"use client";

import { useState } from "react";
import { NOTIFICATION_MESSAGES } from "@/lib/notificationMessages";

interface Props {
  close: () => void;
}

export default function NotifyDialog({
  close,
}: Props) {

  const [selectedMessage, setSelectedMessage] =
    useState(
      NOTIFICATION_MESSAGES[0]
    );


  function handleSend() {

    console.log(
      "Sending notification:",
      selectedMessage
    );

    close();

  }


  return (

    <div
      className="
        fixed
        inset-0
        bg-black/40
        flex
        items-center
        justify-center
        z-50
        p-4
      "
    >

      <div
        className="
          w-full
          max-w-sm
          bg-white
          dark:bg-gray-900
          rounded-xl
          p-5
          space-y-4
          border
          dark:border-gray-700
        "
      >

        <h2
          className="
            text-lg
            font-bold
            text-gray-900
            dark:text-white
          "
        >
          🔔 Notify
        </h2>


        <p
          className="
            text-sm
            text-gray-600
            dark:text-gray-300
          "
        >
          Select message
        </p>


        <div className="space-y-2">

          {NOTIFICATION_MESSAGES.map((item) => (

            <button
              key={item.id}
              onClick={() =>
                setSelectedMessage(item)
              }
              className={`
                w-full
                text-left
                border
                rounded-lg
                p-3
                transition

                ${
                  selectedMessage.id === item.id
                    ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                    : "bg-gray-100 dark:bg-gray-800 dark:text-white"
                }
              `}
            >
              {item.label}

            </button>

          ))}

        </div>


        <div
          className="
            flex
            justify-end
            gap-2
          "
        >

          <button
            onClick={close}
            className="btn-secondary"
          >
            Cancel
          </button>


          <button
            onClick={handleSend}
            className="btn-primary"
          >
            Send
          </button>


        </div>


      </div>

    </div>

  );
}