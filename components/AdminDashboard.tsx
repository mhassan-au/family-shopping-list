"use client";

import { FormEvent, useState } from "react";
import { FiArrowLeft, FiEdit3, FiPlus, FiRefreshCw, FiSettings, FiTrash2, FiX } from "react-icons/fi";
import { getDeviceLogin } from "@/lib/device";
import { UI_TEXT } from "@/lib/uiText";
import { CategoryKind, useCategoryConfig } from "@/hooks/useCategoryConfig";
import { useBankSync } from "@/hooks/useBankSync";
import { BANK_ACCOUNTS, runManualBankSync } from "@/lib/bankSync";
import { BankAccountKey } from "@/lib/types";

const CATEGORY_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} &'/.&()-]{0,39}$/u;

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
        <h2 className="font-bold">{UI_TEXT.admin.bankSync}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.admin.bankSyncDescription}</p>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
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
    </main>
  );
}
