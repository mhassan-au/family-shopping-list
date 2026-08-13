"use client";

import { useState } from "react";
import { clearDeviceLogin, getDeviceLogin } from "@/lib/device";
import { isDeviceApproved } from "@/lib/deviceApproval";
import { UI_TEXT } from "@/lib/uiText";

interface Props {
  onApproved: () => void;
}

export default function DeviceApprovalScreen({ onApproved }: Props) {
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const device = getDeviceLogin();

  async function checkApproval() {
    if (!device?.authUid) return;

    setChecking(true);
    setMessage("");

    try {
      if (await isDeviceApproved(device.authUid)) {
        onApproved();
        return;
      }

      setMessage(UI_TEXT.approval.notApproved);
    } catch (error) {
      console.error("Checking device approval failed", error);
      setMessage(UI_TEXT.approval.checkFailed);
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <section className="w-full max-w-sm rounded-xl border border-blue-200 bg-white p-5 text-center shadow-sm dark:border-blue-800 dark:bg-slate-800">
        <h1 className="rounded-xl bg-gradient-to-r from-blue-100 to-cyan-50 px-3 py-3 text-xl font-bold dark:from-blue-950 dark:to-slate-900">
          {UI_TEXT.approval.title}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {UI_TEXT.approval.description}
        </p>
        {message && (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            {message}
          </p>
        )}
        <button
          type="button"
          onClick={() => void checkApproval()}
          disabled={checking}
          className="mt-5 w-full rounded-lg border border-blue-700 bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
        >
          {checking ? UI_TEXT.approval.checking : UI_TEXT.approval.check}
        </button>
        <button
          type="button"
          onClick={() => {
            clearDeviceLogin();
            window.location.reload();
          }}
          className="btn-secondary mt-3 w-full"
        >
          {UI_TEXT.approval.anotherLogin}
        </button>
      </section>
    </main>
  );
}
