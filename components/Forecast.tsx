"use client";

import { useMemo, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiEdit2, FiPlus, FiTrendingUp, FiX } from "react-icons/fi";
import { buildMonthlyProjection, ForecastEntry, toDateKey } from "@/lib/forecast";
import { UI_TEXT } from "@/lib/uiText";

const currency = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const safetyBuffer = 1500;

type AuditRecord = { id: number; subject: string; from: string; to: string; reason: string; timestamp: string };

function mockEntries(year: number, monthIndex: number): ForecastEntry[] {
  const key = (day: number) => toDateKey(year, monthIndex, day);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return [
    { id: "pay-1", dateKey: key(5), description: "Fortnightly pay", amount: 2800, direction: "income", source: "scheduled" },
    { id: "expenses-total", dateKey: key(8), description: UI_TEXT.forecast.expensesTotal, amount: 126.4, direction: "expense", source: "actual" },
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
  const [entries, setEntries] = useState<ForecastEntry[]>(() => mockEntries(now.getFullYear(), now.getMonth()));
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingDateKey, setEditingDateKey] = useState<string | null>(null);
  const year = anchor.getFullYear();
  const monthIndex = anchor.getMonth();
  const carriedForward = 1800;
  const [openingBalance, setOpeningBalance] = useState(1650);
  const [showOpeningBalance, setShowOpeningBalance] = useState(false);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const projection = useMemo(
    () => buildMonthlyProjection({ year, monthIndex, openingBalance, entries, todayKey }),
    [entries, monthIndex, openingBalance, todayKey, year],
  );
  const monthLabel = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(anchor);
  const shortMonth = new Intl.DateTimeFormat("en-AU", { month: "short" }).format(anchor);
  const gap = Math.max(0, safetyBuffer - projection.lowestDay.closingBalance);

  function changeMonth(direction: number) {
    const next = new Date(year, monthIndex + direction, 1);
    setAnchor(next);
    setEntries(mockEntries(next.getFullYear(), next.getMonth()));
  }

  function toggleEntry(entryId: string) {
    setEntries((current) => current.map((entry) => entry.id === entryId ? { ...entry, excluded: !entry.excluded } : entry));
  }

  function addOneOff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const direction = form.get("direction") === "expense" ? "expense" : "income";
    setEntries((current) => [...current, {
      id: `one-off-${Date.now()}`,
      dateKey: String(form.get("date")),
      description: String(form.get("description")),
      amount: Number(form.get("amount")),
      direction,
      source: "scheduled",
    }]);
    setShowAddEntry(false);
  }

  function saveDayAdjustments(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason"));
    setEntries((current) => current.map((entry) => {
      if (entry.dateKey !== editingDateKey) return entry;
      const nextExcluded = form.get(`included-${entry.id}`) !== "on";
      const adjustedAmount = entry.source === "actual" ? Number(form.get(`amount-${entry.id}`)) : entry.amount;
      const nextAmount = Number.isFinite(adjustedAmount) && adjustedAmount >= 0 ? adjustedAmount : entry.amount;
      if (nextAmount !== entry.amount) setAuditRecords((records) => [{ id: Date.now() + 1, subject: entry.description, from: currency.format(entry.amount), to: currency.format(nextAmount), reason, timestamp: new Date().toLocaleString("en-AU") }, ...records]);
      if (nextExcluded !== Boolean(entry.excluded)) setAuditRecords((records) => [{ id: Date.now(), subject: entry.description, from: entry.excluded ? UI_TEXT.forecast.excluded : UI_TEXT.forecast.included, to: nextExcluded ? UI_TEXT.forecast.excluded : UI_TEXT.forecast.included, reason, timestamp: new Date().toLocaleString("en-AU") }, ...records]);
      return { ...entry, amount: nextAmount, excluded: nextExcluded };
    }));
    setEditingDateKey(null);
  }

  function saveOpeningBalance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextBalance = Number(form.get("openingBalance"));
    if (Number.isFinite(nextBalance) && nextBalance !== openingBalance) {
      setAuditRecords((records) => [{ id: Date.now(), subject: UI_TEXT.forecast.openingBalance, from: currency.format(openingBalance), to: currency.format(nextBalance), reason: String(form.get("reason")), timestamp: new Date().toLocaleString("en-AU") }, ...records]);
      setOpeningBalance(nextBalance);
    }
    setShowOpeningBalance(false);
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
          <SummaryItem label={UI_TEXT.forecast.openingBalance} value={currency.format(openingBalance)} action={<button type="button" onClick={() => setShowOpeningBalance(true)} className="flex size-6 items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" aria-label={UI_TEXT.forecast.editOpeningBalance}><FiEdit2 size={13} aria-hidden="true" /></button>} />
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
            <li key={day.dateKey} className={`group rounded-xl border px-3 py-2 transition ${day.state === "today" ? "border-emerald-500 bg-emerald-50 font-semibold shadow-sm dark:bg-emerald-950" : day.state === "past" ? "border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500" : "border-slate-100 bg-white text-slate-500 opacity-65 dark:border-slate-800 dark:bg-slate-900"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <time dateTime={day.dateKey} className="w-14 shrink-0 text-xs uppercase">{day.state === "today" ? UI_TEXT.forecast.today : new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric" }).format(new Date(year, monthIndex, day.day))}</time>
                  <div className="min-w-0">{day.entries.length ? day.entries.map((entry) => <p key={entry.id} className={`truncate text-sm ${entry.excluded ? "line-through opacity-50" : ""}`}><span className={entry.direction === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}>{entry.direction === "income" ? "+" : "−"}{currency.format(entry.amount)}</span> {entry.description}{entry.excluded ? ` · ${UI_TEXT.forecast.excluded}` : ""}</p>) : <p className="text-xs">{UI_TEXT.forecast.noActivity}</p>}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2"><div className="text-right"><p className="text-sm font-bold">{currency.format(day.closingBalance)}</p>{day.state === "future" && <p className="text-[10px] uppercase">{UI_TEXT.forecast.projected}</p>}</div>{day.entries.length > 0 && <button type="button" onClick={() => setEditingDateKey(day.dateKey)} className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700" aria-label={UI_TEXT.forecast.editDay(day.dateKey)}><FiEdit2 size={14} aria-hidden="true" /></button>}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <button type="button" className="fixed bottom-24 left-1/2 z-30 flex size-14 translate-x-[calc(12rem-3.5rem)] items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 active:scale-95 sm:translate-x-[calc(14rem-3.5rem)]" aria-label={UI_TEXT.forecast.add} title={UI_TEXT.forecast.add} onClick={() => setShowAddEntry(true)}><FiPlus size={26} aria-hidden="true" /></button>

      {showAddEntry && <ForecastDialog title={UI_TEXT.forecast.addOneOffTitle} onClose={() => setShowAddEntry(false)}><form onSubmit={addOneOff} className="space-y-4"><label className="block text-sm font-medium">{UI_TEXT.forecast.entryType}<select name="direction" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"><option value="expense">{UI_TEXT.forecast.unexpectedExpense}</option><option value="income">{UI_TEXT.forecast.oneOffIncome}</option></select></label><label className="block text-sm font-medium">{UI_TEXT.forecast.entryDate}<input required type="date" name="date" defaultValue={toDateKey(year, monthIndex, Math.min(now.getDate(), new Date(year, monthIndex + 1, 0).getDate()))} min={toDateKey(year, monthIndex, 1)} max={toDateKey(year, monthIndex, new Date(year, monthIndex + 1, 0).getDate())} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" /></label><label className="block text-sm font-medium">{UI_TEXT.forecast.entryDescription}<input required name="description" placeholder={UI_TEXT.forecast.entryDescriptionPlaceholder} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" /></label><label className="block text-sm font-medium">{UI_TEXT.forecast.entryAmount}<input required type="number" name="amount" min="0.01" step="0.01" inputMode="decimal" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" /></label><p className="text-xs text-slate-500">{UI_TEXT.forecast.previewOnlyHelp}</p><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowAddEntry(false)} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">{UI_TEXT.common.cancel}</button><button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{UI_TEXT.forecast.addEntry}</button></div></form></ForecastDialog>}

      {editingDateKey && <ForecastDialog title={UI_TEXT.forecast.editDay(new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long" }).format(new Date(`${editingDateKey}T00:00:00`)))} onClose={() => setEditingDateKey(null)}><p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.forecast.editDayHelp}</p><form onSubmit={saveDayAdjustments}><div className="space-y-2">{entries.filter((entry) => entry.dateKey === editingDateKey).map((entry) => <div key={entry.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><div className="flex items-center justify-between gap-3"><span className="min-w-0"><span className="block truncate font-medium">{entry.description}</span>{entry.source === "actual" ? <span className="text-xs text-slate-500">{UI_TEXT.forecast.expensesTotalHelp}</span> : <span className={entry.direction === "income" ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>{entry.direction === "income" ? "+" : "−"}{currency.format(entry.amount)}</span>}</span><label className="flex shrink-0 items-center gap-2 text-sm"><span>{entry.excluded ? UI_TEXT.forecast.excluded : UI_TEXT.forecast.included}</span><input type="checkbox" checked={!entry.excluded} onChange={() => toggleEntry(entry.id)} aria-label={UI_TEXT.forecast.excludeFromForecast(entry.description)} className="size-5 accent-emerald-600" /></label></div>{entry.source === "actual" && <label className="mt-3 block text-sm font-medium">{UI_TEXT.forecast.forecastAmount}<div className="relative mt-1"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">$</span><input required type="number" name={`amount-${entry.id}`} defaultValue={entry.amount} min="0" step="0.01" inputMode="decimal" className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 dark:border-slate-600 dark:bg-slate-800" /></div></label>}</div>)}</div><ReasonField /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditingDateKey(null)} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">{UI_TEXT.common.cancel}</button><button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{UI_TEXT.forecast.saveAdjustments}</button></div></form></ForecastDialog>}

      {showOpeningBalance && <ForecastDialog title={UI_TEXT.forecast.editOpeningBalance} onClose={() => setShowOpeningBalance(false)}><p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.forecast.openingBalanceHelp}</p><form onSubmit={saveOpeningBalance}><label className="block text-sm font-medium">{UI_TEXT.forecast.openingBalance}<div className="relative mt-1"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">$</span><input required autoFocus type="number" name="openingBalance" defaultValue={openingBalance} step="0.01" inputMode="decimal" className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-7 pr-3 dark:border-slate-600 dark:bg-slate-800" /></div></label><ReasonField /><AuditTrail records={auditRecords} /><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowOpeningBalance(false)} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">{UI_TEXT.common.cancel}</button><button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{UI_TEXT.common.save}</button></div></form></ForecastDialog>}
    </main>
  );
}

function ForecastDialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.common.close}><FiX aria-hidden="true" /></button></div>{children}</section></div>;
}

function ReasonField() { return <label className="mt-4 block text-sm font-medium">{UI_TEXT.forecast.changeReason}<textarea required name="reason" rows={2} maxLength={160} placeholder={UI_TEXT.forecast.changeReasonPlaceholder} className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" /></label>; }

function AuditTrail({ records }: { records: AuditRecord[] }) { return <section className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700"><h3 className="text-sm font-bold">{UI_TEXT.forecast.auditTrail}</h3>{records.length === 0 ? <p className="mt-2 text-xs text-slate-500">{UI_TEXT.forecast.noAuditHistory}</p> : <ol className="mt-2 max-h-32 space-y-2 overflow-y-auto">{records.map((record) => <li key={record.id} className="rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800"><p className="font-semibold">{record.subject} · {UI_TEXT.forecast.changedFromTo(record.from, record.to)}</p><p className="text-slate-500">{UI_TEXT.forecast.changedByOwner(record.timestamp)}</p><p>{record.reason}</p></li>)}</ol>}</section>; }

function SummaryItem({ label, value, action, tone }: { label: string; value: string; action?: React.ReactNode; tone?: "rose" | "emerald" }) {
  return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt><dd className={`mt-1 flex items-center gap-1 font-bold ${tone === "rose" ? "text-rose-700 dark:text-rose-300" : tone === "emerald" ? "text-emerald-700 dark:text-emerald-300" : ""}`}>{value}{action}</dd></div>;
}
