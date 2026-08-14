import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB5Cddf5NC28y4M2NiR3VzEHQBBvLogOLA",
  authDomain: "erp-app-8a00c.firebaseapp.com",
  projectId: "erp-app-8a00c",
  storageBucket: "erp-app-8a00c.firebasestorage.app",
  messagingSenderId: "264651904748",
  appId: "1:264651904748:web:26e78104fa9d0e58f037c9"
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);

