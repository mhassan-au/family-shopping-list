export type ForecastEntry = {
  id: string;
  dateKey: string;
  description: string;
  amount: number;
  direction: "income" | "expense";
  source: "scheduled" | "recurring" | "one-off" | "actual" | "loan-repayment";
  excluded?: boolean;
  scheduleId?: string;
};

import type { Expense, ForecastFrequency, ForecastOneOff, ForecastOverride, ForecastSchedule, PersonalLoan, PersonalLoanRepayment } from "./types";

export function forecastOneOffEntry(entry: ForecastOneOff): ForecastEntry {
  const adjustment = entry.kind === "adjustment";
  return {
    id: entry.id,
    dateKey: entry.dateKey,
    description: entry.description,
    amount: adjustment ? Math.abs(entry.amount) : entry.amount,
    direction: entry.kind === "adjustment" ? (entry.amount >= 0 ? "income" : "expense") : entry.kind,
    source: "one-off",
  };
}

export function personalLoanRepaymentEntry(repayment: PersonalLoanRepayment, loan?: PersonalLoan): ForecastEntry {
  return {
    id: `loan-repayment-${repayment.id}`,
    dateKey: repayment.repaidDate,
    description: loan ? `Loan repayment: ${loan.lender}` : "Loan repayment",
    amount: repayment.amount,
    direction: "expense",
    source: "loan-repayment",
  };
}

export function calculateForecastExpenseTotal(expenses: Pick<Expense, "id" | "amount">[], override?: ForecastOverride) {
  const sourceTotal = Math.round(expenses.reduce((total, expense) => total + expense.amount, 0) * 100) / 100;
  if (!override) return { sourceTotal, includedTotal: sourceTotal, finalTotal: sourceTotal };
  if (!override.excludedExpenseIds) {
    return { sourceTotal, includedTotal: override.excluded ? 0 : override.amount, finalTotal: override.excluded ? 0 : override.amount };
  }
  const excludedIds = new Set(override.excludedExpenseIds);
  const includedTotal = Math.round(expenses.filter((expense) => !excludedIds.has(expense.id)).reduce((total, expense) => total + expense.amount, 0) * 100) / 100;
  return { sourceTotal, includedTotal, finalTotal: override.locked ? override.amount : includedTotal };
}

export type ForecastDay = {
  dateKey: string;
  day: number;
  entries: ForecastEntry[];
  closingBalance: number;
  state: "past" | "today" | "future";
};

export function toDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildMonthlyProjection({ year, monthIndex, openingBalance, entries, todayKey }: {
  year: number;
  monthIndex: number;
  openingBalance: number;
  entries: ForecastEntry[];
  todayKey: string;
}) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let balance = openingBalance;
  const days: ForecastDay[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = toDateKey(year, monthIndex, day);
    const dayEntries = entries.filter((entry) => entry.dateKey === dateKey);
    const includedEntries = dayEntries.filter(
      (entry) => !entry.excluded && (entry.source !== "actual" || entry.dateKey <= todayKey),
    );
    balance += includedEntries.reduce(
      (total, entry) => total + (entry.direction === "income" ? entry.amount : -entry.amount),
      0,
    );
    days.push({
      dateKey,
      day,
      entries: dayEntries,
      closingBalance: balance,
      state: dateKey < todayKey ? "past" : dateKey === todayKey ? "today" : "future",
    });
  }

  return {
    days,
    closingBalance: balance,
    lowestDay: days.reduce((lowest, day) =>
      day.closingBalance < lowest.closingBalance ? day : lowest,
    ),
  };
}

export function monthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function parseAustralianDate(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]), month = Number(match[2]), rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return toDateKey(year, month - 1, day);
}

function addCalendarMonths(date: Date, months: number, preferredDay: number) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  target.setDate(Math.min(preferredDay, new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
  return target;
}

function nextOccurrence(date: Date, frequency: ForecastFrequency, preferredDay: number) {
  if (frequency === "weekly" || frequency === "fortnightly") {
    const next = new Date(date);
    next.setDate(next.getDate() + (frequency === "weekly" ? 7 : 14));
    return next;
  }
  return addCalendarMonths(date, frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12, preferredDay);
}

export function scheduleOccurrencesBetween(schedule: ForecastSchedule, startDateKey: string, endDateKey: string): ForecastEntry[] {
  const [startYear, startMonth, startDay] = schedule.firstDate.split("-").map(Number);
  let occurrence = new Date(startYear, startMonth - 1, startDay);
  while (toDateKey(occurrence.getFullYear(), occurrence.getMonth(), occurrence.getDate()) < startDateKey) occurrence = nextOccurrence(occurrence, schedule.frequency, startDay);
  const entries: ForecastEntry[] = [];
  while (true) {
    const dateKey = toDateKey(occurrence.getFullYear(), occurrence.getMonth(), occurrence.getDate());
    if (dateKey > endDateKey) break;
    if (schedule.active || !schedule.inactiveAt || dateKey < schedule.inactiveAt) entries.push({ id: `${schedule.id}-${dateKey}`, scheduleId: schedule.id, dateKey, description: schedule.name, amount: schedule.amount, direction: schedule.kind, source: "recurring" });
    occurrence = nextOccurrence(occurrence, schedule.frequency, startDay);
  }
  return entries;
}

export function nextScheduleOccurrence(schedule: ForecastSchedule, fromDateKey: string) {
  const [startYear, startMonth, startDay] = schedule.firstDate.split("-").map(Number);
  let occurrence = new Date(startYear, startMonth - 1, startDay);
  while (toDateKey(occurrence.getFullYear(), occurrence.getMonth(), occurrence.getDate()) < fromDateKey) occurrence = nextOccurrence(occurrence, schedule.frequency, startDay);
  const dateKey = toDateKey(occurrence.getFullYear(), occurrence.getMonth(), occurrence.getDate());
  return schedule.active || !schedule.inactiveAt || dateKey < schedule.inactiveAt ? dateKey : null;
}

export function scheduleOccurrences(schedule: ForecastSchedule, year: number, monthIndex: number): ForecastEntry[] {
  const [startYear, startMonth, startDay] = schedule.firstDate.split("-").map(Number);
  let occurrence = new Date(startYear, startMonth - 1, startDay);
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);
  while (occurrence < monthStart) occurrence = nextOccurrence(occurrence, schedule.frequency, startDay);
  const entries: ForecastEntry[] = [];
  while (occurrence <= monthEnd) {
    const dateKey = toDateKey(occurrence.getFullYear(), occurrence.getMonth(), occurrence.getDate());
    if (schedule.active || !schedule.inactiveAt || dateKey < schedule.inactiveAt) entries.push({ id: `${schedule.id}-${dateKey}`, scheduleId: schedule.id, dateKey, description: schedule.name, amount: schedule.amount, direction: schedule.kind, source: "recurring" });
    occurrence = nextOccurrence(occurrence, schedule.frequency, startDay);
  }
  return entries;
}
