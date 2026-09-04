"use client";
import { useEffect, useState } from "react";
import { useExpenses } from "./useExpenses";
import { subscribeForecastAudit, subscribeForecastMonths, subscribeForecastOccurrenceOverrides, subscribeForecastOneOffs, subscribeForecastOverrides, subscribeForecastSchedules } from "@/lib/forecastStore";
import type { ForecastAuditRecord, ForecastMonth, ForecastOccurrenceOverride, ForecastOneOff, ForecastOverride, ForecastSchedule } from "@/lib/types";
import { usePersonalLoans } from "./usePersonalLoans";
import { useWishes } from "./useWishes";

export function useForecast() {
  const expensesState = useExpenses();
  const personalLoansState = usePersonalLoans();
  const wishesState = useWishes();
  const [schedules, setSchedules] = useState<ForecastSchedule[]>([]); const [oneOffs, setOneOffs] = useState<ForecastOneOff[]>([]); const [months, setMonths] = useState<ForecastMonth[]>([]); const [overrides, setOverrides] = useState<ForecastOverride[]>([]); const [occurrenceOverrides, setOccurrenceOverrides] = useState<ForecastOccurrenceOverride[]>([]); const [audit, setAudit] = useState<ForecastAuditRecord[]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { const fail = (listenerError: Error) => { console.error("Forecast listener failed", listenerError); setError("Could not load forecast data."); }; const unsubscribe = [subscribeForecastSchedules(setSchedules, fail), subscribeForecastOneOffs(setOneOffs, fail), subscribeForecastMonths(setMonths, fail), subscribeForecastOverrides(setOverrides, fail), subscribeForecastOccurrenceOverrides(setOccurrenceOverrides, fail), subscribeForecastAudit(setAudit, fail)]; return () => unsubscribe.forEach((stop) => stop()); }, []);
  return { schedules, oneOffs, months, overrides, occurrenceOverrides, audit: [...audit].sort((a,b) => b.createdAtMs-a.createdAtMs), expenses: expensesState.expenses, loans: personalLoansState.loans, loanRepayments: personalLoansState.repayments, wishes: wishesState.wishes, wishTransactions: wishesState.transactions, loading: expensesState.loading || personalLoansState.loading || wishesState.loading, error: error ?? expensesState.error ?? personalLoansState.error ?? wishesState.error };
}
