import test from "node:test";
import assert from "node:assert/strict";
import { getPeriodRange, shiftPeriod } from "../lib/expenseReportPeriods";

test("monthly navigation cannot overflow into the wrong month", () => {
  const september = shiftPeriod(new Date(2026, 9, 31, 12), "month", -1);
  assert.equal(september.getFullYear(), 2026);
  assert.equal(september.getMonth(), 8);
  assert.equal(september.getDate(), 30);

  const range = getPeriodRange("month", september);
  assert.equal(range.start.getMonth(), 8);
  assert.equal(range.start.getDate(), 1);
  assert.equal(range.end.getMonth(), 9);
  assert.equal(range.end.getDate(), 1);
});

test("monthly navigation preserves the day when the target month contains it", () => {
  const september = shiftPeriod(new Date(2026, 7, 15, 12), "month", 1);
  assert.equal(september.getMonth(), 8);
  assert.equal(september.getDate(), 15);
});
