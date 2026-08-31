"use client";

import { useEffect, useState } from "react";
import { subscribePersonalLoanRepayments, subscribePersonalLoans } from "@/lib/personalLoanStore";
import { UI_TEXT } from "@/lib/uiText";
import type { PersonalLoan, PersonalLoanRepayment } from "@/lib/types";

export function usePersonalLoans() {
  const [loans, setLoans] = useState<PersonalLoan[]>([]);
  const [repayments, setRepayments] = useState<PersonalLoanRepayment[]>([]);
  const [loaded, setLoaded] = useState({ loans: false, repayments: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fail = (listenerError: Error) => {
      console.error("Personal loan listener failed", listenerError);
      setError(UI_TEXT.personalLoans.loadFailed);
    };
    const stopLoans = subscribePersonalLoans((items) => {
      setLoans([...items].sort((left, right) => right.takenDate.localeCompare(left.takenDate) || right.createdAtMs - left.createdAtMs));
      setLoaded((current) => ({ ...current, loans: true }));
    }, fail);
    const stopRepayments = subscribePersonalLoanRepayments((items) => {
      setRepayments([...items].sort((left, right) => right.repaidDate.localeCompare(left.repaidDate) || right.createdAtMs - left.createdAtMs));
      setLoaded((current) => ({ ...current, repayments: true }));
    }, fail);
    return () => { stopLoans(); stopRepayments(); };
  }, []);

  return { loans, repayments, loading: !loaded.loans || !loaded.repayments, error };
}
