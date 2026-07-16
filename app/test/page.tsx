"use client";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

export default function TestPage() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const snapshot = await getDocs(collection(db, "shopping_items"));
      setCount(snapshot.size);
    }

    load();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Firebase Connected ✅
      </h1>

      <p className="mt-4">
        Documents found: {count ?? "Loading..."}
      </p>
    </main>
  );
}