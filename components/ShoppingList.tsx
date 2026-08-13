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
import ShoppingSummary from "./ShoppingSummary";
import { FiLogOut } from "react-icons/fi";
import { clearDeviceLogin, getDeviceLogin } from "@/lib/device";

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

  const [newItem, setNewItem] = useState("");
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [clearing, setClearing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [viewMode, setViewMode] = useState<"flat" | "shop" | "category">("flat");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: "success" | "error" | "duplicate";
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const device = getDeviceLogin();

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
  const syncLabel = !isOnline
    ? "Offline"
    : syncing
      ? "Syncing"
      : "Synced";

  function handleLogout() {

    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) {
      return;
    }


    clearDeviceLogin();

    window.location.reload();

  }
  // Add grocery item

  function handleAddNew() {
    const requestedItems = newItem
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (requestedItems.length === 0) {
      return;
    }

    const knownNames = new Set(
      items.map((item) => item.text.trim().toLocaleLowerCase()),
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
        `${duplicateNames.join(", ")} ${duplicateNames.length === 1 ? "is" : "are"} already added`,
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

    setSelectedCategory("");

    setSelectedPriority("");

    void addPromise
      .then(() => {
        if (duplicateNames.length > 0) {
          showToast(
            `${duplicateNames.join(", ")} skipped — already added`,
            "duplicate",
          );
        } else {
          showToast(
            `${newNames.length === 1 ? "Item" : "Items"} added`,
            "success",
          );
        }
      })
      .catch((addError) => {
        console.error("Adding shopping item failed", addError);
        showToast("Item could not be added", "error");
      });

  }

  return (
    <main className="w-full max-w-md mx-auto p-4 sm:p-5">
      <div
        className="
    flex
    items-center
    justify-between
    w-full
    rounded-xl
    border
    border-blue-200
    bg-gradient-to-r
    from-blue-100
    to-cyan-50
    px-3
    py-2
    mb-4
    shadow-sm
    dark:border-blue-800
    dark:from-blue-950
    dark:to-slate-900
  "
      >

        <h1 className="text-xl font-bold">
          🛒 MyGrocery
        </h1>


        <div className="flex items-center gap-2">

          <span className="
    text-sm
    font-medium
    text-gray-700
    dark:text-gray-200
  ">
            {device?.username}
          </span>


          <button
            onClick={handleLogout}
            className="
      p-2
      rounded-lg

      text-gray-700
      dark:text-gray-200

      hover:bg-gray-100
      dark:hover:bg-gray-800

      transition
    "
            title="Logout"
          >

            <FiLogOut size={20} />

          </button>

        </div>

      </div>

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

      {loading && <p>Loading...</p>}

      {error && (
        <p className="text-red-500 text-sm my-2" role="alert">
          {error}
        </p>
      )}

      {(!isOnline || syncing) && (
        <p className="text-xs text-amber-600 dark:text-amber-400 my-2">
          {!isOnline
            ? "Offline — changes will sync when connected"
            : connectionStalled
              ? "Connection delayed - retrying sync..."
              : hasPendingWrites
                ? "Uploading changes..."
                : "Refreshing list..."}
          {connectionStalled && (
            <button
              type="button"
              onClick={() => void reconnect()}
              className="ml-2 underline font-medium"
            >
              Retry now
            </button>
          )}
        </p>
      )}

      <span className="sr-only" aria-live="polite">
        {syncing ? "Syncing shopping list" : "Shopping list synced"}
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

      {/* Shopping Summary */}

      <ShoppingSummary

        items={items}

        onClear={() => {

          setShowClearConfirm(true);

        }}

      />

      {!loading && items.length === 0 && (
        <p className="text-gray-500 text-center mt-5">
          Your grocery list is empty
        </p>
      )}

      <footer className="sticky bottom-2 z-10 mt-6 rounded-xl border border-blue-200 bg-blue-100/95 px-4 py-2 text-center text-sm font-medium text-blue-900 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-blue-950/95 dark:text-blue-100">
        <time dateTime={todayDateTime} suppressHydrationWarning>
          {todayLabel}
        </time>
        <span aria-hidden="true"> • </span>
        <span>
          {remainingItemCount} {remainingItemCount === 1 ? "item" : "items"} left
        </span>
        <span aria-hidden="true"> • </span>
        <span>{syncLabel}</span>
      </footer>

      {/* Delete Confirmation */}

      {deleteTarget && (

        <ConfirmDialog

          title="Delete item?"

          message={deleteTarget.text}

          confirmText="Delete"

          onCancel={() => {

            setDeleteTarget(null);

          }}

          onConfirm={() => {
            const itemName = deleteTarget.text;
            const deletePromise = handleDelete(deleteTarget.id);
            setDeleteTarget(null);

            void deletePromise
              .then(() => showToast(`${itemName} deleted`, "success"))
              .catch((deleteError) => {
                console.error("Deleting shopping item failed", deleteError);
                showToast("Item could not be deleted", "error");
              });

          }}

        />

      )}
      {/* Clear Completed Confirmation */}

      {showClearConfirm && (

        <ConfirmDialog

          title="Clear completed items?"

          confirmText="Clear"

          loading={clearing}

          onCancel={() => {

            setShowClearConfirm(false);

          }}

          onConfirm={() => {
            setClearing(true);
            setShowClearConfirm(false);

            void handleClear()
              .then(() => showToast("Completed list cleared", "success"))
              .catch((clearError) => {
                console.error("Clearing completed items failed", clearError);
                showToast("Completed list could not be cleared", "error");
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
              showToast(`${itemToComplete.text} completed`, "success");
            } catch {
              // The hook restores the item and exposes a user-facing error.
              showToast("Item could not be completed", "error");
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
