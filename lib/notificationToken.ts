import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function saveNotificationToken(
  familyCode: string,
  username: string,
  token: string
) {

  await setDoc(
    doc(
      db,
      "families",
      familyCode,
      "users",
      username
    ),
    {
      notificationToken: token,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );

}