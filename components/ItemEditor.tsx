"use client";

import { useState } from "react";
import { updateItemDetails } from "@/lib/shopping";
import { ShoppingItem } from "@/lib/types";

interface Props {
  item: ShoppingItem;
  close: () => void;
}

export default function ItemEditor({ item, close }: Props) {

  const [shop, setShop] = useState(item.shop || "");
  const [category, setCategory] = useState(item.category || "");


  async function save() {

    await updateItemDetails(
      item.id,
      shop,
      category
    );

    close();
  }


  return (
    <div className="border rounded-lg p-4 mt-2">

      <h3 className="font-bold mb-3">
        {item.text}
      </h3>


      <input
        className="border p-2 rounded w-full mb-2"
        placeholder="Shop"
        value={shop}
        onChange={(e)=>setShop(e.target.value)}
      />


      <input
        className="border p-2 rounded w-full mb-3"
        placeholder="Category"
        value={category}
        onChange={(e)=>setCategory(e.target.value)}
      />


      <div className="flex gap-2">

        <button
          onClick={save}
          className="bg-black text-white px-3 py-1 rounded"
        >
          Save
        </button>


        <button
          onClick={close}
          className="border px-3 py-1 rounded"
        >
          Cancel
        </button>

      </div>

    </div>
  );
}