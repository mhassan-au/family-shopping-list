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


  function save() {
    const updatePromise = updateItemDetails(
      item.id,
      shop,
      category,
      priority
    );

    close();

    void updatePromise.catch((updateError) => {
      console.error("Updating shopping item failed", updateError);
    });

  }


  return (

    <div className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/40
      p-4
    ">

      <div className="
        card
        w-full
        max-w-sm
        rounded-xl
        p-5
      ">

        <h3 className="font-bold text-lg mb-4">
          {item.text}
        </h3>

      {/* Priority */}
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="
          border
          rounded
          p-2
          w-full
          mb-3
          input
        "
      >

        {PRIORITIES.map(priority => (

          <option
            key={priority.label}
            value={priority.label}
          >
            {priority.label || "-- Select Priority --"}
          </option>

        ))}

      </select>

      {/* Shop */}
      <select
        value={shop}
        onChange={(e) => setShop(e.target.value)}
        className="
          border
          rounded
          p-2
          w-full
          mb-2
          input
        "
      >

        {SHOPS.map(shop => (

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
        onChange={(e) => setCategory(e.target.value)}
        className="
          border
          rounded
          p-2
          w-full
          mb-2
          input
        "
      >

        {CATEGORIES.map(category => (

          <option
            key={category.label}
            value={category.label}
          >
            {category.label || "-- Select Category --"}
          </option>

        ))}

      </select>

        <div className="flex justify-end gap-3 mt-4">

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

    </div>

  );
}
