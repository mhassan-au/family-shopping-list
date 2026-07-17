"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { shoppingQuery } from "@/lib/shopping";

import {
  addShoppingItem,
  deleteShoppingItem,
  clearShoppingItems,
  toggleShoppingItem,
  completeShoppingItem
} from "@/lib/ShoppingActions";

import { ShoppingItem } from "@/lib/types";

export function useShoppingList() {
  // Items State

  const [items, setItems] = useState<ShoppingItem[]>([]);

  const [loading, setLoading] = useState(true);

  // Firebase Listener

  useEffect(() => {
    const unsubscribe = onSnapshot(
      shoppingQuery,

      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,

          ...(doc.data() as Omit<ShoppingItem, "id">),
        }));

        setItems(data);

        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Add Item

  async function handleAdd(
    text: string,

    shop: string,

    category: string,

    priority: string,
  ) {
    await addShoppingItem(text, shop, category, priority);
  }

  // Toggle Completed

  async function handleToggle(item: ShoppingItem) {
    await toggleShoppingItem(item);
  }

  // Delete Item

  async function handleDelete(id: string) {
    await deleteShoppingItem(id);
  }

  // Clear Completed

  async function handleClear() {
    await clearShoppingItems();
  }

  // Complete Item With Price

  async function handleComplete(
    item: ShoppingItem,

    qty: number,

    unitPrice: number,
  ) {
    await completeShoppingItem(item, qty, unitPrice);
  }

  return {
    items,

    loading,

    handleAdd,

    handleToggle,

    handleDelete,

    handleClear,

    handleComplete,
  };
}
