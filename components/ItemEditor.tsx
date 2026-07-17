"use client";

import { useState } from "react";
import { updateItemDetails } from "@/lib/shopping";
import { ShoppingItem } from "@/lib/types";
import { SHOPS, CATEGORIES, PRIORITIES } from "@/lib/config";

interface Props {
  item: ShoppingItem;
  close: () => void;
}

export default function ItemEditor({ item, close }: Props) {

  const [shop, setShop] = useState(item.shop || "");
  const [category, setCategory] = useState(item.category || "");
  const [priority, setPriority] = useState(item.priority || "");


  async function save() {

    await updateItemDetails(
      item.id,
      shop,
      category,
      priority
    );

    close();

  }


  return (

    <div className="
      border
      rounded-lg
      p-4
      mt-2
      bg-gray-50
    ">

      <h3 className="font-bold mb-3">
        {item.text}
      </h3>


      {/* Shop */}

      <select
        value={shop}
        onChange={(e)=>setShop(e.target.value)}
        className="
          border
          rounded
          p-2
          w-full
          mb-2
        "
      >

        {SHOPS.map(shop=>(

          <option
            key={shop.label}
            value={shop.label}
          >
            {shop.label || "-- Select Shop --"}
          </option>

        ))}

      </select>



      {/* Category */}

      <select
        value={category}
        onChange={(e)=>setCategory(e.target.value)}
        className="
          border
          rounded
          p-2
          w-full
          mb-2
        "
      >

        {CATEGORIES.map(category=>(

          <option
            key={category.label}
            value={category.label}
          >
            {category.label || "-- Select Category --"}
          </option>

        ))}

      </select>



      {/* Priority */}

      <select
        value={priority}
        onChange={(e)=>setPriority(e.target.value)}
        className="
          border
          rounded
          p-2
          w-full
          mb-3
        "
      >

        {PRIORITIES.map(priority=>(

          <option
            key={priority.label}
            value={priority.label}
          >
            {priority.label || "-- Select Priority --"}
          </option>

        ))}

      </select>



      <div className="flex gap-2">

        <button
          onClick={save}
          className="
            bg-black
            text-white
            px-3
            py-1
            rounded
          "
        >
          Save
        </button>


        <button
          onClick={close}
          className="
            border
            px-3
            py-1
            rounded
          "
        >
          Cancel
        </button>


      </div>

    </div>

  );
}