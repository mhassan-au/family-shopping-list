"use client";

import { useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useExpenses } from "@/hooks/useExpenses";
import {
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

export default function ExpenseReport({ onClose }: { onClose: () => void }) {
  const { expenses, loading, error } = useExpenses();
  const [period, setPeriod] = useState<ReportPeriod>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const { start, end } = getPeriodRange(period, anchor);

  const report = useMemo(() => {
    const entries = expenses
      .filter((expense) => {
        const date = expenseDate(expense);
        return date >= start && date < end;
      })
      .sort((left, right) => right.createdAtMs - left.createdAtMs);
    const total = entries.reduce((sum, expense) => sum + expense.amount, 0);
    const categories = new Map<string, number>();

    entries.forEach((expense) => {
      const name = normalizeExpenseCategory(expense.category);
      categories.set(name, (categories.get(name) ?? 0) + expense.amount);
    });

    return {
      entries,
      total,
      average: entries.length ? total / entries.length : 0,
      unusualCount: entries.filter(
        (expense) =>
          expense.transactionType !== "amendment" &&
          (expense.unusual ?? isExpenseAmountUnusual(expense.category, expense.amount)),
      ).length,
      categories: [...categories.entries()]
        .filter(([, amount]) => amount !== 0)
        .sort((left, right) => right[1] - left[1]),
    };
  }, [end, expenses, start]);

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

          {report.entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-rose-200 bg-rose-50 p-5 text-center text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">
              {UI_TEXT.expenseReport.noExpenses}
            </p>
          ) : (
            <>
              <section className="mb-4 rounded-xl border border-rose-200 bg-white p-4 shadow-sm dark:border-rose-900 dark:bg-slate-900">
                <h2 className="mb-3 font-bold">{UI_TEXT.expenseReport.categoryBreakdown}</h2>
                <div className="space-y-3">
                  {report.categories.map(([name, amount]) => {
                    const percentage = report.total > 0 ? Math.max(0, (amount / report.total) * 100) : 0;
                    return (
                      <div key={name}>
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                          <span>{name}</span>
                          <span className="font-semibold">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-rose-100 dark:bg-rose-950">
                          <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(100, percentage)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-rose-200 bg-white p-4 shadow-sm dark:border-rose-900 dark:bg-slate-900">
                <h2 className="mb-3 font-bold">{UI_TEXT.expenseReport.recentTransactions}</h2>
                <div className="divide-y divide-rose-100 dark:divide-rose-950">
                  {report.entries.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{expense.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {normalizeExpenseCategory(expense.category)}
                          {expense.transactionType === "amendment" ? ` · ${UI_TEXT.expenseReport.amendment}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 font-semibold ${expense.amount < 0 ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
