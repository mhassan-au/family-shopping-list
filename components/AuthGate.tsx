"use client";

import { useEffect, useState } from "react";

import FamilyCodeScreen from "./FamilyCodeScreen";
import { hasDeviceLogin } from "@/lib/device";


export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {

  const [ready, setReady] = useState(false);

  const [loggedIn, setLoggedIn] = useState(false);


  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoggedIn(hasDeviceLogin());
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);


  if (!ready) {

    return null;

  }


  if (!loggedIn) {

    return <FamilyCodeScreen />;

  }


  return children;

}
