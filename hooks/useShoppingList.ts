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

  const [error, setError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(true);

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Firebase Listener

  useEffect(() => {
    const unsubscribe = onSnapshot(
      shoppingQuery,

      { includeMetadataChanges: true },

      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,

          ...(doc.data() as Omit<ShoppingItem, "id">),
        }));

        setItems(data);

        setError(null);

        setLoading(false);

        setSyncing(
          snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites,
        );
      },

      (snapshotError) => {
        console.error("Shopping list listener failed", snapshotError);
        setError("Could not refresh the shopping list. Check your connection and try again.");
        setLoading(false);
        setSyncing(false);
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
    const previousItem = item;

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              completed: true,
              qty,
              unitPrice,
              lastQty: qty,
              lastUnitPrice: unitPrice,
            }
          : currentItem,
      ),
    );

    setError(null);

    try {
      await completeShoppingItem(item, qty, unitPrice);
    } catch (completeError) {
      console.error("Completing shopping item failed", completeError);
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === previousItem.id ? previousItem : currentItem,
        ),
      );
      setError("The item could not be completed. Check your connection and try again.");
      throw completeError;
    }
  }

  return {
    items,

    loading,

    error,

    syncing,

    isOnline,

    handleAdd,

    handleToggle,

    handleDelete,

    handleClear,

    handleComplete,
  };
}
