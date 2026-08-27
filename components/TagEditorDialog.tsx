"use client";

import { useState } from "react";
import { PRIORITIES, getShopOptions, getShoppingCategoryOptions } from "@/lib/config";
import { normalizeConfiguredCategory, useCategoryConfig } from "@/hooks/useCategoryConfig";
import { UI_TEXT } from "@/lib/uiText";
import { getDropdownOptionClass } from "@/lib/dropdownStyle";

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

    const { shops, shopping, shopAliases, shoppingAliases } = useCategoryConfig();
    const shopOptions = getShopOptions(shops);
    const categoryOptions = getShoppingCategoryOptions(shopping);


    const [value, setValue] = useState(
        type === "category"
            ? normalizeConfiguredCategory(currentValue, shoppingAliases)
            : type === "shop"
              ? normalizeConfiguredCategory(currentValue, shopAliases)
              : currentValue,
    );


    // Get dropdown options

    const options =
        type === "shop"
            ? shopOptions
            : type === "category"
                ? categoryOptions
                : PRIORITIES;

    const title =
        type === "shop"
            ? UI_TEXT.editor.changeShop
            : type === "category"
                ? UI_TEXT.editor.changeCategory
                : UI_TEXT.editor.changePriority;

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

                    {options.map((option, index) => (

                        <option

                            key={option.label}

                            value={option.label}
                            className={getDropdownOptionClass(index)}

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
                        {UI_TEXT.common.remove}
                    </button>


                    <div className="flex gap-3">

                        <button

                            onClick={onCancel}

                            className="btn-secondary"

                        >
                            {UI_TEXT.common.cancel}

                        </button>


                        <button

                            onClick={() => onSave(value)}

                            className="btn-primary"
                        >
                            {UI_TEXT.common.save}

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}
