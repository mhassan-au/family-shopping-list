import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJ67VPynNL4duIBIC1G5tO2pPnjpKksGs",
  authDomain: "family-shopping-list-4fadf.firebaseapp.com",
  projectId: "family-shopping-list-4fadf",
  storageBucket: "family-shopping-list-4fadf.firebasestorage.app",
  messagingSenderId: "391226829341",
  appId: "1:391226829341:web:1d3834495e2ff7a0cf34f4",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);