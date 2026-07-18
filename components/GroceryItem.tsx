"use client";

import { useState } from "react";
import TagEditorDialog from "./TagEditorDialog";
import { updateItemDetails } from "@/lib/shopping";

import { FiTrash2, FiEdit3 } from "react-icons/fi";
import { ShoppingItem } from "@/lib/types";
import { getTagColor } from "@/lib/tagColor";


interface Props {

    item: ShoppingItem;

    onEdit: (item: ShoppingItem) => void;

    onDelete: (item: ShoppingItem) => void;

    onComplete: (item: ShoppingItem) => void;

    hideShopTag?: boolean;

    hideCategoryTag?: boolean;

}


export default function GroceryItem({

    item,

    onEdit,

    onDelete,

    onComplete,

    hideShopTag = false,

    hideCategoryTag = false

}: Props) {

    // Tag editor state

    const [editingTag, setEditingTag] = useState<{
        type: "shop" | "category" | "priority";
        value: string;
    } | null>(null);

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

                        {!hideShopTag && item.shop &&
                            <span
                                onClick={() =>
                                    setEditingTag({
                                        type: "shop",
                                        value: item.shop!,
                                    })
                                }
                                className={`
            ml-1 px-2 py-1 rounded-full text-xs cursor-pointer active:scale-95 transition
            ${getTagColor(item.shop)}
            `}>
                                {item.shop}
                            </span>}


                        {!hideCategoryTag && item.category &&
                            <span
                                onClick={() =>
                                    setEditingTag({
                                        type: "category",
                                        value: item.category!,
                                    })
                                }
                                className={`
            ml-1 px-2 py-1 rounded-full text-xs cursor-pointer active:scale-95 transition
            ${getTagColor(item.category)}
            `}>
                                {item.category}
                            </span>}


                        {item.priority &&
                            <span
                                onClick={() => {

                                    if (item.priority !== "WalkIn") {

                                        setEditingTag({
                                            type: "priority",
                                            value: item.priority!,
                                        });

                                    }

                                }}
                                className={`
            ml-1 px-2 py-1 rounded-full text-xs cursor-pointer active:scale-95 transition
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

            {/* Tag Edit Dialog */}

            {editingTag && (

                <TagEditorDialog

                    type={editingTag.type}

                    currentValue={editingTag.value}

                    onCancel={() => setEditingTag(null)}

                    onSave={async (value) => {

                        await updateItemDetails(

                            item.id,

                            editingTag.type === "shop"
                                ? value
                                : item.shop ?? "",

                            editingTag.type === "category"
                                ? value
                                : item.category ?? "",

                            editingTag.type === "priority"
                                ? value
                                : item.priority ?? ""

                        );
                        setEditingTag(null);

                    }}

                    onRemove={async () => {

                        await updateItemDetails(

                            item.id,

                            editingTag.type === "shop"
                                ? ""
                                : item.shop ?? "",

                            editingTag.type === "category"
                                ? ""
                                : item.category ?? "",

                            editingTag.type === "priority"
                                ? ""
                                : item.priority ?? ""

                        );

                        setEditingTag(null);

                    }}

                />

            )}
        </div>

    );

}