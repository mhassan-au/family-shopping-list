import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./firebase";


export async function requestNotificationPermission() {

  const permission = await Notification.requestPermission();


  if (permission !== "granted") {

    throw new Error("Notification permission denied");

  }


  const messaging = getMessaging(app);


  const token = await getToken(
    messaging,
    {
      vapidKey:
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    }
  );


  return token;

}