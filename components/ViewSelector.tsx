"use client";

import { useState } from "react";
import { FiFilter } from "react-icons/fi";
import { PRIORITIES } from "@/lib/config";
import { getTagColor } from "@/lib/tagColor";
import { UI_TEXT } from "@/lib/uiText";

interface Props {
  viewMode: "flat" | "shop" | "category";

  setViewMode: (
    mode: "flat" | "shop" | "category"
  ) => void;

  priorityFilter: string;

  setPriorityFilter: (value: string) => void;
}

export default function ViewSelector({
  viewMode,
  setViewMode,
  priorityFilter,
  setPriorityFilter,
}: Props) {
  const [showPriorityFilter, setShowPriorityFilter] =
    useState(false);

  return (
    <div className="mb-4 grid grid-cols-4 gap-1.5">
      {/* View Buttons */}

      <div className="col-span-3 grid min-w-0 grid-cols-3 gap-1.5">
        <button
          onClick={() => setViewMode("flat")}
          className={`
            px-1
            py-1.5
            text-sm
            rounded-lg
            border
            transition
            min-w-0

            ${
              viewMode === "flat"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
                : "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            }
          `}
        >
          {UI_TEXT.views.flat}
        </button>

        <button
          onClick={() => setViewMode("shop")}
          className={`
            px-1
            py-1.5
            text-sm
            rounded-lg
            border
            transition
            min-w-0

            ${
              viewMode === "shop"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
                : "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            }
          `}
        >
          {UI_TEXT.views.shop}
        </button>

        <button
          onClick={() => setViewMode("category")}
          className={`
            px-1
            py-1.5
            text-sm
            rounded-lg
            border
            transition
            min-w-0

            ${
              viewMode === "category"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
                : "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            }
          `}
        >
          {UI_TEXT.views.category}
        </button>
      </div>

      {/* Filter */}

      <div className="relative min-w-0">
        <button
          onClick={() =>
            setShowPriorityFilter(!showPriorityFilter)
          }
          className={`
            flex
            items-center
            justify-center
            gap-1
            px-1
            py-2
            rounded-lg
            border
            w-full

            ${
              priorityFilter
                ? `${getTagColor(priorityFilter)} border-transparent`
                : "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            }
          `}
        >
          <FiFilter size={18} />

          <span className="text-sm font-medium">
            {priorityFilter || UI_TEXT.views.all}
          </span>
        </button>

        {showPriorityFilter && (
          <div
            className="
              absolute
              right-0
              mt-2
              w-44
              rounded-lg
              border
              border-gray-300
              dark:border-gray-700
              bg-white
              dark:bg-gray-800
              shadow-lg
              z-20
              p-2
            "
          >
            <button
              onClick={() => {
                setPriorityFilter("");
                setShowPriorityFilter(false);
              }}
              className={`
                block
                w-full
                text-left
                px-2
                py-2
                rounded
                hover:bg-gray-100
                dark:hover:bg-gray-700

                ${
                  priorityFilter === ""
                    ? "bg-gray-200 dark:bg-gray-700 font-semibold"
                    : ""
                }
              `}
            >
              {UI_TEXT.views.all}
            </button>

            {PRIORITIES.filter((p) => p.label).map(
              (priority) => (
                <button
                  key={priority.label}
                  onClick={() => {
                    setPriorityFilter(priority.label);
                    setShowPriorityFilter(false);
                  }}
                  className={`
                    block
                    w-full
                    text-left
                    px-2
                    py-2
                    rounded
                    hover:bg-gray-100
                    dark:hover:bg-gray-700

                    ${
                      priorityFilter ===
                      priority.label
                        ? "bg-gray-200 dark:bg-gray-700 font-semibold"
                        : ""
                    }
                  `}
                >
                  {priority.label}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
