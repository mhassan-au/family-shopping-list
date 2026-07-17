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

    <div className="
    mt-8
    text-center
    ">


      {/* Clear Completed Button */}

      {items.some(item=>item.completed) && (

        <button

          onClick={onClear}

          className="
          bg-gray-200
          px-4
          py-2
          rounded-lg
          text-sm
          "

        >

          🧹 Clear completed

        </button>

      )}




      {/* Shopping Total */}

      {total > 0 && (

        <div className="
        mt-5
        text-right
        font-bold
        ">

          Total: $

          {total.toFixed(2)}

        </div>

      )}


    </div>

  );

}