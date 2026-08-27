"use client";

import { FormEvent, useState } from "react";
import { FiEdit3, FiPlus, FiRefreshCw, FiSettings } from "react-icons/fi";
import { getDeviceLogin } from "@/lib/device";
import { UI_TEXT } from "@/lib/uiText";
import { CategoryKind, useCategoryConfig } from "@/hooks/useCategoryConfig";

const CATEGORY_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} &'/.&()-]{0,39}$/u;

export default function AdminDashboard() {
  const login = getDeviceLogin();
  const {
    shopping,
    expenses,
    loading,
    error,
    addCategory,
    renameCategory,
  } = useCategoryConfig();
  const [newCategory, setNewCategory] = useState<Record<CategoryKind, string>>({
    shopping: "",
    expenses: "",
  });
  const [editing, setEditing] = useState<{ kind: CategoryKind; oldName: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  if (login?.role !== "owner") return null;

  function isDuplicate(kind: CategoryKind, name: string, except?: string) {
    const categories = kind === "shopping" ? shopping : expenses;
    return categories.some(
      (category) =>
        category !== except && category.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
  }

  async function handleAdd(event: FormEvent, kind: CategoryKind) {
    event.preventDefault();
    const name = newCategory[kind].trim();
    if (!CATEGORY_PATTERN.test(name) || isDuplicate(kind, name)) {
      setMessage({ text: UI_TEXT.admin.invalidCategory, error: true });
      return;
    }
    setSaving(true);
    try {
      await addCategory(kind, name);
      setNewCategory((current) => ({ ...current, [kind]: "" }));
      setMessage({ text: UI_TEXT.admin.categoryAdded(name), error: false });
    } catch (saveError) {
      console.error("Adding category failed", saveError);
      setMessage({ text: UI_TEXT.admin.saveFailed, error: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleRename(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const name = renameValue.trim();
    if (!CATEGORY_PATTERN.test(name) || isDuplicate(editing.kind, name, editing.oldName)) {
      setMessage({ text: UI_TEXT.admin.invalidCategory, error: true });
      return;
    }
    setSaving(true);
    try {
      await renameCategory(editing.kind, editing.oldName, name);
      setEditing(null);
      setRenameValue("");
      setMessage({ text: UI_TEXT.admin.categoryRenamed(editing.oldName, name), error: false });
    } catch (saveError) {
      console.error("Renaming category failed", saveError);
      setMessage({ text: UI_TEXT.admin.saveFailed, error: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md p-4 pb-24 sm:p-5 sm:pb-24">
      <header className="mb-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-100 via-indigo-50 to-blue-50 px-4 py-3 shadow-sm dark:border-violet-900 dark:from-violet-950 dark:via-indigo-950 dark:to-slate-900">
        <div className="flex items-center gap-2">
          <FiSettings className="text-violet-700 dark:text-violet-300" size={24} />
          <h1 className="text-xl font-bold">{UI_TEXT.admin.title}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {UI_TEXT.admin.subtitle}
        </p>
      </header>

      {message && (
        <p className={`mb-3 rounded-lg px-3 py-2 text-sm ${message.error
          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        }`} role={message.error ? "alert" : "status"}>
          {message.text}
        </p>
      )}
      {error && <p className="mb-3 text-sm text-red-600" role="alert">{UI_TEXT.admin.loadFailed}</p>}

      {([
        ["shopping", UI_TEXT.admin.shoppingCategories, shopping],
        ["expenses", UI_TEXT.admin.expenseCategories, expenses],
      ] as const).map(([kind, title, categories]) => (
        <section key={kind} className="mb-4 rounded-xl border border-violet-200 bg-white p-4 shadow-sm dark:border-violet-900 dark:bg-slate-900">
          <h2 className="font-bold">{title}</h2>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            {UI_TEXT.admin.categoryHelp}
          </p>
          {loading ? (
            <p className="text-sm">{UI_TEXT.loading}</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <span className="min-w-0 truncate text-sm font-medium">{category}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing({ kind, oldName: category });
                      setRenameValue(category);
                      setMessage(null);
                    }}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-violet-700 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-950"
                    aria-label={UI_TEXT.admin.renameCategory(category)}
                  >
                    <FiEdit3 size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={(event) => void handleAdd(event, kind)} className="mt-3 flex gap-2">
            <input
              value={newCategory[kind]}
              onChange={(event) => setNewCategory((current) => ({
                ...current,
                [kind]: event.target.value,
              }))}
              className="input min-w-0 flex-1 px-3 py-2"
              placeholder={UI_TEXT.admin.newCategory}
              maxLength={40}
              disabled={saving}
              aria-label={`${title}: ${UI_TEXT.admin.newCategory}`}
            />
            <button
              type="submit"
              disabled={saving}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              aria-label={UI_TEXT.admin.addCategory}
            >
              <FiPlus size={19} aria-hidden="true" />
            </button>
          </form>
        </section>
      ))}

      <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <FiRefreshCw className="mt-0.5 shrink-0 text-slate-500" size={21} />
          <div>
            <h2 className="font-bold">{UI_TEXT.admin.bankSync}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {UI_TEXT.admin.bankSyncComingSoon}
            </p>
            <p className="mt-2 text-xs text-slate-500">{UI_TEXT.admin.lastSyncNever}</p>
          </div>
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center">
          <form onSubmit={(event) => void handleRename(event)} className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900">
            <h2 className="text-lg font-bold">{UI_TEXT.admin.renameTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{editing.oldName}</p>
            <input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              className="input mt-3 w-full px-3 py-2"
              maxLength={40}
              autoFocus
              disabled={saving}
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold dark:border-slate-700">
                {UI_TEXT.common.cancel}
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-violet-600 px-3 py-2 font-semibold text-white disabled:opacity-50">
                {saving ? UI_TEXT.common.pleaseWait : UI_TEXT.common.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
