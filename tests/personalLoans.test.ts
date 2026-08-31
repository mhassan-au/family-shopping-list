import assert from "node:assert/strict";
import test from "node:test";
import { isValidLoanInput, isValidRepaymentInput, outstandingBalance, repaymentTotal, sortLoansByStatus } from "../lib/personalLoans";
import type { PersonalLoan, PersonalLoanRepayment } from "../lib/types";

const loan: PersonalLoan = { id: "loan-1", lender: "Family", reason: "Emergency repair", originalAmount: 1000, takenDate: "2026-09-01", createdAtMs: 1, createdBy: "Owner" };
const repayments: PersonalLoanRepayment[] = [
  { id: "repayment-1", loanId: "loan-1", amount: 250, repaidDate: "2026-09-10", createdAtMs: 2, createdBy: "Owner" },
  { id: "repayment-2", loanId: "loan-1", amount: 100, repaidDate: "2026-09-20", createdAtMs: 3, createdBy: "Owner" },
  { id: "other", loanId: "loan-2", amount: 500, repaidDate: "2026-09-20", createdAtMs: 4, createdBy: "Owner" },
];

test("personal loan totals include only repayments for that loan", () => {
  assert.equal(repaymentTotal(loan.id, repayments), 350);
  assert.equal(outstandingBalance(loan, repayments), 650);
});

test("repayments cannot exceed the outstanding balance", () => {
  assert.equal(isValidRepaymentInput({ amount: 650, repaidDate: "2026-09-30" }, 650, "2026-09-30"), true);
  assert.equal(isValidRepaymentInput({ amount: 650.01, repaidDate: "2026-09-30" }, 650, "2026-09-30"), false);
  assert.equal(isValidRepaymentInput({ amount: 100, repaidDate: "2026-10-01" }, 650, "2026-09-30"), false);
});

test("loan input requires lender, positive amount, and ISO date", () => {
  assert.equal(isValidLoanInput({ lender: "Friend", reason: "Moving costs", originalAmount: 500, takenDate: "2026-09-01" }), true);
  assert.equal(isValidLoanInput({ lender: " ", reason: "", originalAmount: 500, takenDate: "01/09/2026" }), false);
});

test("unpaid loans sort above settled loans", () => {
  const settled: PersonalLoan = { ...loan, id: "settled", lender: "Settled", originalAmount: 100, takenDate: "2026-09-02" };
  const olderUnpaid: PersonalLoan = { ...loan, id: "unpaid", lender: "Unpaid", takenDate: "2026-08-01" };
  const paid: PersonalLoanRepayment = { id: "paid", loanId: "settled", amount: 100, repaidDate: "2026-09-03", createdAtMs: 5, createdBy: "Owner" };
  assert.deepEqual(sortLoansByStatus([settled, olderUnpaid], [paid]).map((item) => item.id), ["unpaid", "settled"]);
});
