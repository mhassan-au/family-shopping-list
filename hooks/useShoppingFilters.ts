"use client";

import { useMemo } from "react";
import { ShoppingItem } from "@/lib/types";

export function useShoppingFilters(
  items: ShoppingItem[],
  viewMode: "flat" | "shop" | "category",
  priorityFilter: string,
) {
  const groupedItems = useMemo(() => {
    // Filter by priority

    const filteredItems = priorityFilter
      ? items.filter((item) => item.priority === priorityFilter)
      : items;

    // Flat View

    if (viewMode === "flat") {
      return {
        Flat: [...filteredItems].sort((a, b) => {
          if (a.completed === b.completed) return 0;

          return a.completed ? 1 : -1;
        }),
      };
    }

    // Group Items

    const groups: Record<string, ShoppingItem[]> = {};

    filteredItems.forEach((item) => {
      const key =
        viewMode === "shop"
          ? item.shop || "No Shop"
          : item.category || "No Category";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(item);
    });

    // Sort each group
    // Active first, completed last

    Object.values(groups).forEach((group) => {
      group.sort((a, b) => {
        if (a.completed === b.completed) return 0;

        return a.completed ? 1 : -1;
      });
    });

    // Sort groups
    // "No Shop" / "No Category" always last

    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => {
        const aIsNo = a.startsWith("No ");
        const bIsNo = b.startsWith("No ");

        if (aIsNo && !bIsNo) return 1;
        if (!aIsNo && bIsNo) return -1;

        return a.localeCompare(b);
      }),
    );
  }, [items, viewMode, priorityFilter]);

  return {
    groupedItems,
  };
}