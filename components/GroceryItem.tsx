"use client";

import { FiTrash2, FiEdit3 } from "react-icons/fi";
import { ShoppingItem } from "@/lib/types";
import { getTagColor } from "@/lib/tagColor";


interface Props {

    item: ShoppingItem;

    onEdit: (item: ShoppingItem) => void;

    onDelete: (item: ShoppingItem) => void;

    onComplete: (item: ShoppingItem) => void;

}


export default function GroceryItem({

    item,

    onEdit,

    onDelete,

    onComplete

}: Props) {


    {/* Handle complete */ }

    function handleComplete() {

        onComplete(item);

    }


    return (

        <div
            className="
      flex
      justify-between
      items-start
      gap-2
      border
      rounded-lg
      p-3
      "
        >

            <div className="
      flex
      gap-3
      items-center
      flex-1
      min-w-0
      ">


                <input

                    type="checkbox"

                    checked={item.completed}

                    onChange={handleComplete}

                />


                <div>

                    <div
                        onClick={handleComplete}
                        className={`
  cursor-pointer
  text-lg
  ${item.completed
                                ? "line-through text-gray-400"
                                : ""
                            }
  `}
                    >

                        {item.text}

                        {/* Completed Item Price */}
                        {item.completed &&
                            Number(item.unitPrice || 0) !== 0 && (

                                <span
                                    className="
    ml-2
    font-bold
    text-green-600
    "
                                >
                                    ${(
                                        Number(item.qty || 0) *
                                        Number(item.unitPrice || 0)
                                    ).toFixed(2)}
                                </span>

                            )}

                    </div>


                    <div className="text-xs">

                        {item.shop &&
                            <span className={`
            ml-1 px-2 py-1 rounded-full
            ${getTagColor(item.shop)}
            `}>
                                {item.shop}
                            </span>}


                        {item.category &&
                            <span className={`
            ml-1 px-2 py-1 rounded-full
            ${getTagColor(item.category)}
            `}>
                                {item.category}
                            </span>}


                        {item.priority &&
                            <span className={`
            ml-1 px-2 py-1 rounded-full
            ${getTagColor(item.priority)}
            `}>
                                {item.priority}
                            </span>}

                    </div>

                </div>


            </div>


            {!item.completed && (

                <div className="flex gap-3">


                    <button onClick={() => onEdit(item)}>

                        <FiEdit3 size={18} />

                    </button>


                    <button
                        onClick={() => onDelete(item)}
                        className="text-red-500"
                    >

                        <FiTrash2 size={18} />

                    </button>


                </div>

            )}


        </div>

    );

}