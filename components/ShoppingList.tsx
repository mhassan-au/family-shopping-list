"use client";

import { useEffect, useState } from "react";

import {
  onSnapshot
} from "firebase/firestore";

import {
  shoppingQuery,
  addItem,
  toggleItem,
  deleteItem
} from "@/lib/shopping";

import { ShoppingItem } from "@/lib/types";


export default function ShoppingList() {

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const unsubscribe = onSnapshot(
      shoppingQuery,
      (snapshot) => {

        const data = snapshot.docs.map((doc) => ({

          id: doc.id,

          ...(doc.data() as Omit<ShoppingItem, "id">)

        }));

        setItems(data);

        setLoading(false);

      }
    );


    return () => unsubscribe();


  }, []);



  async function handleAdd() {

    await addItem(newItem);

    setNewItem("");

  }



  return (

    <main className="max-w-md mx-auto p-5">

      <h1 className="text-3xl font-bold mb-6">
        🛒 MyGrocery
      </h1>


      <div className="flex gap-2 mb-5">

        <input

          className="border rounded-lg p-2 flex-1"

          placeholder="Add grocery item"

          value={newItem}

          onChange={(e)=>
            setNewItem(e.target.value)
          }

          onKeyDown={(e)=>{

            if(e.key==="Enter"){
              handleAdd();
            }

          }}

        />


        <button

          onClick={handleAdd}

          className="bg-black text-white px-4 rounded-lg"

        >

          +

        </button>


      </div>



      {loading && (

        <p>
          Loading...
        </p>

      )}



      <div className="space-y-2">


        {items.map((item)=>(


          <div

            key={item.id}

            className="
            flex
            justify-between
            items-center
            border
            rounded-lg
            p-3
            "

          >

            <label className="flex gap-3">


              <input

                type="checkbox"

                checked={item.completed}

                onChange={()=>{

                  toggleItem(
                    item.id,
                    item.completed
                  );

                }}

              />


              <span
                className={
                  item.completed
                  ?
                  "line-through text-gray-400"
                  :
                  ""
                }
              >

                {item.text}

              </span>


            </label>



            <button

              onClick={()=>deleteItem(item.id)}

              className="text-red-500"

            >

              🗑

            </button>


          </div>


        ))}


      </div>


      {!loading && items.length===0 && (

        <p className="text-gray-500 text-center mt-5">

          Your grocery list is empty

        </p>

      )}


    </main>

  );

}