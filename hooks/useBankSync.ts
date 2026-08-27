"use client";

import { useEffect, useState } from "react";
import {
  subscribeToBankSyncStatus,
  subscribeToPendingBankTransactions,
} from "@/lib/bankSync";
import { BankSyncStatus, PendingBankTransaction } from "@/lib/types";

export function useBankSync(enabled: boolean) {
  const [pending, setPending] = useState<PendingBankTransaction[]>([]);
  const [status, setStatus] = useState<BankSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let pendingReady = false;
    let statusReady = false;
    const markReady = () => {
      if (pendingReady && statusReady) setLoading(false);
    };
    const handleError = (message: string) => {
      setError(message);
      setLoading(false);
    };
    const unsubscribePending = subscribeToPendingBankTransactions(
      (transactions) => {
        pendingReady = true;
        setPending(transactions);
        markReady();
      },
      handleError,
    );
    const unsubscribeStatus = subscribeToBankSyncStatus(
      (nextStatus) => {
        statusReady = true;
        setStatus(nextStatus);
        markReady();
      },
      handleError,
    );

    return () => {
      unsubscribePending();
      unsubscribeStatus();
    };
  }, [enabled]);

  return enabled
    ? { pending, status, loading, error }
    : { pending: [], status: null, loading: false, error: null };
}
