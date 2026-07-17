export interface TagOption {
  label: string;
  color: string;
}

export const SHOPS: TagOption[] = [
  { label: "", color: "" },
  { label: "Aldi", color: "bg-pink-100 text-pink-800" },
  { label: "Coles", color: "bg-red-100 text-red-800" },
  { label: "Woolworths", color: "bg-blue-100 text-blue-800" },
  { label: "Marmara", color: "bg-amber-100 text-amber-800" },
  { label: "PharmEasy", color: "bg-lime-100 text-lime-800" },
  { label: "Veggie Patch", color: "bg-emerald-100 text-emerald-800" },
  { label: "Indian Store", color: "bg-orange-100 text-orange-800" },
  { label: "Other...", color: "bg-gray-200 text-gray-700" },
];

export const CATEGORIES: TagOption[] = [
  { label: "", color: "" },
  { label: "Dairy", color: "bg-yellow-100 text-yellow-800" },
  { label: "Meat", color: "bg-red-100 text-red-800" },
  { label: "Fruit", color: "bg-orange-100 text-orange-800" },
  { label: "Vegetables", color: "bg-green-100 text-green-800" },
  { label: "Bakery", color: "bg-amber-100 text-amber-800" },
  { label: "Frozen", color: "bg-cyan-100 text-cyan-800" },
  { label: "Pantry", color: "bg-violet-100 text-violet-800" },
  { label: "Household", color: "bg-slate-100 text-slate-800" },
  { label: "Other...", color: "bg-gray-200 text-gray-700" },
];