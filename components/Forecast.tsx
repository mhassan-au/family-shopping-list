"use client";

import { useMemo, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiEdit2, FiPlus, FiTrendingUp } from "react-icons/fi";
import { buildMonthlyProjection, ForecastEntry, toDateKey } from "@/lib/forecast";
import { UI_TEXT } from "@/lib/uiText";

const currency = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const safetyBuffer = 1500;

function mockEntries(year: number, monthIndex: number): ForecastEntry[] {
  const key = (day: number) => toDateKey(year, monthIndex, day);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return [
    { id: "pay-1", dateKey: key(5), description: "Fortnightly pay", amount: 2800, direction: "income", source: "scheduled" },
    { id: "groceries", dateKey: key(8), description: "Groceries", amount: 126.4, direction: "expense", source: "actual" },
    { id: "once-off", dateKey: key(12), description: "One-off income", amount: 350, direction: "income", source: "scheduled" },
    { id: "pay-2", dateKey: key(19), description: "Fortnightly pay", amount: 2800, direction: "income", source: "scheduled" },
    { id: "credit-card", dateKey: key(22), description: "Credit card payment", amount: 900, direction: "expense", source: "scheduled" },
    { id: "mortgage", dateKey: key(27), description: "Mortgage", amount: 2000, direction: "expense", source: "scheduled" },
    { id: "month-end", dateKey: key(lastDay), description: "Month-end pay", amount: 900, direction: "income", source: "scheduled" },
  ];
}

export default function Forecast() {
  const now = new Date();
  const [anchor, setAnchor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const year = anchor.getFullYear();
  const monthIndex = anchor.getMonth();
  const carriedForward = 1800;
  const openingBalance = 1650;
  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const projection = useMemo(
    () => buildMonthlyProjection({ year, monthIndex, openingBalance, entries: mockEntries(year, monthIndex), todayKey }),
    [monthIndex, todayKey, year],
  );
  const monthLabel = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(anchor);
  const shortMonth = new Intl.DateTimeFormat("en-AU", { month: "short" }).format(anchor);
  const gap = Math.max(0, safetyBuffer - projection.lowestDay.closingBalance);

  function changeMonth(direction: number) {
    setAnchor(new Date(year, monthIndex + direction, 1));
  }

  return (
    <main className="mx-auto w-full max-w-md p-4 pb-28 sm:p-5 sm:pb-28">
      <header className="mb-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-100 via-teal-50 to-cyan-50 px-4 py-3 shadow-sm dark:border-emerald-900 dark:from-emerald-950 dark:via-teal-950 dark:to-slate-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><FiTrendingUp className="text-emerald-700 dark:text-emerald-300" size={24} aria-hidden="true" /><h1 className="text-xl font-bold">{UI_TEXT.forecast.title}</h1></div>
          <span className="rounded-full bg-white/75 px-2 py-1 text-[11px] font-bold text-emerald-800 dark:bg-slate-900/70 dark:text-emerald-200">{UI_TEXT.forecast.mockData}</span>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.forecast.subtitle}</p>
      </header>

      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => changeMonth(-1)} className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.forecast.previousMonth}><FiChevronLeft aria-hidden="true" /></button>
          <div className="flex items-center gap-2 font-bold"><FiCalendar className="text-emerald-600" aria-hidden="true" />{monthLabel}</div>
          <button type="button" onClick={() => changeMonth(1)} className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.forecast.nextMonth}><FiChevronRight aria-hidden="true" /></button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <SummaryItem label={UI_TEXT.forecast.carriedForward} value={currency.format(carriedForward)} />
          <SummaryItem label={UI_TEXT.forecast.openingBalance} value={currency.format(openingBalance)} action={<FiEdit2 size={13} aria-hidden="true" />} />
          <SummaryItem label={UI_TEXT.forecast.difference} value={currency.format(openingBalance - carriedForward)} tone="rose" />
          <SummaryItem label={UI_TEXT.forecast.projectedClosing} value={currency.format(projection.closingBalance)} tone="emerald" />
        </dl>
        <div className={`mt-2 rounded-lg px-3 py-2 text-sm ${gap > 0 ? "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100" : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"}`}>
          <p><span className="font-semibold">{UI_TEXT.forecast.lowestBalance}:</span> {currency.format(projection.lowestDay.closingBalance)} · {projection.lowestDay.day} {shortMonth}</p>
          <p className="mt-0.5 text-xs">{gap > 0 ? UI_TEXT.forecast.bufferGap(currency.format(gap)) : UI_TEXT.forecast.bufferSafe}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between px-1 pb-3"><h2 className="font-bold">{UI_TEXT.forecast.timelineTitle}</h2><div className="flex gap-2 text-[10px] text-slate-500"><span>● {UI_TEXT.forecast.today}</span><span className="opacity-55">● {UI_TEXT.forecast.projected}</span></div></div>
        <ol className="space-y-1.5">
          {projection.days.map((day) => (
            <li key={day.dateKey} className={`rounded-xl border px-3 py-2 transition ${day.state === "today" ? "border-emerald-500 bg-emerald-50 font-semibold shadow-sm dark:bg-emerald-950" : day.state === "past" ? "border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500" : "border-slate-100 bg-white text-slate-500 opacity-65 dark:border-slate-800 dark:bg-slate-900"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <time dateTime={day.dateKey} className="w-14 shrink-0 text-xs uppercase">{day.state === "today" ? UI_TEXT.forecast.today : new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric" }).format(new Date(year, monthIndex, day.day))}</time>
                  <div className="min-w-0">{day.entries.length ? day.entries.map((entry) => <p key={entry.id} className="truncate text-sm"><span className={entry.direction === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}>{entry.direction === "income" ? "+" : "−"}{currency.format(entry.amount)}</span> {entry.description}</p>) : <p className="text-xs">{UI_TEXT.forecast.noActivity}</p>}</div>
                </div>
                <div className="shrink-0 text-right"><p className="text-sm font-bold">{currency.format(day.closingBalance)}</p>{day.state === "future" && <p className="text-[10px] uppercase">{UI_TEXT.forecast.projected}</p>}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <button type="button" className="fixed bottom-24 left-1/2 z-30 flex size-14 translate-x-[calc(12rem-3.5rem)] items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 active:scale-95 sm:translate-x-[calc(14rem-3.5rem)]" aria-label={UI_TEXT.forecast.add} title={UI_TEXT.forecast.add} onClick={() => window.alert(UI_TEXT.forecast.mockAction)}><FiPlus size={26} aria-hidden="true" /></button>
    </main>
  );
}

function SummaryItem({ label, value, action, tone }: { label: string; value: string; action?: React.ReactNode; tone?: "rose" | "emerald" }) {
  return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt><dd className={`mt-1 flex items-center gap-1 font-bold ${tone === "rose" ? "text-rose-700 dark:text-rose-300" : tone === "emerald" ? "text-emerald-700 dark:text-emerald-300" : ""}`}>{value}{action}</dd></div>;
}
