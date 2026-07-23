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
        flex
        flex-wrap
        justify-between
        items-center
        gap-2
        mb-4
      "
    >
      {/* View Buttons */}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setViewMode("flat")}
          className={`
            px-3
            py-1.5
            rounded-lg
            border
            transition

            ${
              viewMode === "flat"
                ? "bg-white text-black border-gray-300 font-semibold"
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
            rounded-lg
            border
            transition

            ${
              viewMode === "shop"
                ? "bg-white text-black border-gray-300 font-semibold"
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
            rounded-lg
            border
            transition

            ${
              viewMode === "category"
                ? "bg-white text-black border-gray-300 font-semibold"
                : "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            }
          `}
        >
          Category
        </button>
      </div>

      {/* Filter */}

      <div className="relative">
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