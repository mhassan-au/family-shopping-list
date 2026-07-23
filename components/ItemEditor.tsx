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
    input
      border
      rounded-lg
      p-4
      mt-2
      card
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
          input
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
          input
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
          input
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
          className="btn-primary"
        >
          Save
        </button>


        <button
          onClick={close}
          className="btn-secondary"
        >
          Cancel
        </button>


      </div>

    </div>

  );
}