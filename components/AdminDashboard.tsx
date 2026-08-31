"use client";

import { FormEvent, useState } from "react";
import { FiArrowLeft, FiClock, FiEdit3, FiFileText, FiPlus, FiRefreshCw, FiSettings, FiTrash2, FiTrendingDown, FiTrendingUp, FiX } from "react-icons/fi";
import { getDeviceLogin } from "@/lib/device";
import { UI_TEXT } from "@/lib/uiText";
import { CategoryKind, useCategoryConfig } from "@/hooks/useCategoryConfig";
import { useBankSync } from "@/hooks/useBankSync";
import { BANK_ACCOUNTS, runManualBankSync } from "@/lib/bankSync";
import { BankAccountKey, BankSyncAuditRecord } from "@/lib/types";
import type { ForecastAuditRecord, ForecastSchedule } from "@/lib/types";
import { useForecast } from "@/hooks/useForecast";
import { addForecastSchedule, inactivateForecastSchedule } from "@/lib/forecastStore";
import DeviceDebugId from "./DeviceDebugId";

const CATEGORY_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} &'/.&()-]{0,39}$/u;
const recurringDate = new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "2-digit", year: "2-digit" });

type MockSchedule = ForecastSchedule;

const TAB_THEMES: Record<CategoryKind, {
  active: string;
  inactive: string;
  action: string;
  tag: string;
}> = {
  shops: {
    active: "bg-sky-600 text-white shadow-sm",
    inactive: "bg-sky-50 text-sky-800 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-200",
    action: "bg-sky-600 hover:bg-sky-700",
    tag: "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-400 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100",
  },
  shopping: {
    active: "bg-emerald-600 text-white shadow-sm",
    inactive: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200",
    action: "bg-emerald-600 hover:bg-emerald-700",
    tag: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  },
  expenses: {
    active: "bg-rose-600 text-white shadow-sm",
    inactive: "bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-200",
    action: "bg-rose-600 hover:bg-rose-700",
    tag: "border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-400 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100",
  },
};

export default function AdminDashboard({
  onBack,
  onOpenTransactions,
}: {
  onBack: () => void;
  onOpenTransactions: () => void;
}) {
  const login = getDeviceLogin();
  const config = useCategoryConfig();
  const bankSync = useBankSync(login?.role === "owner");
  const forecast = useForecast();
  const [activeTab, setActiveTab] = useState<CategoryKind>("shops");
  const [dialog, setDialog] = useState<{
    mode: "add" | "edit";
    kind: CategoryKind;
    oldName?: string;
  } | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
    openTransactions?: boolean;
  } | null>(null);
  const [syncingBank, setSyncingBank] = useState<BankAccountKey | null>(null);
  const [scheduleDialog, setScheduleDialog] = useState<MockSchedule["kind"] | null>(null);
  const [historyScheduleId, setHistoryScheduleId] = useState<string | null>(null);
  const [scheduleTab, setScheduleTab] = useState<MockSchedule["kind"]>("income");
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleAmount, setScheduleAmount] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState<MockSchedule["frequency"]>("fortnightly");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleReason, setScheduleReason] = useState("");
  const [inactiveReason, setInactiveReason] = useState("");
  const [showForecastAudit, setShowForecastAudit] = useState(false);
  const [showBankSyncReport, setShowBankSyncReport] = useState(false);
  const mockSchedules = forecast.schedules;

  if (login?.role !== "owner") return null;

  const categories = config[activeTab];
  const activeTheme = TAB_THEMES[activeTab];
  const tabs: Array<{ kind: CategoryKind; label: string }> = [
    { kind: "shops", label: UI_TEXT.admin.shops },
    { kind: "shopping", label: UI_TEXT.admin.shoppingCategories },
    { kind: "expenses", label: UI_TEXT.admin.expenseCategories },
  ];

  function isDuplicate(kind: CategoryKind, name: string, except?: string) {
    return config[kind].some(
      (category) => category !== except && category.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
  }

  function openAdd() {
    setDialog({ mode: "add", kind: activeTab });
    setValue("");
    setMessage(null);
  }

  function openEdit(category: string) {
    setDialog({ mode: "edit", kind: activeTab, oldName: category });
    setValue(category);
    setMessage(null);
  }

  function closeDialog() {
    if (saving) return;
    setDialog(null);
    setValue("");
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!dialog) return;
    const name = value.trim();
    if (!CATEGORY_PATTERN.test(name) || isDuplicate(dialog.kind, name, dialog.oldName)) {
      setMessage({ text: UI_TEXT.admin.invalidCategory, error: true });
      return;
    }

    setSaving(true);
    try {
      if (dialog.mode === "add") {
        await config.addCategory(dialog.kind, name);
        setMessage({ text: UI_TEXT.admin.categoryAdded(name), error: false });
      } else if (dialog.oldName && name !== dialog.oldName) {
        await config.renameCategory(dialog.kind, dialog.oldName, name);
        setMessage({ text: UI_TEXT.admin.categoryRenamed(dialog.oldName, name), error: false });
      }
      setDialog(null);
      setValue("");
    } catch (saveError) {
      console.error("Saving shared option failed", saveError);
      setMessage({ text: UI_TEXT.admin.saveFailed, error: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!dialog?.oldName || config[dialog.kind].length <= 1) return;
    setSaving(true);
    try {
      await config.deleteCategory(dialog.kind, dialog.oldName);
      setMessage({ text: UI_TEXT.admin.categoryDeleted(dialog.oldName), error: false });
      setDialog(null);
      setValue("");
    } catch (deleteError) {
      console.error("Deleting shared option failed", deleteError);
      setMessage({ text: UI_TEXT.admin.saveFailed, error: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleBankSync(accountKey: BankAccountKey) {
    setSyncingBank(accountKey);
    setMessage(null);
    try {
      const result = await runManualBankSync(
        accountKey,
        bankSync.statuses[accountKey]?.lastSyncedAtMs,
      );
      setMessage({
        text: UI_TEXT.admin.bankSyncResult(result.importedCount, result.fetchedCount),
        error: false,
        openTransactions: result.importedCount > 0,
      });
    } catch (syncError) {
      console.error("Manual UP sync failed", syncError);
      setMessage({ text: UI_TEXT.admin.bankSyncFailed, error: true });
    } finally {
      setSyncingBank(null);
    }
  }

  function openScheduleDialog(kind: MockSchedule["kind"]) {
    setScheduleTab(kind);
    setScheduleDialog(kind);
    setScheduleName("");
    setScheduleAmount("");
    setScheduleFrequency(kind === "income" ? "fortnightly" : "monthly");
    setScheduleDate("");
    setScheduleReason("");
  }

  function closeScheduleDialog() {
    setScheduleDialog(null);
  }

  function handleMockSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scheduleDialog) return;
    const amount = Number(scheduleAmount);
    const firstDate = scheduleDate;
    if (!scheduleName.trim() || !Number.isFinite(amount) || amount <= 0 || !firstDate || !scheduleReason.trim()) return;
    void addForecastSchedule({ kind: scheduleDialog, name: scheduleName, amount, frequency: scheduleFrequency, firstDate, reason: scheduleReason }).then(closeScheduleDialog);
  }

  function makeMockScheduleInactive(id: string) {
    if (!inactiveReason.trim()) return;
    const schedule = mockSchedules.find((item) => item.id === id);
    if (!schedule) return;
    void inactivateForecastSchedule(schedule, inactiveReason).then(() => { setInactiveReason(""); setHistoryScheduleId(null); });
  }

  const historySchedule = historyScheduleId === null
    ? null
    : mockSchedules.find((schedule) => schedule.id === historyScheduleId) ?? null;
  const scheduleHistory = historySchedule
    ? mockSchedules.filter((schedule) =>
        schedule.kind === historySchedule.kind &&
        schedule.name.toLocaleLowerCase() === historySchedule.name.toLocaleLowerCase(),
      )
    : [];

  return (
    <main className="mx-auto w-full max-w-md p-4 pb-10 sm:p-5">
      <header className="mb-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-100 via-indigo-50 to-blue-50 px-4 py-3 shadow-sm dark:border-violet-900 dark:from-violet-950 dark:via-indigo-950 dark:to-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiSettings className="text-violet-700 dark:text-violet-300" size={24} />
            <h1 className="text-xl font-bold">{UI_TEXT.admin.title}</h1>
          </div>
          <button type="button" onClick={onBack} className="flex size-10 items-center justify-center rounded-xl border border-violet-200 bg-white/70 text-violet-700 shadow-sm dark:border-violet-800 dark:bg-slate-900/60 dark:text-violet-200" aria-label={UI_TEXT.admin.backToShopping} title={UI_TEXT.admin.backToShopping}>
            <FiArrowLeft size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.admin.subtitle}</p>
      </header>
      <DeviceDebugId />

      {message && (
        message.openTransactions ? (
          <button
            type="button"
            onClick={onOpenTransactions}
            className="mb-3 w-full rounded-lg bg-emerald-100 px-3 py-2 text-left text-sm text-emerald-800 transition hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900"
            aria-label={UI_TEXT.admin.openSyncedTransactions}
          >
            {message.text}
          </button>
        ) : (
          <p className={`mb-3 rounded-lg px-3 py-2 text-sm ${message.error ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"}`} role={message.error ? "alert" : "status"}>
            {message.text}
          </p>
        )
      )}
      {config.error && <p className="mb-3 text-sm text-red-600" role="alert">{UI_TEXT.admin.loadFailed}</p>}

      <section className="mb-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50 p-4 shadow-sm dark:border-emerald-900 dark:from-emerald-950/60 dark:to-cyan-950/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><h2 className="font-bold">{UI_TEXT.admin.forecastSchedules}</h2><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-slate-900 dark:text-emerald-300">{UI_TEXT.admin.previewOnly}</span></div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.admin.forecastSchedulesHelp}</p>
          </div>
          <button type="button" onClick={() => setShowForecastAudit(true)} className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-300 bg-white/80 text-emerald-800 hover:bg-white dark:border-emerald-800 dark:bg-slate-900/70 dark:text-emerald-200" aria-label={UI_TEXT.admin.openForecastAudit} title={UI_TEXT.admin.openForecastAudit}><FiClock aria-hidden="true" /></button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-white/70 p-1 dark:bg-slate-950/40">
          {(["income", "expense"] as const).map((kind) => (
            <div key={kind} className={`flex overflow-hidden rounded-lg ${scheduleTab === kind ? "bg-emerald-100 text-emerald-900 shadow-sm dark:bg-emerald-950 dark:text-emerald-100" : "text-slate-600 dark:text-slate-300"}`}>
              <button type="button" onClick={() => setScheduleTab(kind)} className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold">{kind === "income" ? <FiTrendingUp size={16} aria-hidden="true" /> : <FiTrendingDown size={16} aria-hidden="true" />}{kind === "income" ? UI_TEXT.admin.recurringIncomeTab : UI_TEXT.admin.recurringExpenseTab}</button>
              <button type="button" onClick={() => openScheduleDialog(kind)} className={`flex w-9 shrink-0 items-center justify-center border-l border-current/20 ${scheduleTab === kind ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} aria-label={kind === "income" ? UI_TEXT.admin.addRecurringIncome : UI_TEXT.admin.addRecurringExpense} title={kind === "income" ? UI_TEXT.admin.addRecurringIncome : UI_TEXT.admin.addRecurringExpense}><FiPlus size={17} aria-hidden="true" /></button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{UI_TEXT.admin.scheduleLifecycleHelp}</p>
        <div className="mt-3 space-y-2">
          {mockSchedules.filter((schedule) => schedule.kind === scheduleTab).map((schedule) => (
            <div key={schedule.id} className={`rounded-xl border border-white/80 bg-white/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/70 ${schedule.active ? "" : "opacity-55 grayscale"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate font-semibold">{schedule.name}</p><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${schedule.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{schedule.active ? UI_TEXT.admin.active : UI_TEXT.admin.inactive}</span></div><p className="text-xs capitalize text-slate-500 dark:text-slate-400">{schedule.frequency} · {UI_TEXT.admin.starts(recurringDate.format(new Date(`${schedule.firstDate}T00:00:00`)))}</p></div>
                <div className="flex shrink-0 items-center gap-2"><p className={`font-bold ${schedule.kind === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{schedule.kind === "income" ? "+" : "−"}{new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(schedule.amount)}</p><button type="button" onClick={() => setHistoryScheduleId(schedule.id)} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={UI_TEXT.admin.manageSchedule(schedule.name)} title={UI_TEXT.admin.manageSchedule(schedule.name)}><FiEdit3 size={15} aria-hidden="true" /></button></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm dark:border-violet-900 dark:bg-slate-900">
        <div className="grid grid-cols-3 gap-1 border-b border-violet-100 bg-slate-50 p-1 dark:border-violet-950 dark:bg-slate-950/50">
          {tabs.map((tab) => (
            <button key={tab.kind} type="button" onClick={() => setActiveTab(tab.kind)} className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${activeTab === tab.kind ? TAB_THEMES[tab.kind].active : TAB_THEMES[tab.kind].inactive}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">{tabs.find((tab) => tab.kind === activeTab)?.label}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{UI_TEXT.admin.tapToEdit}</p>
            </div>
            <button type="button" onClick={openAdd} className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${activeTheme.action}`} aria-label={UI_TEXT.admin.addCategory}>
              <FiPlus size={20} aria-hidden="true" />
            </button>
          </div>

          {config.loading ? <p className="text-sm">{UI_TEXT.loading}</p> : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button key={category} type="button" onClick={() => openEdit(category)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition ${activeTheme.tag}`}>
                  {category}<FiEdit3 size={13} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 shadow-sm dark:border-violet-900 dark:from-violet-950/60 dark:to-indigo-950/60">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{UI_TEXT.admin.bankSync}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.admin.bankSyncDescription}</p></div><button type="button" onClick={() => setShowBankSyncReport(true)} className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-violet-300 bg-white/80 text-violet-800 hover:bg-white dark:border-violet-800 dark:bg-slate-900/70 dark:text-violet-200" aria-label={UI_TEXT.admin.openBankSyncReport} title={UI_TEXT.admin.openBankSyncReport}><FiFileText aria-hidden="true" /></button></div>
        <div className="mt-3 space-y-2">
          {BANK_ACCOUNTS.map((account) => {
            const status = bankSync.statuses[account.key];
            const isSyncing = syncingBank === account.key;
            return (
              <div key={account.key} className="flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-white/75 p-3 dark:border-violet-800 dark:bg-slate-900/60">
                <div className="flex min-w-0 items-center gap-2">
                  <FiRefreshCw className={`shrink-0 text-violet-600 ${isSyncing ? "animate-spin" : ""}`} size={18} />
                  <div className="min-w-0">
                    <p className="font-semibold">{account.label}</p>
                    <p className="truncate text-xs text-slate-500">
                      {status?.lastSyncedAtMs
                        ? UI_TEXT.admin.lastSync(new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(status.lastSyncedAtMs)))
                        : UI_TEXT.admin.lastSyncNever}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => void handleBankSync(account.key)} disabled={Boolean(syncingBank) || bankSync.loading} className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50">
                  {isSyncing ? UI_TEXT.admin.syncingBank : UI_TEXT.admin.syncNow}
                </button>
              </div>
            );
          })}
        </div>
        {bankSync.error && <p className="mt-2 text-xs text-red-700 dark:text-red-300">{UI_TEXT.admin.bankSyncFailed}</p>}
      </section>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <form onSubmit={(event) => void handleSave(event)} className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{dialog.mode === "add" ? UI_TEXT.admin.addTitle : UI_TEXT.admin.renameTitle}</h2>
              <button type="button" onClick={closeDialog} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.common.close}><FiX size={18} aria-hidden="true" /></button>
            </div>
            <input value={value} onChange={(event) => setValue(event.target.value)} className="input mt-3 w-full px-3 py-2" placeholder={UI_TEXT.admin.newCategory} maxLength={40} autoFocus disabled={saving} />
            <div className={`mt-4 grid gap-2 ${dialog.mode === "edit" ? "grid-cols-3" : "grid-cols-2"}`}>
              {dialog.mode === "edit" && (
                <button type="button" onClick={() => void handleDelete()} disabled={saving || config[dialog.kind].length <= 1} className="flex items-center justify-center gap-1 rounded-lg border border-red-200 px-2 py-2 text-sm font-semibold text-red-700 disabled:opacity-40 dark:border-red-900 dark:text-red-300">
                  <FiTrash2 size={15} aria-hidden="true" />{UI_TEXT.common.remove}
                </button>
              )}
              <button type="button" onClick={closeDialog} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold dark:border-slate-700">{UI_TEXT.common.cancel}</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-violet-600 px-3 py-2 font-semibold text-white disabled:opacity-50">{saving ? UI_TEXT.common.pleaseWait : UI_TEXT.common.save}</button>
            </div>
          </form>
        </div>
      )}

      {scheduleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeScheduleDialog(); }}>
          <form onSubmit={handleMockSchedule} className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-600">{UI_TEXT.admin.previewOnly}</p><h2 className="text-lg font-bold">{scheduleDialog === "income" ? UI_TEXT.admin.recurringIncomeTitle : UI_TEXT.admin.recurringExpenseTitle}</h2></div>
              <button type="button" onClick={closeScheduleDialog} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.common.close}><FiX size={18} aria-hidden="true" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold">{UI_TEXT.admin.scheduleName}<input value={scheduleName} onChange={(event) => setScheduleName(event.target.value)} className="input mt-1 w-full px-3 py-2" placeholder={scheduleDialog === "income" ? UI_TEXT.admin.incomePlaceholder : UI_TEXT.admin.expensePlaceholder} maxLength={40} required autoFocus /></label>
              <label className="block text-sm font-semibold">{UI_TEXT.admin.scheduleAmount}<input value={scheduleAmount} onChange={(event) => setScheduleAmount(event.target.value)} className="input mt-1 w-full px-3 py-2" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" required /></label>
              <label className="block text-sm font-semibold">{UI_TEXT.admin.frequency}<select value={scheduleFrequency} onChange={(event) => setScheduleFrequency(event.target.value as MockSchedule["frequency"])} className="input mt-1 w-full px-3 py-2"><option value="weekly">{UI_TEXT.admin.weekly}</option><option value="fortnightly">{UI_TEXT.admin.fortnightly}</option><option value="monthly">{UI_TEXT.admin.monthly}</option><option value="quarterly">{UI_TEXT.admin.quarterly}</option><option value="yearly">{UI_TEXT.admin.yearly}</option></select></label>
              <label className="block text-sm font-semibold">{UI_TEXT.admin.firstDate}<input value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} className="input mt-1 w-full px-3 py-2" type="date" lang="en-AU" required /></label>
              <label className="block text-sm font-semibold">{UI_TEXT.forecast.changeReason}<textarea value={scheduleReason} onChange={(event) => setScheduleReason(event.target.value)} className="input mt-1 w-full resize-none px-3 py-2" rows={2} maxLength={160} required /></label>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{UI_TEXT.admin.previewNotSaved}</p>
            <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={closeScheduleDialog} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold dark:border-slate-700">{UI_TEXT.common.cancel}</button><button type="submit" className={`rounded-lg px-3 py-2 font-semibold text-white ${scheduleDialog === "income" ? "bg-emerald-600" : "bg-rose-600"}`}>{UI_TEXT.common.add}</button></div>
          </form>
        </div>
      )}

      {historySchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setHistoryScheduleId(null); }}>
          <section className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="schedule-history-title">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-violet-600">{UI_TEXT.admin.previewOnly}</p><h2 id="schedule-history-title" className="text-lg font-bold">{historySchedule.name}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{UI_TEXT.admin.scheduleHistoryHelp}</p></div><button type="button" onClick={() => setHistoryScheduleId(null)} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.common.close}><FiX size={18} aria-hidden="true" /></button></div>
            <div className="mt-4 space-y-2">
              {scheduleHistory.map((record) => (
                <div key={record.id} className={`rounded-xl border p-3 ${record.id === historySchedule.id ? "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/50" : "border-slate-200 dark:border-slate-700"}`}>
                  <div className="flex items-center justify-between gap-3"><p className="font-bold">{new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(record.amount)}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${record.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{record.active ? UI_TEXT.admin.active : UI_TEXT.admin.inactive}</span></div>
                  <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">{record.frequency} · {UI_TEXT.admin.starts(recurringDate.format(new Date(`${record.firstDate}T00:00:00`)))}</p>
                  {record.inactiveAt && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{UI_TEXT.admin.inactiveSince(new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(`${record.inactiveAt}T00:00:00`)))}</p>}
                  {record.inactiveReason && <p className="mt-1 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{UI_TEXT.admin.auditReason(record.inactiveReason)}</p>}
                </div>
              ))}
            </div>
            {historySchedule.active && <label className="mt-4 block text-sm font-semibold">{UI_TEXT.admin.inactiveReason}<textarea value={inactiveReason} onChange={(event) => setInactiveReason(event.target.value)} rows={2} maxLength={160} placeholder={UI_TEXT.admin.inactiveReasonPlaceholder} className="input mt-1 w-full resize-none px-3 py-2" required /></label>}
            <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => { setInactiveReason(""); setHistoryScheduleId(null); }} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold dark:border-slate-700">{UI_TEXT.common.close}</button><button type="button" onClick={() => makeMockScheduleInactive(historySchedule.id)} disabled={!historySchedule.active || !inactiveReason.trim()} className="rounded-lg bg-slate-700 px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-600">{historySchedule.active ? UI_TEXT.admin.makeInactive : UI_TEXT.admin.alreadyInactive}</button></div>
          </section>
        </div>
      )}

      {showForecastAudit && <ForecastAuditPage records={forecast.audit} onClose={() => setShowForecastAudit(false)} />}
      {showBankSyncReport && <BankSyncReport records={bankSync.audit} onClose={() => setShowBankSyncReport(false)} />}
    </main>
  );
}

function BankSyncReport({ records, onClose }: { records: BankSyncAuditRecord[]; onClose: () => void }) {
  const dateTime = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" });
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="bank-sync-report-title" className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"><header className="flex items-start justify-between gap-3 border-b border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950"><div><h2 id="bank-sync-report-title" className="font-bold">{UI_TEXT.admin.bankSyncReportTitle}</h2><p className="text-xs text-slate-600 dark:text-slate-300">{UI_TEXT.admin.bankSyncReportHelp}</p></div><button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900" aria-label={UI_TEXT.common.close}><FiX aria-hidden="true" /></button></header><div className="overflow-y-auto p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">{UI_TEXT.admin.bankSyncAuditAll}</p><span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">{records.length}</span></div>{records.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">{UI_TEXT.admin.bankSyncAuditEmpty}</p> : <ol className="space-y-3">{records.map((record) => <li key={record.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start gap-3"><span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${record.status === "success" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"}`}><FiRefreshCw size={15} aria-hidden="true" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="font-semibold">{record.accountLabel}</p><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${record.status === "success" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"}`}>{record.status === "success" ? UI_TEXT.admin.bankSyncSuccess : UI_TEXT.admin.bankSyncFailure}</span></div><p className="mt-1 text-xs text-slate-500">{dateTime.format(new Date(record.occurredAtMs))}</p><p className="mt-1 text-xs text-slate-500">{UI_TEXT.admin.bankSyncDevice(record.deviceUid.slice(-6))}</p></div></div></li>)}</ol>}</div></section></div>;
}

function ForecastAuditPage({ records: sourceRecords, onClose }: { records: ForecastAuditRecord[]; onClose: () => void }) {
  const titles: Record<ForecastAuditRecord["action"], string> = { opening_balance_changed: UI_TEXT.admin.auditOpeningBalance, daily_expense_adjusted: UI_TEXT.admin.auditDailyExpense, daily_expense_excluded: UI_TEXT.admin.auditExcluded, schedule_created: UI_TEXT.admin.auditScheduleCreated, schedule_inactivated: UI_TEXT.admin.auditScheduleInactive, one_off_created: UI_TEXT.admin.auditOneOffCreated };
  const records = sourceRecords.map((record) => ({ id: record.id, title: titles[record.action], subject: `${record.subject} · ${record.oldValue} → ${record.newValue}`, date: new Date(record.createdAtMs).toLocaleString("en-AU"), reason: record.reason }));
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="forecast-audit-title" className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"><header className="flex items-start justify-between gap-3 border-b border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950"><div><h2 id="forecast-audit-title" className="font-bold">{UI_TEXT.admin.forecastAuditTitle}</h2><p className="text-xs text-slate-600 dark:text-slate-300">{UI_TEXT.admin.forecastAuditHelp}</p></div><button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900" aria-label={UI_TEXT.common.close}><FiX aria-hidden="true" /></button></header><div className="overflow-y-auto p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">{UI_TEXT.admin.auditAll}</p><span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold dark:bg-slate-800">{records.length}</span></div>{records.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">{UI_TEXT.admin.auditEmpty}</p> : <ol className="space-y-3">{records.map((record) => <li key={record.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start gap-3"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><FiClock size={15} aria-hidden="true" /></span><div className="min-w-0"><p className="font-semibold">{record.title}</p><p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">{record.subject}</p><p className="mt-2 text-xs text-slate-500">{UI_TEXT.admin.auditByOwner} · {record.date}</p><p className="mt-1 rounded-lg bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-800">{UI_TEXT.admin.auditReason(record.reason)}</p></div></div></li>)}</ol>}</div></section></div>;
}
