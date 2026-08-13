"use client";

import { useState } from "react";
import { UI_TEXT } from "@/lib/uiText";
import { INPUT_LIMITS, isValidItemName } from "@/lib/validation";

interface Props {
  groupName: string;
  groupType: "shop" | "category";
  defaultPriority: string;
  onCancel: () => void;
  onSave: (
    text: string,
    shop: string,
    category: string,
    priority: string
  ) => void;
}

export default function QuickAddDialog({
  groupName,
  groupType,
  defaultPriority,
  onCancel,
  onSave,
}: Props) {

  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function save() {

    const itemName = text.trim();

    if (!itemName) return;

    if (!isValidItemName(itemName)) {
      setError(UI_TEXT.toast.invalidCharacters);
      return;
    }


    onSave(
      itemName,
      groupType === "shop" ? groupName : "",
      groupType === "category" ? groupName : "",
      defaultPriority
    );

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
      "
    >

      <div
        className="
        card
        rounded-xl
        p-5
        w-80
        "
      >

        {/* Title */}

        <h2 className="font-bold text-lg mb-4">

          {UI_TEXT.input.addTo(groupName)}

        </h2>


        {/* Item Input */}

        <input

          autoFocus

          value={text}

          onChange={(e) => setText(e.target.value)}

          placeholder={UI_TEXT.input.itemName}
          maxLength={INPUT_LIMITS.itemName}

          className="
          border
          rounded-lg
          p-2
          w-full
          mb-4
          "

        />

        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}


        {/* Buttons */}

        <div className="flex justify-end gap-3">


          <button

            onClick={onCancel}

            className="btn-secondary"
           
          >
            {UI_TEXT.common.cancel}

          </button>


          <button

            onClick={save}

            className="btn-primary"

          >
            {UI_TEXT.common.add}

          </button>


        </div>


      </div>


    </div>

  );
}
