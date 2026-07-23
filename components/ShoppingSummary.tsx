"use client";

import { ShoppingItem } from "@/lib/types";


interface Props {

  items: ShoppingItem[];

  onClear: ()=>void;

}


export default function ShoppingSummary({

  items,

  onClear

}: Props) {


  // Completed items total

  const total = items

    .filter(item => item.completed)

    .reduce(

      (sum,item)=>

        sum +

        ((item.qty || 0) *

        (item.unitPrice || 0)),

      0

    );



return (

  <div className="mt-8 text-center">


    {/* Shopping Total */}

    <div
      className="
      text-2xl
      font-bold
      mb-4
      "
    >

      Total: $

      {total.toFixed(2)}

    </div>


    {/* Clear Completed Button */}

    {items.some(item => item.completed) && (

      <button

        onClick={onClear}

        className="btn-danger text-sm
        "

      >

        🧹 Clear completed

      </button>

    )}


  </div>

);

}