// /admin/admin.js
import { auth, db } from "../auth/firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentPB = null;
const $ = (sel) => document.querySelector(sel);

function showLoader() {
  $("#main").innerHTML = `<div>Loading...</div>`;
}

function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/auth/login.html";
      return;
    }

    const udoc = await getDoc(doc(db, "users", user.uid));
    if (!udoc.exists()) {
      window.location.href = "/auth/login.html";
      return;
    }

    const data = udoc.data();

    if (data.role !== "admin") {
      if (data.role === "super") window.location.href = "/super-user/";
      else window.location.href = "/cast/";
      return;
    }

    currentPB = data.practiceBaseId || null;
    if (!currentPB) {
      window.location.href = "/auth/login.html";
      return;
    }

    setupUI();
  });
}

async function loadAnnouncements() {
  showLoader();
  const q = query(
    collection(db, "announcements"),
    where("practiceBaseId", "==", currentPB),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  $("#main").innerHTML = `
    <h2>Announcements</h2>
    <form id="annForm">
      <input id="annTitle" placeholder="Title">
      <textarea id="annMsg" placeholder="Message"></textarea>
      <button type="submit">Save</button>
    </form>
    <div id="annList"></div>
  `;

  const list = $("#annList");
  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div>
        <strong>${x.title}</strong><br>
        <span>${x.message}</span>
      </div>
    `;
  });

  document.getElementById("annForm").onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById("annTitle").value.trim();
    const message = document.getElementById("annMsg").value.trim();
    if (!title && !message) return;

    await addDoc(collection(db, "announcements"), {
      title,
      message,
      practiceBaseId: currentPB,
      createdAt: serverTimestamp()
    });

    loadAnnouncements();
  };
}

function setupUI() {
  document.getElementById("nav-ann").onclick = loadAnnouncements;

  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    window.location.href = "/auth/login.html";
  };

  loadAnnouncements();
}

initAuth();
