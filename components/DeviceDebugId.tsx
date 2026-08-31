"use client";
import { useState } from "react";
import { getDeviceLogin } from "@/lib/device";
import { auth } from "@/lib/firebase";
import { UI_TEXT } from "@/lib/uiText";

export default function DeviceDebugId() {
  const [copied, setCopied] = useState(false);
  if (process.env.NODE_ENV !== "development") return null;
  const uid = getDeviceLogin()?.authUid ?? auth.currentUser?.uid;
  if (!uid) return null;
  return <aside className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-left text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"><p className="font-bold">{UI_TEXT.approval.debugDeviceId}</p><code className="mt-1 block break-all select-all">{uid}</code><button type="button" onClick={() => void navigator.clipboard.writeText(uid).then(() => setCopied(true))} className="mt-2 rounded-md border border-amber-500 px-2 py-1 font-semibold">{copied ? UI_TEXT.approval.deviceIdCopied : UI_TEXT.approval.copyDeviceId}</button></aside>;
}
