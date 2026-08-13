"use client";

import { SHOPS, CATEGORIES, PRIORITIES } from "@/lib/config";


interface Props {

    newItem: string;

    setNewItem: (value: string) => void;

    selectedShop: string;

    setSelectedShop: (value: string) => void;

    selectedCategory: string;

    setSelectedCategory: (value: string) => void;

    selectedPriority: string;

    setSelectedPriority: (value: string) => void;

    onAdd: () => void;

}


export default function GroceryInput({

    newItem,

    setNewItem,

    selectedShop,

    setSelectedShop,

    selectedCategory,

    setSelectedCategory,

    selectedPriority,

    setSelectedPriority,

    onAdd

}: Props) {


    {/* Handle Enter Key */ }

    function handleKeyDown(
        e: React.KeyboardEvent<HTMLInputElement>
    ) {

        if (e.key === "Enter") {

            onAdd();

        }

    }


    return (

        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm dark:border-blue-800 dark:bg-blue-950/40">


            {/* Input Box */}

            <div className="flex gap-2 w-full min-w-0">


                <input

                    className="input
          p-2
          flex-1
          min-w-0
          focus:border-blue-400
          focus:outline-none
          focus:ring-2
          focus:ring-blue-200
          "

                    placeholder="Add grocery item"

                    value={newItem}

                    onChange={(e) =>
                        setNewItem(e.target.value)
                    }

                    onKeyDown={handleKeyDown}

                />


                <button

                    onClick={onAdd}

                    className="
      bg-blue-600
      hover:bg-blue-700
      text-white
      border
      border-blue-700
      transition
      active:scale-95
      w-12
      h-12
      rounded-lg
      font-bold
      text-2xl"

                >

                    +

                </button>


            </div>



            {/* Dropdown Section */}

            <div className="
      grid
      grid-cols-3
      gap-2
      mt-3
      ">

                {/* Priority Dropdown */}

                <select

                    className="input
          border
          rounded-lg
          px-1
          py-2
          min-w-0
          w-full
          text-sm
          "

                    value={selectedPriority}

                    onChange={(e) =>
                        setSelectedPriority(e.target.value)
                    }

                >

                    {PRIORITIES.map(priority => (

                        <option

                            key={priority.label}

                            value={priority.label}

                        >

                            {priority.label || "Priority"}

                        </option>

                    ))}


                </select>

                {/* Shop Dropdown */}

                <select

                    className="input
          border
          rounded-lg
          px-1
          py-2
          min-w-0
          w-full
          text-sm
          "

                    value={selectedShop}

                    onChange={(e) =>
                        setSelectedShop(e.target.value)
                    }

                >

                    {SHOPS.map(shop => (

                        <option

                            key={shop.label}

                            value={shop.label}

                        >

                            {shop.label || "Shop"}

                        </option>

                    ))}


                </select>


                {/* Category Dropdown */}

                <select

                    className="input
          border
          rounded-lg
          px-1
          py-2
          min-w-0
          w-full
          text-sm
          "

                    value={selectedCategory}

                    onChange={(e) =>
                        setSelectedCategory(e.target.value)
                    }

                >

                    {CATEGORIES.map(category => (

                        <option

                            key={category.label}

                            value={category.label}

                        >

                            {category.label || "Category"}

                        </option>

                    ))}


                </select>

            </div>


        </div>

    );

}
