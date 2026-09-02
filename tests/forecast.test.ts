import test from "node:test";
import assert from "node:assert/strict";
import { buildMonthlyProjection, calculateForecastExpenseTotal, forecastOneOffEntry, ForecastEntry, nextScheduleOccurrence, parseAustralianDate, scheduleOccurrences, scheduleOccurrencesBetween } from "../lib/forecast";
import { ForecastOverride, ForecastSchedule } from "../lib/types";

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

test("signed one-off adjustments increase or decrease the projected balance", () => {
  const adjustments = [
    forecastOneOffEntry({ id: "plus", kind: "adjustment", description: "Correction", amount: 100, dateKey: "2026-09-05", createdAtMs: 1, createdBy: "Owner" }),
    forecastOneOffEntry({ id: "minus", kind: "adjustment", description: "Correction", amount: -40, dateKey: "2026-09-06", createdAtMs: 2, createdBy: "Owner" }),
  ];
  const projection = buildMonthlyProjection({ year: 2026, monthIndex: 8, openingBalance: 1000, entries: adjustments, todayKey: "2026-09-30" });
  assert.equal(projection.closingBalance, 1060);
  assert.deepEqual(adjustments.map((entry) => [entry.direction, entry.amount]), [["income", 100], ["expense", 40]]);
});

test("quarterly schedules recur every three calendar months", () => {
  assert.deepEqual(scheduleOccurrences(schedule({ frequency: "quarterly", firstDate: "2026-01-31" }), 2026, 3).map((entry) => entry.dateKey), ["2026-04-30"]);
  assert.deepEqual(scheduleOccurrences(schedule({ frequency: "quarterly", firstDate: "2026-01-31" }), 2026, 6).map((entry) => entry.dateKey), ["2026-07-31"]);
});

test("upcoming schedule helpers return the next date and exact window occurrences", () => {
  const fortnightly = schedule({ frequency: "fortnightly", firstDate: "2026-09-02" });
  assert.equal(nextScheduleOccurrence(fortnightly, "2026-09-03"), "2026-09-16");
  assert.deepEqual(scheduleOccurrencesBetween(fortnightly, "2026-09-01", "2026-09-30").map((entry) => entry.dateKey), ["2026-09-02", "2026-09-16", "2026-09-30"]);
});

test("inactive schedules retain occurrences before the inactive date", () => {
  assert.deepEqual(scheduleOccurrences(schedule({ active: false, inactiveAt: "2026-09-20", inactiveReason: "Changed" }), 2026, 8).map((entry) => entry.dateKey), ["2026-09-02", "2026-09-16"]);
});

test("Australian recurring-date input converts to an ISO date key", () => {
  assert.equal(parseAustralianDate("2/9/26"), "2026-09-02");
  assert.equal(parseAustralianDate("31/02/26"), null);
});

const override = (values: Partial<ForecastOverride>): ForecastOverride => ({ id: "2026-09-01", dateKey: "2026-09-01", amount: 0, excluded: false, updatedAtMs: 1, updatedBy: "Owner", ...values });

test("transaction exclusions still include new daily expenses automatically", () => {
  const result = calculateForecastExpenseTotal([{ id: "wife", amount: 30 }, { id: "mine", amount: 12.5 }, { id: "new", amount: 10 }], override({ excludedExpenseIds: ["wife"], amount: 12.5, locked: false }));
  assert.deepEqual(result, { sourceTotal: 52.5, includedTotal: 22.5, finalTotal: 22.5 });
});

test("a locked daily total does not change when a new expense arrives", () => {
  const result = calculateForecastExpenseTotal([{ id: "mine", amount: 12.5 }, { id: "new", amount: 10 }], override({ excludedExpenseIds: [], amount: 15, locked: true }));
  assert.equal(result.finalTotal, 15);
});
