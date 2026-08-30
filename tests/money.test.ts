import test from "node:test";
import assert from "node:assert/strict";
import {
  formatFlexibleMoneyInput,
  getAmbiguousMoneyValues,
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

test("amount choice appears only outside the normal one-to-one-thousand range", () => {
  assert.deepEqual(getAmbiguousMoneyValues("12"), { whole: 12, cents: 0.12 });
  assert.deepEqual(getAmbiguousMoneyValues("100001"), { whole: 100001, cents: 1000.01 });
  assert.equal(getAmbiguousMoneyValues("100"), null);
  assert.equal(getAmbiguousMoneyValues("1099"), null);
  assert.equal(getAmbiguousMoneyValues("100000"), null);
});

test("explicit decimals and shifted values do not request an amount choice", () => {
  assert.equal(getAmbiguousMoneyValues(null), null);
});
