import test from "node:test";
import assert from "node:assert/strict";
import {
  formatFlexibleMoneyInput,
  parseFlexibleMoneyInput,
} from "../lib/validation";

test("whole digits keep the cents-first entry behavior", () => {
  assert.equal(parseFlexibleMoneyInput("12"), 0.12);
  assert.equal(parseFlexibleMoneyInput("1099"), 10.99);
});

test("an explicit decimal keeps the entered dollar value", () => {
  assert.equal(parseFlexibleMoneyInput("12.00"), 12);
  assert.equal(parseFlexibleMoneyInput(".5"), 0.5);
});

test("money input formats to two decimal places", () => {
  assert.equal(formatFlexibleMoneyInput("12"), "0.12");
  assert.equal(formatFlexibleMoneyInput("12.00"), "12.00");
});
