// /cast/cast.js
import { auth, db } from "../auth/firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ============================================================
   GLOBAL STATE
============================================================ */
let currentUser = null;
let currentUserEmail = null;
let currentUserRole = null;
let currentPracticeBaseId = null;

/* ============================================================
   HELPERS
============================================================ */
const $ = (sel) => document.querySelector(sel);

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"]/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[s]));
}

function showLoader() {
  $("#main").innerHTML = `<div class="page-loader"></div>`;
}

function setActive(section) {
  document.querySelectorAll(".nav-item[data-section]").forEach(item => {
    item.classList.toggle("active", item.dataset.section === section);
  });
}

/* ============================================================
   AUTH + ROLE ENFORCEMENT
============================================================ */
function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/auth/login.html";
      return;
    }

    currentUser = user;
    currentUserEmail = user.email;

    const udoc = await getDoc(doc(db, "users", user.uid));
    if (!udoc.exists()) {
      window.location.href = "/auth/login.html";
      return;
    }

    const data = udoc.data();
    currentUserRole = data.role || "cast";
    currentPracticeBaseId = data.practiceBaseId || null;

    if (!currentPracticeBaseId) {
      window.location.href = "/auth/login.html";
      return;
    }

    if (currentUserRole === "admin") {
      window.location.href = "/admin/";
      return;
    }

    // Cast user is valid → start UI
    startUI();
  });
}

/* ============================================================
   FIRESTORE SUBSCRIPTIONS (PracticeBase-filtered)
============================================================ */
function subAnnouncements(cb) {
  return onSnapshot(
    query(
      collection(db, "announcements"),
      where("practiceBaseId", "==", currentPracticeBaseId),
      orderBy("createdAt", "desc"),
      limit(100)
    ),
    cb
  );
}

function subSchedule(cb) {
  return onSnapshot(
    query(
      collection(db, "schedule"),
      where("practiceBaseId", "==", currentPracticeBaseId),
      orderBy("sortTimestamp", "asc")
    ),
    cb
  );
}

function subTracks(cb) {
  return onSnapshot(
    query(
      collection(db, "tracks"),
      where("practiceBaseId", "==", currentPracticeBaseId),
      orderBy("createdAt", "desc")
    ),
    cb
  );
}

function subVideos(cb) {
  return onSnapshot(
    query(
      collection(db, "videos"),
      where("practiceBaseId", "==", currentPracticeBaseId),
      orderBy("createdAt", "desc")
    ),
    cb
  );
}

async function getScriptUrl() {
  const q = query(
    collection(db, "scripts"),
    where("practiceBaseId", "==", currentPracticeBaseId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data().url || null;
}

function subChat(cb) {
  return onSnapshot(
    query(
      collection(db, "chat"),
      where("practiceBaseId", "==", currentPracticeBaseId),
      orderBy("createdAt", "asc")
    ),
    cb
  );
}

async function sendChat(text) {
  if (!text.trim()) return;
  await addDoc(collection(db, "chat"), {
    practiceBaseId: currentPracticeBaseId,
    user: currentUserEmail,
    text: text.trim(),
    createdAt: serverTimestamp()
  });
}

/* ============================================================
   SECTION RENDERERS
============================================================ */
function loadAnnouncements() {
  showLoader();
  setTimeout(() => {
    $("#main").innerHTML = `
      <div class="header-row">
        <div>
          <h2 class="section-title">Announcements</h2>
          <p class="section-sub">Latest updates from your PracticeBase.</p>
        </div>
      </div>
      <div class="card">
        <div id="annList" class="list"></div>
      </div>
    `;

    const list = $("#annList");
    subAnnouncements((snap) => {
      list.innerHTML = "";
      snap.forEach((d) => {
        const x = d.data();
        list.innerHTML += `
          <div class="list-item">
            <div>
              <strong>${escapeHtml(x.title)}</strong>
              <div class="small">${escapeHtml(x.message)}</div>
            </div>
          </div>
        `;
      });
    });
  }, 150);
}

function loadSchedule() {
  showLoader();
  setTimeout(() => {
    $("#main").innerHTML = `
      <div class="header-row">
        <div>
          <h2 class="section-title">Rehearsals</h2>
          <p class="section-sub">Upcoming rehearsals for your PracticeBase.</p>
        </div>
      </div>
      <div class="card">
        <div id="schList" class="list"></div>
      </div>
    `;

    const list = $("#schList");
    subSchedule((snap) => {
      list.innerHTML = "";
      snap.forEach((d) => {
        const x = d.data();
        list.innerHTML += `
          <div class="list-item">
            <div>
              <strong>${escapeHtml(x.title)}</strong>
              <div class="small">${escapeHtml(x.date)} • ${escapeHtml(x.time)} • ${escapeHtml(x.who)}</div>
              ${x.extra ? `<div class="small">${escapeHtml(x.extra)}</div>` : ""}
            </div>
            <div class="pill">${escapeHtml(x.date)}</div>
          </div>
        `;
      });
    });
  }, 150);
}

function loadTracks() {
  showLoader();
  setTimeout(() => {
    $("#main").innerHTML = `
      <div class="header-row">
        <div>
          <h2 class="section-title">Tracks</h2>
          <p class="section-sub">Audio tracks for your PracticeBase.</p>
        </div>
      </div>
      <div class="card">
        <div id="trkList" class="list"></div>
      </div>
    `;

    const list = $("#trkList");
    subTracks((snap) => {
      list.innerHTML = "";
      snap.forEach((d) => {
        const x = d.data();
        list.innerHTML += `
          <div class="list-item">
            <div><strong>${escapeHtml(x.title)}</strong></div>
            <a href="${escapeHtml(x.url)}" target="_blank" class="pill">Open</a>
          </div>
        `;
      });
    });
  }, 150);
}

function loadVideos() {
  showLoader();
  setTimeout(() => {
    $("#main").innerHTML = `
      <div class="header-row">
        <div>
          <h2 class="section-title">Videos</h2>
          <p class="section-sub">Reference and choreography videos.</p>
        </div>
      </div>
      <div class="card">
        <div id="vidList" class="list"></div>
      </div>
    `;

    const list = $("#vidList");
    subVideos((snap) => {
      list.innerHTML = "";
      snap.forEach((d) => {
        const x = d.data();
        list.innerHTML += `
          <div class="list-item">
            <div><strong>${escapeHtml(x.title)}</strong></div>
            <a href="${escapeHtml(x.url)}" target="_blank" class="pill">Open</a>
          </div>
        `;
      });
    });
  }, 150);
}

function loadScript() {
  showLoader();
  setTimeout(async () => {
    const url = await getScriptUrl();
    $("#main").innerHTML = `
      <div class="header-row">
        <div>
          <h2 class="section-title">Script</h2>
          <p class="section-sub">Your PracticeBase script.</p>
        </div>
      </div>
      <div class="card">
        ${
          url
            ? `<a href="${escapeHtml(url)}" target="_blank" class="btn outline">Open Script</a>`
            : `<div class="small">No script uploaded yet.</div>`
        }
      </div>
    `;
  }, 150);
}

function loadChat() {
  showLoader();
  setTimeout(() => {
    $("#main").innerHTML = `
      <div class="header-row">
        <div>
          <h2 class="section-title">Chat</h2>
          <p class="section-sub">Talk with your castmates.</p>
        </div>
      </div>
      <div class="card">
        <div id="chatList" class="list" style="max-height:420px; overflow:auto;"></div>
        <div class="chat-box">
          <input id="chatInput" placeholder="Type a message..." />
          <button id="chatSend" class="btn">Send</button>
        </div>
      </div>
    `;

    const chatList = $("#chatList");
    const chatInput = $("#chatInput");
    const chatSend = $("#chatSend");

    subChat((snap) => {
      chatList.innerHTML = "";
      snap.forEach((d) => {
        const x = d.data();
        const ts = x.createdAt?.toDate?.().toLocaleString() || "";
        chatList.innerHTML += `
          <div class="list-item">
            <div class="chat-message">
              <div style="min-width:140px;">
                <strong>${escapeHtml(x.user)}</strong>
                <div class="chat-meta">${ts}</div>
              </div>
              <div>${escapeHtml(x.text)}</div>
            </div>
          </div>
        `;
      });
      chatList.scrollTop = chatList.scrollHeight;
    });

    chatSend.onclick = async () => {
      await sendChat(chatInput.value);
      chatInput.value = "";
    };

    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") chatSend.click();
    });
  }, 150);
}

/* ============================================================
   ROUTER
============================================================ */
function loadSection(section) {
  setActive(section);
  if (section === "announcements") return loadAnnouncements();
  if (section === "schedule") return loadSchedule();
  if (section === "tracks") return loadTracks();
  if (section === "videos") return loadVideos();
  if (section === "script") return loadScript();
  if (section === "chat") return loadChat();
}

/* ============================================================
   UI INIT
============================================================ */
function startUI() {
  // Wire nav
  document.querySelectorAll(".nav-item[data-section]").forEach(item => {
    item.addEventListener("click", () => {
      loadSection(item.dataset.section);
    });
  });

  // Logout
  $("#logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/auth/login";
  });

  // Default section
  loadSection("announcements");
}

/* ============================================================
   START
============================================================ */
initAuth();
