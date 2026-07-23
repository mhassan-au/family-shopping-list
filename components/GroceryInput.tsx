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

        <div className="mb-5">


            {/* Input Box */}

            <div className="flex gap-2 w-full">


                <input

                    className="
          border
          rounded-lg
          p-2
          flex-1
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

                    className="btn-primary text-2xl"

                >

                    +

                </button>


            </div>



            {/* Dropdown Section */}

            <div className="
      grid
      grid-cols-1
      sm:grid-cols-3
      gap-2
      mt-3
      ">

                {/* Priority Dropdown */}

                <select

                    className="input
          border
          rounded-lg
          p-2
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
          p-2
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
          p-2
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