"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { HIDDEN_PRIORITIES } from "@/lib/config";
import QuickAddDialog from "./QuickAddDialog";
import { addItem } from "@/lib/shopping";
import GroceryItem from "./GroceryItem";
import ItemEditor from "./ItemEditor";
import { ShoppingItem } from "@/lib/types";


interface Props {

    groupName: string;

    groupItems: ShoppingItem[];

    viewMode: "flat" | "shop" | "category";

    editing: ShoppingItem | null;

    setEditing: (item: ShoppingItem | null) => void;

    onDelete: (item: ShoppingItem) => void;

    onComplete: (item: ShoppingItem) => void;

    // Quick add support
    canQuickAdd: boolean;

}

export default function GroceryGroup({

    groupName,

    groupItems,

    viewMode,

    editing,

    setEditing,

    canQuickAdd,

    onDelete,

    onComplete

}: Props) {

    // Quick add dialog state

    const [showQuickAdd, setShowQuickAdd] = useState(false);

    return (

        <div>

            {/* Group Header */}

            {viewMode !== "flat" && (

                <div
                    className="
  sticky
  top-0
  bg-white
  font-bold
  text-lg
  border-b
  pb-2
  mb-2
  z-10
  flex
  justify-between
  items-center
  "
                >

                    <span>
                        {groupName}
                    </span>


                    {canQuickAdd && (

                        <button

                            onClick={() => setShowQuickAdd(true)}

                            className="
      bg-black
      text-white
      rounded-full
      w-7
      h-7
      flex
      items-center
      justify-center
      "

                        >

                            <FiPlus size={16} />

                        </button>

                    )}

                </div>

            )}
            {/* Group Items */}

            <div className="space-y-2">


                {groupItems.map((item) => (


                    <div key={item.id}>


                        <GroceryItem

                            item={item}

                            hideCategoryTag={viewMode === "category"}

                            hideShopTag={viewMode === "shop"}

                            onEdit={(item) => {

                                setEditing(item);

                            }}

                            onDelete={onDelete}

                            onComplete={onComplete}

                        />



                        {/* Edit Panel */}

                        {editing?.id === item.id &&
                            !item.completed && (

                                <ItemEditor

                                    item={item}

                                    close={() => setEditing(null)}

                                />

                            )}


                    </div>


                ))}


            </div>

            {/* Quick Add Dialog */}

            {showQuickAdd && (

                <QuickAddDialog

                    groupName={groupName}

                    groupType={viewMode === "shop" ? "shop" : "category"}
                    
                    defaultPriority={HIDDEN_PRIORITIES[0].label}

                    onCancel={() => setShowQuickAdd(false)}

                    onSave={async (
                        text,
                        shop,
                        category,
                        priority
                    ) => {

                        await addItem(
                            text,
                            shop,
                            category,
                            priority
                        );

                        setShowQuickAdd(false);

                    }}

                />

            )}

        </div>

    );

}