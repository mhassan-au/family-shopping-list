import {
  collection,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { db } from "./firebase";
import { getDeviceLogin } from "./device";
import {
  INPUT_LIMITS,
  isValidItemName,
  parseItemNames,
} from "./validation";

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

  const device = getDeviceLogin();

  const items = parseItemNames(text)
    .map((item) => item.charAt(0).toLocaleUpperCase() + item.slice(1));

  if (
    items.length > INPUT_LIMITS.itemBatch ||
    items.some((item) => !isValidItemName(item))
  ) {
    throw new Error("Invalid shopping item input");
  }

  const batch = writeBatch(db);

  for (const item of items) {
    const itemRef = doc(shoppingCollection);

    batch.set(itemRef, {
      text: item,

      completed: false,

      shop,

      category,

      priority,

      createdBy: device?.username ?? "",

      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
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

export async function completeItem(
  id: string,
  qty: number,
  unitPrice: number,
  lastQty: number,
  lastUnitPrice: number,
) {
  const ref = doc(db, "shopping_items", id);

  await updateDoc(ref, {
    completed: true,

    qty,

    unitPrice,

    lastQty,

    lastUnitPrice,
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
  const snapshot = await getDocs(
    query(shoppingCollection, where("completed", "==", true)),
  );

  const batch = writeBatch(db);

  let count = 0;

  snapshot.docs.forEach((item) => {
    batch.delete(item.ref);

    count++;
  });

  if (count > 0) {
    await batch.commit();
  }
}
