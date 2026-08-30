import test from "node:test";
import assert from "node:assert/strict";
import {
  bankTransactionDocumentId,
  getBankSyncSince,
  isExcludedBankTransaction,
} from "../lib/bankSyncPolicy";

const HOUR_MS = 60 * 60 * 1000;

test("first sync requests the previous 72 hours", () => {
  const now = 1_800_000_000_000;
  assert.equal(getBankSyncSince(undefined, now), now - 72 * HOUR_MS);
});

test("later sync overlaps the previous checkpoint by 48 hours", () => {
  const now = 1_800_000_000_000;
  const lastSync = now - 3 * HOUR_MS;
  assert.equal(getBankSyncSince(lastSync, now), lastSync - 48 * HOUR_MS);
});

test("future checkpoints safely fall back to the initial window", () => {
  const now = 1_800_000_000_000;
  assert.equal(getBankSyncSince(now + HOUR_MS, now), now - 72 * HOUR_MS);
});

test("transaction identity includes its UP account", () => {
  assert.equal(bankTransactionDocumentId("peu", "txn-1"), "peu__txn-1");
  assert.equal(bankTransactionDocumentId("shamir", "txn-1"), "shamir__txn-1");
});

test("transfer and debt-payment descriptions are excluded from expense review", () => {
  for (const description of [
    "Transfer to Savings",
    "AFTERPAY AUSTRALIA",
    "Zip Pay repayment",
    "BPAY Energy bill",
    "Bill payment",
    "Credit card payment",
    "CC PAYMENT",
    "Payment to other account",
  ]) {
    assert.equal(isExcludedBankTransaction(description), true, description);
  }
});

test("ordinary household purchases remain eligible for review", () => {
  for (const description of [
    "Woolworths Metro",
    "Shell Petrol",
    "Family restaurant",
    "Electricity retailer purchase",
  ]) {
    assert.equal(isExcludedBankTransaction(description), false, description);
  }
});

test("all available bank description fields participate in exclusion", () => {
  assert.equal(isExcludedBankTransaction("Payment", "Transfer to Peu", null), true);
});
