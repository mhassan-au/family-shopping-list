"use client";

import { useEffect, useState } from "react";

import FamilyCodeScreen from "./FamilyCodeScreen";
import { hasDeviceLogin } from "@/lib/device";
import { auth } from "@/lib/firebase";
import { loginAnonymous } from "@/lib/auth";
import Loading from "@/app/loading";
import DeviceApprovalScreen from "./DeviceApprovalScreen";
import { getDeviceLogin } from "@/lib/device";
import { isDeviceApproved } from "@/lib/deviceApproval";


export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {

  const [ready, setReady] = useState(false);

  const [loggedIn, setLoggedIn] = useState(false);
  const [approved, setApproved] = useState(false);


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

        const device = getDeviceLogin();
        const uid = auth.currentUser?.uid;

        if (device?.authUid && uid && uid === device.authUid) {
          const deviceApproved = await isDeviceApproved(uid);

          if (active) {
            setApproved(deviceApproved);
          }
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

  if (!approved) {
    return <DeviceApprovalScreen onApproved={() => setApproved(true)} />;
  }


  return children;

}
