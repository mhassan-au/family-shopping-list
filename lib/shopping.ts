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

export const shoppingCollection = collection(db, "shopping_items");

export const shoppingQuery = query(
  shoppingCollection,
  orderBy("createdAt", "asc"),
);

export async function addItem(
  text: string,
  shop: string,
  category: string,
  priority: string,
) {
  if (!text.trim()) return;

  const items = text
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  for (const item of items) {
    await addDoc(shoppingCollection, {
      text: item,

      completed: false,

      shop,

      category,

      priority,

      createdAt: serverTimestamp(),
    });
  }
}

export async function updateItemDetails(
  id: string,
  shop: string,
  category: string,
  priority: string,
) {
  await updateDoc(doc(db, "shopping_items", id), {
    shop,
    category,
    priority,
  });
}

export async function toggleItem(id: string, completed: boolean) {
  await updateDoc(doc(db, "shopping_items", id), {
    completed: !completed,
  });
}

export async function deleteItem(id: string) {
  await deleteDoc(doc(db, "shopping_items", id));
}

export async function clearCompleted() {
  const snapshot = await getDocs(shoppingCollection);

  const batch = writeBatch(db);

  let count = 0;

  snapshot.docs.forEach((item) => {
    const data = item.data();

    if (data.completed === true) {
      batch.delete(item.ref);

      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
  }
}
