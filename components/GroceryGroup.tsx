"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { HIDDEN_PRIORITIES } from "@/lib/config";
import QuickAddDialog from "./QuickAddDialog";
import { addItem } from "@/lib/shopping";
import GroceryItem from "./GroceryItem";
import ItemEditor from "./ItemEditor";
import { ShoppingItem } from "@/lib/types";
import { getTagColor } from "@/lib/tagColor";

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

    const [collapsed, setCollapsed] = useState(false);

    return (

        <div>

            {/* Group Header */}
            {viewMode !== "flat" && (

                <div onClick={() => setCollapsed(!collapsed)}
                    className={`
      sticky
      top-0
      z-10
      flex
      items-center
      justify-between
      px-3
      py-2
      mb-2
      rounded-lg
      font-bold
      border
      cursor-pointer

      ${groupName.startsWith("No ")
                            ? "bg-gray-200 text-gray-700"
                            : getTagColor(groupName)
                        }
    `}
                >

                    <span>
                        {groupName}
                    </span>


                    {/* Future collapse button */}

                    <span className="text-sm">
                        {collapsed ? "▶" : "▼"}
                    </span>


                </div>

            )}
            {/* Group Items */}
            {!collapsed && (
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
            )}
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