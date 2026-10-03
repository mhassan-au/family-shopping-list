import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidExpenseDescription,
  isValidItemName,
} from "../lib/validation";

test("shopping items and expense descriptions accept ordinary punctuation", () => {
  for (const value of ["Peu$#a143", "50% off!", "Tomato: red?", "Tea @ Aldi"]) {
    assert.equal(isValidItemName(value), true, value);
    assert.equal(isValidExpenseDescription(value), true, value);
  }
});

test("shopping items and expense descriptions keep Firestore text-length limits", () => {
  assert.equal(isValidItemName(""), false);
  assert.equal(isValidExpenseDescription("   "), false);
  assert.equal(isValidItemName("x".repeat(81)), false);
  assert.equal(isValidExpenseDescription("x".repeat(81)), false);
});
