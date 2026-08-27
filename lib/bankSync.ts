import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { getCurrentUsername } from "./currentUser";
import { isExpenseAmountUnusual } from "./config";
import { BankSyncStatus, PendingBankTransaction } from "./types";

const pendingCollection = collection(db, "pending_bank_transactions");
const statusRef = doc(db, "bank_sync", "status");

export function subscribeToPendingBankTransactions(
  onData: (transactions: PendingBankTransaction[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    query(pendingCollection, orderBy("occurredAtMs", "desc"), limit(100)),
    (snapshot) => onData(snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<PendingBankTransaction, "id">),
    }))),
    (error) => onError(error.message),
  );
}

export function subscribeToBankSyncStatus(
  onData: (status: BankSyncStatus | null) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    statusRef,
    (snapshot) => onData(snapshot.exists() ? snapshot.data() as BankSyncStatus : null),
    (error) => onError(error.message),
  );
}

export async function runManualBankSync(lastSyncedAtMs?: number) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error("Firebase authentication is not ready");
  const idToken = await user.getIdToken();
  const response = await fetch("/api/up/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ since: lastSyncedAtMs }),
  });
  const result = await response.json() as {
    error?: string;
    syncedAtMs?: number;
    sinceMs?: number;
    transactions?: Array<Omit<PendingBankTransaction, "id" | "importedAtMs" | "importedBy">>;
  };
  if (!response.ok || !result.syncedAtMs || !result.transactions) {
    throw new Error(result.error || "Bank sync failed");
  }

  let importedCount = 0;
  for (const transaction of result.transactions) {
    const pendingRef = doc(pendingCollection, transaction.externalId);
    const processedRef = doc(db, "processed_bank_transactions", transaction.externalId);
    const [pendingSnapshot, processedSnapshot] = await Promise.all([
      getDoc(pendingRef),
      getDoc(processedRef),
    ]);
    if (pendingSnapshot.exists() || processedSnapshot.exists()) continue;
    await setDoc(pendingRef, {
      ...transaction,
      importedAt: serverTimestamp(),
      importedAtMs: Date.now(),
      importedBy: getCurrentUsername(),
    });
    importedCount += 1;
  }

  await setDoc(statusRef, {
    lastSyncedAt: serverTimestamp(),
    lastSyncedAtMs: result.syncedAtMs,
    lastSinceMs: result.sinceMs ?? null,
    importedCount,
    updatedBy: getCurrentUsername(),
  });
  return { importedCount, fetchedCount: result.transactions.length };
}

export async function acceptPendingBankTransaction(
  transaction: PendingBankTransaction,
  description: string,
  category: string,
) {
  const expenseRef = doc(collection(db, "expenses"));
  const pendingRef = doc(pendingCollection, transaction.id);
  const processedRef = doc(db, "processed_bank_transactions", transaction.externalId);
  const createdAtMs = Date.now();
  const createdBy = getCurrentUsername();
  const batch = writeBatch(db);
  batch.set(expenseRef, {
    description: description.trim(),
    category,
    amount: transaction.amount,
    createdAt: serverTimestamp(),
    createdAtMs,
    createdBy,
    transactionType: "expense",
    unusual: isExpenseAmountUnusual(category, transaction.amount),
    source: "up-bank",
    sourceTransactionId: transaction.externalId,
  });
  batch.set(processedRef, {
    decision: "accepted",
    processedAt: serverTimestamp(),
    processedAtMs: createdAtMs,
    processedBy: createdBy,
    expenseId: expenseRef.id,
  });
  batch.delete(pendingRef);
  await batch.commit();
}

export async function rejectPendingBankTransaction(transaction: PendingBankTransaction) {
  const processedRef = doc(db, "processed_bank_transactions", transaction.externalId);
  const batch = writeBatch(db);
  batch.set(processedRef, {
    decision: "rejected",
    processedAt: serverTimestamp(),
    processedAtMs: Date.now(),
    processedBy: getCurrentUsername(),
  });
  batch.delete(doc(pendingCollection, transaction.id));
  await batch.commit();
}
