"use client";

import { useState } from "react";
import { updateItemDetails } from "@/lib/shopping";
import { ShoppingItem } from "@/lib/types";
import { SHOPS, PRIORITIES, getShoppingCategoryOptions } from "@/lib/config";
import { normalizeConfiguredCategory, useCategoryConfig } from "@/hooks/useCategoryConfig";
import { UI_TEXT } from "@/lib/uiText";
import { getDropdownOptionClass } from "@/lib/dropdownStyle";

interface Props {
  item: ShoppingItem;
  close: () => void;
}

export default function ItemEditor({ item, close }: Props) {

  const { shopping, shoppingAliases } = useCategoryConfig();
  const categoryOptions = getShoppingCategoryOptions(shopping);

  const [shop, setShop] = useState(item.shop || "");
  const [category, setCategory] = useState(
    item.category ? normalizeConfiguredCategory(item.category, shoppingAliases) : "",
  );
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

        {PRIORITIES.map((priority, index) => (

          <option
            key={priority.label}
            value={priority.label}
            className={getDropdownOptionClass(index)}
          >
            {priority.label || UI_TEXT.editor.selectPriority}
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

        {SHOPS.map((shop, index) => (

          <option
            key={shop.label}
            value={shop.label}
            className={getDropdownOptionClass(index)}
          >
            {shop.label || UI_TEXT.editor.selectShop}
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

        {categoryOptions.map((category, index) => (

          <option
            key={category.label}
            value={category.label}
            className={getDropdownOptionClass(index)}
          >
            {category.label || UI_TEXT.editor.selectCategory}
          </option>

        ))}

      </select>

        <div className="flex justify-end gap-3 mt-4">

        <button
          onClick={save}
          className="btn-primary"
        >
          {UI_TEXT.common.save}
        </button>


        <button
          onClick={close}
          className="btn-secondary"
        >
          {UI_TEXT.common.cancel}
        </button>


        </div>

      </div>

    </div>

  );
}
