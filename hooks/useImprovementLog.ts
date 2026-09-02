"use client";

import { useEffect, useState } from "react";
import { subscribeToImprovementLogs } from "@/lib/improvementLogStore";
import type { ImprovementLogEntry } from "@/lib/types";

export function useImprovementLog() {
  const [entries, setEntries] = useState<ImprovementLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    return subscribeToImprovementLogs(
      (nextEntries) => { setEntries(nextEntries); setError(null); setLoading(false); },
      (nextError) => { setError(nextError); setLoading(false); },
    );
  }, []);

  return { entries, loading, error };
}
