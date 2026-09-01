import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");
const rules = readFileSync(resolve(root, "firestore.rules"), "utf8");
const nextConfig = readFileSync(resolve(root, "next.config.ts"), "utf8");

function ruleBlock(collection: string) {
  const start = rules.indexOf(`match /${collection}`);
  assert.notEqual(start, -1, `Missing Firestore rule block for ${collection}`);
  const nextMatch = rules.indexOf("\n    match /", start + 1);
  return rules.slice(start, nextMatch === -1 ? undefined : nextMatch);
}

test("Firestore has no public allow-all rule and denies unknown collections", () => {
  assert.doesNotMatch(rules, /allow\s+read\s*,\s*write\s*:\s*if\s+true/);
  assert.match(ruleBlock("{document=**}"), /allow read, write: if false/);
});

test("expense history remains append-only", () => {
  assert.match(ruleBlock("expenses/{expenseId}"), /allow update, delete: if false/);
});

test("shared category writes require the owner bank-admin boundary", () => {
  const block = ruleBlock("app_config/categories");
  assert.match(block, /allow read: if approvedDevice\(\)/);
  assert.match(block, /allow create, update: if bankAdminDevice\(\) && validCategoryConfig\(\)/);
  assert.doesNotMatch(block, /allow create, update: if approvedDevice\(\)/);
});

test("bank collections require bank-admin devices", () => {
  assert.match(ruleBlock("pending_bank_transactions/{transactionId}"), /bankAdminDevice\(\)/);
  assert.match(ruleBlock("processed_bank_transactions/{transactionId}"), /bankAdminDevice\(\)/);
  assert.match(ruleBlock("bank_sync/{accountKey}"), /bankAdminDevice\(\)/);
  assert.match(ruleBlock("bank_sync_audit/{auditId}"), /bankAdminDevice\(\)/);
  assert.match(ruleBlock("bank_sync_audit/{auditId}"), /allow update, delete: if false/);
  assert.match(ruleBlock("bank_sync_audit/{auditId}"), /request\.resource\.data\.occurredAt == request\.time/);
});

test("forecast collections are owner-only and historical ledgers are append-only", () => {
  for (const collection of ["forecast_schedules/{scheduleId}", "forecast_one_offs/{entryId}", "forecast_months/{monthId}", "forecast_overrides/{overrideId}", "forecast_audit/{auditId}"]) assert.match(ruleBlock(collection), /bankAdminDevice\(\)/);
  assert.match(ruleBlock("forecast_one_offs/{entryId}"), /allow update, delete: if false/);
  assert.match(ruleBlock("forecast_audit/{auditId}"), /allow update, delete: if false/);
  assert.match(ruleBlock("forecast_schedules/{scheduleId}"), /resource\.data\.active == true && request\.resource\.data\.active == false/);
  assert.match(rules, /data\.frequency in \['weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly'\]/);
  assert.match(rules, /data\.excludedExpenseIds is list && data\.excludedExpenseIds\.size\(\) <= 200/);
  assert.match(rules, /'daily_expense_selection_changed', 'daily_expense_amount_locked'/);
});

test("personal loan and repayment ledgers are owner-only and append-only", () => {
  for (const collection of ["personal_loans/{loanId}", "personal_loan_repayments/{repaymentId}"]) {
    assert.match(ruleBlock(collection), /allow read: if bankAdminDevice\(\)/);
    assert.match(ruleBlock(collection), /allow create: if bankAdminDevice\(\)/);
    assert.match(ruleBlock(collection), /allow update, delete: if false/);
  }
  assert.match(rules, /exists\(\/databases\/\$\(database\)\/documents\/personal_loans\/\$\(data\.loanId\)\)/);
});

test("production responses declare the core browser security headers", () => {
  for (const header of [
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Strict-Transport-Security",
  ]) {
    assert.match(nextConfig, new RegExp(`key: [\"']${header}[\"']`));
  }
});
