"use client";

import { UI_TEXT } from "@/lib/uiText";

interface Props {
  wholeAmount: number;
  centsAmount: number;
  onChoose: (amount: number) => void;
  onCancel: () => void;
  tone?: "blue" | "rose";
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

export default function AmountChoiceDialog({
  wholeAmount,
  centsAmount,
  onChoose,
  onCancel,
  tone = "blue",
}: Props) {
  const buttonClass = tone === "rose"
    ? "border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
    : "border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="amount-choice-title">
        <h2 id="amount-choice-title" className="text-center text-lg font-bold">{UI_TEXT.moneyChoice.title}</h2>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">{UI_TEXT.moneyChoice.help}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onChoose(wholeAmount)} className={`rounded-xl border px-3 py-4 text-lg font-bold transition ${buttonClass}`}>{formatAmount(wholeAmount)}</button>
          <button type="button" onClick={() => onChoose(centsAmount)} className={`rounded-xl border px-3 py-4 text-lg font-bold transition ${buttonClass}`}>{formatAmount(centsAmount)}</button>
        </div>
        <button type="button" onClick={onCancel} className="btn-secondary mt-3 w-full">{UI_TEXT.common.cancel}</button>
      </div>
    </div>
  );
}
