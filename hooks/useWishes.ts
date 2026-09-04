"use client";

import { useEffect, useState } from "react";
import { subscribeWishes, subscribeWishTransactions } from "@/lib/wishStore";
import { UI_TEXT } from "@/lib/uiText";
import type { Wish, WishTransaction } from "@/lib/types";

export function useWishes() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [transactions, setTransactions] = useState<WishTransaction[]>([]);
  const [loaded, setLoaded] = useState({ wishes: false, transactions: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fail = (listenerError: Error) => {
      console.error("Wish List listener failed", listenerError);
      setError(UI_TEXT.wishes.loadFailed);
    };
    const stopWishes = subscribeWishes((items) => {
      setWishes([...items].sort((left, right) => left.status.localeCompare(right.status) || left.deadlineDate.localeCompare(right.deadlineDate) || right.createdAtMs - left.createdAtMs));
      setLoaded((current) => ({ ...current, wishes: true }));
    }, fail);
    const stopTransactions = subscribeWishTransactions((items) => {
      setTransactions([...items].sort((left, right) => right.dateKey.localeCompare(left.dateKey) || right.createdAtMs - left.createdAtMs));
      setLoaded((current) => ({ ...current, transactions: true }));
    }, fail);
    return () => { stopWishes(); stopTransactions(); };
  }, []);

  return { wishes, transactions, loading: !loaded.wishes || !loaded.transactions, error };
}
