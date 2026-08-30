"use client";

import { useEffect, useState } from "react";
import {
  BANK_ACCOUNTS,
  subscribeToBankSyncStatus,
  subscribeToPendingBankTransactions,
} from "@/lib/bankSync";
import { BankAccountKey, BankSyncStatus, PendingBankTransaction } from "@/lib/types";

type BankStatuses = Record<BankAccountKey, BankSyncStatus | null>;

export function useBankSync(enabled: boolean) {
  const [pending, setPending] = useState<PendingBankTransaction[]>([]);
  const [statuses, setStatuses] = useState<BankStatuses>({ peu: null, shamir: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let pendingReady = false;
    const readyAccounts = new Set<BankAccountKey>();
    const markReady = () => {
      if (pendingReady && readyAccounts.size === BANK_ACCOUNTS.length) setLoading(false);
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
    const unsubscribeStatuses = BANK_ACCOUNTS.map((account) =>
      subscribeToBankSyncStatus(
        account.key,
        (nextStatus) => {
          readyAccounts.add(account.key);
          setStatuses((current) => ({ ...current, [account.key]: nextStatus }));
          markReady();
        },
        handleError,
      ),
    );

    return () => {
      unsubscribePending();
      unsubscribeStatuses.forEach((unsubscribe) => unsubscribe());
    };
  }, [enabled]);

  return enabled
    ? { pending, statuses, loading, error }
    : { pending: [], statuses: { peu: null, shamir: null }, loading: false, error: null };
}
