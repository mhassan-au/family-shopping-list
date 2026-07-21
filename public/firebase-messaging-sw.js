importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);


firebase.initializeApp({
  apiKey: "AIzaSyCJ67VPynNL4duIBIC1G5tO2pPnjpKksGs",
  authDomain: "family-shopping-list-4fadf.firebaseapp.com",
  projectId: "family-shopping-list-4fadf",
  storageBucket: "family-shopping-list-4fadf.firebasestorage.app",
  messagingSenderId: "391226829341",
  appId: "1:391226829341:web:1d3834495e2ff7a0cf34f4",
});


const messaging = firebase.messaging();


messaging.onBackgroundMessage((payload) => {

  console.log(
    "Background message:",
    payload
  );


  const notificationTitle =
    payload.notification.title;


  const notificationOptions = {

    body: payload.notification.body,

  };


  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );

});