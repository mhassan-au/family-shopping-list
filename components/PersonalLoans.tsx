"use client";

import { FormEvent, useMemo, useState } from "react";
import { FiArrowLeft, FiCalendar, FiChevronDown, FiChevronUp, FiCreditCard, FiPlus, FiX } from "react-icons/fi";
import { usePersonalLoans } from "@/hooks/usePersonalLoans";
import { addPersonalLoan, addPersonalLoanRepayment } from "@/lib/personalLoanStore";
import { isValidLoanInput, isValidRepaymentInput, outstandingBalance, PERSONAL_LOAN_LIMITS, repaymentTotal, sortLoansByStatus } from "@/lib/personalLoans";
import type { PersonalLoan } from "@/lib/types";
import { UI_TEXT } from "@/lib/uiText";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const date = new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });

function localDateKey() {
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string) {
  if (!value) return "";
  return date.format(new Date(`${value}T00:00:00`));
}

export default function PersonalLoans({ onBack }: { onBack: () => void }) {
  const { loans, repayments, loading, error } = usePersonalLoans();
  const [dialog, setDialog] = useState<"loan" | PersonalLoan | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedSettledLoans, setExpandedSettledLoans] = useState<Set<string>>(() => new Set());

  const totals = useMemo(() => loans.reduce((result, loan) => {
    result.borrowed += loan.originalAmount;
    result.repaid += repaymentTotal(loan.id, repayments);
    result.outstanding += outstandingBalance(loan, repayments);
    return result;
  }, { borrowed: 0, repaid: 0, outstanding: 0 }), [loans, repayments]);
  const orderedLoans = useMemo(() => sortLoansByStatus(loans, repayments), [loans, repayments]);

  function openDialog(value: "loan" | PersonalLoan) {
    setFormError(null);
    setDialog(value);
  }

  function toggleSettledLoan(id: string) {
    setExpandedSettledLoans((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function submitLoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = { lender: String(form.get("lender")), reason: String(form.get("reason")), originalAmount: Number(form.get("amount")), takenDate: String(form.get("date")) };
    if (!isValidLoanInput(input)) { setFormError(UI_TEXT.personalLoans.invalidLoan); return; }
    setSaving(true);
    try { await addPersonalLoan(input); setDialog(null); }
    catch (saveError) { console.error("Saving personal loan failed", saveError); setFormError(UI_TEXT.personalLoans.saveFailed); }
    finally { setSaving(false); }
  }

  async function submitRepayment(event: FormEvent<HTMLFormElement>, loan: PersonalLoan) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const outstanding = outstandingBalance(loan, repayments);
    const input = { amount: Number(form.get("amount")), repaidDate: String(form.get("date")) };
    if (!isValidRepaymentInput(input, outstanding, localDateKey())) { setFormError(UI_TEXT.personalLoans.invalidRepayment); return; }
    setSaving(true);
    try { await addPersonalLoanRepayment({ loanId: loan.id, outstanding, ...input }); setDialog(null); }
    catch (saveError) { console.error("Saving personal loan repayment failed", saveError); setFormError(UI_TEXT.personalLoans.saveFailed); }
    finally { setSaving(false); }
  }

  return <main className="mx-auto w-full max-w-md p-4 pb-10 sm:p-5">
    <header className="mb-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-100 via-violet-50 to-fuchsia-50 px-4 py-3 shadow-sm dark:border-indigo-900 dark:from-indigo-950 dark:via-violet-950 dark:to-slate-900">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><FiCreditCard className="text-indigo-700 dark:text-indigo-300" size={24}/><h1 className="text-xl font-bold">{UI_TEXT.personalLoans.title}</h1></div><button type="button" onClick={onBack} className="flex size-10 items-center justify-center rounded-xl border border-indigo-200 bg-white/70 text-indigo-700 shadow-sm dark:border-indigo-800 dark:bg-slate-900/60 dark:text-indigo-200" aria-label={UI_TEXT.personalLoans.back}><FiArrowLeft size={20}/></button></div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.personalLoans.subtitle}</p>
    </header>

    {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}

    <section className="mb-4 grid grid-cols-3 gap-1 rounded-xl border bg-white p-2 text-center shadow-sm dark:bg-slate-900">
      <Summary label={UI_TEXT.personalLoans.borrowed} value={money.format(totals.borrowed)}/>
      <Summary label={UI_TEXT.personalLoans.repaid} value={money.format(totals.repaid)}/>
      <Summary label={UI_TEXT.personalLoans.outstanding} value={money.format(totals.outstanding)} emphasis/>
    </section>

    <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">{UI_TEXT.personalLoans.menu}</h2><button type="button" onClick={() => openDialog("loan")} className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700" aria-label={UI_TEXT.personalLoans.addLoan}><FiPlus size={20}/></button></div>

    {loading && <p className="py-8 text-center text-slate-500">{UI_TEXT.loading}</p>}
    {!loading && loans.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">{UI_TEXT.personalLoans.empty}</p>}
    <div className="space-y-3">{orderedLoans.map((loan) => {
      const paid = repaymentTotal(loan.id, repayments), outstanding = outstandingBalance(loan, repayments);
      const history = repayments.filter((item) => item.loanId === loan.id);
      const settled = outstanding === 0, expanded = !settled || expandedSettledLoans.has(loan.id);
      return <article key={loan.id} className={`rounded-xl border p-3 shadow-sm ${settled ? "border-slate-200 bg-slate-100 text-slate-400 [&_*]:text-slate-400! dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-500 dark:[&_*]:text-slate-500!" : "border-indigo-100 bg-white dark:border-indigo-900 dark:bg-slate-900"}`}>
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold">{loan.lender}</h3><p className="truncate text-sm font-medium text-violet-700 dark:text-violet-300">{loan.reason}</p><p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(loan.takenDate)}</p></div><div className="flex items-start gap-2"><div className="text-right"><p className="font-bold">{money.format(loan.originalAmount)}</p>{settled && <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{UI_TEXT.personalLoans.settled}</span>}</div>{settled && <button type="button" onClick={() => toggleSettledLoan(loan.id)} className="flex size-8 items-center justify-center rounded-lg text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950" aria-expanded={expanded} aria-label={expanded ? UI_TEXT.personalLoans.collapseLoan(loan.lender) : UI_TEXT.personalLoans.expandLoan(loan.lender)}>{expanded ? <FiChevronUp/> : <FiChevronDown/>}</button>}</div></div>
        {expanded && <><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div className="rounded-lg bg-emerald-50 px-2 py-1.5 dark:bg-emerald-950"><span className="block text-xs text-slate-500 dark:text-slate-400">{UI_TEXT.personalLoans.repaid}</span><b>{money.format(paid)}</b></div><div className="rounded-lg bg-amber-50 px-2 py-1.5 dark:bg-amber-950"><span className="block text-xs text-slate-500 dark:text-slate-400">{UI_TEXT.personalLoans.outstanding}</span><b>{money.format(outstanding)}</b></div></div>
        <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800"><div className="flex items-center justify-between"><h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{UI_TEXT.personalLoans.repaymentHistory}</h4>{!settled && <button type="button" onClick={() => openDialog(loan)} className="rounded-lg border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950">{UI_TEXT.personalLoans.addRepayment}</button>}</div>{history.length === 0 ? <p className="mt-2 text-xs text-slate-400">{UI_TEXT.personalLoans.noRepayments}</p> : <ul className="mt-2 space-y-1">{history.map((item) => <li key={item.id} className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">{formatDate(item.repaidDate)}</span><b className="text-emerald-700 dark:text-emerald-300">−{money.format(item.amount)}</b></li>)}</ul>}</div></>}
      </article>;
    })}</div>

    {dialog === "loan" && <Modal title={UI_TEXT.personalLoans.addLoan} close={() => setDialog(null)}><form onSubmit={submitLoan}><Field name="lender" label={UI_TEXT.personalLoans.lender} maxLength={PERSONAL_LOAN_LIMITS.lender}/><Field name="reason" label={UI_TEXT.personalLoans.reason} maxLength={PERSONAL_LOAN_LIMITS.reason}/><Field name="amount" label={UI_TEXT.personalLoans.originalAmount} type="number"/><AustralianDateField name="date" label={UI_TEXT.personalLoans.takenDate} value={localDateKey()}/>{formError && <ErrorText text={formError}/>}<SaveButton saving={saving} label={UI_TEXT.personalLoans.saveLoan}/></form></Modal>}
    {dialog && dialog !== "loan" && <Modal title={UI_TEXT.personalLoans.addRepayment} close={() => setDialog(null)}><form onSubmit={(event) => submitRepayment(event, dialog)}><p className="mt-2 text-sm text-slate-500">{dialog.lender} · {UI_TEXT.personalLoans.outstanding} {money.format(outstandingBalance(dialog, repayments))}</p><Field name="amount" label={UI_TEXT.personalLoans.repaymentAmount} type="number" max={outstandingBalance(dialog, repayments)}/><AustralianDateField name="date" label={UI_TEXT.personalLoans.repaidDate} value={localDateKey()} max={localDateKey()}/>{formError && <ErrorText text={formError}/>}<SaveButton saving={saving} label={UI_TEXT.personalLoans.saveRepayment}/></form></Modal>}
  </main>;
}

function Summary({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) { return <div className="min-w-0 rounded-lg bg-slate-50 px-1 py-2 dark:bg-slate-800"><span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{label}</span><b className={`block truncate text-xs ${emphasis ? "text-amber-700 dark:text-amber-300" : ""}`}>{value}</b></div>; }
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={close} className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.common.close}><FiX/></button></div>{children}</section></div>; }
function Field({ name, label, type = "text", value, maxLength, max }: { name: string; label: string; type?: string; value?: string; maxLength?: number; max?: number }) { return <label className="mt-3 block text-sm font-semibold">{label}<input required name={name} type={type} defaultValue={value} maxLength={maxLength} max={max} min={type === "number" ? 0.01 : undefined} step={type === "number" ? 0.01 : undefined} className="input mt-1 w-full px-3 py-2"/></label>; }
function AustralianDateField({ name, label, value, max }: { name: string; label: string; value: string; max?: string }) { const [dateValue, setDateValue] = useState(value); return <label className="mt-3 block text-sm font-semibold">{label}<span className="relative mt-1 block"><input aria-hidden="true" readOnly tabIndex={-1} value={formatDate(dateValue)} className="input w-full px-3 py-2 pr-10"/><FiCalendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600"/><input required name={name} type="date" lang="en-AU" value={dateValue} max={max} onChange={(event) => setDateValue(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={`${label} (dd/mm/yyyy)`}/></span></label>; }
function ErrorText({ text }: { text: string }) { return <p className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{text}</p>; }
function SaveButton({ saving, label }: { saving: boolean; label: string }) { return <button disabled={saving} className="mt-4 w-full rounded-lg bg-indigo-600 p-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? UI_TEXT.common.pleaseWait : label}</button>; }
