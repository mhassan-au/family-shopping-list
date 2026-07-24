import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

export async function sendNotification(
  familyCode: string,
  from: string,
  to: string,
  messageId: string,
  message: string
) {

  await addDoc(
    collection(db, "notification_requests"),
    {
      familyCode,
      from,
      to,
      messageId,
      message,
      status: "pending",
      createdAt: serverTimestamp(),
    }
  );

}