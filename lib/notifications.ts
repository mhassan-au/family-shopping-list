import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";


export async function saveNotificationDevice(
  token: string,
  name: string
) {

  await addDoc(
    collection(db, "notification_devices"),
    {
      name,
      token,
      createdAt: serverTimestamp(),
    }
  );

}