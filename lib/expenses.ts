import {
  collection,
  doc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { getCurrentUsername } from "./currentUser";
import { EXPENSE_CATEGORIES, isExpenseAmountUnusual } from "./config";
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

  if (
    !isValidExpenseDescription(cleanDescription) ||
    !isValidExpenseAmount(amount) ||
    !EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number])
  ) {
    throw new Error("Invalid expense input");
  }

  const expenseRef = doc(expensesCollection);
  const createdAtMs = Date.now();
  const createdBy = getCurrentUsername();
  const unusual = isExpenseAmountUnusual(category, amount);

  return {
    id: expenseRef.id,
    createdAtMs,
    createdBy,
    transactionType: "expense" as const,
    unusual,
    save: setDoc(expenseRef, {
      description: cleanDescription,
      category,
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

  if (
    !originalExpenseId ||
    !isValidExpenseDescription(cleanDescription) ||
    !isValidAmendmentAmount(amount) ||
    !EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number])
  ) {
    throw new Error("Invalid expense amendment");
  }

  const amendmentRef = doc(expensesCollection);
  const createdAtMs = Date.now();
  const createdBy = getCurrentUsername();

  return setDoc(amendmentRef, {
    description: cleanDescription,
    category,
    amount,
    createdAt: serverTimestamp(),
    createdAtMs,
    createdBy,
    transactionType: "amendment",
    amendsExpenseId: originalExpenseId,
    unusual: false,
  });
}
