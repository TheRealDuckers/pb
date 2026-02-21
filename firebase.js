// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// -----------------------------------------
//  FIREBASE CONFIG
// -----------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCZ09Rpe0cVAJsm-IvdfAzQ_syYTEZZhOE",
  authDomain: "duckersdevapi.firebaseapp.com",
  projectId: "duckersdevapi",
  storageBucket: "duckersdevapi.firebasestorage.app",
  messagingSenderId: "185659028396",
  appId: "1:185659028396:web:79168ac252d8b725334009",
  measurementId: "G-NLX9C7ZXNH"
};

// -----------------------------------------
//  INIT
// -----------------------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// -----------------------------------------
//  EXPORTS
// -----------------------------------------
export {
  app,
  auth,
  db,

  // Auth
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,

  // Firestore
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
};
