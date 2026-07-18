"use client";

import { useShoppingList } from "@/hooks/useShoppingList";
import { useShoppingFilters } from "@/hooks/useShoppingFilters";
import { useShoppingDialogs } from "@/hooks/useShoppingDialogs";
import { PRIORITIES } from "@/lib/config";
import { useEffect, useState } from "react";

import { ShoppingItem } from "@/lib/types";
import ViewSelector from "./ViewSelector";
import CompleteItemDialog from "./CompleteItemDialog";
import GroceryInput from "./GroceryInput";
import GroceryGroup from "./GroceryGroup";
import ConfirmDialog from "./ConfirmDialog";
import ShoppingSummary from "./ShoppingSummary";


export default function ShoppingList() {

  const [newItem, setNewItem] = useState("");
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [clearing, setClearing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [viewMode, setViewMode] = useState<"flat" | "shop" | "category">("flat");
  const [priorityFilter, setPriorityFilter] = useState("");


  const {

    items,

    loading,

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

  // Add grocery item

  async function handleAddNew() {

    await handleAdd(
      newItem,
      selectedShop,
      selectedCategory,
      selectedPriority
    );


    setNewItem("");

    setSelectedShop("");

    setSelectedCategory("");

    setSelectedPriority("");

  }

  const priorityOrder = Object.fromEntries(
    PRIORITIES.map(priority => [
      priority.label,
      priority.order
    ])
  );


  return (
    <main className="w-full max-w-md mx-auto p-4 sm:p-5">
      <h1 className="text-3xl font-bold mb-6">🛒 MyGrocery</h1>

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

              canQuickAdd={viewMode !== "flat"}
              
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

      {/* Delete Confirmation */}

      {deleteTarget && (

        <ConfirmDialog

          title="Delete item?"

          message={deleteTarget.text}

          confirmText="Delete"

          onCancel={() => {

            setDeleteTarget(null);

          }}

          onConfirm={async () => {

            await handleDelete(
              deleteTarget.id
            );

            setDeleteTarget(null);

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

          onConfirm={async () => {

            setClearing(true);

            await handleClear()

            setClearing(false);

            setShowClearConfirm(false);

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

            await handleComplete(
              completingItem,
              qty,
              unitPrice
            );

            setCompletingItem(null);

          }}

        />

      )}
    </main>
  );
}
