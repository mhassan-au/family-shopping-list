export type ReportPeriod = "day" | "week" | "month" | "year";

export function getPeriodRange(period: ReportPeriod, anchor: Date) {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);

  if (period === "week") {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  } else if (period === "month") {
    start.setDate(1);
  } else if (period === "year") {
    start.setMonth(0, 1);
  }

  const end = new Date(start);
  if (period === "day") end.setDate(end.getDate() + 1);
  if (period === "week") end.setDate(end.getDate() + 7);
  if (period === "month") end.setMonth(end.getMonth() + 1);
  if (period === "year") end.setFullYear(end.getFullYear() + 1);
  return { start, end };
}

export function shiftPeriod(date: Date, period: ReportPeriod, direction: number) {
  const shifted = new Date(date);
  if (period === "day") shifted.setDate(shifted.getDate() + direction);
  if (period === "week") shifted.setDate(shifted.getDate() + direction * 7);
  if (period === "month") {
    const originalDay = shifted.getDate();
    shifted.setDate(1);
    shifted.setMonth(shifted.getMonth() + direction);
    const lastDay = new Date(
      shifted.getFullYear(),
      shifted.getMonth() + 1,
      0,
    ).getDate();
    shifted.setDate(Math.min(originalDay, lastDay));
  }
  if (period === "year") {
    const originalMonth = shifted.getMonth();
    shifted.setDate(1);
    shifted.setFullYear(shifted.getFullYear() + direction);
    shifted.setMonth(originalMonth);
  }
  return shifted;
}
