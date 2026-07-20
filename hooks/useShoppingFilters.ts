"use client";

import { useMemo } from "react";
import { ShoppingItem } from "@/lib/types";
import { PRIORITIES, HIDDEN_PRIORITIES } from "@/lib/config";

export function useShoppingFilters(
  items: ShoppingItem[],
  viewMode: "flat" | "shop" | "category",
  priorityFilter: string,
) {
  // Priority sort order

  const priorityOrder = Object.fromEntries(
    [...PRIORITIES, ...HIDDEN_PRIORITIES].map((priority) => [
      priority.label,

      priority.order,
    ]),
  );

  const groupedItems = useMemo(() => {
    // Filter by priority

    const filteredItems = priorityFilter
      ? items.filter((item) => item.priority === priorityFilter)
      : items;

    // Flat View

    if (viewMode === "flat") {
      return {
        Flat: [...filteredItems].sort((a, b) => {
          // Active first

          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }

          // Priority

          const aPriority = priorityOrder[a.priority ?? ""] ?? 999;

          const bPriority = priorityOrder[b.priority ?? ""] ?? 999;

          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          // Alphabetical

          return a.text.localeCompare(b.text);
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
        // Active first

        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // Priority

        const aPriority = priorityOrder[a.priority ?? ""] ?? 999;

        const bPriority = priorityOrder[b.priority ?? ""] ?? 999;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Alphabetical

        return a.text.localeCompare(b.text);
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
