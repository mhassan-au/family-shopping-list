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
  getDoc,
  writeBatch,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";
import { getDeviceLogin } from "./device";
import {
  INPUT_LIMITS,
  isValidItemName,
  parseItemNames,
} from "./validation";

export const shoppingCollection = collection(db, "shopping_items");
export const shoppingPriceHistoryCollection = collection(db, "shopping_price_history");

function normalizePriceHistoryName(text: string) {
  return text.trim().toLocaleLowerCase();
}

function priceHistoryRef(text: string) {
  return doc(shoppingPriceHistoryCollection, encodeURIComponent(normalizePriceHistoryName(text)));
}

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

  const expectedPrices = await Promise.all(
    items.map(async (item) => {
      try {
        const history = await getDoc(priceHistoryRef(item));
        const price = history.data()?.lastUnitPrice;
        return typeof price === "number" && price > 0 ? price : undefined;
      } catch {
        return undefined;
      }
    }),
  );

  items.forEach((item, index) => {
    const itemRef = doc(shoppingCollection);

    batch.set(itemRef, {
      text: item,

      completed: false,

      shop,

      category,

      priority,

      createdBy: device?.username ?? "",

      createdAt: serverTimestamp(),

      ...(expectedPrices[index]
        ? { expectedUnitPrice: expectedPrices[index] }
        : {}),
    });
  });

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
  text: string,
  qty: number,
  unitPrice: number,
  lastQty: number,
  lastUnitPrice: number,
) {
  const ref = doc(db, "shopping_items", id);
  const device = getDeviceLogin();

  await updateDoc(ref, {
    completed: true,

    qty,

    unitPrice,

    lastQty,

    lastUnitPrice,
  });

  if (unitPrice > 0) {
    try {
      await setDoc(priceHistoryRef(text), {
        itemName: text.trim(),
        normalizedName: normalizePriceHistoryName(text),
        lastUnitPrice: unitPrice,
        updatedAt: serverTimestamp(),
        updatedAtMs: Date.now(),
        updatedBy: device?.username ?? "",
      });
    } catch (historyError) {
      console.error("Saving shopping price history failed", historyError);
    }
  }
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
