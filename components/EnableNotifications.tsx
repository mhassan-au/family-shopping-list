"use client";

import { requestNotificationPermission } from "@/lib/messaging";
import { saveNotificationDevice } from "@/lib/notifications";


export default function EnableNotifications() {


  async function enableNotifications() {

    try {

      const token =
        await requestNotificationPermission();


      await saveNotificationDevice(
        token,
        "Amina Phone"
      );


      alert("Notifications enabled");


    } catch (error) {

      console.error(error);

      alert("Could not enable notifications");

    }

  }


  return (

    <button
      onClick={enableNotifications}
      className="
      bg-black
      text-white
      rounded-lg
      px-4
      py-2
      "
    >
      🔔 Enable Notifications
    </button>

  );

}