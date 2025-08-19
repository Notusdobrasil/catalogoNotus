// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFDhJBh_x-qObsdNc8ER_TtgsTyxImduo",
  authDomain: "notusauth.firebaseapp.com",
  projectId: "notusauth",
  storageBucket: "notusauth.appspot.com",
  messagingSenderId: "664148141431",
  appId: "1:664148141431:web:aee809c797115fbf12ad72",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
