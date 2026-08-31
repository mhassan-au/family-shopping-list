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
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { getCurrentUsername } from "./currentUser";
import { isExpenseAmountUnusual } from "./config";
import { BankAccountKey, BankSyncAuditRecord, BankSyncStatus, PendingBankTransaction } from "./types";
import { bankTransactionDocumentId } from "./bankSyncPolicy";

export const BANK_ACCOUNTS: ReadonlyArray<{ key: BankAccountKey; label: string }> = [
  { key: "peu", label: "Peu UP" },
  { key: "shamir", label: "Shamir UP" },
];

const pendingCollection = collection(db, "pending_bank_transactions");
const auditCollection = collection(db, "bank_sync_audit");
const statusRef = (accountKey: BankAccountKey) => doc(db, "bank_sync", accountKey);

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
  accountKey: BankAccountKey,
  onData: (status: BankSyncStatus | null) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    statusRef(accountKey),
    (snapshot) => onData(snapshot.exists() ? snapshot.data() as BankSyncStatus : null),
    (error) => onError(error.message),
  );
}

export function subscribeToBankSyncAudit(
  onData: (records: BankSyncAuditRecord[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    query(auditCollection, orderBy("occurredAtMs", "desc"), limit(500)),
    (snapshot) => onData(snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<BankSyncAuditRecord, "id">),
    }))),
    (error) => onError(error.message),
  );
}

export async function runManualBankSync(
  accountKey: BankAccountKey,
  lastSyncedAtMs?: number,
) {
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
    body: JSON.stringify({ account: accountKey, since: lastSyncedAtMs }),
  });
  const result = await response.json() as {
    error?: string;
    syncedAtMs?: number;
    sinceMs?: number;
    accountKey?: BankAccountKey;
    accountLabel?: string;
    transactions?: Array<Omit<PendingBankTransaction, "id" | "importedAtMs" | "importedBy">>;
  };
  if (
    !response.ok ||
    !result.syncedAtMs ||
    !result.transactions ||
    result.accountKey !== accountKey ||
    !result.accountLabel
  ) {
    throw new Error(result.error || "Bank sync failed");
  }

  let importedCount = 0;
  for (const transaction of result.transactions) {
    const documentId = bankTransactionDocumentId(accountKey, transaction.externalId);
    const pendingRef = doc(pendingCollection, documentId);
    const processedRef = doc(db, "processed_bank_transactions", documentId);
    const legacyPendingRef = doc(pendingCollection, transaction.externalId);
    const legacyProcessedRef = doc(db, "processed_bank_transactions", transaction.externalId);
    const [pendingSnapshot, processedSnapshot, legacyPendingSnapshot, legacyProcessedSnapshot] = await Promise.all([
      getDoc(pendingRef),
      getDoc(processedRef),
      accountKey === "peu" ? getDoc(legacyPendingRef) : Promise.resolve(null),
      accountKey === "peu" ? getDoc(legacyProcessedRef) : Promise.resolve(null),
    ]);
    if (processedSnapshot.exists() || legacyProcessedSnapshot?.exists()) continue;
    if (legacyPendingSnapshot?.exists()) continue;
    const transactionData = {
      ...transaction,
      accountKey,
      accountLabel: result.accountLabel,
    };
    if (pendingSnapshot.exists()) {
      await updateDoc(pendingRef, transactionData);
      continue;
    }
    await setDoc(pendingRef, {
      ...transactionData,
      importedAt: serverTimestamp(),
      importedAtMs: Date.now(),
      importedBy: getCurrentUsername(),
    });
    importedCount += 1;
  }

  await setDoc(statusRef(accountKey), {
    accountKey,
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
  const processedRef = doc(
    db,
    "processed_bank_transactions",
    transaction.accountKey
      ? bankTransactionDocumentId(transaction.accountKey, transaction.externalId)
      : transaction.externalId,
  );
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
    ...(transaction.accountKey ? { sourceAccount: transaction.accountKey } : {}),
  });
  batch.set(processedRef, {
    decision: "accepted",
    processedAt: serverTimestamp(),
    processedAtMs: createdAtMs,
    processedBy: createdBy,
    expenseId: expenseRef.id,
    ...(transaction.accountKey ? {
      accountKey: transaction.accountKey,
      externalId: transaction.externalId,
    } : {}),
  });
  batch.delete(pendingRef);
  await batch.commit();
}

export async function rejectPendingBankTransaction(transaction: PendingBankTransaction) {
  const processedRef = doc(
    db,
    "processed_bank_transactions",
    transaction.accountKey
      ? bankTransactionDocumentId(transaction.accountKey, transaction.externalId)
      : transaction.externalId,
  );
  const batch = writeBatch(db);
  batch.set(processedRef, {
    decision: "rejected",
    processedAt: serverTimestamp(),
    processedAtMs: Date.now(),
    processedBy: getCurrentUsername(),
    ...(transaction.accountKey ? {
      accountKey: transaction.accountKey,
      externalId: transaction.externalId,
    } : {}),
  });
  batch.delete(doc(pendingCollection, transaction.id));
  await batch.commit();
}
