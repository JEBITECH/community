importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyB5Cddf5NC28y4M2NiR3VzEHQBBvLogOLA",
  authDomain: "erp-app-8a00c.firebaseapp.com",
  projectId: "erp-app-8a00c",
  storageBucket: "erp-app-8a00c.firebasestorage.app",
  messagingSenderId: "264651904748",
  appId: "1:264651904748:web:26e78104fa9d0e58f037c9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background Message:", payload);

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/logo192.png",
    }
  );
});