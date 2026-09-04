import { collection, doc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getCurrentUsername } from "./currentUser";
import { isValidWishInput, isValidWishMovement, toCents } from "./wishes";
import type { Wish, WishTransaction } from "./types";

const wishes = collection(db, "wishes");
const wishTransactions = collection(db, "wish_transactions");

function localDateKey() {
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function subscribe<T>(ref: ReturnType<typeof collection>, callback: (items: T[]) => void, onError: (error: Error) => void) {
  return onSnapshot(ref, (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)), onError);
}

export const subscribeWishes = (callback: (items: Wish[]) => void, onError: (error: Error) => void) => subscribe(wishes, callback, onError);
export const subscribeWishTransactions = (callback: (items: WishTransaction[]) => void, onError: (error: Error) => void) => subscribe(wishTransactions, callback, onError);

export async function addWish(input: { name: string; targetAmount: number; deadlineDate: string; eventDate: string }) {
  if (!isValidWishInput(input)) throw new Error("Invalid wish");
  const now = Date.now();
  const actor = getCurrentUsername();
  await setDoc(doc(wishes), {
    name: input.name.trim(),
    targetCents: toCents(input.targetAmount),
    balanceCents: 0,
    deadlineDate: input.deadlineDate,
    eventDate: input.eventDate,
    status: "active",
    createdAt: serverTimestamp(),
    createdAtMs: now,
    createdBy: actor,
    updatedAt: serverTimestamp(),
    updatedAtMs: now,
    updatedBy: actor,
  });
}

export async function addWishMovement(input: { wishId: string; type: "contribution" | "withdrawal"; amount: number; dateKey: string; note: string }) {
  const wishRef = doc(wishes, input.wishId);
  const transactionRef = doc(wishTransactions);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(wishRef);
    if (!snapshot.exists()) throw new Error("Wish not found");
    const wish = { id: snapshot.id, ...snapshot.data() } as Wish;
    if (wish.status !== "active" || !isValidWishMovement(input, wish.balanceCents, input.type, localDateKey())) throw new Error("Invalid wish transaction");
    const amountCents = toCents(input.amount);
    const nextBalance = input.type === "contribution" ? wish.balanceCents + amountCents : wish.balanceCents - amountCents;
    const now = Date.now();
    const actor = getCurrentUsername();
    transaction.set(transactionRef, {
      wishId: wish.id,
      type: input.type,
      amountCents,
      dateKey: input.dateKey,
      note: input.note.trim(),
      createdAt: serverTimestamp(),
      createdAtMs: now,
      createdBy: actor,
    });
    transaction.update(wishRef, {
      balanceCents: nextBalance,
      lastTransactionId: transactionRef.id,
      updatedAt: serverTimestamp(),
      updatedAtMs: now,
      updatedBy: actor,
    });
  });
}

export async function terminateWish(wishId: string, note: string) {
  const wishRef = doc(wishes, wishId);
  const transactionRef = doc(wishTransactions);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(wishRef);
    if (!snapshot.exists()) throw new Error("Wish not found");
    const wish = { id: snapshot.id, ...snapshot.data() } as Wish;
    if (wish.status !== "active" || note.trim().length > 160) throw new Error("Invalid wish termination");
    const now = Date.now();
    const actor = getCurrentUsername();
    transaction.set(transactionRef, {
      wishId: wish.id,
      type: "termination_refund",
      amountCents: wish.balanceCents,
      dateKey: localDateKey(),
      note: note.trim(),
      createdAt: serverTimestamp(),
      createdAtMs: now,
      createdBy: actor,
    });
    transaction.update(wishRef, {
      balanceCents: 0,
      status: "terminated",
      lastTransactionId: transactionRef.id,
      terminatedAt: serverTimestamp(),
      terminatedAtMs: now,
      updatedAt: serverTimestamp(),
      updatedAtMs: now,
      updatedBy: actor,
    });
  });
}
