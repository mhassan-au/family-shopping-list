export interface TagOption {
  label: string;
  color: string;
}

export const SHOPS: TagOption[] = [
  { label: "", color: "" },

  // Shops
  { 
    label: "Aldi", 
    color: "bg-purple-100 text-purple-800" 
  },

  { 
    label: "Coles", 
    color: "bg-red-100 text-red-800" 
  },

  { 
    label: "Woolworths", 
    color: "bg-green-700 text-white" 
  },

  { 
    label: "Marmara", 
    color: "bg-sky-100 text-sky-800" 
  },

  { 
    label: "Veggie Patch", 
    color: "bg-emerald-100 text-emerald-800" 
  },

  { 
    label: "Indian Store", 
    color: "bg-orange-200 text-orange-900" 
  },

  { 
    label: "Pharmacy", 
    color: "bg-teal-100 text-teal-800" 
  },

  { 
    label: "Other...", 
    color: "bg-gray-200 text-gray-700" 
  },
];


export const CATEGORIES: TagOption[] = [
  { label: "", color: "" },

  // Categories (avoid shop colours)
  { 
    label: "Dairy", 
    color: "bg-yellow-100 text-yellow-900" 
  },

  { 
    label: "Meat", 
    color: "bg-rose-100 text-rose-800" 
  },

  { 
    label: "Fruit", 
    color: "bg-lime-100 text-lime-800" 
  },

  { 
    label: "Vegetables", 
    color: "bg-emerald-100 text-emerald-800" 
  },

  { 
    label: "Bakery", 
    color: "bg-amber-100 text-amber-900" 
  },

  { 
    label: "Frozen", 
    color: "bg-cyan-100 text-cyan-800" 
  },

  { 
    label: "Pantry", 
    color: "bg-indigo-100 text-indigo-800" 
  },

  { 
    label: "Household", 
    color: "bg-slate-100 text-slate-800" 
  },

  { 
    label: "Other...", 
    color: "bg-gray-200 text-gray-700" 
  },
];


export const PRIORITIES = [
  {
    label: "",
    color: "",
    order: 3
  },

  {
    label: "MustHave",
    color: "bg-red-700 text-white font-bold",
    order: 0
  },

  {
    label: "LowQty",
    color: "bg-yellow-200 text-yellow-900",
    order: 1
  }
];


export const HIDDEN_PRIORITIES = [
  {
    label: "WalkIn",
    color: "bg-gray-800 text-white",
    order: 99
  },
];