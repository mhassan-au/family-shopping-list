"use client";

import { useState } from "react";
import {
  FiArrowLeft,
  FiArrowDown,
  FiArrowUp,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useExpenses } from "@/hooks/useExpenses";
import {
  getExpenseCategoryColor,
  isExpenseAmountUnusual,
  normalizeExpenseCategory,
} from "@/lib/config";
import { Expense } from "@/lib/types";
import { UI_TEXT } from "@/lib/uiText";

type ReportPeriod = "day" | "week" | "month" | "year";

function expenseDate(expense: Expense) {
  return expense.createdAt?.toDate() ?? new Date(expense.createdAtMs);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function getPeriodRange(period: ReportPeriod, anchor: Date) {
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

function shiftPeriod(date: Date, period: ReportPeriod, direction: number) {
  const shifted = new Date(date);
  if (period === "day") shifted.setDate(shifted.getDate() + direction);
  if (period === "week") shifted.setDate(shifted.getDate() + direction * 7);
  if (period === "month") shifted.setMonth(shifted.getMonth() + direction);
  if (period === "year") shifted.setFullYear(shifted.getFullYear() + direction);
  return shifted;
}

function formatPeriodLabel(period: ReportPeriod, start: Date, end: Date) {
  if (period === "day") {
    return new Intl.DateTimeFormat("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(start);
  }
  if (period === "month") {
    return new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(start);
  }
  if (period === "year") return String(start.getFullYear());

  const lastDay = new Date(end.getTime() - 1);
  const formatter = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" });
  return `${formatter.format(start)} – ${formatter.format(lastDay)}`;
}

function getTrendLabels(period: ReportPeriod, start: Date) {
  if (period === "day") return ["Night", "Morning", "Afternoon", "Evening"];
  if (period === "week") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (period === "month") return ["W1", "W2", "W3", "W4", "W5"];
  return Array.from({ length: 12 }, (_, month) =>
    new Intl.DateTimeFormat("en-AU", { month: "short" }).format(
      new Date(start.getFullYear(), month, 1),
    ),
  );
}

function getTrendBucket(period: ReportPeriod, date: Date) {
  if (period === "day") return Math.min(3, Math.floor(date.getHours() / 6));
  if (period === "week") return date.getDay() === 0 ? 6 : date.getDay() - 1;
  if (period === "month") return Math.min(4, Math.floor((date.getDate() - 1) / 7));
  return date.getMonth();
}

export default function ExpenseReport({ onClose }: { onClose: () => void }) {
  const { expenses, loading, error } = useExpenses();
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [reportOpenedAt] = useState(() => Date.now());
  const { start, end } = getPeriodRange(period, anchor);
  const previousRange = getPeriodRange(period, shiftPeriod(anchor, period, -1));
  const startMs = start.getTime();
  const endMs = end.getTime();
  const previousStartMs = previousRange.start.getTime();
  const nowMs = reportOpenedAt;
  const isCurrentPeriod = nowMs >= startMs && nowMs < endMs;
  const previousEndMs = isCurrentPeriod
    ? Math.min(previousRange.end.getTime(), previousStartMs + (nowMs - startMs))
    : previousRange.end.getTime();

  const report = (() => {
    const entries = expenses
      .filter((expense) => expense.createdAtMs >= startMs && expense.createdAtMs < endMs)
      .sort((left, right) => right.createdAtMs - left.createdAtMs);
    const previousEntries = expenses.filter(
      (expense) =>
        expense.createdAtMs >= previousStartMs && expense.createdAtMs < previousEndMs,
    );
    const total = entries.reduce((sum, expense) => sum + expense.amount, 0);
    const previousTotal = previousEntries.reduce((sum, expense) => sum + expense.amount, 0);
    const categories = new Map<string, { amount: number; count: number }>();
    const previousCategories = new Map<string, number>();

    entries.forEach((expense) => {
      const name = normalizeExpenseCategory(expense.category);
      const current = categories.get(name) ?? { amount: 0, count: 0 };
      categories.set(name, {
        amount: current.amount + expense.amount,
        count: current.count + 1,
      });
    });

    previousEntries.forEach((expense) => {
      const name = normalizeExpenseCategory(expense.category);
      previousCategories.set(name, (previousCategories.get(name) ?? 0) + expense.amount);
    });

    const categoryComparisons = [...new Set([
      ...categories.keys(),
      ...previousCategories.keys(),
    ])].map((name) => {
      const current = categories.get(name) ?? { amount: 0, count: 0 };
      const previousAmount = previousCategories.get(name) ?? 0;
      return {
        name,
        ...current,
        previousAmount,
        change: current.amount - previousAmount,
      };
    });
    const categoryDetails = categoryComparisons
      .filter((category) => category.amount > 0)
      .sort((left, right) => right.amount - left.amount);
    const biggestIncrease = [...categoryComparisons].sort(
      (left, right) => right.change - left.change,
    )[0];
    const biggestDecrease = [...categoryComparisons]
      .filter((category) => category.change < 0)
      .sort((left, right) => left.change - right.change)[0];
    const mostFrequent = [...categoryDetails].sort((left, right) => right.count - left.count)[0];
    const largestTransaction = entries
      .filter((expense) => expense.transactionType !== "amendment")
      .sort((left, right) => right.amount - left.amount)[0];
    const unusualEntries = entries.filter(
      (expense) =>
        expense.transactionType !== "amendment" &&
        (expense.unusual ?? isExpenseAmountUnusual(expense.category, expense.amount)),
    );
    const trend = getTrendLabels(period, new Date(startMs)).map((label, index) => ({
      label,
      amount: entries
        .filter((expense) => getTrendBucket(period, expenseDate(expense)) === index)
        .reduce((sum, expense) => sum + expense.amount, 0),
    }));

    return {
      entries,
      total,
      previousTotal,
      totalChange: total - previousTotal,
      changePercent:
        previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null,
      average: entries.length ? total / entries.length : 0,
      unusualCount: unusualEntries.length,
      unusualTotal: unusualEntries.reduce((sum, expense) => sum + expense.amount, 0),
      categories: categoryDetails,
      comparisonCategories: categoryComparisons
        .filter((category) => category.amount > 0 || category.previousAmount > 0)
        .sort(
          (left, right) =>
            Math.max(right.amount, right.previousAmount) -
            Math.max(left.amount, left.previousAmount),
        ),
      biggestIncrease: biggestIncrease?.change > 0 ? biggestIncrease : undefined,
      biggestDecrease,
      mostFrequent,
      largestTransaction,
      trend,
    };
  })();

  const categoryTotal = report.categories.reduce(
    (sum, category) => sum + category.amount,
    0,
  );
  const pieChart = report.categories.reduce(
    (chart, category) => {
      const nextAngle = chart.angle +
        (categoryTotal > 0 ? (category.amount / categoryTotal) * 360 : 0);
      const color = getExpenseCategoryColor(category.name);
      return {
        angle: nextAngle,
        segments: [
          ...chart.segments,
          `${color} ${chart.angle}deg ${nextAngle}deg`,
        ],
        labels: [
          ...chart.labels,
          {
            name: category.name,
            percentage: categoryTotal > 0
              ? Math.round((category.amount / categoryTotal) * 100)
              : 0,
            angle: chart.angle + (nextAngle - chart.angle) / 2,
          },
        ],
      };
    },
    {
      angle: 0,
      segments: [] as string[],
      labels: [] as Array<{ name: string; percentage: number; angle: number }>,
    },
  );

  return (
    <main className="mx-auto w-full max-w-md p-4 pb-24 sm:p-5 sm:pb-24">
      <header className="mb-4 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-100 via-pink-50 to-orange-50 px-4 py-3 shadow-sm dark:border-rose-900 dark:from-rose-950 dark:via-pink-950 dark:to-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiBarChart2 className="text-rose-700 dark:text-rose-300" size={24} />
            <h1 className="text-xl font-bold">{UI_TEXT.expenseReport.title}</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-xl border border-rose-200 bg-white/70 text-rose-700 shadow-sm dark:border-rose-800 dark:bg-slate-900/60 dark:text-rose-200"
            aria-label={UI_TEXT.expenseReport.back}
            title={UI_TEXT.expenseReport.back}
          >
            <FiArrowLeft size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {UI_TEXT.expenseReport.subtitle}
        </p>
      </header>

      <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl bg-rose-100 p-1 dark:bg-rose-950">
        {(["day", "week", "month", "year"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setPeriod(option);
              setAnchor(new Date());
            }}
            className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${
              period === option
                ? "bg-rose-600 text-white shadow-sm"
                : "text-rose-800 dark:text-rose-100"
            }`}
          >
            {UI_TEXT.expenseReport[option]}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-white px-2 py-2 shadow-sm dark:border-rose-900 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setAnchor((current) => shiftPeriod(current, period, -1))}
          className="flex size-9 items-center justify-center rounded-lg text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950"
          aria-label={UI_TEXT.expenseReport.previous}
        >
          <FiChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => setAnchor(new Date())}
          className="min-w-0 px-2 text-center text-sm font-semibold"
          title={UI_TEXT.expenseReport.today}
        >
          {formatPeriodLabel(period, start, end)}
        </button>
        <button
          type="button"
          onClick={() => setAnchor((current) => shiftPeriod(current, period, 1))}
          className="flex size-9 items-center justify-center rounded-lg text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950"
          aria-label={UI_TEXT.expenseReport.next}
        >
          <FiChevronRight size={20} />
        </button>
      </div>

      {loading && <p>{UI_TEXT.loading}</p>}
      {error && <p className="mb-3 text-sm text-red-600" role="alert">{error}</p>}

      {!loading && (
        <>
          <section className="mb-4 grid grid-cols-2 gap-2">
            {[
              [UI_TEXT.expenseReport.total, formatCurrency(report.total)],
              [UI_TEXT.expenseReport.transactions, String(report.entries.length)],
              [UI_TEXT.expenseReport.average, formatCurrency(report.average)],
              [UI_TEXT.expenseReport.unusual, String(report.unusualCount)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-rose-200 bg-white p-3 shadow-sm dark:border-rose-900 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-bold text-rose-700 dark:text-rose-300">{value}</p>
              </div>
            ))}
          </section>

          <section className={`mb-4 rounded-xl border p-4 shadow-sm ${
            report.totalChange > 0
              ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
              : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {isCurrentPeriod
                ? UI_TEXT.expenseReport.periodComparisonToDate
                : UI_TEXT.expenseReport.periodComparison}
            </p>
            <p className="mt-1 text-lg font-bold">
              {report.previousTotal === 0
                ? UI_TEXT.expenseReport.noPreviousComparison
                : report.totalChange > 0
                  ? UI_TEXT.expenseReport.spendingUp(
                      formatCurrency(Math.abs(report.totalChange)),
                      Math.abs(Math.round(report.changePercent ?? 0)),
                    )
                  : report.totalChange < 0
                    ? UI_TEXT.expenseReport.spendingDown(
                        formatCurrency(Math.abs(report.totalChange)),
                        Math.abs(Math.round(report.changePercent ?? 0)),
                      )
                    : UI_TEXT.expenseReport.spendingUnchanged}
            </p>
            {report.previousTotal > 0 && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {UI_TEXT.expenseReport.previousSpend(formatCurrency(report.previousTotal))}
              </p>
            )}
          </section>

          {report.entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-5 text-center text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">
              {UI_TEXT.expenseReport.noExpenses}
            </p>
          ) : (
            <>
              <section className="mb-4 rounded-xl border border-rose-200 bg-white p-4 shadow-sm dark:border-rose-900 dark:bg-slate-900">
                <h2 className="mb-3 font-bold">{UI_TEXT.expenseReport.spendingTrend}</h2>
                <div className="flex h-32 items-end gap-1.5">
                  {report.trend.map((point) => {
                    const maximum = Math.max(...report.trend.map((item) => item.amount), 1);
                    const height = point.amount > 0 ? Math.max(8, (point.amount / maximum) * 100) : 2;
                    return (
                      <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                        <span className="text-[0.6rem] font-semibold text-slate-500 dark:text-slate-400">
                          {point.amount > 0 ? formatCurrency(point.amount).replace("$", "") : ""}
                        </span>
                        <div className="flex h-20 w-full items-end rounded-md bg-rose-50 dark:bg-rose-950">
                          <div className="w-full rounded-md bg-rose-500" style={{ height: `${height}%` }} />
                        </div>
                        <span className="truncate text-[0.62rem] text-slate-500 dark:text-slate-400">
                          {point.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="mb-4 rounded-xl border border-rose-200 bg-gradient-to-br from-white to-rose-50 p-4 shadow-sm dark:border-rose-900 dark:from-slate-900 dark:to-rose-950">
                <h2 className="mb-3 font-bold">{UI_TEXT.expenseReport.insights}</h2>
                <div className="space-y-2 text-sm">
                  {report.categories[0] && (
                    <p>{UI_TEXT.expenseReport.topCategory(
                      report.categories[0].name,
                      formatCurrency(report.categories[0].amount),
                      report.total > 0 ? Math.round((report.categories[0].amount / report.total) * 100) : 0,
                    )}</p>
                  )}
                  {report.biggestIncrease && (
                    <p className="text-amber-800 dark:text-amber-200">
                      {UI_TEXT.expenseReport.biggestIncrease(
                        report.biggestIncrease.name,
                        formatCurrency(report.biggestIncrease.change),
                      )}
                    </p>
                  )}
                  {report.biggestDecrease && (
                    <p className="text-emerald-800 dark:text-emerald-200">
                      {UI_TEXT.expenseReport.biggestDecrease(
                        report.biggestDecrease.name,
                        formatCurrency(Math.abs(report.biggestDecrease.change)),
                      )}
                    </p>
                  )}
                  {report.mostFrequent && (
                    <p>{UI_TEXT.expenseReport.mostFrequent(
                      report.mostFrequent.name,
                      report.mostFrequent.count,
                    )}</p>
                  )}
                  {report.largestTransaction && (
                    <p>{UI_TEXT.expenseReport.largestTransaction(
                      report.largestTransaction.description,
                      formatCurrency(report.largestTransaction.amount),
                    )}</p>
                  )}
                  {report.unusualCount > 0 && (
                    <p className="text-amber-800 dark:text-amber-200">
                      {UI_TEXT.expenseReport.unusualSummary(
                        report.unusualCount,
                        formatCurrency(report.unusualTotal),
                      )}
                    </p>
                  )}
                </div>
              </section>

              <section className="mb-4 rounded-xl border border-rose-200 bg-white p-4 shadow-sm dark:border-rose-900 dark:bg-slate-900">
                <h2 className="mb-3 font-bold">{UI_TEXT.expenseReport.categoryBreakdown}</h2>
                <div className="grid grid-cols-[10.5rem_minmax(0,1fr)] items-center gap-3">
                  <div className="relative aspect-square w-full">
                    <div
                      className="absolute inset-0 rounded-full shadow-inner ring-4 ring-white dark:ring-slate-800"
                      style={{ background: `conic-gradient(${pieChart.segments.join(", ")})` }}
                      role="img"
                      aria-label={UI_TEXT.expenseReport.categoryChart}
                    />
                    {pieChart.labels.map((label) => {
                      const radians = ((label.angle - 90) * Math.PI) / 180;
                      const left = 50 + Math.cos(radians) * 31;
                      const top = 50 + Math.sin(radians) * 31;
                      return (
                        <span
                          key={label.name}
                          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded bg-black/35 px-1 py-0.5 text-[0.58rem] font-bold leading-none text-white shadow-sm"
                          style={{ left: `${left}%`, top: `${top}%` }}
                        >
                          {label.percentage}%
                        </span>
                      );
                    })}
                  </div>
                  <div className="min-w-0 space-y-2">
                    {report.categories.map((category) => {
                      return (
                        <div key={category.name} className="flex items-start justify-between gap-2 text-xs">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: getExpenseCategoryColor(category.name) }}
                            />
                            <span className="truncate">{category.name}</span>
                          </div>
                          <span className="flex shrink-0 items-center gap-1 font-semibold">
                            {formatCurrency(category.amount)}
                            {category.change > 0 && (
                              <FiArrowUp
                                className="text-amber-600 dark:text-amber-300"
                                size={14}
                                aria-label={UI_TEXT.expenseReport.categoryUp}
                              />
                            )}
                            {category.change < 0 && (
                              <FiArrowDown
                                className="text-emerald-600 dark:text-emerald-300"
                                size={14}
                                aria-label={UI_TEXT.expenseReport.categoryDown}
                              />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="mb-4 rounded-xl border border-rose-200 bg-white p-4 shadow-sm dark:border-rose-900 dark:bg-slate-900">
                <h2 className="mb-1 font-bold">{UI_TEXT.expenseReport.periodBars}</h2>
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                  {isCurrentPeriod
                    ? UI_TEXT.expenseReport.periodBarsToDate
                    : UI_TEXT.expenseReport.periodBarsComplete}
                </p>
                <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/70 px-2 py-2 dark:border-rose-900 dark:bg-rose-950/50">
                  <button
                    type="button"
                    onClick={() => setAnchor((current) => shiftPeriod(current, period, -1))}
                    className="flex size-9 items-center justify-center rounded-lg text-rose-700 hover:bg-white dark:text-rose-300 dark:hover:bg-slate-900"
                    aria-label={UI_TEXT.expenseReport.previous}
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnchor(new Date())}
                    className="min-w-0 px-2 text-center text-sm font-semibold"
                    title={UI_TEXT.expenseReport.today}
                  >
                    {formatPeriodLabel(period, start, end)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnchor((current) => shiftPeriod(current, period, 1))}
                    className="flex size-9 items-center justify-center rounded-lg text-rose-700 hover:bg-white dark:text-rose-300 dark:hover:bg-slate-900"
                    aria-label={UI_TEXT.expenseReport.next}
                  >
                    <FiChevronRight size={20} />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {report.comparisonCategories.map((category) => {
                    const color = getExpenseCategoryColor(category.name);
                    const maximum = Math.max(category.amount, category.previousAmount, 1);
                    const bars = [
                      {
                        label: UI_TEXT.expenseReport.previousShort,
                        amount: category.previousAmount,
                        background: `linear-gradient(135deg, ${color}99 0%, ${color}3d 100%)`,
                        shadow: `inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 1px ${color}80, 0 3px 8px ${color}2e`,
                        backdropFilter: "blur(4px)",
                      },
                      {
                        label: UI_TEXT.expenseReport.currentShort,
                        amount: category.amount,
                        background: color,
                        shadow: "0 3px 8px rgba(15,23,42,0.18)",
                        backdropFilter: "none",
                      },
                    ];

                    return (
                      <div key={category.name} className="w-28 shrink-0 rounded-xl bg-slate-50 px-2 py-3 dark:bg-slate-950/50">
                        <div className="flex h-32 items-end justify-center gap-2">
                          {bars.map((bar) => {
                            const height = bar.amount > 0
                              ? Math.max(8, (bar.amount / maximum) * 100)
                              : 2;
                            return (
                              <div key={bar.label} className="flex h-full w-10 flex-col items-center justify-end">
                                <span className="mb-1 text-[0.62rem] font-bold" title={formatCurrency(bar.amount)}>
                                  {formatCompactCurrency(bar.amount)}
                                </span>
                                <div className="flex h-24 w-full items-end overflow-hidden rounded-t-md bg-white dark:bg-slate-900">
                                  <div
                                    className="w-full rounded-t-md transition-[height] duration-500"
                                    style={{
                                      height: `${height}%`,
                                      background: bar.background,
                                      boxShadow: bar.shadow,
                                      backdropFilter: bar.backdropFilter,
                                    }}
                                  />
                                </div>
                                <span className="mt-1 text-[0.6rem] text-slate-500 dark:text-slate-400">
                                  {bar.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-2 truncate text-center text-xs font-semibold" title={category.name}>
                          {category.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
