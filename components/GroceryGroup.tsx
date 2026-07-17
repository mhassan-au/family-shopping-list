"use client";

import GroceryItem from "./GroceryItem";
import ItemEditor from "./ItemEditor";
import { ShoppingItem } from "@/lib/types";


interface Props {

  groupName: string;

  groupItems: ShoppingItem[];

  viewMode: "flat" | "shop" | "category";

  editing: ShoppingItem | null;

  setEditing: (item: ShoppingItem | null)=>void;

  onDelete: (item: ShoppingItem)=>void;

  onComplete: (item: ShoppingItem)=>void;

}


export default function GroceryGroup({

  groupName,

  groupItems,

  viewMode,

  editing,

  setEditing,

  onDelete,

  onComplete

}: Props) {


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
          "
        >

          {groupName}

        </div>

      )}



      {/* Group Items */}

      <div className="space-y-2">


        {groupItems.map((item)=>(


          <div key={item.id}>


            <GroceryItem

              item={item}

              onEdit={(item)=>{

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

                close={()=>setEditing(null)}

              />

            )}


          </div>


        ))}


      </div>


    </div>

  );

}