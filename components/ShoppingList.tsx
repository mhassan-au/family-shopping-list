"use client";

import { useShoppingList } from "@/hooks/useShoppingList";
import { useShoppingFilters } from "@/hooks/useShoppingFilters";
import { useShoppingDialogs } from "@/hooks/useShoppingDialogs";
import { useEffect, useRef, useState } from "react";

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
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const device = getDeviceLogin();

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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
    const normalizedName = newItem.trim().toLocaleLowerCase();
    const duplicate = items.find(
      (item) => item.text.trim().toLocaleLowerCase() === normalizedName,
    );

    if (duplicate) {
      setToastMessage(`${duplicate.text} already added`);

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = setTimeout(() => {
        setToastMessage("");
        toastTimerRef.current = null;
      }, 2500);

      return;
    }

    const addPromise = handleAdd(
      newItem,
      selectedShop,
      selectedCategory,
      selectedPriority
    );


    setNewItem("");

    setSelectedShop("");

    setSelectedCategory("");

    setSelectedPriority("");

    void addPromise.catch((addError) => {
      console.error("Adding shopping item failed", addError);
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
            const deletePromise = handleDelete(deleteTarget.id);
            setDeleteTarget(null);

            void deletePromise.catch((deleteError) => {
              console.error("Deleting shopping item failed", deleteError);
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
              .catch((clearError) => {
                console.error("Clearing completed items failed", clearError);
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
            } catch {
              // The hook restores the item and exposes a user-facing error.
            }

          }}

        />

      )}

      {toastMessage && (
        <div
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#FA8072] px-4 py-3 text-sm font-medium text-gray-950 shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
    </main>
  );
}
