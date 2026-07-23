"use client";

import { useState } from "react";
import NotifyDialog from "./NotifyDialog";

export default function NotifyButton() {

  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary w-full"
      >
        🔔 Notify
      </button>


      {open && (
        <NotifyDialog
          close={() => setOpen(false)}
        />
      )}

    </>
  );
}