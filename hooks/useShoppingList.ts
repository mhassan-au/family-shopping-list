"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";

import {
  shoppingQuery,
  addItem,
  toggleItem,
  deleteItem,
  clearCompleted,
  completeItem
} from "@/lib/shopping";

import { ShoppingItem } from "@/lib/types";


export function useShoppingList(){


  // Items State

  const [items,setItems] =
    useState<ShoppingItem[]>([]);


  const [loading,setLoading] =
    useState(true);



  // Firebase Listener

  useEffect(()=>{


    const unsubscribe = onSnapshot(

      shoppingQuery,

      (snapshot)=>{


        const data = snapshot.docs.map(doc=>({

          id:doc.id,

          ...(doc.data() as Omit<ShoppingItem,"id">)

        }));


        setItems(data);

        setLoading(false);


      }

    );


    return ()=>unsubscribe();


  },[]);



  // Add Item

  async function handleAdd(

    text:string,

    shop:string,

    category:string,

    priority:string

  ){


    await addItem(

      text,

      shop,

      category,

      priority

    );


  }



  // Toggle Completed

  async function handleToggle(

    item:ShoppingItem

  ){


    await toggleItem(

      item.id,

      item.completed

    );


  }




  // Delete Item

  async function handleDelete(

    id:string

  ){


    await deleteItem(id);


  }




  // Clear Completed

  async function handleClear(){


    await clearCompleted();


  }





  // Complete Item With Price

  async function handleComplete(

    item:ShoppingItem,

    qty:number,

    unitPrice:number

  ){


    await completeItem(

      item.id,

      qty,

      unitPrice,

      qty,

      unitPrice

    );


  }




  return {


    items,

    loading,


    handleAdd,

    handleToggle,

    handleDelete,

    handleClear,

    handleComplete


  };


}