"use client";

import { createContext, createElement, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORIES, EXPENSE_CATEGORIES, SHOPS } from "@/lib/config";
import { getCurrentUsername } from "@/lib/currentUser";

export type CategoryKind = "shops" | "shopping" | "expenses";

interface StoredCategoryConfig {
  shops?: string[];
  shopping?: string[];
  expenses?: string[];
  shopAliases?: Record<string, string>;
  shoppingAliases?: Record<string, string>;
  expenseAliases?: Record<string, string>;
}

export interface CategoryConfig {
  shops: string[];
  shopping: string[];
  expenses: string[];
  shopAliases: Record<string, string>;
  shoppingAliases: Record<string, string>;
  expenseAliases: Record<string, string>;
}

interface CategoryConfigContextValue extends CategoryConfig {
  loading: boolean;
  error: string | null;
  addCategory: (kind: CategoryKind, name: string) => Promise<void>;
  renameCategory: (
    kind: CategoryKind,
    oldName: string,
    newName: string,
  ) => Promise<void>;
  deleteCategory: (kind: CategoryKind, name: string) => Promise<void>;
  reorderCategory: (kind: CategoryKind, fromIndex: number, toIndex: number) => Promise<void>;
}

const CategoryConfigContext = createContext<CategoryConfigContextValue | null>(null);

const configRef = doc(db, "app_config", "categories");
const defaultShopping = CATEGORIES.map((category) => category.label).filter(Boolean);
const defaultShops = SHOPS.map((shop) => shop.label).filter(Boolean);

export const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  shops: defaultShops,
  shopping: defaultShopping,
  expenses: [...EXPENSE_CATEGORIES],
  shopAliases: {},
  shoppingAliases: {},
  expenseAliases: {},
};

function cleanList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
  return cleaned.length > 0 ? cleaned : fallback;
}

function cleanAliases(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[0].length > 0 && entry[1].length > 0,
    ),
  );
}

function parseConfig(data?: StoredCategoryConfig): CategoryConfig {
  return {
    shops: cleanList(data?.shops, DEFAULT_CATEGORY_CONFIG.shops),
    shopping: cleanList(data?.shopping, DEFAULT_CATEGORY_CONFIG.shopping),
    expenses: cleanList(data?.expenses, DEFAULT_CATEGORY_CONFIG.expenses),
    shopAliases: cleanAliases(data?.shopAliases),
    shoppingAliases: cleanAliases(data?.shoppingAliases),
    expenseAliases: cleanAliases(data?.expenseAliases),
  };
}

export function CategoryConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CategoryConfig>(DEFAULT_CATEGORY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onSnapshot(
    configRef,
    (snapshot) => {
      setConfig(parseConfig(snapshot.exists() ? snapshot.data() : undefined));
      setLoading(false);
      setError(null);
    },
    (snapshotError) => {
      console.error("Loading category configuration failed", snapshotError);
      setLoading(false);
      setError(snapshotError.message);
    },
  ), []);

  const actions = useMemo(() => ({
    async addCategory(kind: CategoryKind, name: string) {
      const nextConfig = {
        ...config,
        [kind]: [...config[kind], name],
      };
      await saveConfig(nextConfig);
    },
    async renameCategory(kind: CategoryKind, oldName: string, newName: string) {
      const aliasKey = kind === "shops"
        ? "shopAliases"
        : kind === "shopping"
          ? "shoppingAliases"
          : "expenseAliases";
      const aliases = { ...config[aliasKey] };
      Object.entries(aliases).forEach(([source, target]) => {
        if (target === oldName) aliases[source] = newName;
      });
      aliases[oldName] = newName;

      const nextConfig = {
        ...config,
        [kind]: config[kind].map((category) =>
          category === oldName ? newName : category,
        ),
        [aliasKey]: aliases,
      };
      await saveConfig(nextConfig);
    },
    async deleteCategory(kind: CategoryKind, name: string) {
      const nextConfig = {
        ...config,
        [kind]: config[kind].filter((category) => category !== name),
      };
      await saveConfig(nextConfig);
    },
    async reorderCategory(kind: CategoryKind, fromIndex: number, toIndex: number) {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= config[kind].length || toIndex >= config[kind].length) return;
      const reordered = [...config[kind]];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      await saveConfig({ ...config, [kind]: reordered });
    },
  }), [config]);

  return createElement(
    CategoryConfigContext.Provider,
    { value: { ...config, loading, error, ...actions } },
    children,
  );
}

export function useCategoryConfig() {
  const context = useContext(CategoryConfigContext);
  if (!context) throw new Error("useCategoryConfig must be used within CategoryConfigProvider");
  return context;
}

async function saveConfig(config: CategoryConfig) {
  await setDoc(configRef, {
    ...config,
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now(),
    updatedBy: getCurrentUsername(),
  });
}

export function normalizeConfiguredCategory(
  category: string,
  aliases: Record<string, string>,
) {
  let normalized = category;
  const visited = new Set<string>();
  while (aliases[normalized] && !visited.has(normalized)) {
    visited.add(normalized);
    normalized = aliases[normalized];
  }
  return normalized;
}
