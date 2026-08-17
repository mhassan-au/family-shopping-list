
"use client";

import AuthGate from "@/components/AuthGate";
import HouseholdApp from "@/components/HouseholdApp";

export default function Home() {

  return (

    <AuthGate>

      <HouseholdApp />

    </AuthGate>

  );

}
