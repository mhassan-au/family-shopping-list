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

  setPriorityFilter

}: Props) {


  // Filter dropdown state

  const [showPriorityFilter, setShowPriorityFilter] =
    useState(false);


  return (

    <div className="
      flex
      flex-wrap
      justify-between
      items-center
      gap-2
      mb-4
    ">


      {/* View Mode Buttons */}

      <div className="
        flex
        gap-2
        flex-wrap
      ">


        <button

          onClick={() => setViewMode("flat")}

          className={`
          px-3
          py-1
          rounded
          ${viewMode === "flat"
              ? "bg-black text-white"
              : "bg-gray-200"
            }
          `}

        >

          Flat

        </button>


        <button

          onClick={() => setViewMode("shop")}

          className={`
          px-3
          py-1
          rounded
          ${viewMode === "shop"
              ? "bg-black text-white"
              : "bg-gray-200"
            }
          `}

        >

          Shop

        </button>


        <button

          onClick={() => setViewMode("category")}

          className={`
          px-3
          py-1
          rounded
          ${viewMode === "category"
              ? "bg-black text-white"
              : "bg-gray-200"
            }
          `}

        >

          Category

        </button>


      </div>



      {/* Priority Filter */}

      <div className="flex items-center gap-2">

        {/* Current Filter */}

        {priorityFilter && (

          <span

            className={`
      px-2
      py-1
      rounded-full
      text-xs
      font-semibold
      ${getTagColor(priorityFilter)}
      `}

          >

            {priorityFilter}

          </span>

        )}


        <div className="relative">

          <button

            onClick={() => {

              setShowPriorityFilter(
                !showPriorityFilter
              );

            }}

            className={`
      p-2
      rounded-lg
      ${priorityFilter
                ? "bg-red-100"
                : "bg-gray-200"
              }
      `}

          >

            <FiFilter size={20} />

          </button>


          {showPriorityFilter && (

            <div
              className="
        absolute
        right-0
        mt-2
        bg-white
        border
        rounded-lg
        shadow
        p-2
        z-20
        w-40
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
          ${priorityFilter === ""
                    ? "bg-gray-200 font-bold"
                    : ""
                  }
          `}
              >

                All

              </button>


              {PRIORITIES.map(priority => (

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
            ${priorityFilter === priority.label
                      ? "bg-gray-200 font-bold"
                      : ""
                    }
            `}
                >

                  {priority.label}

                </button>

              ))}

            </div>

          )}

        </div>

      </div>


    </div>

  );

}