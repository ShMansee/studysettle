import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDuVWY_1vkA2cDXc1m03iNDJH5MxvFR9jg",
  authDomain: "studysettle-baku.firebaseapp.com",
  projectId: "studysettle-baku",
  storageBucket: "studysettle-baku.firebasestorage.app",
  messagingSenderId: "970475471019",
  appId: "1:970475471019:web:660ad0ff831cc10e5c77ee"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const ADMIN_EMAILS = ["amanbekabilmansur@gmail.com"];
