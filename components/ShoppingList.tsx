"use client";

import { SHOPS, CATEGORIES, PRIORITIES } from "@/lib/config";
import ItemEditor from "./ItemEditor";
import { useEffect, useState } from "react";
import { getTagColor } from "@/lib/tagColor";
import { FiTrash2, FiEdit3 } from "react-icons/fi";
import { onSnapshot } from "firebase/firestore";

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
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [clearing, setClearing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ShoppingItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  return (
    <main className="max-w-md mx-auto p-5">
      <h1 className="text-3xl font-bold mb-6">🛒 MyGrocery</h1>

      <div className="mb-5">
        <div className="flex gap-2">
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
        <div className="flex gap-2 mt-3">
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

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id}>
            <div
              className="
      flex
      justify-between
      items-center
      border
      rounded-lg
      p-3
      "
            >
              <div className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {
                    toggleItem(item.id, item.completed);
                  }}
                />

                <span
                  
                  className={`
            cursor-pointer
            ${item.completed ? "line-through text-gray-400" : ""}
            `}
                >
                  <span
    onClick={()=>{
      toggleItem(
        item.id,
        item.completed
      );
    }}
    className="cursor-pointer"
  >
    {item.text}
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

              <div className="flex gap-3">

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


                <button
                  onClick={() => {
                    setDeleteTarget(item);
                  }}
                  className="text-red-500"
                >
                  <FiTrash2 size={18} />
                </button>

              </div>
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
    </main>
  );
}
