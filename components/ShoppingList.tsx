"use client";

import { useShoppingList } from "@/hooks/useShoppingList";
import { useShoppingFilters } from "@/hooks/useShoppingFilters";
import { useShoppingDialogs } from "@/hooks/useShoppingDialogs";
import { useCallback, useEffect, useRef, useState } from "react";

import { ShoppingItem } from "@/lib/types";
import ViewSelector from "./ViewSelector";
import CompleteItemDialog from "./CompleteItemDialog";
import GroceryInput from "./GroceryInput";
import GroceryGroup from "./GroceryGroup";
import ConfirmDialog from "./ConfirmDialog";
import CompletedItemsDialog from "./CompletedItemsDialog";
import { getDeviceLogin } from "@/lib/device";
import { UI_TEXT } from "@/lib/uiText";
import { transferCompletedShoppingToExpense } from "@/lib/expenses";
import {
  INPUT_LIMITS,
  isValidItemName,
  parseItemNames,
} from "@/lib/validation";

const today = new Date();
const todayLabel = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(today);
const todayDateTime = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

export default function ShoppingList() {

  const device = getDeviceLogin();
  const defaultCategory =
    device?.username?.toLocaleLowerCase() === "izhaar" ? "Izhaar" : "";
  const [newItem, setNewItem] = useState("");
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [clearing, setClearing] = useState(false);
  const [transferringExpense, setTransferringExpense] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [viewMode, setViewMode] = useState<"flat" | "shop" | "category">("flat");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: "success" | "error" | "duplicate";
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "duplicate") => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      setToast({ id: Date.now(), message, type });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, 2800);
    },
    [],
  );

  const {

    items,

    loading,

    error,

    syncing,

    isOnline,

    connectionStalled,

    hasPendingWrites,

    reconnect,

    handleAdd,

    handleToggle,

    handleDelete,

    handleClear,

    handleComplete

  } = useShoppingList();

  // Shopping filters
  const {

    groupedItems

  } = useShoppingFilters(

    items,

    viewMode,

    priorityFilter

  );

  const {

    deleteTarget,

    setDeleteTarget,

    showClearConfirm,

    setShowClearConfirm,

    completingItem,

    setCompletingItem

  } = useShoppingDialogs();

  const remainingItemCount = items.filter((item) => !item.completed).length;
  const completedItems = items.filter((item) => item.completed);
  const completedTotal = completedItems
    .reduce(
      (sum, item) =>
        sum + Number(item.qty || 0) * Number(item.unitPrice || 0),
      0,
    );
  const expectedTotal = items
    .filter((item) => !item.completed)
    .reduce(
      (sum, item) => sum + Number(item.expectedUnitPrice || 0),
      0,
    );
  const syncLabel = !isOnline
    ? UI_TEXT.sync.offline
    : syncing
      ? UI_TEXT.sync.syncing
      : UI_TEXT.sync.synced;

  // Add grocery item

  function handleAddNew() {
    const requestedItems = parseItemNames(newItem);

    if (requestedItems.length === 0) {
      return;
    }

    if (requestedItems.length > INPUT_LIMITS.itemBatch) {
      showToast(
        UI_TEXT.toast.maxItems(INPUT_LIMITS.itemBatch),
        "error",
      );
      return;
    }

    const oversizedItem = requestedItems.find(
      (item) => item.length > INPUT_LIMITS.itemName,
    );

    if (oversizedItem) {
      showToast(
        UI_TEXT.toast.maxLength(INPUT_LIMITS.itemName),
        "error",
      );
      return;
    }

    if (requestedItems.some((item) => !isValidItemName(item))) {
      showToast(UI_TEXT.toast.invalidCharacters, "error");
      return;
    }

    const knownNames = new Set(
      items
        .filter((item) => !item.completed)
        .map((item) => item.text.trim().toLocaleLowerCase()),
    );
    const duplicateNames: string[] = [];
    const newNames: string[] = [];

    requestedItems.forEach((itemName) => {
      const normalizedName = itemName.toLocaleLowerCase();

      if (knownNames.has(normalizedName)) {
        duplicateNames.push(itemName);
        return;
      }

      knownNames.add(normalizedName);
      newNames.push(itemName);
    });

    if (newNames.length === 0) {
      setNewItem("");
      showToast(
        UI_TEXT.toast.alreadyAdded(duplicateNames, duplicateNames.length !== 1),
        "duplicate",
      );

      return;
    }

    const addPromise = handleAdd(
      newNames.join(", "),
      selectedShop,
      selectedCategory,
      selectedPriority
    );


    setNewItem("");

    setSelectedShop("");

    setSelectedCategory(defaultCategory);

    setSelectedPriority("");

    void addPromise
      .then(() => {
        if (duplicateNames.length > 0) {
          showToast(
            UI_TEXT.toast.duplicatesSkipped(duplicateNames),
            "duplicate",
          );
        } else {
          showToast(
            UI_TEXT.toast.added(newNames.length),
            "success",
          );
        }
      })
      .catch((addError) => {
        console.error("Adding shopping item failed", addError);
        showToast(UI_TEXT.toast.addFailed, "error");
      });

  }

  return (
    <main className="w-full max-w-md mx-auto p-4 pb-24 sm:p-5 sm:pb-24">
      <section className="mb-4 rounded-xl border border-blue-200 bg-blue-100/95 p-2 text-center text-blue-900 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-blue-950/95 dark:text-blue-100">
        <div className="px-2 py-1 text-sm font-medium">
          <time dateTime={todayDateTime} suppressHydrationWarning>{todayLabel}</time>
          <span aria-hidden="true"> • </span>
          <span>{UI_TEXT.items.remaining(remainingItemCount)}</span>
          <span aria-hidden="true"> • </span>
          <span>{syncLabel}</span>
          {!isOnline && <div className="mt-1 text-xs font-normal text-amber-700 dark:text-amber-300">{UI_TEXT.sync.offlineMode}</div>}
        </div>
        {expectedTotal > 0 && <div className="px-2 pb-1 text-xs font-medium text-slate-400 dark:text-slate-500">{UI_TEXT.items.expectedTotal(expectedTotal)}</div>}
        {completedItems.length > 0 && (
          <button type="button" onClick={() => setShowClearConfirm(true)} className="mt-1 w-full rounded-lg border border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-100 px-4 py-2 text-lg font-bold text-red-600 shadow-sm transition hover:from-blue-100 hover:to-cyan-200 active:scale-[0.99] dark:border-blue-700 dark:from-blue-900 dark:to-cyan-950 dark:text-red-400 dark:hover:from-blue-800 dark:hover:to-cyan-900">
            {UI_TEXT.items.total(completedTotal)}
          </button>
        )}
      </section>

      {/* Grocery Input */}

      <GroceryInput

        newItem={newItem}

        setNewItem={setNewItem}

        selectedShop={selectedShop}

        setSelectedShop={setSelectedShop}

        selectedCategory={selectedCategory}

        setSelectedCategory={setSelectedCategory}

        selectedPriority={selectedPriority}

        setSelectedPriority={setSelectedPriority}

        onAdd={handleAddNew}

      />

      {loading && <p>{UI_TEXT.loading}</p>}

      {error && (
        <p className="text-red-500 text-sm my-2" role="alert">
          {error}
        </p>
      )}

      {isOnline && syncing && (
        <p className="text-xs text-amber-600 dark:text-amber-400 my-2">
          {connectionStalled
            ? UI_TEXT.sync.delayed
            : hasPendingWrites
              ? UI_TEXT.sync.uploading
              : UI_TEXT.sync.refreshing}
          {connectionStalled && (
            <button
              type="button"
              onClick={() => void reconnect()}
              className="ml-2 underline font-medium"
            >
              {UI_TEXT.sync.retry}
            </button>
          )}
        </p>
      )}

      <span className="sr-only" aria-live="polite">
        {syncing ? UI_TEXT.sync.syncingList : UI_TEXT.sync.listSynced}
      </span>

      <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        {/* View Selector */}

        <ViewSelector

          viewMode={viewMode}

          setViewMode={setViewMode}

          priorityFilter={priorityFilter}

          setPriorityFilter={setPriorityFilter}

        />

        {/* Grocery Groups */}

        <div className="space-y-5">


        {Object.entries(groupedItems).map(
          ([groupName, groupItems]) => (


            <GroceryGroup

              key={groupName}

              groupName={groupName}

              groupItems={groupItems}

              viewMode={viewMode}

              editing={editing}

              setEditing={setEditing}



              onDelete={(item) => {

                setDeleteTarget(item);

              }}

              onComplete={(item) => {


                if (item.completed) {

                  handleToggle(item);

                }
                else {

                  setCompletingItem(item);

                }


              }}

            />


          ))}


        </div>
      </section>

      {!loading && items.length === 0 && (
        <p className="text-gray-500 text-center mt-5">
          {UI_TEXT.items.empty}
        </p>
      )}

      {/* Delete Confirmation */}

      {deleteTarget && (

        <ConfirmDialog

          title={UI_TEXT.items.deleteTitle}

          message={deleteTarget.text}

          confirmText={UI_TEXT.items.delete}

          onCancel={() => {

            setDeleteTarget(null);

          }}

          onConfirm={() => {
            const itemName = deleteTarget.text;
            const deletePromise = handleDelete(deleteTarget.id);
            setDeleteTarget(null);

            void deletePromise
              .then(() => showToast(UI_TEXT.toast.deleted(itemName), "success"))
              .catch((deleteError) => {
                console.error("Deleting shopping item failed", deleteError);
                showToast(UI_TEXT.toast.deleteFailed, "error");
              });

          }}

        />

      )}
      {/* Completed Items */}

      {showClearConfirm && (

        <CompletedItemsDialog
          items={completedItems}
          total={completedTotal}
          clearing={clearing}
          transferring={transferringExpense}
          onClose={() => setShowClearConfirm(false)}
          onTransfer={() => {
            setTransferringExpense(true);

            try {
              const transfer = transferCompletedShoppingToExpense(
                completedItems,
                UI_TEXT.items.shoppingTransferDescription,
              );

              void transfer.save
                .then(() => {
                  setShowClearConfirm(false);
                  showToast(
                    UI_TEXT.toast.transferredToExpenses(transfer.amount),
                    "success",
                  );
                })
                .catch((transferError) => {
                  console.error("Transferring shopping total failed", transferError);
                  showToast(UI_TEXT.toast.transferFailed, "error");
                })
                .finally(() => setTransferringExpense(false));
            } catch (transferError) {
              console.error("Invalid shopping transfer", transferError);
              setTransferringExpense(false);
              showToast(UI_TEXT.toast.transferFailed, "error");
            }
          }}
          onClear={() => {
            setClearing(true);

            void handleClear()
              .then(() => {
                setShowClearConfirm(false);
                showToast(UI_TEXT.toast.cleared, "success");
              })
              .catch((clearError) => {
                console.error("Clearing completed items failed", clearError);
                showToast(UI_TEXT.toast.clearFailed, "error");
              })
              .finally(() => setClearing(false));
          }}
        />

      )}
      {/* Complete Item Dialog */}

      {completingItem && (

        <CompleteItemDialog

          itemName={completingItem.text}

          defaultQty={completingItem.lastQty || 1}

          defaultUnitPrice={
            completingItem.lastUnitPrice || 0
          }

          onCancel={() => {

            setCompletingItem(null);

          }}

          onSave={async (qty, unitPrice) => {
            const itemToComplete = completingItem;
            setCompletingItem(null);

            try {
              await handleComplete(
                itemToComplete,
                qty,
                unitPrice
              );
              showToast(UI_TEXT.toast.completed(itemToComplete.text), "success");
            } catch {
              // The hook restores the item and exposes a user-facing error.
              showToast(UI_TEXT.toast.completeFailed, "error");
            }

          }}

        />

      )}

      {toast && (
        <div
          key={toast.id}
          className={`toast-fade fixed inset-x-0 top-0 z-50 w-full border-b px-4 py-3 text-center text-sm font-medium shadow-lg backdrop-blur-md ${
            toast.type === "success"
              ? "border-green-300 bg-green-100/85 text-green-900"
              : toast.type === "error"
                ? "border-red-300 bg-red-100/85 text-red-900"
                : "border-[#e96f62] bg-[#FA8072]/85 text-gray-950"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
