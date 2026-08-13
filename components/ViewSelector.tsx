"use client";

import { useState } from "react";
import { FiFilter } from "react-icons/fi";
import { PRIORITIES } from "@/lib/config";
import { getTagColor } from "@/lib/tagColor";

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
    <div
      className="
        mb-4
      "
    >
      {/* View Buttons */}

      <div className="grid w-full grid-cols-3 gap-2">
        <button
          onClick={() => setViewMode("flat")}
          className={`
            px-3
            py-1.5
            text-sm
            rounded-lg
            border
            transition

            ${
              viewMode === "flat"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
                : "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            }
          `}
        >
          Flat
        </button>

        <button
          onClick={() => setViewMode("shop")}
          className={`
            px-3
            py-1.5
            text-sm
            rounded-lg
            border
            transition

            ${
              viewMode === "shop"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
                : "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            }
          `}
        >
          Shop
        </button>

        <button
          onClick={() => setViewMode("category")}
          className={`
            px-3
            py-1.5
            text-sm
            rounded-lg
            border
            transition

            ${
              viewMode === "category"
                ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
                : "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            }
          `}
        >
          Category
        </button>
      </div>

      {/* Filter */}

      <div className="relative mt-2 flex justify-end">
        <button
          onClick={() =>
            setShowPriorityFilter(!showPriorityFilter)
          }
          className={`
            flex
            items-center
            gap-2
            px-3
            py-2
            rounded-lg
            border

            ${
              priorityFilter
                ? `${getTagColor(priorityFilter)} border-transparent`
                : "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            }
          `}
        >
          <FiFilter size={18} />

          <span className="text-sm font-medium">
            {priorityFilter || "All"}
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
              All
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
