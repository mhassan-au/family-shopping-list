import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { db } from "./firebase";


export const shoppingCollection = collection(
  db,
  "shopping_items"
);


export const shoppingQuery = query(
  shoppingCollection,
  orderBy("createdAt", "asc")
);


export async function addItem(text: string) {

  if (!text.trim()) return;

  await addDoc(shoppingCollection, {

    text: text.trim(),

    completed: false,

    shop: "",

    createdAt: serverTimestamp(),

  });

}


export async function toggleItem(
  id: string,
  completed: boolean
) {

  await updateDoc(
    doc(db, "shopping_items", id),
    {
      completed: !completed,
    }
  );

}


export async function deleteItem(
  id: string
) {

  await deleteDoc(
    doc(db, "shopping_items", id)
  );

}

export async function clearCompleted() {

  const snapshot = await getDocs(shoppingCollection);

  const batch = writeBatch(db);


  snapshot.docs.forEach((item) => {

    const data = item.data();


    if (data.completed === true) {

      batch.delete(item.ref);

    }

  });


  await batch.commit();

}