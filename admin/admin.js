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
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ============================================================
   GLOBAL STATE
============================================================ */
let currentUser = null;
let currentUserEmail = null;
let currentPracticeBaseId = null;

/* ============================================================
   HELPERS
============================================================ */
const $ = (id) => document.getElementById(id);

function status(msg, type = "info") {
  const bar = $("status");
  if (!bar) return;
  bar.textContent = msg;
  bar.style.background = type === "error" ? "#b00020" : "#111";
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
    if (data.role !== "admin") {
      window.location.href = "/cast/";
      return;
    }

    currentPracticeBaseId = data.practiceBaseId;
    if (!currentPracticeBaseId) {
      status("No PracticeBase assigned.", "error");
      return;
    }

    startUI();
  });
}

/* ============================================================
   FIRESTORE HELPERS (PB‑SCOPED)
============================================================ */
function pbCollection(name) {
  return query(
    collection(db, name),
    where("practiceBaseId", "==", currentPracticeBaseId)
  );
}

function pbOrdered(name, field, direction = "asc") {
  return query(
    collection(db, name),
    where("practiceBaseId", "==", currentPracticeBaseId),
    orderBy(field, direction)
  );
}

/* ============================================================
   ANNOUNCEMENTS
============================================================ */
async function loadAnnouncements() {
  const list = $("announcementsList");
  list.innerHTML = "Loading…";

  const snap = await getDocs(
    pbOrdered("announcements", "createdAt", "desc")
  );

  list.innerHTML = "";
  snap.forEach((d) => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div class="list-item-main">
          <strong>${x.title}</strong><br>
          <div>${x.message}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn small outline" onclick="editAnnouncement('${d.id}')">Edit</button>
          <button class="btn small outline" onclick="deleteAnnouncement('${d.id}')">Delete</button>
        </div>
      </div>
    `;
  });
}

window.editAnnouncement = async function (id) {
  const snap = await getDoc(doc(db, "announcements", id));
  if (!snap.exists()) return;

  const x = snap.data();
  $("announcementTitle").value = x.title;
  $("announcementMessage").value = x.message;
  window.editingAnnouncementId = id;
  status("Editing announcement…");
};

window.deleteAnnouncement = async function (id) {
  await deleteDoc(doc(db, "announcements", id));
  status("Announcement deleted.");
  loadAnnouncements();
};

$("announcementForm").onsubmit = async (e) => {
  e.preventDefault();

  const title = $("announcementTitle").value.trim();
  const message = $("announcementMessage").value.trim();

  if (!title && !message) return;

  const data = {
    title,
    message,
    practiceBaseId: currentPracticeBaseId,
    createdAt: serverTimestamp()
  };

  if (window.editingAnnouncementId) {
    await updateDoc(doc(db, "announcements", window.editingAnnouncementId), data);
    window.editingAnnouncementId = null;
    status("Announcement updated.");
  } else {
    await addDoc(collection(db, "announcements"), data);
    status("Announcement created.");
  }

  $("announcementForm").reset();
  loadAnnouncements();
};

/* ============================================================
   SCHEDULE
============================================================ */
async function loadSchedule() {
  const list = $("scheduleList");
  list.innerHTML = "Loading…";

  const snap = await getDocs(
    pbOrdered("schedule", "sortTimestamp", "asc")
  );

  list.innerHTML = "";
  snap.forEach((d) => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div class="list-item-main">
          <strong>${x.title}</strong><br>
          <div>${x.date} • ${x.time} • ${x.who}</div>
          ${x.extra ? `<div>${x.extra}</div>` : ""}
        </div>
        <div class="list-item-actions">
          <button class="btn small outline" onclick="editSchedule('${d.id}')">Edit</button>
          <button class="btn small outline" onclick="deleteSchedule('${d.id}')">Delete</button>
        </div>
      </div>
    `;
  });
}

window.editSchedule = async function (id) {
  const snap = await getDoc(doc(db, "schedule", id));
  if (!snap.exists()) return;

  const x = snap.data();
  $("scheduleTitle").value = x.title;
  $("scheduleDate").value = x.date;
  $("scheduleTime").value = x.time;
  $("scheduleWho").value = x.who;
  $("scheduleExtra").value = x.extra || "";
  window.editingScheduleId = id;
  status("Editing schedule…");
};

window.deleteSchedule = async function (id) {
  await deleteDoc(doc(db, "schedule", id));
  status("Schedule deleted.");
  loadSchedule();
};

$("scheduleForm").onsubmit = async (e) => {
  e.preventDefault();

  const title = $("scheduleTitle").value.trim();
  const date = $("scheduleDate").value.trim();
  const time = $("scheduleTime").value.trim();
  const who = $("scheduleWho").value.trim();
  const extra = $("scheduleExtra").value.trim();

  const data = {
    title,
    date,
    time,
    who,
    extra,
    practiceBaseId: currentPracticeBaseId,
    sortTimestamp: new Date(`${date} ${time}`).getTime(),
    createdAt: serverTimestamp()
  };

  if (window.editingScheduleId) {
    await updateDoc(doc(db, "schedule", window.editingScheduleId), data);
    window.editingScheduleId = null;
    status("Schedule updated.");
  } else {
    await addDoc(collection(db, "schedule"), data);
    status("Schedule created.");
  }

  $("scheduleForm").reset();
  loadSchedule();
};

/* ============================================================
   TRACKS
============================================================ */
async function loadTracks() {
  const list = $("tracksList");
  list.innerHTML = "Loading…";

  const snap = await getDocs(
    pbOrdered("tracks", "createdAt", "desc")
  );

  list.innerHTML = "";
  snap.forEach((d) => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div class="list-item-main">
          <strong>${x.title}</strong>
        </div>
        <div class="list-item-actions">
          <button class="btn small outline" onclick="editTrack('${d.id}')">Edit</button>
          <button class="btn small outline" onclick="deleteTrack('${d.id}')">Delete</button>
        </div>
      </div>
    `;
  });
}

window.editTrack = async function (id) {
  const snap = await getDoc(doc(db, "tracks", id));
  if (!snap.exists()) return;

  const x = snap.data();
  $("trackTitle").value = x.title;
  $("trackUrl").value = x.url;
  window.editingTrackId = id;
  status("Editing track…");
};

window.deleteTrack = async function (id) {
  await deleteDoc(doc(db, "tracks", id));
  status("Track deleted.");
  loadTracks();
};

$("trackForm").onsubmit = async (e) => {
  e.preventDefault();

  const title = $("trackTitle").value.trim();
  const url = $("trackUrl").value.trim();

  const data = {
    title,
    url,
    practiceBaseId: currentPracticeBaseId,
    createdAt: serverTimestamp()
  };

  if (window.editingTrackId) {
    await updateDoc(doc(db, "tracks", window.editingTrackId), data);
    window.editingTrackId = null;
    status("Track updated.");
  } else {
    await addDoc(collection(db, "tracks"), data);
    status("Track created.");
  }

  $("trackForm").reset();
  loadTracks();
};

/* ============================================================
   VIDEOS
============================================================ */
async function loadVideos() {
  const list = $("videosList");
  list.innerHTML = "Loading…";

  const snap = await getDocs(
    pbOrdered("videos", "createdAt", "desc")
  );

  list.innerHTML = "";
  snap.forEach((d) => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div class="list-item-main">
          <strong>${x.title}</strong>
        </div>
        <div class="list-item-actions">
          <button class="btn small outline" onclick="editVideo('${d.id}')">Edit</button>
          <button class="btn small outline" onclick="deleteVideo('${d.id}')">Delete</button>
        </div>
      </div>
    `;
  });
}

window.editVideo = async function (id) {
  const snap = await getDoc(doc(db, "videos", id));
  if (!snap.exists()) return;

  const x = snap.data();
  $("videoTitle").value = x.title;
  $("videoUrl").value = x.url;
  window.editingVideoId = id;
  status("Editing video…");
};

window.deleteVideo = async function (id) {
  await deleteDoc(doc(db, "videos", id));
  status("Video deleted.");
  loadVideos();
};

$("videoForm").onsubmit = async (e) => {
  e.preventDefault();

  const title = $("videoTitle").value.trim();
  const url = $("videoUrl").value.trim();

  const data = {
    title,
    url,
    practiceBaseId: currentPracticeBaseId,
    createdAt: serverTimestamp()
  };

  if (window.editingVideoId) {
    await updateDoc(doc(db, "videos", window.editingVideoId), data);
    window.editingVideoId = null;
    status("Video updated.");
  } else {
    await addDoc(collection(db, "videos"), data);
    status("Video created.");
  }

  $("videoForm").reset();
  loadVideos();
};

/* ============================================================
   USERS (READ‑ONLY)
============================================================ */
async function loadUsers() {
  const list = $("usersList");
  list.innerHTML = "Loading…";

  const snap = await getDocs(
    pbCollection("users")
  );

  list.innerHTML = "";
  snap.forEach((d) => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div class="list-item-main">
          <strong>${x.username}</strong><br>
          <div class="small">${x.email} — ${x.role}</div>
        </div>
      </div>
    `;
  });
}

/* ============================================================
   NAVIGATION
============================================================ */
function startUI() {
  $("adminEmail").textContent = currentUserEmail;

  $("navAnnouncements").onclick = () => loadAnnouncements();
  $("navSchedule").onclick = () => loadSchedule();
  $("navTracks").onclick = () => loadTracks();
  $("navVideos").onclick = () => loadVideos();
  $("navUsers").onclick = () => loadUsers();

  $("signOutBtn").onclick = async () => {
    await signOut(auth);
    window.location.href = "/auth/login.html";
  };

  loadAnnouncements();
}

/* ============================================================
   START
============================================================ */
initAuth();
