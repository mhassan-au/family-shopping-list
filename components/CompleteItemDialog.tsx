"use client";

import { useState } from "react";

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
    const [qty, setQty] = useState(defaultQty);

    // Unit Price State
    const [unitPrice, setUnitPrice] = useState(defaultUnitPrice);

    const total = qty * unitPrice;

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

            <div className="card
rounded-xl
p-5
w-80
space-y-4
">

                {/* Title */}

                <h2 className="text-xl font-bold">

                    {itemName}

                </h2>

{/* Quantity and Unit Price */}

<div>

  <label className="text-sm">
    Quantity / Unit Price
  </label>


  <div className="flex items-center gap-2 mt-1">


    {/* Minus Button */}

    <button

      onClick={() => setQty(Math.max(1, qty - 1))}

      className="btn-primary
      w-12
      h-12
      rounded-lg
      font-bold
      text-2xl
      "

    >
      −

    </button>


    {/* Quantity */}

    <input

      type="number"

      min="1"

      value={qty}

      onChange={(e)=>setQty(Number(e.target.value))}

      className="
      border
      rounded-lg
      text-center
      w-14
      h-12
      text-lg
      "

    />


    {/* Plus Button */}

    <button

      onClick={() => setQty(qty + 1)}

      className="btn-primary
      w-12
      h-12
      rounded-lg
      font-bold
      text-2xl
      "

    >
      +

    </button>


    {/* Price */}

    <input

      type="number"

      inputMode="decimal"

      step="0.01"

      placeholder="$"

      value={unitPrice || ""}

      onChange={(e)=>setUnitPrice(Number(e.target.value))}

      className="
      border
      rounded-lg
      h-12
      w-24
      text-center
      text-lg
      "

    />


  </div>

</div>

                {/* Total */}

                <div className="font-bold text-lg">

                    Total : ${(qty * unitPrice).toFixed(2)}

                </div>

                {/* Buttons */}

                <div className="flex justify-end gap-3">

                    <button

                        onClick={onCancel}

                        className="btn-secondary"

                    >

                        Cancel

                    </button>

                    <button

                        onClick={() => onSave(qty, unitPrice)}

                        className="btn-primary"

                    >

                        Complete

                    </button>

                </div>

            </div>

        </div>

    );

}