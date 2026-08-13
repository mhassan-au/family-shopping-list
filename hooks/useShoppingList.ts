"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { disableNetwork, enableNetwork, onSnapshot } from "firebase/firestore";
import { shoppingQuery } from "@/lib/shopping";
import { db } from "@/lib/firebase";

import {
  addShoppingItem,
  deleteShoppingItem,
  clearShoppingItems,
  toggleShoppingItem,
  completeShoppingItem
} from "@/lib/ShoppingActions";

import { ShoppingItem } from "@/lib/types";
import { UI_TEXT } from "@/lib/uiText";

export function useShoppingList() {
  // Items State

  const [items, setItems] = useState<ShoppingItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(true);

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  const [connectionStalled, setConnectionStalled] = useState(false);

  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  const cacheOnlyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnecting = useRef(false);
  const autoRetryAttempted = useRef(false);

  const clearCacheOnlyTimer = useCallback(() => {
    if (cacheOnlyTimer.current) {
      clearTimeout(cacheOnlyTimer.current);
      cacheOnlyTimer.current = null;
    }
  }, []);

  const clearPendingWriteTimer = useCallback(() => {
    if (pendingWriteTimer.current) {
      clearTimeout(pendingWriteTimer.current);
      pendingWriteTimer.current = null;
    }
  }, []);

  const reconnect = useCallback(async () => {
    if (reconnecting.current || !navigator.onLine) return;

    reconnecting.current = true;
    clearCacheOnlyTimer();

    try {
      await disableNetwork(db);
      await enableNetwork(db);
    } catch (reconnectError) {
      console.error("Firestore reconnect failed", reconnectError);
    } finally {
      reconnecting.current = false;
    }
  }, [clearCacheOnlyTimer]);

  useEffect(() => {
    let hiddenAt: number | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStalled(false);
      autoRetryAttempted.current = false;
      void reconnect();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStalled(false);
      clearCacheOnlyTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }

      if (hiddenAt !== null && Date.now() - hiddenAt > 5000) {
        hiddenAt = null;
        setConnectionStalled(false);
        autoRetryAttempted.current = false;
        void reconnect();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setConnectionStalled(false);
        autoRetryAttempted.current = false;
        void reconnect();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearCacheOnlyTimer, reconnect]);

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

        setHasPendingWrites(snapshot.metadata.hasPendingWrites);

        if (snapshot.metadata.hasPendingWrites) {
          if (!pendingWriteTimer.current && !autoRetryAttempted.current) {
            pendingWriteTimer.current = setTimeout(() => {
              pendingWriteTimer.current = null;
              autoRetryAttempted.current = true;
              setConnectionStalled(true);
              void reconnect();
            }, 10000);
          }
        } else {
          clearPendingWriteTimer();
        }

        if (snapshot.metadata.fromCache && navigator.onLine) {
          if (!cacheOnlyTimer.current && !autoRetryAttempted.current) {
            cacheOnlyTimer.current = setTimeout(() => {
              cacheOnlyTimer.current = null;
              autoRetryAttempted.current = true;
              setConnectionStalled(true);
              void reconnect();
            }, 10000);
          }
        } else {
          clearCacheOnlyTimer();
          setConnectionStalled(false);
          autoRetryAttempted.current = false;
        }
      },

      (snapshotError) => {
        console.error("Shopping list listener failed", snapshotError);
        setError("Could not refresh the shopping list. Check your connection and try again.");
        setLoading(false);
        setSyncing(false);
      },
    );

    return () => {
      clearCacheOnlyTimer();
      clearPendingWriteTimer();
      unsubscribe();
    };
  }, [clearCacheOnlyTimer, clearPendingWriteTimer, reconnect]);

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
    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, completed: !currentItem.completed }
          : currentItem,
      ),
    );

    try {
      await toggleShoppingItem(item);
    } catch (toggleError) {
      console.error("Toggling shopping item failed", toggleError);
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id ? item : currentItem,
        ),
      );
      setError(UI_TEXT.errors.update);
      throw toggleError;
    }
  }

  // Delete Item

  async function handleDelete(id: string) {
    let deletedItem: ShoppingItem | undefined;
    let deletedIndex = -1;

    setItems((currentItems) => {
      deletedIndex = currentItems.findIndex((item) => item.id === id);
      deletedItem = currentItems[deletedIndex];
      return currentItems.filter((item) => item.id !== id);
    });

    try {
      await deleteShoppingItem(id);
    } catch (deleteError) {
      console.error("Deleting shopping item failed", deleteError);

      if (deletedItem) {
        const itemToRestore = deletedItem;
        setItems((currentItems) => {
          if (currentItems.some((item) => item.id === itemToRestore.id)) {
            return currentItems;
          }

          const restoredItems = [...currentItems];
          restoredItems.splice(
            Math.min(Math.max(deletedIndex, 0), restoredItems.length),
            0,
            itemToRestore,
          );
          return restoredItems;
        });
      }

      setError(UI_TEXT.errors.delete);
      throw deleteError;
    }
  }

  // Clear Completed

  async function handleClear() {
    let completedItems: ShoppingItem[] = [];

    setItems((currentItems) => {
      completedItems = currentItems.filter((item) => item.completed);
      return currentItems.filter((item) => !item.completed);
    });

    try {
      await clearShoppingItems();
    } catch (clearError) {
      console.error("Clearing completed items failed", clearError);
      setItems((currentItems) => {
        const currentIds = new Set(currentItems.map((item) => item.id));
        return [
          ...currentItems,
          ...completedItems.filter((item) => !currentIds.has(item.id)),
        ];
      });
      setError(UI_TEXT.errors.clear);
      throw clearError;
    }
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
      setError(UI_TEXT.errors.complete);
      throw completeError;
    }
  }

  return {
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

    handleComplete,
  };
}
