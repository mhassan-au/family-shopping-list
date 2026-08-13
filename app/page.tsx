
"use client";

import ShoppingList from "@/components/ShoppingList";
import AuthGate from "@/components/AuthGate";

export default function Home() {

  return (

    <AuthGate>

      <ShoppingList />

    </AuthGate>

  );

}
