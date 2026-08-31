export type ForecastEntry = {
  id: string;
  dateKey: string;
  description: string;
  amount: number;
  direction: "income" | "expense";
  source: "scheduled" | "actual";
  excluded?: boolean;
};

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
      (entry) => !entry.excluded && (entry.source === "scheduled" || entry.dateKey <= todayKey),
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
