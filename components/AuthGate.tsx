"use client";

import { useEffect, useState } from "react";

import FamilyCodeScreen from "./FamilyCodeScreen";
import { hasDeviceLogin } from "@/lib/device";
import { auth } from "@/lib/firebase";
import { loginAnonymous } from "@/lib/auth";
import Loading from "@/app/loading";


export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {

  const [ready, setReady] = useState(false);

  const [loggedIn, setLoggedIn] = useState(false);


  useEffect(() => {
    let active = true;

    async function restoreLogin() {
      const hasLogin = hasDeviceLogin();

      if (!hasLogin) {
        if (active) {
          setReady(true);
        }
        return;
      }

      try {
        await auth.authStateReady();

        if (!auth.currentUser) {
          await loginAnonymous();
        }
      } catch (error) {
        // Firestore can still serve previously cached data while offline.
        console.error("Firebase authentication restoration failed", error);
      }

      if (active) {
        setLoggedIn(true);
        setReady(true);
      }
    }

    void restoreLogin();

    return () => {
      active = false;
    };
  }, []);


  if (!ready) {

    return <Loading />;

  }


  if (!loggedIn) {

    return <FamilyCodeScreen />;

  }


  return children;

}
