import test from "node:test";
import assert from "node:assert/strict";
import { buildMonthlyProjection, ForecastEntry, parseAustralianDate, scheduleOccurrences } from "../lib/forecast";
import { ForecastSchedule } from "../lib/types";

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

const schedule = (overrides: Partial<ForecastSchedule>): ForecastSchedule => ({ id: "schedule", kind: "income", name: "Pay", amount: 100, frequency: "fortnightly", firstDate: "2026-09-02", active: true, createdAtMs: 1, createdBy: "Owner", ...overrides });

test("fortnightly schedules preserve the weekday", () => {
  assert.deepEqual(scheduleOccurrences(schedule({}), 2026, 8).map((entry) => entry.dateKey), ["2026-09-02", "2026-09-16", "2026-09-30"]);
});

test("monthly schedules clamp the 31st to a short month end", () => {
  assert.deepEqual(scheduleOccurrences(schedule({ frequency: "monthly", firstDate: "2026-01-31" }), 2026, 1).map((entry) => entry.dateKey), ["2026-02-28"]);
});

test("quarterly schedules recur every three calendar months", () => {
  assert.deepEqual(scheduleOccurrences(schedule({ frequency: "quarterly", firstDate: "2026-01-31" }), 2026, 3).map((entry) => entry.dateKey), ["2026-04-30"]);
  assert.deepEqual(scheduleOccurrences(schedule({ frequency: "quarterly", firstDate: "2026-01-31" }), 2026, 6).map((entry) => entry.dateKey), ["2026-07-31"]);
});

test("inactive schedules retain occurrences before the inactive date", () => {
  assert.deepEqual(scheduleOccurrences(schedule({ active: false, inactiveAt: "2026-09-20", inactiveReason: "Changed" }), 2026, 8).map((entry) => entry.dateKey), ["2026-09-02", "2026-09-16"]);
});

test("Australian recurring-date input converts to an ISO date key", () => {
  assert.equal(parseAustralianDate("2/9/26"), "2026-09-02");
  assert.equal(parseAustralianDate("31/02/26"), null);
});
