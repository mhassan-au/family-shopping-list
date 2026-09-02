"use client";

import { FormEvent, useMemo, useState } from "react";
import { FiArrowLeft, FiCheck, FiEdit3, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { getDeviceLogin } from "@/lib/device";
import { UI_TEXT } from "@/lib/uiText";
import { useImprovementLog } from "@/hooks/useImprovementLog";
import { addImprovementLog, changeImprovementStatus, deleteImprovementLog, editImprovementLog } from "@/lib/improvementLogStore";
import type { ImprovementLogEntry, ImprovementStatus, ImprovementType } from "@/lib/types";

const PAGE_SIZE = 8;
const HISTORY_STATUSES: ImprovementStatus[] = ["done", "not_doing", "duplicate"];
const dateTime = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" });

type EntryDialog = { mode: "add" } | { mode: "edit"; entry: ImprovementLogEntry };
type ResolutionDialog = { entry: ImprovementLogEntry; status: "done" | "not_doing" | "duplicate" };

export default function ImprovementLog({ onBack }: { onBack: () => void }) {
  const login = getDeviceLogin();
  const { entries, loading, error } = useImprovementLog();
  const [tab, setTab] = useState<"current" | "history">("current");
  const [page, setPage] = useState(1);
  const [entryDialog, setEntryDialog] = useState<EntryDialog | null>(null);
  const [resolutionDialog, setResolutionDialog] = useState<ResolutionDialog | null>(null);
  const [type, setType] = useState<ImprovementType>("bug");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const visibleEntries = useMemo(() => entries.filter((entry) => tab === "history"
    ? HISTORY_STATUSES.includes(entry.status)
    : !HISTORY_STATUSES.includes(entry.status)), [entries, tab]);
  const pageCount = Math.max(1, Math.ceil(visibleEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedEntries = visibleEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (login?.role !== "owner") return null;

  function openAdd() {
    setType("bug"); setTitle(""); setNotes(""); setMessage(null); setEntryDialog({ mode: "add" });
  }
  function openEdit(entry: ImprovementLogEntry) {
    setType(entry.type); setTitle(entry.title); setNotes(entry.notes); setMessage(null); setEntryDialog({ mode: "edit", entry });
  }
  async function saveEntry(event: FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    setSaving(true); setMessage(null);
    try {
      if (entryDialog?.mode === "edit") await editImprovementLog(entryDialog.entry.id, type, cleanTitle, notes.trim(), login.username);
      else await addImprovementLog(type, cleanTitle, notes.trim(), login.username);
      setEntryDialog(null);
      setMessage({ text: UI_TEXT.improvementLog.saved, error: false });
    } catch (saveError) {
      console.error("Saving improvement log failed", saveError);
      setMessage({ text: UI_TEXT.improvementLog.saveFailed, error: true });
    } finally { setSaving(false); }
  }
  async function removeEntry(entry: ImprovementLogEntry) {
    if (!window.confirm(UI_TEXT.improvementLog.confirmDelete(entry.title))) return;
    try { await deleteImprovementLog(entry.id); }
    catch (deleteError) { console.error("Deleting improvement log failed", deleteError); setMessage({ text: UI_TEXT.improvementLog.saveFailed, error: true }); }
  }
  async function setStatus(entry: ImprovementLogEntry, status: ImprovementStatus) {
    try { await changeImprovementStatus(entry.id, status, login.username); }
    catch (statusError) { console.error("Updating improvement status failed", statusError); setMessage({ text: UI_TEXT.improvementLog.saveFailed, error: true }); }
  }
  function openResolution(entry: ImprovementLogEntry) {
    setSummary(""); setResolutionDialog({ entry, status: "done" }); setMessage(null);
  }
  async function saveResolution(event: FormEvent) {
    event.preventDefault();
    if (!resolutionDialog || !summary.trim()) return;
    setSaving(true);
    try {
      await changeImprovementStatus(resolutionDialog.entry.id, resolutionDialog.status, login.username, summary);
      setResolutionDialog(null); setSummary(""); setTab("history");
      setMessage({ text: UI_TEXT.improvementLog.movedToHistory, error: false });
    } catch (resolutionError) {
      console.error("Completing improvement log failed", resolutionError);
      setMessage({ text: UI_TEXT.improvementLog.saveFailed, error: true });
    } finally { setSaving(false); }
  }

  return <main className="mx-auto w-full max-w-md p-4 pb-10 sm:p-5">
    <header className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-100 via-orange-50 to-rose-50 px-4 py-3 shadow-sm dark:border-amber-900 dark:from-amber-950 dark:via-orange-950 dark:to-slate-900">
      <div className="flex items-center justify-between gap-3"><div><h1 className="text-xl font-bold">{UI_TEXT.improvementLog.title}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.improvementLog.subtitle}</p></div><button type="button" onClick={onBack} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white/70 text-amber-800 dark:border-amber-800 dark:bg-slate-900/60 dark:text-amber-200" aria-label={UI_TEXT.common.back}><FiArrowLeft size={20}/></button></div>
    </header>
    {message && <p className={`mb-3 rounded-lg px-3 py-2 text-sm ${message.error ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"}`} role={message.error ? "alert" : "status"}>{message.text}</p>}
    <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
      {(["current", "history"] as const).map((item) => <button key={item} type="button" onClick={() => { setTab(item); setPage(1); }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${tab === item ? "bg-white text-amber-800 shadow-sm dark:bg-slate-800 dark:text-amber-200" : "text-slate-600 dark:text-slate-300"}`}>{item === "current" ? UI_TEXT.improvementLog.current : UI_TEXT.improvementLog.history}</button>)}
      {tab === "current" && <button type="button" onClick={openAdd} className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm hover:bg-amber-700" aria-label={UI_TEXT.improvementLog.add}><FiPlus size={20}/></button>}
    </div>
    {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200" role="alert">{UI_TEXT.improvementLog.loadFailed}</p>}
    {loading ? <p className="text-sm">{UI_TEXT.loading}</p> : pagedEntries.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500 dark:bg-slate-900">{tab === "current" ? UI_TEXT.improvementLog.emptyCurrent : UI_TEXT.improvementLog.emptyHistory}</p> : <ol className="space-y-3">{pagedEntries.map((entry) => <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-200">{UI_TEXT.improvementLog.types[entry.type]}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{UI_TEXT.improvementLog.statuses[entry.status]}</span></div><h2 className="mt-2 font-bold">{entry.title}</h2></div>{entry.status === "inbox" && <div className="flex shrink-0 gap-1"><button type="button" onClick={() => openEdit(entry)} className="flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={UI_TEXT.improvementLog.edit}><FiEdit3 size={15}/></button><button type="button" onClick={() => void removeEntry(entry)} className="flex size-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950" aria-label={UI_TEXT.improvementLog.remove}><FiTrash2 size={15}/></button></div>}</div>
      {entry.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{entry.notes}</p>}
      <p className="mt-2 text-xs text-slate-500">{dateTime.format(new Date(entry.createdAtMs))} · {entry.createdBy}</p>
      {entry.resolutionSummary && <div className="mt-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/50"><p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">{UI_TEXT.improvementLog.resolutionSummary}</p><p className="mt-1 whitespace-pre-wrap text-sm">{entry.resolutionSummary}</p></div>}
      {tab === "current" && <div className="mt-3 flex flex-wrap gap-2">{entry.status !== "in_progress" && <button type="button" onClick={() => void setStatus(entry, "in_progress")} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700">{UI_TEXT.improvementLog.start}</button>}<button type="button" onClick={() => openResolution(entry)} className="flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950"><FiCheck size={14}/>{UI_TEXT.improvementLog.finish}</button></div>}
    </li>)}</ol>}
    {pageCount > 1 && <nav className="mt-4 flex items-center justify-between" aria-label={UI_TEXT.improvementLog.pagination}><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700">{UI_TEXT.common.previous}</button><span className="text-sm text-slate-500">{UI_TEXT.improvementLog.page(currentPage, pageCount)}</span><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700">{UI_TEXT.common.next}</button></nav>}
    {entryDialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm"><form onSubmit={(event) => void saveEntry(event)} className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{entryDialog.mode === "add" ? UI_TEXT.improvementLog.addTitle : UI_TEXT.improvementLog.editTitle}</h2><button type="button" onClick={() => setEntryDialog(null)} className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.common.close}><FiX/></button></div><label className="mt-3 block text-sm font-semibold">{UI_TEXT.improvementLog.type}<select value={type} onChange={(event) => setType(event.target.value as ImprovementType)} className="input mt-1 w-full px-3 py-2">{(["bug", "ui_change", "feature"] as const).map((item) => <option key={item} value={item}>{UI_TEXT.improvementLog.types[item]}</option>)}</select></label><label className="mt-3 block text-sm font-semibold">{UI_TEXT.improvementLog.logTitle}<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required autoFocus className="input mt-1 w-full px-3 py-2"/></label><label className="mt-3 block text-sm font-semibold">{UI_TEXT.improvementLog.notes}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1200} rows={5} className="input mt-1 w-full resize-y px-3 py-2"/></label><button type="submit" disabled={saving || !title.trim()} className="mt-4 w-full rounded-lg bg-amber-600 px-3 py-2 font-semibold text-white disabled:opacity-50">{saving ? UI_TEXT.common.saving : UI_TEXT.common.save}</button></form></div>}
    {resolutionDialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm"><form onSubmit={(event) => void saveResolution(event)} className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{UI_TEXT.improvementLog.finishTitle}</h2><button type="button" onClick={() => setResolutionDialog(null)} className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.common.close}><FiX/></button></div><p className="mt-1 text-sm text-slate-500">{resolutionDialog.entry.title}</p><label className="mt-3 block text-sm font-semibold">{UI_TEXT.improvementLog.outcome}<select value={resolutionDialog.status} onChange={(event) => setResolutionDialog({ ...resolutionDialog, status: event.target.value as ResolutionDialog["status"] })} className="input mt-1 w-full px-3 py-2"><option value="done">{UI_TEXT.improvementLog.statuses.done}</option><option value="not_doing">{UI_TEXT.improvementLog.statuses.not_doing}</option><option value="duplicate">{UI_TEXT.improvementLog.statuses.duplicate}</option></select></label><label className="mt-3 block text-sm font-semibold">{UI_TEXT.improvementLog.resolutionSummary}<textarea value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={1200} rows={5} required autoFocus className="input mt-1 w-full resize-y px-3 py-2" placeholder={UI_TEXT.improvementLog.summaryPlaceholder}/></label><button type="submit" disabled={saving || !summary.trim()} className="mt-4 w-full rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white disabled:opacity-50">{saving ? UI_TEXT.common.saving : UI_TEXT.improvementLog.moveToHistory}</button></form></div>}
  </main>;
}
