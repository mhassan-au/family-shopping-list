"use client";

import { ShoppingItem } from "@/lib/types";
import { UI_TEXT } from "@/lib/uiText";

interface Props {
  items: ShoppingItem[];
  total: number;
  clearing: boolean;
  onClose: () => void;
  onClear: () => void;
}

export default function CompletedItemsDialog({
  items,
  total,
  clearing,
  onClose,
  onClear,
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

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={clearing}
            className="btn-secondary"
          >
            {UI_TEXT.common.close}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={clearing}
            className="btn-danger"
          >
            {clearing ? UI_TEXT.items.clearing : UI_TEXT.items.clearCompleted}
          </button>
        </div>
      </section>
    </div>
  );
}
