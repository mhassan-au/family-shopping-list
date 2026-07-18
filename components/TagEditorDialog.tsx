"use client";

import { useState } from "react";
import { SHOPS, CATEGORIES, PRIORITIES } from "@/lib/config";

interface Props {

    type: "shop" | "category" | "priority";

    currentValue: string;

    onCancel: () => void;

    onSave: (value: string) => void;

    onRemove: () => void;

}


export default function TagEditorDialog({

    type,

    currentValue,

    onCancel,

    onSave,

    onRemove,

}: Props) {


    const [value, setValue] = useState(currentValue);


    // Get dropdown options

    const options =
        type === "shop"
            ? SHOPS
            : type === "category"
                ? CATEGORIES
                : PRIORITIES;

    const title =
        type === "shop"
            ? "Change Shop"
            : type === "category"
                ? "Change Category"
                : "Change Priority";

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
        bg-white
        rounded-xl
        p-5
        w-80
        "
            >


                <h2 className="font-bold text-lg mb-4">

                    {title}

                </h2>


                <select

                    value={value}

                    onChange={(e) => setValue(e.target.value)}

                    className="
          border
          rounded-lg
          p-2
          w-full
          mb-4
          "

                >

                    {options.map(option => (

                        <option

                            key={option.label}

                            value={option.label}

                        >

                            {option.label}

                        </option>

                    ))}


                </select>
                <div className="flex justify-between gap-3">

                    <button

                        onClick={onRemove}

                        className="
    text-red-600
    px-3
    py-2
    "
                    >
                        Remove
                    </button>


                    <div className="flex gap-3">

                        <button

                            onClick={onCancel}

                            className="px-4 py-2"

                        >
                            Cancel

                        </button>


                        <button

                            onClick={() => onSave(value)}

                            className="
      bg-black
      text-white
      px-4
      py-2
      rounded-lg
      "

                        >
                            Save

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}