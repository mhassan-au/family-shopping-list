
"use client";

import FamilyCodeScreen from "@/components/FamilyCodeScreen";
import { hasDeviceLogin } from "@/lib/device";
import ShoppingList from "@/components/ShoppingList";
import AuthGate from "@/components/AuthGate";

export default function Home() {

  return (

    <AuthGate>

      <ShoppingList />

    </AuthGate>

  );

}