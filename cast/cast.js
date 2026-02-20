// /cast/cast.js
import { auth, db } from "../auth/firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc
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

    // Only allow cast/admin/super to see cast dashboard
    if (!["cast", "admin", "super"].includes(data.role)) {
      window.location.href = "/auth/login.html";
      return;
    }

    currentPB = data.practiceBaseId || null;

    // Cast must have a PB; admin/super can have null
    if (!currentPB && data.role === "cast") {
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

  $("#main").innerHTML = `<h2>Announcements</h2><div id="annList"></div>`;
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
}

async function loadSchedule() {
  showLoader();
  const q = query(
    collection(db, "schedule"),
    where("practiceBaseId", "==", currentPB),
    orderBy("sortTimestamp", "asc")
  );
  const snap = await getDocs(q);

  $("#main").innerHTML = `<h2>Rehearsals</h2><div id="schedList"></div>`;
  const list = $("#schedList");

  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div>
        <strong>${x.title}</strong><br>
        <span>${x.date} • ${x.time} • ${x.who}</span>
      </div>
    `;
  });
}

function setupUI() {
  document.getElementById("nav-ann").onclick = loadAnnouncements;
  document.getElementById("nav-sched").onclick = loadSchedule;

  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    window.location.href = "/auth/login.html";
  };

  loadAnnouncements();
}

initAuth();
