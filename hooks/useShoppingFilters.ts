"use client";

import { useMemo } from "react";
import { ShoppingItem } from "@/lib/types";


export function useShoppingFilters(

  items: ShoppingItem[],

  viewMode: "flat" | "shop" | "category",

  priorityFilter: string

){


  // Filter and group items

  const groupedItems = useMemo(()=>{


    const filteredItems = priorityFilter

      ? items.filter(
          item =>
          item.priority === priorityFilter
        )

      : items;



    if(viewMode==="flat"){

      return {

        Flat: filteredItems

      };

    }



    const groups:
    Record<string,ShoppingItem[]> = {};



    filteredItems.forEach(item=>{


      const key =

        viewMode==="shop"

        ? (item.shop || "No Shop")

        : (item.category || "No Category");



      if(!groups[key]){

        groups[key]=[];

      }



      groups[key].push(item);


    });



    return groups;


  },[

    items,

    viewMode,

    priorityFilter

  ]);



  return {

    groupedItems

  };


}