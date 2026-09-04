"use client";

import { FormEvent, useMemo, useState } from "react";
import { FiArrowDownCircle, FiArrowLeft, FiArrowUpCircle, FiCalendar, FiGift, FiPlus, FiSlash, FiX } from "react-icons/fi";
import { useWishes } from "@/hooks/useWishes";
import { addWish, addWishMovement, terminateWish } from "@/lib/wishStore";
import { fromCents, isValidWishInput, isValidWishMovement, WISH_LIMITS, wishProgress } from "@/lib/wishes";
import { UI_TEXT } from "@/lib/uiText";
import type { Wish, WishTransaction } from "@/lib/types";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const date = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" });

function localDateKey() {
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string) {
  return date.format(new Date(`${value}T00:00:00`));
}

type Dialog = { kind: "wish" } | { kind: "contribution" | "withdrawal" | "terminate"; wish: Wish } | null;

export default function WishList({ onBack }: { onBack: () => void }) {
  const { wishes, transactions, loading, error } = useWishes();
  const [tab, setTab] = useState<"current" | "history">("current");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const visibleWishes = useMemo(() => wishes.filter((wish) => tab === "current" ? wish.status === "active" : wish.status === "terminated"), [tab, wishes]);

  function openDialog(next: Dialog) {
    setFormError(null);
    setDialog(next);
  }

  async function submitWish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = { name: String(form.get("name")), targetAmount: Number(form.get("amount")), deadlineDate: String(form.get("deadline")), eventDate: String(form.get("eventDate")) };
    if (!isValidWishInput(input)) { setFormError(UI_TEXT.wishes.invalidWish); return; }
    await save(() => addWish(input));
  }

  async function submitMovement(event: FormEvent<HTMLFormElement>, wish: Wish, type: "contribution" | "withdrawal") {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = { amount: Number(form.get("amount")), dateKey: String(form.get("date")), note: String(form.get("note")) };
    if (!isValidWishMovement(input, wish.balanceCents, type, localDateKey())) { setFormError(UI_TEXT.wishes.invalidMovement); return; }
    await save(() => addWishMovement({ wishId: wish.id, type, ...input }));
  }

  async function submitTermination(event: FormEvent<HTMLFormElement>, wish: Wish) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save(() => terminateWish(wish.id, String(form.get("note"))));
  }

  async function save(action: () => Promise<void>) {
    setSaving(true);
    setFormError(null);
    try { await action(); setDialog(null); }
    catch (saveError) { console.error("Saving Wish List change failed", saveError); setFormError(UI_TEXT.wishes.saveFailed); }
    finally { setSaving(false); }
  }

  return <main className="mx-auto w-full max-w-md p-4 pb-10 sm:p-5">
    <header className="mb-4 rounded-xl border border-fuchsia-200 bg-gradient-to-r from-fuchsia-100 via-pink-50 to-amber-50 px-4 py-3 shadow-sm dark:border-fuchsia-900 dark:from-fuchsia-950 dark:via-pink-950 dark:to-slate-900">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FiGift className="text-fuchsia-700 dark:text-fuchsia-300" size={24}/><h1 className="text-xl font-bold">{UI_TEXT.wishes.title}</h1></div><button type="button" onClick={onBack} className="flex size-10 items-center justify-center rounded-xl border border-fuchsia-200 bg-white/70 text-fuchsia-700 shadow-sm dark:border-fuchsia-800 dark:bg-slate-900/60 dark:text-fuchsia-200" aria-label={UI_TEXT.wishes.back}><FiArrowLeft size={20}/></button></div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.wishes.subtitle}</p>
    </header>

    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}

    <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {(["current", "history"] as const).map((value) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === value ? "bg-white text-fuchsia-800 shadow-sm dark:bg-slate-950 dark:text-fuchsia-200" : "text-slate-500"}`} aria-current={tab === value ? "page" : undefined}>{value === "current" ? UI_TEXT.wishes.current : UI_TEXT.wishes.history}</button>)}
    </div>

    {tab === "current" && <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">{UI_TEXT.wishes.current}</h2><button type="button" onClick={() => openDialog({ kind: "wish" })} className="flex size-10 items-center justify-center rounded-xl bg-fuchsia-600 text-white shadow-sm hover:bg-fuchsia-700" aria-label={UI_TEXT.wishes.addWish}><FiPlus size={20}/></button></div>}

    {loading && <p className="py-8 text-center text-slate-500">{UI_TEXT.loading}</p>}
    {!loading && visibleWishes.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">{tab === "current" ? UI_TEXT.wishes.emptyCurrent : UI_TEXT.wishes.emptyHistory}</p>}
    <div className="space-y-3">{visibleWishes.map((wish) => <WishCard key={wish.id} wish={wish} transactions={transactions.filter((item) => item.wishId === wish.id)} onAction={(kind) => openDialog({ kind, wish })}/>)}</div>

    {dialog?.kind === "wish" && <Modal title={UI_TEXT.wishes.addWish} close={() => setDialog(null)}><form onSubmit={submitWish}><Field name="name" label={UI_TEXT.wishes.name} placeholder={UI_TEXT.wishes.namePlaceholder} maxLength={WISH_LIMITS.name}/><Field name="amount" label={UI_TEXT.wishes.targetAmount} type="number"/><DateField name="deadline" label={UI_TEXT.wishes.deadlineDate}/><DateField name="eventDate" label={UI_TEXT.wishes.eventDate}/>{formError && <ErrorText text={formError}/>}<SaveButton saving={saving}/></form></Modal>}
    {dialog && (dialog.kind === "contribution" || dialog.kind === "withdrawal") && <Modal title={dialog.kind === "contribution" ? UI_TEXT.wishes.addSavings : UI_TEXT.wishes.withdraw} close={() => setDialog(null)}><form onSubmit={(event) => submitMovement(event, dialog.wish, dialog.kind as "contribution" | "withdrawal")}><p className="mt-2 text-sm text-slate-500">{dialog.wish.name} · {UI_TEXT.wishes.saved} {money.format(fromCents(dialog.wish.balanceCents))}</p><Field name="amount" label={UI_TEXT.wishes.amount} type="number" max={dialog.kind === "withdrawal" ? fromCents(dialog.wish.balanceCents) : undefined}/><DateField name="date" label={UI_TEXT.wishes.transactionDate} value={localDateKey()} max={localDateKey()}/><Field name="note" label={UI_TEXT.wishes.note} required={false} maxLength={WISH_LIMITS.note}/>{formError && <ErrorText text={formError}/>}<SaveButton saving={saving}/></form></Modal>}
    {dialog?.kind === "terminate" && <Modal title={UI_TEXT.wishes.terminateTitle} close={() => setDialog(null)}><form onSubmit={(event) => submitTermination(event, dialog.wish)}><p className="mt-3 text-sm">{dialog.wish.balanceCents > 0 ? UI_TEXT.wishes.terminateHelp(money.format(fromCents(dialog.wish.balanceCents))) : UI_TEXT.wishes.terminateNoBalance}</p><Field name="note" label={UI_TEXT.wishes.note} required={false} maxLength={WISH_LIMITS.note}/>{formError && <ErrorText text={formError}/>}<button disabled={saving} className="mt-4 w-full rounded-lg bg-rose-600 p-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{saving ? UI_TEXT.common.pleaseWait : UI_TEXT.wishes.terminate}</button></form></Modal>}
  </main>;
}

function WishCard({ wish, transactions, onAction }: { wish: Wish; transactions: WishTransaction[]; onAction: (kind: "contribution" | "withdrawal" | "terminate") => void }) {
  const funded = wish.balanceCents >= wish.targetCents;
  const remaining = Math.max(0, wish.targetCents - wish.balanceCents);
  return <article className={`rounded-xl border p-3 shadow-sm ${funded && wish.status === "active" ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50" : wish.status === "terminated" ? "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900" : "border-fuchsia-100 bg-white dark:border-fuchsia-900 dark:bg-slate-900"}`}>
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold">{wish.name}</h3><p className="text-xs text-slate-500">{UI_TEXT.wishes.deadlineDate}: {formatDate(wish.deadlineDate)} · {UI_TEXT.wishes.eventDate}: {formatDate(wish.eventDate)}</p></div>{funded && wish.status === "active" ? <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">{UI_TEXT.wishes.fullyFunded}</span> : wish.status === "terminated" ? <span className="text-xs font-bold uppercase">{UI_TEXT.wishes.terminated}</span> : null}</div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className={`h-full rounded-full ${funded ? "bg-emerald-500" : "bg-fuchsia-500"}`} style={{ width: `${wishProgress(wish)}%` }}/></div>
    <div className="mt-2 grid grid-cols-3 gap-1 text-center"><Summary label={UI_TEXT.wishes.saved} value={money.format(fromCents(wish.balanceCents))}/><Summary label={UI_TEXT.wishes.targetAmount} value={money.format(fromCents(wish.targetCents))}/><Summary label={UI_TEXT.wishes.remaining} value={money.format(fromCents(remaining))}/></div>
    {wish.status === "active" && <div className="mt-3 grid grid-cols-3 gap-1"><Action icon={<FiArrowDownCircle/>} label={UI_TEXT.wishes.addSavings} onClick={() => onAction("contribution")}/><Action icon={<FiArrowUpCircle/>} label={UI_TEXT.wishes.withdraw} onClick={() => onAction("withdrawal")} disabled={wish.balanceCents === 0}/><Action icon={<FiSlash/>} label={UI_TEXT.wishes.terminate} onClick={() => onAction("terminate")} danger/></div>}
    <div className="mt-3 border-t border-slate-200 pt-2 dark:border-slate-700"><h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{UI_TEXT.wishes.transactionHistory}</h4>{transactions.length === 0 ? <p className="mt-1 text-xs text-slate-400">{UI_TEXT.wishes.noTransactions}</p> : <ul className="mt-1 space-y-1">{transactions.map((item) => <li key={item.id} className="flex items-start justify-between gap-2 text-xs"><span><span className="block">{formatDate(item.dateKey)} · {item.type === "contribution" ? UI_TEXT.wishes.contribution : item.type === "withdrawal" ? UI_TEXT.wishes.withdrawal : UI_TEXT.wishes.terminationRefund}</span>{item.note && <span className="block text-slate-400">{item.note}</span>}</span><b className={item.type === "contribution" ? "text-rose-600" : "text-emerald-600"}>{item.type === "contribution" ? "−" : "+"}{money.format(fromCents(item.amountCents))}</b></li>)}</ul>}</div>
  </article>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-lg bg-white/70 px-1 py-2 dark:bg-slate-800/70"><span className="block truncate text-[10px] text-slate-500">{label}</span><b className="block truncate text-xs">{value}</b></div>; }
function Action({ icon, label, onClick, disabled = false, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) { return <button type="button" onClick={onClick} disabled={disabled} className={`flex min-h-12 flex-col items-center justify-center rounded-lg border px-1 py-1 text-[11px] font-semibold disabled:opacity-40 ${danger ? "border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300" : "border-fuchsia-200 text-fuchsia-700 dark:border-fuchsia-900 dark:text-fuchsia-300"}`}>{icon}{label}</button>; }
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={close} className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.common.close}><FiX/></button></div>{children}</section></div>; }
function Field({ name, label, type = "text", placeholder, maxLength, max, required = true }: { name: string; label: string; type?: string; placeholder?: string; maxLength?: number; max?: number; required?: boolean }) { return <label className="mt-3 block text-sm font-semibold">{label}<input required={required} name={name} type={type} placeholder={placeholder} maxLength={maxLength} max={max} min={type === "number" ? 0.01 : undefined} step={type === "number" ? 0.01 : undefined} className="input mt-1 w-full px-3 py-2"/></label>; }
function DateField({ name, label, value = "", max }: { name: string; label: string; value?: string; max?: string }) { const [dateValue, setDateValue] = useState(value); return <label className="mt-3 block text-sm font-semibold">{label}<span className="relative mt-1 block"><input aria-hidden="true" readOnly tabIndex={-1} value={dateValue ? formatDate(dateValue) : ""} className="input w-full px-3 py-2 pr-10"/><FiCalendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fuchsia-600"/><input required name={name} type="date" lang="en-AU" value={dateValue} max={max} onChange={(event) => setDateValue(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={`${label} (dd/mm/yyyy)`}/></span></label>; }
function ErrorText({ text }: { text: string }) { return <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{text}</p>; }
function SaveButton({ saving }: { saving: boolean }) { return <button disabled={saving} className="mt-4 w-full rounded-lg bg-fuchsia-600 p-2 font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50">{saving ? UI_TEXT.common.pleaseWait : UI_TEXT.common.save}</button>; }
