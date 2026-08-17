"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { expensesQuery } from "@/lib/expenses";
import { Expense } from "@/lib/types";
import { UI_TEXT } from "@/lib/uiText";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      expensesQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        setExpenses(
          snapshot.docs.map((expense) => ({
            id: expense.id,
            ...(expense.data() as Omit<Expense, "id">),
          })),
        );
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        console.error("Expense listener failed", snapshotError);
        setError(UI_TEXT.expenses.loadFailed);
        setLoading(false);
      },
    );
  }, []);

  return { expenses, loading, error };
}
