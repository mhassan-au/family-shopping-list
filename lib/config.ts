export interface TagOption {
  label: string;
  color: string;
}

export const FAMILY_MEMBER_COLORS: Record<string, string> = {
  shamir: "#3b82f6",
  peu: "#a855f7",
  izhaar: "#f97316",
};

export const SHOPS: TagOption[] = [
  { label: "", color: "" },

  // Shops
  {
    label: "Aldi",
    color: "bg-purple-100 text-purple-800",
  },

  {
    label: "Coles",
    color: "bg-red-100 text-red-800",
  },

  {
    label: "Woolworths",
    color: "bg-green-700 text-white",
  },

  {
    label: "Marmara",
    color: "bg-sky-100 text-sky-800",
  },

  {
    label: "Veggie Patch",
    color: "bg-emerald-100 text-emerald-800",
  },

  {
    label: "Indian Store",
    color: "bg-orange-200 text-orange-900",
  },

  {
    label: "Pharmacy",
    color: "bg-teal-100 text-teal-800",
  },

  {
    label: "Other...",
    color: "bg-gray-200 text-gray-700",
  },
];

export const CATEGORIES: TagOption[] = [
  { label: "", color: "" },

  // Categories (avoid shop colours)

  {
    label: "Izhaar",
    color: "bg-orange-500 text-white font-bold",
  },
  {
    label: "Meat",
    color: "bg-rose-100 text-rose-800",
  },
  {
    label: "Vegetables",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    label: "Fruit",
    color: "bg-lime-100 text-lime-800",
  },
  {
    label: "Dairy",
    color: "bg-yellow-100 text-yellow-900",
  },
  {
    label: "Bakery",
    color: "bg-amber-100 text-amber-900",
  },
  {
    label: "Frozen",
    color: "bg-cyan-100 text-cyan-800",
  },
  {
    label: "Pantry",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    label: "Household",
    color: "bg-slate-100 text-slate-800",
  },
  {
    label: "Other...",
    color: "bg-gray-200 text-gray-700",
  },
];

export const PRIORITIES = [
  {
    label: "",
    color: "",
    order: 3,
  },

  {
    label: "MustHave",
    color: "bg-red-700 text-white font-bold",
    order: 0,
  },

  {
    label: "LowQty",
    color: "bg-yellow-200 text-yellow-900",
    order: 1,
  },
];

export const HIDDEN_PRIORITIES = [
  {
    label: "WalkIn",
    color: "bg-gray-800 text-white",
    order: 99,
  },
];
export const EXPENSE_CATEGORIES = [
  "Restaurant",
  "Kids Meal",
  "Toy",
  "Grocery",
  "Meat/Fish",
  "Veg/Fruit",
  "Snacks",
  "Petrol",
  "Transport",
  "House Needs",
  "Home Decor",
  "Gift",
  "B'Day",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

const LEGACY_EXPENSE_CATEGORIES: Record<string, ExpenseCategory> = {
  Dinner: "Restaurant",
  "Kids Dinner": "Kids Meal",
  "Kids Toy": "Toy",
  Kmart: "House Needs",
};

export function normalizeExpenseCategory(category: string): string {
  return LEGACY_EXPENSE_CATEGORIES[category] ?? category;
}

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Restaurant: "#e11d48",
  "Kids Meal": "#f97316",
  Toy: "#eab308",
  Grocery: "#22c55e",
  "Meat/Fish": "#ef4444",
  "Veg/Fruit": "#10b981",
  Snacks: "#f59e0b",
  Petrol: "#3b82f6",
  Transport: "#06b6d4",
  "House Needs": "#8b5cf6",
  "Home Decor": "#a855f7",
  Gift: "#d946ef",
  "B'Day": "#ec4899",
  Other: "#64748b",
};

export function getExpenseCategoryColor(category: string) {
  const normalizedCategory = normalizeExpenseCategory(category) as ExpenseCategory;
  if (EXPENSE_CATEGORY_COLORS[normalizedCategory]) {
    return EXPENSE_CATEGORY_COLORS[normalizedCategory];
  }
  const palette = ["#0ea5e9", "#14b8a6", "#84cc16", "#f59e0b", "#f43f5e", "#8b5cf6"];
  const hash = [...normalizedCategory].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return palette[hash % palette.length];
}

export function getShoppingCategoryOptions(names: string[]): TagOption[] {
  return [
    { label: "", color: "" },
    ...names.map((name) =>
      CATEGORIES.find((category) => category.label === name) ?? {
        label: name,
        color: "bg-indigo-100 text-indigo-800",
      },
    ),
  ];
}

export function getShopOptions(names: string[]): TagOption[] {
  return [
    { label: "", color: "" },
    ...names.map((name) =>
      SHOPS.find((shop) => shop.label === name) ?? {
        label: name,
        color: "bg-sky-100 text-sky-800",
      },
    ),
  ];
}

export const EXPENSE_UNUSUAL_THRESHOLDS: Record<
  (typeof EXPENSE_CATEGORIES)[number],
  number | null
> = {
  Restaurant: 200,
  "Kids Meal": 100,
  Toy: 100,
  Grocery: 300,
  "Meat/Fish": null,
  "Veg/Fruit": null,
  Snacks: null,
  "House Needs": 300,
  "Home Decor": null,
  Gift: 100,
  "B'Day": null,
  Petrol: null,
  Transport: null,
  Other: null,
};

export const EXPENSE_UNUSUAL_STYLE = {
  row: "bg-amber-50 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/55 dark:ring-amber-800",
  badge: "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100",
} as const;

export const EXPENSE_AUTO_TRANSFER_STYLE =
  "bg-cyan-100 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100";

export function isExpenseAmountUnusual(category: string, amount: number) {
  const normalizedCategory = normalizeExpenseCategory(category);
  const threshold = EXPENSE_UNUSUAL_THRESHOLDS[
    normalizedCategory as keyof typeof EXPENSE_UNUSUAL_THRESHOLDS
  ];
  return typeof threshold === "number" && amount > threshold;
}
