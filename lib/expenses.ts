import {
  collection,
  doc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { getCurrentUsername } from "./currentUser";
import { ShoppingItem } from "./types";
import {
  EXPENSE_CATEGORIES,
  isExpenseAmountUnusual,
  normalizeExpenseCategory,
} from "./config";
import {
  isValidExpenseAmount,
  isValidExpenseDescription,
  isValidAmendmentAmount,
} from "./validation";

export const expensesCollection = collection(db, "expenses");
export const expensesQuery = query(
  expensesCollection,
  orderBy("createdAtMs", "desc"),
);

export function createExpense(
  description: string,
  category: string,
  amount: number,
) {
  const cleanDescription = description.trim();
  const cleanCategory = normalizeExpenseCategory(category);

  if (
    !isValidExpenseDescription(cleanDescription) ||
    !isValidExpenseAmount(amount) ||
    !EXPENSE_CATEGORIES.includes(cleanCategory as (typeof EXPENSE_CATEGORIES)[number])
  ) {
    throw new Error("Invalid expense input");
  }

  const expenseRef = doc(expensesCollection);
  const createdAtMs = Date.now();
  const createdBy = getCurrentUsername();
  const unusual = isExpenseAmountUnusual(cleanCategory, amount);

  return {
    id: expenseRef.id,
    createdAtMs,
    createdBy,
    transactionType: "expense" as const,
    unusual,
    save: setDoc(expenseRef, {
      description: cleanDescription,
      category: cleanCategory,
      amount,
      createdAt: serverTimestamp(),
      createdAtMs,
      createdBy,
      transactionType: "expense",
      unusual,
    }),
  };
}

export function createExpenseAmendment(
  originalExpenseId: string,
  description: string,
  category: string,
  amount: number,
) {
  const cleanDescription = description.trim();
  const cleanCategory = normalizeExpenseCategory(category);

  if (
    !originalExpenseId ||
    !isValidExpenseDescription(cleanDescription) ||
    !isValidAmendmentAmount(amount) ||
    !EXPENSE_CATEGORIES.includes(cleanCategory as (typeof EXPENSE_CATEGORIES)[number])
  ) {
    throw new Error("Invalid expense amendment");
  }

  const amendmentRef = doc(expensesCollection);
  const createdAtMs = Date.now();
  const createdBy = getCurrentUsername();

  return setDoc(amendmentRef, {
    description: cleanDescription,
    category: cleanCategory,
    amount,
    createdAt: serverTimestamp(),
    createdAtMs,
    createdBy,
    transactionType: "amendment",
    amendsExpenseId: originalExpenseId,
    unusual: false,
  });
}

export function transferCompletedShoppingToExpense(
  items: ShoppingItem[],
  description: string,
) {
  const completedItems = items.filter((item) => item.completed);
  const amount = completedItems.reduce(
    (sum, item) =>
      sum + Number(item.qty || 0) * Number(item.unitPrice || 0),
    0,
  );
  const cleanDescription = description.trim();

  if (
    completedItems.length === 0 ||
    !isValidExpenseDescription(cleanDescription) ||
    !isValidExpenseAmount(amount)
  ) {
    throw new Error("No completed shopping total to transfer");
  }

  const expenseRef = doc(expensesCollection);
  const createdAtMs = Date.now();
  const createdBy = getCurrentUsername();
  const batch = writeBatch(db);

  batch.set(expenseRef, {
    description: cleanDescription,
    category: "Grocery",
    amount,
    createdAt: serverTimestamp(),
    createdAtMs,
    createdBy,
    transactionType: "expense",
    unusual: isExpenseAmountUnusual("Grocery", amount),
    source: "shopping-transfer",
  });

  completedItems.forEach((item) => {
    batch.delete(doc(db, "shopping_items", item.id));
  });

  return { amount, save: batch.commit() };
}
