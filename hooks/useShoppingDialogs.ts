"use client";

import { useState } from "react";
import { ShoppingItem } from "@/lib/types";


export function useShoppingDialogs(){


  // Delete dialog

  const [deleteTarget,setDeleteTarget] =

    useState<ShoppingItem | null>(null);



  // Clear dialog

  const [showClearConfirm,setShowClearConfirm] =

    useState(false);



  // Complete dialog

  const [completingItem,setCompletingItem] =

    useState<ShoppingItem | null>(null);



  return {


    deleteTarget,

    setDeleteTarget,


    showClearConfirm,

    setShowClearConfirm,


    completingItem,

    setCompletingItem


  };


}