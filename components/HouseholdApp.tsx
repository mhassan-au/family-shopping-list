"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { FiClipboard, FiCreditCard, FiDollarSign, FiGift, FiLogOut, FiMenu, FiSettings, FiShoppingCart, FiTrendingUp, FiX } from "react-icons/fi";
import ShoppingList from "./ShoppingList";
import Expenses from "./Expenses";
import ExpenseReport from "./ExpenseReport";
import AdminDashboard from "./AdminDashboard";
import Forecast from "./Forecast";
import PersonalLoans from "./PersonalLoans";
import ImprovementLog from "./ImprovementLog";
import WishList from "./WishList";
import { UI_TEXT } from "@/lib/uiText";
import { clearDeviceLogin, getDeviceLogin } from "@/lib/device";
import { CategoryConfigProvider } from "@/hooks/useCategoryConfig";

type AppSection = "shopping" | "expenses" | "expense-report" | "forecast" | "admin" | "loans" | "improvement-log" | "wishes";

function subscribeToLogin(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getOwnerSnapshot() {
  return getDeviceLogin()?.role === "owner";
}

export default function HouseholdApp() {
  const [section, setSection] = useState<AppSection>("shopping");
  const [adminReturnSection, setAdminReturnSection] = useState<Exclude<AppSection, "admin">>("shopping");
  const [loanReturnSection, setLoanReturnSection] = useState<Exclude<AppSection, "admin" | "loans">>("shopping");
  const [improvementReturnSection, setImprovementReturnSection] = useState<Exclude<AppSection, "improvement-log">>("shopping");
  const [wishReturnSection, setWishReturnSection] = useState<Exclude<AppSection, "wishes">>("shopping");
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const isOwner = useSyncExternalStore(subscribeToLogin, getOwnerSnapshot, () => false);
  const device = getDeviceLogin();

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    setLogoutOpen(true);
  }

  function confirmLogout() {
    clearDeviceLogin();
    window.location.reload();
  }

  function openAdmin() {
    if (section !== "admin") setAdminReturnSection(section);
    setSection("admin");
  }

  function openLoans() {
    if (section !== "admin" && section !== "loans") setLoanReturnSection(section);
    setSection("loans");
  }

  function openImprovementLog() {
    if (section !== "improvement-log") setImprovementReturnSection(section);
    setSection("improvement-log");
  }

  function openWishes() {
    if (section !== "wishes") setWishReturnSection(section);
    setSection("wishes");
  }

  const bannerTheme = section === "expenses" || section === "expense-report"
    ? "border-rose-200 from-rose-100 to-orange-50 dark:border-rose-900 dark:from-rose-950 dark:to-slate-900"
    : section === "forecast"
      ? "border-emerald-200 from-emerald-100 to-cyan-50 dark:border-emerald-900 dark:from-emerald-950 dark:to-slate-900"
      : section === "admin"
        ? "border-violet-200 from-violet-100 to-fuchsia-50 dark:border-violet-900 dark:from-violet-950 dark:to-slate-900"
        : "border-blue-200 from-blue-100 to-cyan-50 dark:border-blue-800 dark:from-blue-950 dark:to-slate-900";

  const menuHoverTheme = section === "expenses" || section === "expense-report"
    ? "hover:bg-rose-100 dark:hover:bg-rose-900"
    : section === "forecast"
      ? "hover:bg-emerald-100 dark:hover:bg-emerald-900"
      : section === "admin"
        ? "hover:bg-violet-100 dark:hover:bg-violet-900"
        : "hover:bg-blue-100 dark:hover:bg-blue-900";

  const bannerTitle = section === "expenses" || section === "expense-report"
    ? <><FiDollarSign aria-hidden="true" />{UI_TEXT.expenses.title}</>
    : section === "forecast"
      ? <><FiTrendingUp aria-hidden="true" />{UI_TEXT.navigation.cashFlow}</>
      : <>🛒 {UI_TEXT.appName}</>;

  return (
    <CategoryConfigProvider>
      {section !== "admin" && section !== "expense-report" && section !== "loans" && section !== "improvement-log" && section !== "wishes" && <div className="mx-auto w-full max-w-md px-4 pt-4 sm:px-5 sm:pt-5">
        <header className={`flex w-full items-center justify-between rounded-xl border bg-gradient-to-r px-3 py-2 shadow-sm ${bannerTheme}`}>
          <h1 className="flex items-center gap-1.5 text-xl font-bold">{bannerTitle}</h1>
          <div className="flex items-center gap-1">
            <span className="max-w-28 truncate text-sm font-medium text-gray-700 dark:text-gray-200">{device?.username}</span>
            <button type="button" onClick={() => setMenuOpen(true)} className={`rounded-lg p-2 text-gray-700 transition dark:text-gray-200 ${menuHoverTheme}`} aria-label={UI_TEXT.navigation.menu} title={UI_TEXT.navigation.menu}>
              <FiMenu size={20} aria-hidden="true" />
            </button>
          </div>
        </header>
      </div>}

      <div>
        {section === "shopping" && <ShoppingList />}
        {section === "expenses" && (
          <Expenses onOpenReport={() => setSection("expense-report")} />
        )}
        {section === "expense-report" && (
          <ExpenseReport onClose={() => setSection("expenses")} />
        )}
        {section === "forecast" && isOwner && <Forecast />}
        {section === "loans" && isOwner && <PersonalLoans onBack={() => setSection(loanReturnSection)} />}
        {section === "improvement-log" && isOwner && <ImprovementLog onBack={() => setSection(improvementReturnSection)} />}
        {section === "wishes" && isOwner && <WishList onBack={() => setSection(wishReturnSection)} />}
        {section === "admin" && isOwner && (
          <AdminDashboard
            onBack={() => setSection(adminReturnSection)}
            onOpenTransactions={() => {
              setSection("expenses");
              window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
            }}
          />
        )}
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={UI_TEXT.navigation.menu}>
            <button type="button" className="absolute inset-0 bg-slate-950/25" onClick={() => setMenuOpen(false)} aria-label={UI_TEXT.navigation.closeMenu} />
            <aside className="absolute right-4 top-4 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:right-[calc((100vw-28rem)/2+1.25rem)] sm:top-5">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-bold">{device?.username}</p><p className="text-xs text-slate-500 dark:text-slate-400">{UI_TEXT.appName}</p></div>
                <button type="button" onClick={() => setMenuOpen(false)} className="flex size-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.navigation.closeMenu}><FiX size={20} aria-hidden="true" /></button>
              </div>
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                {isOwner && <button type="button" onClick={() => { setMenuOpen(false); openLoans(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-indigo-800 hover:bg-indigo-50 dark:text-indigo-200 dark:hover:bg-indigo-950"><FiCreditCard size={19} aria-hidden="true" />{UI_TEXT.personalLoans.menu}</button>}
                {isOwner && <button type="button" onClick={() => { setMenuOpen(false); openWishes(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-fuchsia-800 hover:bg-fuchsia-50 dark:text-fuchsia-200 dark:hover:bg-fuchsia-950"><FiGift size={19} aria-hidden="true" />{UI_TEXT.wishes.menu}</button>}
                {isOwner && <button type="button" onClick={() => { setMenuOpen(false); openImprovementLog(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-amber-800 hover:bg-amber-50 dark:text-amber-200 dark:hover:bg-amber-950"><FiClipboard size={19} aria-hidden="true" />{UI_TEXT.improvementLog.adminTitle}</button>}
                {isOwner && <button type="button" onClick={() => { setMenuOpen(false); openAdmin(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-violet-800 hover:bg-violet-50 dark:text-violet-200 dark:hover:bg-violet-950"><FiSettings size={19} aria-hidden="true" />{UI_TEXT.navigation.settings}</button>}
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950"><FiLogOut size={19} aria-hidden="true" />{UI_TEXT.logout.label}</button>
              </div>
            </aside>
          </div>
        </>
      )}

      {logoutOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setLogoutOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="logout-title" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><div><h2 id="logout-title" className="text-lg font-bold">{UI_TEXT.logout.title}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{UI_TEXT.logout.confirm}</p></div><button type="button" onClick={() => setLogoutOpen(false)} className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={UI_TEXT.common.close}><FiX aria-hidden="true" /></button></div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setLogoutOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold dark:border-slate-700">{UI_TEXT.common.cancel}</button><button type="button" onClick={confirmLogout} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"><FiLogOut className="mr-2 inline" aria-hidden="true" />{UI_TEXT.logout.confirmAction}</button></div></section></div>}

      {section !== "admin" && section !== "loans" && section !== "improvement-log" && section !== "wishes" && <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-200 bg-white/95 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_18px_rgba(15,23,42,0.08)] backdrop-blur dark:border-blue-900 dark:bg-slate-950/95"
        aria-label="Main navigation"
      >
        <div className={`mx-auto grid max-w-md gap-2 ${isOwner ? "grid-cols-3" : "grid-cols-2"}`}>
          <NavButton
            active={section === "shopping"}
            activeTheme="blue"
            label={UI_TEXT.navigation.shopping}
            icon={<FiShoppingCart size={20} />}
            onClick={() => setSection("shopping")}
          />
          <NavButton
            active={section === "expenses" || section === "expense-report"}
            activeTheme="rose"
            label={UI_TEXT.navigation.expenses}
            icon={<FiDollarSign size={20} />}
            onClick={() => setSection("expenses")}
          />
          {isOwner && <NavButton
            active={section === "forecast"}
            activeTheme="emerald"
            label={UI_TEXT.navigation.forecast}
            icon={<FiTrendingUp size={20} />}
            onClick={() => setSection("forecast")}
          />}
        </div>
      </nav>}
    </CategoryConfigProvider>
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
  activeTheme: "blue" | "rose" | "emerald";
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
            : activeTheme === "emerald"
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-50"
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
