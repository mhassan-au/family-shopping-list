"use client";

import { useState } from "react";
import { FiDollarSign, FiShoppingCart } from "react-icons/fi";
import ShoppingList from "./ShoppingList";
import Expenses from "./Expenses";
import { UI_TEXT } from "@/lib/uiText";

type AppSection = "shopping" | "expenses";

export default function HouseholdApp() {
  const [section, setSection] = useState<AppSection>("shopping");

  return (
    <>
      {section === "shopping" ? <ShoppingList /> : <Expenses />}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-200 bg-white/95 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_18px_rgba(15,23,42,0.08)] backdrop-blur dark:border-blue-900 dark:bg-slate-950/95"
        aria-label="Main navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <NavButton
            active={section === "shopping"}
            activeTheme="blue"
            label={UI_TEXT.navigation.shopping}
            icon={<FiShoppingCart size={20} />}
            onClick={() => setSection("shopping")}
          />
          <NavButton
            active={section === "expenses"}
            activeTheme="rose"
            label={UI_TEXT.navigation.expenses}
            icon={<FiDollarSign size={20} />}
            onClick={() => setSection("expenses")}
          />
        </div>
      </nav>
    </>
  );
}

function NavButton({
  active,
  activeTheme,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  activeTheme: "blue" | "rose";
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
        active
          ? activeTheme === "rose"
            ? "bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-50"
            : "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-50"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      {label}
    </button>
  );
}
