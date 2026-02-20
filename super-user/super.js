// /super-user/super.js
import { auth, db } from "../auth/firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

    if (data.role !== "super") {
      if (data.role === "admin") window.location.href = "/admin/";
      else window.location.href = "/cast/";
      return;
    }

    setupUI();
  });
}

async function loadDashboard() {
  showLoader();
  const pbCount = (await getDocs(collection(db, "practicebases"))).size;
  const userCount = (await getDocs(collection(db, "users"))).size;
  const adminCount = (await getDocs(query(collection(db, "users"), where("role", "==", "admin")))).size;

  $("#main").innerHTML = `
    <h2>Super Dashboard</h2>
    <div>PracticeBases: ${pbCount}</div>
    <div>Admins: ${adminCount}</div>
    <div>Users: ${userCount}</div>
  `;
}

async function loadPracticeBases() {
  showLoader();
  const snap = await getDocs(collection(db, "practicebases"));

  $("#main").innerHTML = `
    <h2>PracticeBases</h2>
    <form id="pbForm">
      <input id="pbName" placeholder="Name">
      <input id="pbCode" placeholder="Code">
      <button type="submit">Save</button>
    </form>
    <div id="pbList"></div>
  `;

  const list = $("#pbList");
  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div>
        <strong>${x.name}</strong> (${x.code})
      </div>
    `;
  });

  document.getElementById("pbForm").onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("pbName").value.trim();
    const code = document.getElementById("pbCode").value.trim().toUpperCase();
    if (!name || !code) return;

    await addDoc(collection(db, "practicebases"), {
      name,
      code,
      createdAt: serverTimestamp()
    });

    loadPracticeBases();
  };
}

function setupUI() {
  document.getElementById("nav-dash").onclick = loadDashboard;
  document.getElementById("nav-pb").onclick = loadPracticeBases;

  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    window.location.href = "/auth/login.html";
  };

  loadDashboard();
}

initAuth();
