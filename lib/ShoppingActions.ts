import {
  addItem,
  deleteItem,
  clearCompleted,
  completeItem,
  toggleItem
} from "@/lib/shopping";

import { ShoppingItem } from "@/lib/types";



/* Add new grocery item */

export async function addShoppingItem(

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



/* Delete grocery item */

export async function deleteShoppingItem(

  id:string

){

  await deleteItem(id);

}



/* Clear completed */

export async function clearShoppingItems(){

  await clearCompleted();

}



/* Toggle completed */

export async function toggleShoppingItem(

  item:ShoppingItem

){

  await toggleItem(

    item.id,

    item.completed

  );

}



/* Complete item with price */

export async function completeShoppingItem(

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