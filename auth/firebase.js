import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZ09Rpe0cVAJsm-IvdfAzQ_syYTEZZhOE",
  authDomain: "duckersdevapi.firebaseapp.com",
  projectId: "duckersdevapi",
  storageBucket: "duckersdevapi.firebasestorage.app",
  messagingSenderId: "185659028396",
  appId: "1:185659028396:web:79168ac252d8b725334009",
  measurementId: "G-NLX9C7ZXNH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
