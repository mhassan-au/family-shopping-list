import test from "node:test";
import assert from "node:assert/strict";
import { buildMonthlyProjection, ForecastEntry } from "../lib/forecast";

const entries: ForecastEntry[] = [
  { id: "salary", dateKey: "2026-09-16", description: "Salary", amount: 2800, direction: "income", source: "scheduled" },
  { id: "mortgage", dateKey: "2026-09-27", description: "Mortgage", amount: 2000, direction: "expense", source: "scheduled" },
  { id: "groceries", dateKey: "2026-09-20", description: "Groceries", amount: 120, direction: "expense", source: "actual" },
];

test("scheduled future entries affect the projected closing balance", () => {
  const projection = buildMonthlyProjection({ year: 2026, monthIndex: 8, openingBalance: 1000, entries, todayKey: "2026-09-10" });
  assert.equal(projection.closingBalance, 1800);
});

test("future actual expenses remain zero until their transaction date", () => {
  const beforeExpense = buildMonthlyProjection({ year: 2026, monthIndex: 8, openingBalance: 1000, entries, todayKey: "2026-09-10" });
  const afterExpense = buildMonthlyProjection({ year: 2026, monthIndex: 8, openingBalance: 1000, entries, todayKey: "2026-09-20" });
  assert.equal(beforeExpense.closingBalance, 1800);
  assert.equal(afterExpense.closingBalance, 1680);
});

test("the projection identifies the lowest daily balance", () => {
  const projection = buildMonthlyProjection({ year: 2026, monthIndex: 8, openingBalance: 1000, entries, todayKey: "2026-09-30" });
  assert.equal(projection.lowestDay.dateKey, "2026-09-01");
  assert.equal(projection.lowestDay.closingBalance, 1000);
});
