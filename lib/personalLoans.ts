import type { PersonalLoan, PersonalLoanRepayment } from "./types";

export const PERSONAL_LOAN_LIMITS = {
  lender: 80,
  reason: 160,
  amount: 9_999_999.99,
} as const;

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function isValidLoanInput(input: { lender: string; reason: string; originalAmount: number; takenDate: string }) {
  const lender = input.lender.trim();
  const reason = input.reason.trim();
  return lender.length > 0
    && lender.length <= PERSONAL_LOAN_LIMITS.lender
    && reason.length > 0
    && reason.length <= PERSONAL_LOAN_LIMITS.reason
    && Number.isFinite(input.originalAmount)
    && input.originalAmount > 0
    && input.originalAmount <= PERSONAL_LOAN_LIMITS.amount
    && dateKeyPattern.test(input.takenDate);
}

export function repaymentTotal(loanId: string, repayments: PersonalLoanRepayment[]) {
  return Math.round(repayments.filter((item) => item.loanId === loanId).reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
}

export function outstandingBalance(loan: PersonalLoan, repayments: PersonalLoanRepayment[]) {
  return Math.max(0, Math.round((loan.originalAmount - repaymentTotal(loan.id, repayments)) * 100) / 100);
}

export function sortLoansByStatus(loans: PersonalLoan[], repayments: PersonalLoanRepayment[]) {
  return [...loans].sort((left, right) => {
    const leftSettled = outstandingBalance(left, repayments) === 0;
    const rightSettled = outstandingBalance(right, repayments) === 0;
    if (leftSettled !== rightSettled) return leftSettled ? 1 : -1;
    return right.takenDate.localeCompare(left.takenDate) || right.createdAtMs - left.createdAtMs;
  });
}

export function isValidRepaymentInput(input: { amount: number; repaidDate: string }, outstanding: number, latestDate: string) {
  return Number.isFinite(input.amount)
    && input.amount > 0
    && input.amount <= outstanding
    && input.amount <= PERSONAL_LOAN_LIMITS.amount
    && dateKeyPattern.test(input.repaidDate)
    && input.repaidDate <= latestDate;
}
