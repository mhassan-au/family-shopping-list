import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getCurrentUsername } from "./currentUser";
import { isValidLoanInput, isValidRepaymentInput } from "./personalLoans";
import type { PersonalLoan, PersonalLoanRepayment } from "./types";

const loans = collection(db, "personal_loans");
const repayments = collection(db, "personal_loan_repayments");

function localDateKey() {
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function subscribe<T>(ref: ReturnType<typeof collection>, callback: (items: T[]) => void, onError: (error: Error) => void) {
  return onSnapshot(ref, (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)), onError);
}

export const subscribePersonalLoans = (callback: (items: PersonalLoan[]) => void, onError: (error: Error) => void) => subscribe(loans, callback, onError);
export const subscribePersonalLoanRepayments = (callback: (items: PersonalLoanRepayment[]) => void, onError: (error: Error) => void) => subscribe(repayments, callback, onError);

export async function addPersonalLoan(input: { lender: string; reason: string; originalAmount: number; takenDate: string }) {
  if (!isValidLoanInput(input)) throw new Error("Invalid personal loan");
  await setDoc(doc(loans), {
    lender: input.lender.trim(),
    reason: input.reason.trim(),
    originalAmount: input.originalAmount,
    takenDate: input.takenDate,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
    createdBy: getCurrentUsername(),
  });
}

export async function addPersonalLoanRepayment(input: { loanId: string; amount: number; repaidDate: string; outstanding: number }) {
  if (!input.loanId || !isValidRepaymentInput(input, input.outstanding, localDateKey())) throw new Error("Invalid personal loan repayment");
  await setDoc(doc(repayments), {
    loanId: input.loanId,
    amount: input.amount,
    repaidDate: input.repaidDate,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
    createdBy: getCurrentUsername(),
  });
}
