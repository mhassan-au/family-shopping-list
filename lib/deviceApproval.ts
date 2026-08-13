import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function isDeviceApproved(uid: string) {
  const snapshot = await getDoc(doc(db, "approved_devices", uid));

  return snapshot.exists() && snapshot.data().approved === true;
}

export async function requestDeviceApproval(
  uid: string,
  familyCode: string,
  username: string,
) {
  await setDoc(
    doc(db, "pending_devices", uid),
    {
      familyCode,
      username: username.toLowerCase(),
      requestedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
