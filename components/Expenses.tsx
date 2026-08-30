"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiBarChart2, FiCheck, FiChevronsRight, FiDollarSign, FiPlus, FiSliders, FiX } from "react-icons/fi";
import {
  EXPENSE_AUTO_TRANSFER_STYLE,
  EXPENSE_UNUSUAL_STYLE,
  FAMILY_MEMBER_COLORS,
  getExpenseCategoryColor,
  isExpenseAmountUnusual,
  normalizeExpenseCategory,
} from "@/lib/config";
import { createExpense, createExpenseAmendment } from "@/lib/expenses";
import { Expense, PendingBankTransaction } from "@/lib/types";
import { UI_TEXT } from "@/lib/uiText";
import {
  INPUT_LIMITS,
  isValidExpenseAmount,
  isValidExpenseDescription,
  isValidAmendmentAmount,
  isValidAmendmentInput,
  isValidPriceInput,
} from "@/lib/validation";
import { useExpenses } from "@/hooks/useExpenses";
import { getDropdownOptionClass } from "@/lib/dropdownStyle";
import { useSmartMoneyInput } from "@/hooks/useSmartMoneyInput";
import { normalizeConfiguredCategory, useCategoryConfig } from "@/hooks/useCategoryConfig";
import { getDeviceLogin } from "@/lib/device";
import { useBankSync } from "@/hooks/useBankSync";
import { acceptPendingBankTransaction, rejectPendingBankTransaction } from "@/lib/bankSync";
import AmountChoiceDialog from "@/components/AmountChoiceDialog";

type Toast = { id: number; message: string; type: "success" | "error" };
type PendingExpense = { description: string; category: string; amount: number };

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function expenseDate(expense: Expense) {
  return expense.createdAt?.toDate() ?? new Date(expense.createdAtMs);
}

function groupExpenseTransactions(expenses: Expense[]) {
  const originalIds = new Set(
    expenses
      .filter((expense) => expense.transactionType !== "amendment")
      .map((expense) => expense.id),
  );
  const amendments = new Map<string, Expense[]>();

  expenses.forEach((expense) => {
    if (expense.transactionType !== "amendment" || !expense.amendsExpenseId) return;
    const linkedAmendments = amendments.get(expense.amendsExpenseId) ?? [];
    linkedAmendments.push(expense);
    amendments.set(expense.amendsExpenseId, linkedAmendments);
  });

  return [
    ...expenses
      .filter((expense) => expense.transactionType !== "amendment")
      .map((expense) => [expense, ...(amendments.get(expense.id) ?? [])]),
    ...expenses
      .filter(
        (expense) =>
          expense.transactionType === "amendment" &&
          (!expense.amendsExpenseId || !originalIds.has(expense.amendsExpenseId)),
      )
      .map((expense) => [expense]),
  ];
}

function isUnusualExpense(expense: Expense) {
  if (expense.transactionType === "amendment") return false;
  return expense.unusual ?? isExpenseAmountUnusual(expense.category, expense.amount);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const startMonth = new Intl.DateTimeFormat("en-AU", { month: "short" }).format(weekStart);
  const endMonth = new Intl.DateTimeFormat("en-AU", { month: "short" }).format(weekEnd);

  return startMonth === endMonth
    ? `${startDay}–${endDay} ${endMonth}`
    : `${startDay} ${startMonth}–${endDay} ${endMonth}`;
}

export default function Expenses({ onOpenReport }: { onOpenReport: () => void }) {
  const { expenses, loading, error } = useExpenses();
  const isOwner = getDeviceLogin()?.role === "owner";
  const bankSync = useBankSync(isOwner);
  const { expenses: expenseCategories, expenseAliases } = useCategoryConfig();
  const normalizeCategory = useCallback(
    (value: string) => normalizeConfiguredCategory(normalizeExpenseCategory(value), expenseAliases),
    [expenseAliases],
  );
  const expenseCategoryFilters = useMemo(
    () => expenseCategories.map((categoryName) => ({ label: categoryName, value: categoryName })),
    [expenseCategories],
  );
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const {
    value: amount,
    setValue: setAmount,
    formatOnBlur: formatAmountOnBlur,
    shiftDecimal: shiftAmountDecimal,
    canShift: canShiftAmount,
    parsedValue: parsedAmount,
    ambiguousValues: ambiguousAmountValues,
  } = useSmartMoneyInput();
  const [adding, setAdding] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortMode, setSortMode] = useState<
    "date-desc" | "date-asc" | "price-desc" | "price-asc"
  >("date-desc");
  const [showSort, setShowSort] = useState(false);
  const [visibleWeekCount, setVisibleWeekCount] = useState(1);
  const [pendingUnusualExpense, setPendingUnusualExpense] = useState<PendingExpense | null>(null);
  const [pendingDuplicateExpense, setPendingDuplicateExpense] = useState<PendingExpense | null>(null);
  const [amending, setAmending] = useState<Expense | null>(null);
  const [amendmentDescription, setAmendmentDescription] = useState("");
  const {
    value: amendmentAmount,
    setValue: setAmendmentAmount,
    formatOnBlur: formatAmendmentOnBlur,
    shiftDecimal: shiftAmendmentDecimal,
    canShift: canShiftAmendment,
    parsedValue: parsedAmendmentAmount,
  } = useSmartMoneyInput();
  const [toast, setToast] = useState<Toast | null>(null);
  const [reviewingBankTransaction, setReviewingBankTransaction] = useState<PendingBankTransaction | null>(null);
  const [bankDescription, setBankDescription] = useState("");
  const [bankCategory, setBankCategory] = useState("");
  const [bankDecisionId, setBankDecisionId] = useState<string | null>(null);
  const [showAmountChoice, setShowAmountChoice] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const filteredExpenses = useMemo(
    () =>
      categoryFilter
        ? expenses.filter(
            (expense) => normalizeCategory(expense.category) === categoryFilter,
          )
        : expenses,
    [categoryFilter, expenses, normalizeCategory],
  );

  const weeklyExpenses = useMemo(() => {
    const groups = new Map<string, { start: Date; expenses: Expense[] }>();
    const originalsById = new Map(
      filteredExpenses
        .filter((expense) => expense.transactionType !== "amendment")
        .map((expense) => [expense.id, expense]),
    );

    filteredExpenses.forEach((expense) => {
      const originalExpense = expense.amendsExpenseId
        ? originalsById.get(expense.amendsExpenseId)
        : undefined;
      const weekStart = startOfWeek(expenseDate(originalExpense ?? expense));
      const key = weekStart.toISOString().slice(0, 10);
      const group = groups.get(key) ?? { start: weekStart, expenses: [] };
      group.expenses.push(expense);
      groups.set(key, group);
    });

    return [...groups.values()]
      .sort((left, right) => right.start.getTime() - left.start.getTime())
      .map((group) => ({
        ...group,
        expenses: [...group.expenses].sort((left, right) => {
          if (sortMode === "price-desc") return right.amount - left.amount;
          if (sortMode === "price-asc") return left.amount - right.amount;
          if (sortMode === "date-asc") return left.createdAtMs - right.createdAtMs;
          return right.createdAtMs - left.createdAtMs;
        }),
      }));
  }, [filteredExpenses, sortMode]);

  const currentWeekStats = useMemo(() => {
    const currentWeekStart = startOfWeek(new Date()).getTime();
    const categoryTotals = new Map<string, number>();

    expenses.forEach((expense) => {
      if (startOfWeek(expenseDate(expense)).getTime() !== currentWeekStart) return;
      const normalizedCategory = normalizeCategory(expense.category);
      categoryTotals.set(
        normalizedCategory,
        (categoryTotals.get(normalizedCategory) ?? 0) + expense.amount,
      );
    });

    const total = [...categoryTotals.values()].reduce((sum, value) => sum + value, 0);
    if (total <= 0) return [];

    return [...categoryTotals.entries()]
      .filter(([, value]) => value > 0)
      .sort((left, right) => right[1] - left[1])
      .map(([name, value]) => ({
        name,
        percentage: Math.round((value / total) * 100),
      }));
  }, [expenses, normalizeCategory]);

  const visibleCurrentWeekStats = categoryFilter
    ? currentWeekStats.filter((stat) => stat.name === categoryFilter)
    : currentWeekStats;
  const visibleWeeks = weeklyExpenses.slice(0, visibleWeekCount);

  function showToast(message: string, type: Toast["type"]) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  function openBankReview(transaction: PendingBankTransaction) {
    setReviewingBankTransaction(transaction);
    setBankDescription(transaction.description);
    setBankCategory(expenseCategories[0] ?? "");
  }

  async function handleBankReject(transaction: PendingBankTransaction) {
    setBankDecisionId(transaction.id);
    try {
      await rejectPendingBankTransaction(transaction);
      showToast(UI_TEXT.expenses.bankRejected, "success");
    } catch (decisionError) {
      console.error("Rejecting UP transaction failed", decisionError);
      showToast(UI_TEXT.expenses.bankDecisionFailed, "error");
    } finally {
      setBankDecisionId(null);
    }
  }

  async function handleBankAccept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewingBankTransaction) return;
    if (!isValidExpenseDescription(bankDescription) || !expenseCategories.includes(bankCategory)) {
      showToast(UI_TEXT.expenses.invalidDescription, "error");
      return;
    }
    setBankDecisionId(reviewingBankTransaction.id);
    try {
      await acceptPendingBankTransaction(reviewingBankTransaction, bankDescription, bankCategory);
      setReviewingBankTransaction(null);
      showToast(UI_TEXT.expenses.bankAccepted, "success");
    } catch (decisionError) {
      console.error("Accepting UP transaction failed", decisionError);
      showToast(UI_TEXT.expenses.bankDecisionFailed, "error");
    } finally {
      setBankDecisionId(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidExpenseDescription(description)) {
      showToast(UI_TEXT.expenses.invalidDescription, "error");
      return;
    }

    if (ambiguousAmountValues) {
      setShowAmountChoice(true);
      return;
    }

    prepareExpense(parsedAmount);
  }

  function prepareExpense(numericAmount: number) {

    if (!isValidExpenseAmount(numericAmount)) {
      showToast(UI_TEXT.expenses.invalidAmount, "error");
      return;
    }

    const candidate = {
      description: description.trim(),
      category,
      amount: numericAmount,
    };

    const today = new Date();
    const likelyDuplicate = expenses.some((expense) => {
      const addedAt = expenseDate(expense);
      return expense.transactionType !== "amendment"
        && expense.description.trim().toLocaleLowerCase() === candidate.description.toLocaleLowerCase()
        && normalizeCategory(expense.category) === normalizeCategory(candidate.category)
        && Math.round(expense.amount * 100) === Math.round(candidate.amount * 100)
        && addedAt.getFullYear() === today.getFullYear()
        && addedAt.getMonth() === today.getMonth()
        && addedAt.getDate() === today.getDate();
    });

    if (likelyDuplicate) {
      setPendingDuplicateExpense(candidate);
      return;
    }

    continueExpenseSave(candidate);
  }

  function continueExpenseSave(candidate: PendingExpense) {
    setPendingDuplicateExpense(null);
    if (isExpenseAmountUnusual(candidate.category, candidate.amount)) {
      setPendingUnusualExpense(candidate);
      return;
    }

    saveExpense(candidate.description, candidate.category, candidate.amount);
  }

  function saveExpense(
    expenseDescription: string,
    expenseCategory: string,
    expenseAmount: number,
  ) {
    setAdding(true);

    try {
      const pendingExpense = createExpense(
        expenseDescription,
        expenseCategory,
        expenseAmount,
      );
      setDescription("");
      setCategory("");
      setAmount("");
      setPendingUnusualExpense(null);
      setPendingDuplicateExpense(null);
      setAdding(false);
      showToast(UI_TEXT.expenses.added, "success");

      void pendingExpense.save
        .catch((saveError) => {
          console.error("Adding expense failed", saveError);
          showToast(UI_TEXT.expenses.addFailed, "error");
        });
    } catch (inputError) {
      console.error("Invalid expense", inputError);
      setAdding(false);
      showToast(UI_TEXT.expenses.addFailed, "error");
    }
  }

  function closeAmendment() {
    setAmending(null);
    setAmendmentDescription("");
    setAmendmentAmount("");
  }

  function handleAmendment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!amending || !isValidExpenseDescription(amendmentDescription)) {
      showToast(UI_TEXT.expenses.invalidDescription, "error");
      return;
    }

    const numericAmount = parsedAmendmentAmount;
    if (!isValidAmendmentAmount(numericAmount)) {
      showToast(UI_TEXT.expenses.invalidAmendment, "error");
      return;
    }

    const savePromise = createExpenseAmendment(
      amending.id,
      amendmentDescription,
      amending.category,
      numericAmount,
    );
    closeAmendment();
    showToast(UI_TEXT.expenses.amendmentAdded, "success");

    void savePromise.catch((saveError) => {
      console.error("Adding expense amendment failed", saveError);
      showToast(UI_TEXT.expenses.addFailed, "error");
    });
  }

  const currentWeekKey = startOfWeek(new Date()).toISOString().slice(0, 10);
  const dateFormatter = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  });

  return (
    <main className="mx-auto w-full max-w-md p-4 pb-24 sm:p-5 sm:pb-24">
      <header className="mb-4 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-100 via-pink-50 to-orange-50 px-4 py-3 shadow-sm dark:border-rose-900 dark:from-rose-950 dark:via-pink-950 dark:to-slate-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiDollarSign className="text-rose-700 dark:text-rose-300" size={24} />
            <h1 className="text-xl font-bold">{UI_TEXT.expenses.title}</h1>
          </div>
          <button
            type="button"
            onClick={onOpenReport}
            className="flex size-10 items-center justify-center rounded-xl border border-rose-200 bg-white/70 text-rose-700 shadow-sm transition hover:bg-white active:scale-95 dark:border-rose-800 dark:bg-slate-900/60 dark:text-rose-200"
            aria-label={UI_TEXT.expenseReport.open}
            title={UI_TEXT.expenseReport.open}
          >
            <FiBarChart2 size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {UI_TEXT.expenses.subtitle}
        </p>
      </header>

      <form
          onSubmit={handleSubmit}
          className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
        <div className="grid grid-cols-2 gap-3">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="input w-full px-3 py-2"
            aria-label={UI_TEXT.expenses.category}
            required
          >
            <option value="" disabled className={getDropdownOptionClass(0)}>
              {UI_TEXT.expenses.category}
            </option>
            {expenseCategories.map((expenseCategory, index) => (
              <option
                key={expenseCategory}
                className={getDropdownOptionClass(index + 1)}
              >
                {expenseCategory}
              </option>
            ))}
          </select>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-semibold text-slate-500">$</span>
            <input
              value={amount}
              onChange={(event) => {
                if (isValidPriceInput(event.target.value)) setAmount(event.target.value);
              }}
              onBlur={formatAmountOnBlur}
              inputMode="decimal"
              placeholder="0.00"
              className="input w-full py-2 pl-7 pr-10"
              aria-label={UI_TEXT.expenses.amount}
            />
            <button
              type="button"
              onClick={shiftAmountDecimal}
              disabled={!canShiftAmount}
              className="absolute inset-y-1 right-1 flex w-8 items-center justify-center rounded-md text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-rose-300 dark:hover:bg-rose-900"
              aria-label={UI_TEXT.expenses.shiftDecimal}
              title={UI_TEXT.expenses.shiftDecimal}
            >
              <FiChevronsRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={INPUT_LIMITS.expenseDescription}
            placeholder={UI_TEXT.expenses.descriptionPlaceholder}
            className="input min-w-0 flex-1 px-3 py-2.5"
            autoComplete="off"
            aria-label={UI_TEXT.expenses.description}
          />
          <button
            type="submit"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-rose-700 bg-rose-600 text-white shadow-sm transition hover:bg-rose-700 active:scale-95 disabled:opacity-50 dark:border-rose-500 dark:bg-rose-700 dark:hover:bg-rose-600"
            disabled={adding}
            aria-label={UI_TEXT.expenses.add}
            title={UI_TEXT.expenses.add}
          >
            <FiPlus size={24} aria-hidden="true" />
          </button>
        </div>
      </form>

      {isOwner && bankSync.pending.length > 0 && (
        <section className="mb-4 overflow-hidden rounded-xl border border-fuchsia-200 bg-white shadow-sm dark:border-fuchsia-900 dark:bg-slate-900">
          <div className="flex items-center justify-between bg-gradient-to-r from-fuchsia-50 to-rose-50 px-4 py-2.5 dark:from-fuchsia-950 dark:to-rose-950">
            <h2 className="font-bold text-fuchsia-950 dark:text-fuchsia-100">{UI_TEXT.expenses.bankPendingTitle}</h2>
            <span className="rounded-full bg-fuchsia-100 px-2 py-1 text-xs font-bold text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-100">{UI_TEXT.expenses.bankPendingCount(bankSync.pending.length)}</span>
          </div>
          <ul className="divide-y divide-fuchsia-100 dark:divide-fuchsia-950">
            {bankSync.pending.map((transaction) => (
              <li key={transaction.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{transaction.description}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{transaction.accountLabel ?? UI_TEXT.expenses.bankSource}</span>
                      {transaction.status === "HELD" && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-100">{UI_TEXT.expenses.bankPendingStatus}</span>}
                      <span>· {UI_TEXT.expenses.bankImportedAt(new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(transaction.occurredAtMs)))}</span>
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-fuchsia-800 dark:text-fuchsia-200">{formatCurrency(transaction.amount)}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => void handleBankReject(transaction)} disabled={bankDecisionId === transaction.id} className="flex items-center justify-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950"><FiX size={16} aria-hidden="true" />{UI_TEXT.expenses.bankReject}</button>
                  <button type="button" onClick={() => openBankReview(transaction)} disabled={bankDecisionId === transaction.id} className="flex items-center justify-center gap-1 rounded-lg bg-fuchsia-600 px-3 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50"><FiCheck size={16} aria-hidden="true" />{UI_TEXT.expenses.bankAccept}</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading && <p>{UI_TEXT.loading}</p>}
      {error && <p className="my-2 text-sm text-red-600" role="alert">{error}</p>}
      {!loading && expenses.length > 0 && (
        <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_2.5rem] gap-1.5">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter("");
              setVisibleWeekCount(1);
              setShowSort(false);
            }}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold leading-tight transition ${
              categoryFilter === ""
                ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
            }`}
          >
            {UI_TEXT.expenses.all}
          </button>
          <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1">
            {expenseCategoryFilters.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  setCategoryFilter(option.value);
                  setVisibleWeekCount(1);
                  setShowSort(false);
                }}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold leading-tight transition ${
                  categoryFilter === option.value
                    ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                    : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSort((visible) => !visible)}
              className={`flex size-10 items-center justify-center rounded-lg border transition ${
                sortMode.startsWith("price")
                  ? "border-rose-600 bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100"
                  : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              }`}
              aria-label={UI_TEXT.expenses.sort}
              title={UI_TEXT.expenses.sort}
              aria-expanded={showSort}
            >
              <FiSliders size={18} aria-hidden="true" />
            </button>

            {showSort && (
              <div className="absolute right-0 top-full z-20 mt-2 w-40 rounded-xl border border-rose-200 bg-white p-2 shadow-lg dark:border-rose-900 dark:bg-slate-900">
                {([
                  { label: UI_TEXT.expenses.sortDateNewest, value: "date-desc" as const },
                  { label: UI_TEXT.expenses.sortDateOldest, value: "date-asc" as const },
                  { label: UI_TEXT.expenses.sortPriceHigh, value: "price-desc" as const },
                  { label: UI_TEXT.expenses.sortPriceLow, value: "price-asc" as const },
                ]).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSortMode(option.value);
                      setShowSort(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-rose-50 dark:hover:bg-rose-950 ${
                      sortMode === option.value
                        ? "bg-rose-100 font-semibold dark:bg-rose-900"
                        : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && weeklyExpenses.length === 0 && (
        <p className="py-8 text-center text-slate-500">
          {categoryFilter ? UI_TEXT.expenses.noMatching : UI_TEXT.expenses.empty}
        </p>
      )}

      {visibleCurrentWeekStats.length > 0 && (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-2.5 text-sm shadow-sm dark:border-rose-900 dark:from-rose-950 dark:to-pink-950">
          <span className="font-bold text-rose-800 dark:text-rose-200">
            {UI_TEXT.expenses.thisWeekBreakdown}:
          </span>
          {visibleCurrentWeekStats.map((stat, index) => (
            <span key={stat.name} className="text-slate-700 dark:text-slate-200">
              {index > 0 && <span className="mr-2 text-rose-300">•</span>}
              <strong className="text-rose-700 dark:text-rose-300">{stat.percentage}%</strong>{" "}
              {stat.name}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {visibleWeeks.map((week) => {
          const weekKey = week.start.toISOString().slice(0, 10);
          const total = week.expenses.reduce((sum, expense) => sum + expense.amount, 0);
          const transactionGroups = groupExpenseTransactions(week.expenses);

          return (
            <section
              key={weekKey}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between bg-rose-50 px-4 py-2 dark:bg-rose-950">
                <h2 className="font-bold text-rose-950 dark:text-rose-100">
                  {weekKey === currentWeekKey
                    ? UI_TEXT.expenses.currentWeek
                    : UI_TEXT.expenses.weekRange(formatWeekRange(week.start))}
                </h2>
                <span className="font-bold text-rose-800 dark:text-rose-200">
                  {formatCurrency(total)}
                </span>
              </div>
              <ul className="space-y-1.5 bg-slate-50/70 p-1.5 dark:bg-slate-950/30">
                {transactionGroups.map((transactionGroup) => (
                  <li
                    key={transactionGroup[0].id}
                    className={`overflow-hidden rounded-lg ${
                      transactionGroup.length > 1
                        ? "border border-rose-200 bg-rose-50/70 shadow-sm dark:border-rose-900 dark:bg-rose-950/35"
                        : "bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="divide-y divide-rose-100 dark:divide-rose-900/60">
                    {transactionGroup.map((expense) => (
                    <div
                      key={expense.id}
                      className={`flex items-center justify-between gap-3 px-3 py-3 ${
                        isUnusualExpense(expense) ? EXPENSE_UNUSUAL_STYLE.row : ""
                      }`}
                    >
                    <div className="flex min-w-0 items-start gap-2">
                      {expense.createdBy && FAMILY_MEMBER_COLORS[expense.createdBy.toLowerCase()] && (
                        <span
                          className="mt-1.5 size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: FAMILY_MEMBER_COLORS[expense.createdBy.toLowerCase()] }}
                          title={UI_TEXT.expenses.addedBy(expense.createdBy)}
                          aria-label={UI_TEXT.expenses.addedBy(expense.createdBy)}
                        />
                      )}
                      <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{expense.description}</p>
                        {expense.transactionType === "amendment" && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                            {UI_TEXT.expenses.amendmentLabel}
                          </span>
                        )}
                        {expense.source === "shopping-transfer" && (
                          <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${EXPENSE_AUTO_TRANSFER_STYLE}`}>
                            {UI_TEXT.expenses.autoAdded}
                          </span>
                        )}
                        {expense.source === "up-bank" && (
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100">
                            {expense.sourceAccount
                              ? UI_TEXT.expenses.bankSourceAccount(expense.sourceAccount)
                              : UI_TEXT.expenses.bankSource}
                          </span>
                        )}
                        {isUnusualExpense(expense) && (
                          <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${EXPENSE_UNUSUAL_STYLE.badge}`}>
                            {UI_TEXT.expenses.unusual}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold"
                          style={{
                            borderColor: getExpenseCategoryColor(normalizeCategory(expense.category)),
                            backgroundColor: `${getExpenseCategoryColor(normalizeCategory(expense.category))}1f`,
                          }}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: getExpenseCategoryColor(normalizeCategory(expense.category)) }}
                          />
                          {normalizeCategory(expense.category)}
                        </span>
                        <span>· {dateFormatter.format(expenseDate(expense))}</span>
                      </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`font-semibold ${expense.amount < 0 ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                        {formatCurrency(expense.amount)}
                      </span>
                      {expense.transactionType !== "amendment" && (
                        <button
                          type="button"
                          onClick={() => setAmending(expense)}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950"
                        >
                          {UI_TEXT.expenses.amend}
                        </button>
                      )}
                    </div>
                    </div>
                    ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {visibleWeekCount < weeklyExpenses.length && (
        <button
          type="button"
          onClick={() => setVisibleWeekCount((count) => count + 1)}
          className="mt-4 w-full rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 font-semibold text-rose-800 transition hover:bg-rose-100 active:scale-[0.99] dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200 dark:hover:bg-rose-900"
        >
          {UI_TEXT.expenses.more}
        </button>
      )}

      {showAmountChoice && ambiguousAmountValues && (
        <AmountChoiceDialog
          wholeAmount={ambiguousAmountValues.whole}
          centsAmount={ambiguousAmountValues.cents}
          tone="rose"
          onCancel={() => setShowAmountChoice(false)}
          onChoose={(selectedAmount) => {
            setAmount(selectedAmount.toFixed(2));
            setShowAmountChoice(false);
            prepareExpense(selectedAmount);
          }}
        />
      )}

      {reviewingBankTransaction && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget && !bankDecisionId) setReviewingBankTransaction(null); }}>
          <form onSubmit={(event) => void handleBankAccept(event)} className="w-full max-w-sm space-y-4 rounded-2xl border border-fuchsia-200 bg-white p-5 shadow-2xl dark:border-fuchsia-900 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="bank-review-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="bank-review-title" className="text-lg font-bold">{UI_TEXT.expenses.bankReviewTitle}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{UI_TEXT.expenses.bankReviewHelp}</p>
              </div>
              <button type="button" onClick={() => setReviewingBankTransaction(null)} disabled={Boolean(bankDecisionId)} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800" aria-label={UI_TEXT.common.close}><FiX size={18} aria-hidden="true" /></button>
            </div>
            <div className="rounded-xl bg-fuchsia-50 px-3 py-2 dark:bg-fuchsia-950">
              <p className="text-xl font-bold text-fuchsia-900 dark:text-fuchsia-100">{formatCurrency(reviewingBankTransaction.amount)}</p>
              <p className="text-xs text-fuchsia-700 dark:text-fuchsia-300">{reviewingBankTransaction.accountLabel ?? UI_TEXT.expenses.bankSource} · {UI_TEXT.expenses.bankImportedAt(new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(reviewingBankTransaction.occurredAtMs)))}</p>
            </div>
            <label className="block text-sm font-semibold">{UI_TEXT.expenses.description}
              <input value={bankDescription} onChange={(event) => setBankDescription(event.target.value)} maxLength={INPUT_LIMITS.expenseDescription} className="input mt-1 w-full px-3 py-2" autoFocus disabled={Boolean(bankDecisionId)} />
            </label>
            <label className="block text-sm font-semibold">{UI_TEXT.expenses.category}
              <select value={bankCategory} onChange={(event) => setBankCategory(event.target.value)} className="input mt-1 w-full px-3 py-2" disabled={Boolean(bankDecisionId)} required>
                {expenseCategories.map((option, index) => <option key={option} value={option} className={getDropdownOptionClass(index)}>{option}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="btn-secondary" onClick={() => setReviewingBankTransaction(null)} disabled={Boolean(bankDecisionId)}>{UI_TEXT.common.cancel}</button>
              <button type="submit" disabled={Boolean(bankDecisionId)} className="rounded-lg bg-fuchsia-600 px-4 py-2 font-semibold text-white transition hover:bg-fuchsia-700 disabled:opacity-50">{bankDecisionId ? UI_TEXT.common.pleaseWait : UI_TEXT.expenses.bankAccept}</button>
            </div>
          </form>
        </div>
      )}

      {amending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAmendment}
            className="w-full max-w-sm space-y-4 rounded-2xl border border-rose-200 bg-white p-5 shadow-xl dark:border-rose-800 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="amendment-title"
          >
            <div>
              <h2 id="amendment-title" className="text-lg font-bold">
                {UI_TEXT.expenses.amendmentTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {UI_TEXT.expenses.amendmentFor(amending.description)}
              </p>
            </div>

            <label className="block text-sm font-semibold">
              {UI_TEXT.expenses.amendmentDescription}
              <input
                value={amendmentDescription}
                onChange={(event) => setAmendmentDescription(event.target.value)}
                maxLength={INPUT_LIMITS.expenseDescription}
                placeholder={UI_TEXT.expenses.amendmentPlaceholder}
                className="input mt-1 w-full px-3 py-2"
                autoFocus
              />
            </label>

            <label className="block text-sm font-semibold">
              {UI_TEXT.expenses.adjustmentAmount}
              <div className="relative mt-1">
                <input
                  value={amendmentAmount}
                  onChange={(event) => {
                    if (isValidAmendmentInput(event.target.value)) {
                      setAmendmentAmount(event.target.value);
                    }
                  }}
                  onBlur={formatAmendmentOnBlur}
                  inputMode="decimal"
                  placeholder="-5.00"
                  className="input w-full py-2 pl-3 pr-11"
                />
                <button
                  type="button"
                  onClick={shiftAmendmentDecimal}
                  disabled={!canShiftAmendment}
                  className="absolute inset-y-1 right-1 flex w-8 items-center justify-center rounded-md text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-rose-300 dark:hover:bg-rose-900"
                  aria-label={UI_TEXT.expenses.shiftDecimal}
                  title={UI_TEXT.expenses.shiftDecimal}
                >
                  <FiChevronsRight size={17} aria-hidden="true" />
                </button>
              </div>
              <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                {UI_TEXT.expenses.adjustmentHelp}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="btn-secondary" onClick={closeAmendment}>
                {UI_TEXT.common.close}
              </button>
              <button type="submit" className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-700 active:scale-95">
                {UI_TEXT.expenses.addAmendment}
              </button>
            </div>
          </form>
        </div>
      )}

      {pendingUnusualExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl border border-amber-300 bg-white p-5 shadow-xl dark:border-amber-800 dark:bg-slate-900"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="unusual-expense-title"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wide ${EXPENSE_UNUSUAL_STYLE.badge}`}>
                {UI_TEXT.expenses.unusual}
              </span>
              <h2 id="unusual-expense-title" className="text-lg font-bold">
                {UI_TEXT.expenses.unusualTitle}
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {UI_TEXT.expenses.unusualConfirm}
            </p>
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-100">
              {pendingUnusualExpense.category} · {formatCurrency(pendingUnusualExpense.amount)}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPendingUnusualExpense(null)}
              >
                {UI_TEXT.common.cancel}
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white transition hover:bg-amber-700 active:scale-95"
                onClick={() =>
                  saveExpense(
                    pendingUnusualExpense.description,
                    pendingUnusualExpense.category,
                    pendingUnusualExpense.amount,
                  )
                }
              >
                {UI_TEXT.expenses.proceed}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDuplicateExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl border border-rose-300 bg-white p-5 shadow-xl dark:border-rose-800 dark:bg-slate-900"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="duplicate-expense-title"
          >
            <h2 id="duplicate-expense-title" className="text-lg font-bold">
              {UI_TEXT.expenses.duplicateTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {UI_TEXT.expenses.duplicateConfirm}
            </p>
            <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 dark:bg-rose-950">
              <p className="font-semibold">{pendingDuplicateExpense.description}</p>
              <p className="text-sm text-rose-800 dark:text-rose-200">
                {normalizeCategory(pendingDuplicateExpense.category)} · {formatCurrency(pendingDuplicateExpense.amount)}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPendingDuplicateExpense(null)}
              >
                {UI_TEXT.common.cancel}
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-700 active:scale-95"
                onClick={() => continueExpenseSave(pendingDuplicateExpense)}
              >
                {UI_TEXT.expenses.saveAnyway}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          key={toast.id}
          className={`toast-fade fixed inset-x-0 top-0 z-50 w-full border-b px-4 py-3 text-center text-sm font-medium shadow-lg backdrop-blur-md ${
            toast.type === "success"
              ? "border-green-300 bg-green-100/85 text-green-900"
              : "border-red-300 bg-red-100/85 text-red-900"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
