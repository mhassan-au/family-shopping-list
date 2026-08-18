"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronsLeft } from "react-icons/fi";
import { UI_TEXT } from "@/lib/uiText";
import {
    INPUT_LIMITS,
    isValidPriceInput,
    isValidQuantity,
    isValidQuantityInput,
    isValidUnitPrice,
} from "@/lib/validation";
import { useSmartMoneyInput } from "@/hooks/useSmartMoneyInput";

interface Props {

    itemName: string;

    defaultQty?: number;

    defaultUnitPrice?: number;

    onCancel: () => void;

    onSave: (qty: number, unitPrice: number) => void;

}

export default function CompleteItemDialog({

    itemName,

    defaultQty = 1,

    defaultUnitPrice = 0,

    onCancel,

    onSave

}: Props) {

    // Qty State
    const [qty, setQty] = useState(String(defaultQty));

    // Unit Price State
    const {
        value: unitPrice,
        setValue: setUnitPrice,
        formatOnBlur: formatPriceOnBlur,
        shiftDecimal,
        canShift,
        parsedValue: parsedPrice,
    } = useSmartMoneyInput(
        defaultUnitPrice > 0 ? defaultUnitPrice.toFixed(2) : "",
    );
    const priceInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        priceInputRef.current?.focus();
        priceInputRef.current?.select();
    }, []);

    return (

        <div className="
fixed
inset-0
bg-black/40
flex
items-center
justify-center
z-50
">

            <div className="card w-[calc(100%-2rem)] max-w-xs space-y-4 rounded-xl p-4">

                {/* Title */}

                <h2 className="text-xl font-bold">

                    {itemName}

                </h2>

{/* Quantity and Unit Price */}

<div>

  <label className="text-sm">
    {UI_TEXT.items.quantityPrice}
  </label>


  <div className="mt-1 grid grid-cols-[2.5rem_3rem_2.5rem_minmax(0,1fr)] items-center gap-1.5">


    {/* Minus Button */}

    <button

      onClick={() => setQty(String(Math.max(1, Number(qty || 1) - 1)))}

      className="flex size-10 items-center justify-center rounded-lg border border-blue-700 bg-blue-600 text-xl font-bold text-white transition hover:bg-blue-700 active:scale-95 dark:border-blue-400 dark:bg-blue-700"

    >
      −

    </button>


    {/* Quantity */}

    <input

      type="text"

      inputMode="numeric"

      pattern="[0-9]*"

      maxLength={3}

      value={qty}

      onChange={(e) => {
        if (isValidQuantityInput(e.target.value)) setQty(e.target.value);
      }}

      className="
      border
      rounded-lg
      text-center
      w-12
      h-10
      text-lg
      "

    />


    {/* Plus Button */}

    <button

      onClick={() =>
        setQty(String(Math.min(INPUT_LIMITS.quantity, Number(qty || 0) + 1)))
      }

      className="flex size-10 items-center justify-center rounded-lg border border-blue-700 bg-blue-600 text-xl font-bold text-white transition hover:bg-blue-700 active:scale-95 dark:border-blue-400 dark:bg-blue-700"

    >
      +

    </button>


    {/* Price */}

    <div className="relative min-w-0">
    <input

      ref={priceInputRef}

      type="text"

      inputMode="decimal"

      pattern="[0-9]*[.]?[0-9]{0,2}"

      maxLength={8}

      placeholder="$"

      value={unitPrice}

      onChange={(e) => {
        if (isValidPriceInput(e.target.value)) setUnitPrice(e.target.value);
      }}

      onBlur={formatPriceOnBlur}

      className="
      border
      rounded-lg
      h-10
      w-full
      pr-8
      text-center
      text-lg
      "

    />
    <button
      type="button"
      onClick={shiftDecimal}
      disabled={!canShift}
      className="absolute inset-y-1 right-1 flex w-7 items-center justify-center rounded-md text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-blue-300 dark:hover:bg-blue-900"
      aria-label={UI_TEXT.expenses.shiftDecimal}
      title={UI_TEXT.expenses.shiftDecimal}
    >
      <FiChevronsLeft size={16} aria-hidden="true" />
    </button>
    </div>


  </div>

</div>

                {/* Total */}

                <div className="font-bold text-lg">

                    {UI_TEXT.items.total(
                        Number(qty || 0) * parsedPrice
                    )}

                </div>

                {/* Buttons */}

                <div className="flex justify-end gap-3">

                    <button

                        onClick={onCancel}

                        className="btn-secondary"

                    >

                        {UI_TEXT.common.cancel}

                    </button>

                    <button

                        onClick={() => {
                            const parsedQty = Number(qty);
                            if (
                                isValidQuantity(parsedQty) &&
                                isValidUnitPrice(parsedPrice)
                            ) {
                                onSave(parsedQty, parsedPrice);
                            }
                        }}

                        className="btn-primary"

                    >

                        {UI_TEXT.items.complete}

                    </button>

                </div>

            </div>

        </div>

    );

}
