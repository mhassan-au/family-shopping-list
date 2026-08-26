"use client";

import { ShoppingItem } from "@/lib/types";
import { UI_TEXT } from "@/lib/uiText";

interface Props {
  items: ShoppingItem[];
  total: number;
  clearing: boolean;
  transferring: boolean;
  onClose: () => void;
  onClear: () => void;
  onTransfer: () => void;
}

export default function CompletedItemsDialog({
  items,
  total,
  clearing,
  transferring,
  onClose,
  onClear,
  onTransfer,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section className="card w-full max-w-sm rounded-xl p-5 shadow-xl">
        <h2 className="text-xl font-bold">{UI_TEXT.items.completedTitle}</h2>

        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {items.map((item) => {
            const itemTotal =
              Number(item.qty || 0) * Number(item.unitPrice || 0);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="min-w-0 wrap-break-word">{item.text}</span>
                <span className="shrink-0 font-semibold text-red-600 dark:text-red-400">
                  ${itemTotal.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-right text-lg font-bold text-red-600 dark:text-red-400">
          {UI_TEXT.items.total(total)}
        </div>

        {total > 0 && (
          <button
            type="button"
            onClick={onTransfer}
            disabled={clearing || transferring}
            className="mt-4 w-full rounded-lg border border-cyan-600 bg-cyan-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-cyan-700 active:scale-[0.99] disabled:opacity-50 dark:border-cyan-500 dark:bg-cyan-700 dark:hover:bg-cyan-600"
          >
            {transferring
              ? UI_TEXT.items.transferringExpense
              : UI_TEXT.items.transferToExpenses(total)}
          </button>
        )}

        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {UI_TEXT.items.transferHelp}
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={clearing || transferring}
            className="btn-secondary"
          >
            {UI_TEXT.common.close}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={clearing || transferring}
            className="btn-danger"
          >
            {clearing ? UI_TEXT.items.clearing : UI_TEXT.items.clearCompleted}
          </button>
        </div>
      </section>
    </div>
  );
}
