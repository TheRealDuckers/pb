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

let currentUser = null;
let currentPB = null;

const $ = (sel) => document.querySelector(sel);

function showLoader() {
  $("#main").innerHTML = `<div class="page-loader"></div>`;
}

function setActive(section) {
  document.querySelectorAll(".nav-item[data-section]").forEach(i => {
    i.classList.toggle("active", i.dataset.section === section);
  });
}

function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/auth/login.html";
      return;
    }

    // Load user doc
    const udoc = await getDoc(doc(db, "users", user.uid));
    if (!udoc.exists()) {
      window.location.href = "/auth/login.html";
      return;
    }

    const data = udoc.data();

    // Allowed roles for cast dashboard
    if (!["cast", "admin", "super"].includes(data.role)) {
      window.location.href = "/auth/login.html";
      return;
    }

    currentUser = user;
    currentPB = data.practiceBaseId || null;

    // Cast MUST have a PB
    if (!currentPB && data.role === "cast") {
      window.location.href = "/auth/login.html";
      return;
    }

    startUI();
  });
}

// ANNOUNCEMENTS
async function loadAnnouncements() {
  showLoader();
  const q = query(
    collection(db, "announcements"),
    where("practiceBaseId", "==", currentPB),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">Announcements</h2>
    </div>
    <div class="list" id="annList"></div>
  `;

  const list = $("#annList");
  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div>
          <strong>${x.title}</strong><br>
          <div>${x.message}</div>
        </div>
      </div>
    `;
  });
}

// SCHEDULE
async function loadSchedule() {
  showLoader();
  const q = query(
    collection(db, "schedule"),
    where("practiceBaseId", "==", currentPB),
    orderBy("sortTimestamp", "asc")
  );
  const snap = await getDocs(q);

  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">Rehearsals</h2>
    </div>
    <div class="list" id="schedList"></div>
  `;

  const list = $("#schedList");
  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div>
          <strong>${x.title}</strong><br>
          <div>${x.date} • ${x.time} • ${x.who}</div>
          ${x.extra ? `<div>${x.extra}</div>` : ""}
        </div>
      </div>
    `;
  });
}

// TRACKS
async function loadTracks() {
  showLoader();
  const q = query(
    collection(db, "tracks"),
    where("practiceBaseId", "==", currentPB),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">Tracks</h2>
    </div>
    <div class="list" id="tracksList"></div>
  `;

  const list = $("#tracksList");
  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div><strong>${x.title}</strong></div>
        <a class="btn outline small" href="${x.url}" target="_blank">Open</a>
      </div>
    `;
  });
}

// VIDEOS
async function loadVideos() {
  showLoader();
  const q = query(
    collection(db, "videos"),
    where("practiceBaseId", "==", currentPB),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">Videos</h2>
    </div>
    <div class="list" id="videosList"></div>
  `;

  const list = $("#videosList");
  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div><strong>${x.title}</strong></div>
        <a class="btn outline small" href="${x.url}" target="_blank">Open</a>
      </div>
    `;
  });
}

function startUI() {
  document.querySelectorAll(".nav-item[data-section]").forEach(item => {
    item.addEventListener("click", () => {
      const s = item.dataset.section;
      setActive(s);
      if (s === "announcements") loadAnnouncements();
      if (s === "schedule") loadSchedule();
      if (s === "tracks") loadTracks();
      if (s === "videos") loadVideos();
    });
  });

  $("#logoutBtn").onclick = async () => {
    await signOut(auth);
    window.location.href = "/auth/login.html";
  };

  setActive("announcements");
  loadAnnouncements();
}

initAuth();
