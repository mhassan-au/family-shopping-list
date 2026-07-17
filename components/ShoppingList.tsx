"use client";

import { SHOPS, CATEGORIES, PRIORITIES } from "@/lib/config";
import ItemEditor from "./ItemEditor";
import { useEffect, useMemo, useState } from "react";
import { getTagColor } from "@/lib/tagColor";
import { FiTrash2, FiEdit3, FiFilter } from "react-icons/fi";
import { onSnapshot } from "firebase/firestore";
import CompleteItemDialog from "./CompleteItemDialog";
import { completeItem } from "@/lib/shopping";

import {
  shoppingQuery,
  addItem,
  toggleItem,
  deleteItem,
  clearCompleted,
} from "@/lib/shopping";

import { ShoppingItem } from "@/lib/types";

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  // Sort active items first

  const displayItems = [

    ...items.filter(item => !item.completed),

    ...items.filter(item => item.completed)

  ];
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [clearing, setClearing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ShoppingItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<"flat" | "shop" | "category">("flat");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);

  {/* Complete Item Dialog */ }
  const [completingItem, setCompletingItem] =
    useState<ShoppingItem | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(shoppingQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,

        ...(doc.data() as Omit<ShoppingItem, "id">),
      }));

      setItems(data);

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleAdd() {
    await addItem(newItem, selectedShop, selectedCategory, selectedPriority);

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

  const groupedItems = useMemo(() => {

    const filteredItems = priorityFilter
      ? items.filter(
        item => item.priority === priorityFilter
      )
      : items;


    if (viewMode === "flat") {

      return {
        Flat: filteredItems
      };

    }


    const groups: Record<string, ShoppingItem[]> = {};


    filteredItems.forEach(item => {

      const key =
        viewMode === "shop"
          ? (item.shop || "No Shop")
          : (item.category || "No Category");


      if (!groups[key]) {
        groups[key] = [];
      }


      groups[key].push(item);

    });


    return groups;


  }, [
    items,
    viewMode,
    priorityFilter
  ]);

  return (
    <main className="w-full max-w-md mx-auto p-4 sm:p-5">
      <h1 className="text-3xl font-bold mb-6">🛒 MyGrocery</h1>

      <div className="mb-5">
        <div className="flex gap-2 w-full">
          <input
            className="border rounded-lg p-2 flex-1"
            placeholder="Add grocery item"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAdd();
              }
            }}
          />

          <button
            onClick={handleAdd}
            className="bg-black text-white px-4 rounded-lg"
          >
            +
          </button>
        </div>

        {/* Dropdown Section */}
        <div className="
  grid
  grid-cols-1
  sm:grid-cols-3
  gap-2
  mt-3
">
          {/* Shop dropdown */}
          <select
            className="border rounded-lg p-2 flex-1"
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
          >
            {SHOPS.map((shop) => (
              <option key={shop.label} value={shop.label}>
                {shop.label || "Shop"}
              </option>
            ))}
          </select>
          {/* Category dropdown */}
          <select
            className="border rounded-lg p-2 flex-1"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((category) => (
              <option key={category.label} value={category.label}>
                {category.label || "Category"}
              </option>
            ))}
          </select>
          {/* Priority dropdown */}
          <select
            className="border rounded-lg p-2 flex-1"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority.label} value={priority.label}>
                {priority.label || "Priority"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p>Loading...</p>}

      {/** View Mode Selection */}

      <div className="
  flex
  flex-wrap
  justify-between
  items-center
  gap-2
  mb-4
">

        <div className="
  flex
  gap-2
  flex-wrap
">

          <button
            onClick={() => setViewMode("flat")}
            className={`px-3 py-1 rounded ${viewMode === "flat"
              ? "bg-black text-white"
              : "bg-gray-200"
              }`}
          >
            Flat
          </button>


          <button
            onClick={() => setViewMode("shop")}
            className={`px-3 py-1 rounded ${viewMode === "shop"
              ? "bg-black text-white"
              : "bg-gray-200"
              }`}
          >
            Shop
          </button>


          <button
            onClick={() => setViewMode("category")}
            className={`px-3 py-1 rounded ${viewMode === "category"
              ? "bg-black text-white"
              : "bg-gray-200"
              }`}
          >
            Category
          </button>

        </div>


        {/* Priority Filter */}

        <div className="relative">

          <button
            onClick={() => {
              setShowPriorityFilter(!showPriorityFilter);
            }}
            className={`
      p-2
      rounded-lg
      ${priorityFilter
                ? "bg-red-100"
                : "bg-gray-200"
              }
    `}
          >
            <FiFilter size={20} />
          </button>


          {showPriorityFilter && (

            <div className="
    absolute
    right-0
    mt-2
    bg-white
    border
    rounded-lg
    shadow
    p-2
    z-20
    w-40
  ">

              <button
                onClick={() => {
                  setPriorityFilter("");
                  setShowPriorityFilter(false);
                }}

                className={`
        block
        w-full
        text-left
        px-2
        py-2
        rounded
        hover:bg-gray-100
        ${priorityFilter === ""
                    ? "bg-gray-200 font-bold"
                    : ""
                  }
      `}
              >
                All
              </button>


              {PRIORITIES
                .filter(p => p.label)
                .map(priority => (

                  <button
                    key={priority.label}

                    onClick={() => {
                      setPriorityFilter(priority.label);
                      setShowPriorityFilter(false);
                    }}

                    className={`
          block
          w-full
          text-left
          px-2
          py-2
          rounded
          hover:bg-gray-100
          ${priorityFilter === priority.label
                        ? "bg-gray-200 font-bold"
                        : ""
                      }
        `}
                  >
                    {priority.label}
                  </button>

                ))}

            </div>

          )}

        </div>


      </div>
      <div className="space-y-5">

        {Object.entries(groupedItems).map(([groupName, groupItems]) => (

          <div key={groupName}>

            {viewMode !== "flat" && (

              <div
                className="
          sticky
          top-0
          bg-white
          font-bold
          text-lg
          border-b
          pb-2
          mb-2
          z-10
          "
              >
                {groupName}
              </div>

            )}

            <div className="space-y-2">

              {groupItems.map((item) => (

                <div key={item.id}>
                  <div
                    className="
     flex
justify-between
items-start
gap-2
border
rounded-lg
p-3
      "
                  >
                    <div className="
flex
gap-3
items-center
flex-1
min-w-0
">
                      {/* Complete Checkbox */}

                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {

                          if (item.completed) {

                            toggleItem(item.id, true);

                          } else {

                            setCompletingItem(item);

                          }

                        }}
                      />

                      <span

                        className={`
            cursor-pointer
            ${item.completed ? "line-through text-gray-400" : ""}
            `}
                      >
                        <span
                          onClick={() => {
                            if (item.completed) {

                              toggleItem(item.id, true);

                            } else {

                              setCompletingItem(item);

                            }
                          }}
                          className="cursor-pointer text-lg wrap-break-words"
                        >
                          {item.text}
                          {/* Completed Item Price */}

                          {item.completed &&
                            (item.qty && item.unitPrice) && (

                              <span className="
ml-2
font-bold
text-green-600
">

                                ${(
                                  item.qty *
                                  item.unitPrice
                                ).toFixed(2)}

                              </span>

                            )}
                        </span>

                        {(item.shop || item.category || item.priority) && (

                          <span className="ml-2 text-xs">

                            {item.shop && (
                              <span
                                className={`ml-2 px-2 py-1 rounded-full text-xs ${getTagColor(item.shop)}`}
                              >
                                {item.shop}
                              </span>
                            )}


                            {item.category && (
                              <span
                                className={`ml-1 px-2 py-1 rounded-full text-xs ${getTagColor(item.category)}`}
                              >
                                {item.category}
                              </span>
                            )}


                            {item.priority && (
                              <span
                                className={`
          ml-1
          px-2
          py-1
          rounded-full
          text-xs
          ${getTagColor(item.priority)}
        `}
                              >
                                {item.priority}
                              </span>
                            )}

                          </span>

                        )}
                      </span>
                    </div>
                    {!item.completed && (
                      <div className="flex gap-3 shrink-0">
                        {/* Edit button */}
                        <button
                          onClick={() => {
                            if (!item.completed) {
                              setEditing(item);
                            }
                          }}
                          className={
                            item.completed
                              ? "text-gray-300"
                              : ""
                          }
                        >
                          <FiEdit3 size={18} />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => {
                            setDeleteTarget(item);
                          }}
                          className="text-red-500"
                        >
                          <FiTrash2 size={18} />
                        </button>

                      </div>
                    )}
                  </div>

                  {editing?.id === item.id && !item.completed && (
                    <ItemEditor
                      item={item}
                      close={() => setEditing(null)}
                    />
                  )}
                </div>

              ))}

            </div>

          </div>

        ))}

      </div>

      {items.some((item) => item.completed) && (
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setShowClearConfirm(true);
            }}
            className="
bg-gray-200
px-4
py-2
rounded-lg
text-sm
"
          >
            🧹 Clear completed
          </button>
          {/* Shopping Total */}

          <div className="
mt-5
text-right
font-bold
">

            Total: $

            {items
              .filter(item => item.completed)
              .reduce(
                (sum, item) =>
                  sum +
                  ((item.qty || 0) *
                    (item.unitPrice || 0)),
                0
              )
              .toFixed(2)
            }

          </div>
        </div>

      )}

      {!loading && items.length === 0 && (
        <p className="text-gray-500 text-center mt-5">
          Your grocery list is empty
        </p>
      )}

      {deleteTarget && (

        <div className="
fixed
inset-0
bg-black/40
flex
items-center
justify-center
">

          <div className="
bg-white
rounded-lg
p-5
w-80
">

            <h2 className="font-bold mb-3">
              Delete item?
            </h2>


            <p className="mb-5">
              {deleteTarget.text}
            </p>


            <div className="flex justify-end gap-3">

              <button

                onClick={() => {
                  setDeleteTarget(null);
                }}

                className="px-4 py-2"

              >
                Cancel
              </button>


              <button

                onClick={async () => {

                  await deleteItem(deleteTarget.id);

                  setDeleteTarget(null);

                }}

                className="
bg-red-500
text-white
px-4
py-2
rounded
"

              >
                Delete
              </button>


            </div>

          </div>

        </div>

      )}
      {/* Clear completed items confirmation */}
      {showClearConfirm && (

        <div className="
fixed
inset-0
bg-black/40
flex
items-center
justify-center
">

          <div className="
bg-white
rounded-lg
p-5
w-80
">

            <h2 className="font-bold mb-3">
              Clear completed items?
            </h2>


            <div className="flex justify-end gap-3">


              <button

                onClick={() => {
                  setShowClearConfirm(false);
                }}

                className="px-4 py-2"

              >
                Cancel
              </button>

              <button

                onClick={async () => {

                  setClearing(true);

                  await clearCompleted();

                  setClearing(false);

                  setShowClearConfirm(false);

                }}

                className="
bg-red-500
text-white
px-4
py-2
rounded
"

              >
                {clearing ? "Clearing..." : "Clear"}
              </button>


            </div>

          </div>

        </div>

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

            await completeItem(

              completingItem.id,

              qty,

              unitPrice,

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
