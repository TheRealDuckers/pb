// /admin/admin.js

import { auth, db } from "../auth/firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const $ = id => document.getElementById(id);

function status(msg, type = "info") {
  const bar = $("status");
  if (!bar) return;
  bar.textContent = msg;
  bar.style.background = type === "error" ? "#b00020" : "#111";
}

/* ------------------------------------------------------------------ */
/*  AUTH + ROLE GUARD                                                 */
/* ------------------------------------------------------------------ */

async function isAdmin(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() && snap.data().role === "admin";
}

function showSection(id) {
  const sections = [
    "sectionAnnouncements",
    "sectionSchedule",
    "sectionTracks",
    "sectionVideos",
    "sectionUsers"
  ];
  sections.forEach(sid => {
    const el = $(sid);
    if (!el) return;
    el.classList.toggle("active", sid === id);
  });
}

function setupNav() {
  $("navAnnouncements").onclick = () => showSection("sectionAnnouncements");
  $("navSchedule").onclick = () => showSection("sectionSchedule");
  $("navTracks").onclick = () => showSection("sectionTracks");
  $("navVideos").onclick = () => showSection("sectionVideos");
  $("navUsers").onclick = () => showSection("sectionUsers");
}

function setupSignOut() {
  const btn = $("signOutBtn");
  if (!btn) return;
  btn.onclick = async () => {
    await signOut(auth);
    status("Signed out.");
    setTimeout(() => {
      window.location.href = "/auth/login.html";
    }, 400);
  };
}

/* ------------------------------------------------------------------ */
/*  ANNOUNCEMENTS                                                     */
/* ------------------------------------------------------------------ */

let editingAnnouncementId = null;

async function loadAnnouncements() {
  const list = $("announcementsList");
  if (!list) return;
  list.innerHTML = "Loading…";

  const q = query(
    collection(db, "announcements"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);

  list.innerHTML = "";
  snap.forEach(docSnap => {
    const a = docSnap.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div class="list-item-main">
        <strong>${a.title || "(no title)"}</strong><br>
        <div>${a.message || ""}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn small outline" data-id="${docSnap.id}" data-action="edit">Edit</button>
        <button class="btn small outline" data-id="${docSnap.id}" data-action="delete">Delete</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll("button").forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.onclick = async () => {
      if (action === "edit") {
        const ref = doc(db, "announcements", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const a = snap.data();
          $("announcementTitle").value = a.title || "";
          $("announcementMessage").value = a.message || "";
          editingAnnouncementId = id;
          status("Editing announcement…");
        }
      } else if (action === "delete") {
        await deleteDoc(doc(db, "announcements", id));
        status("Announcement deleted.");
        editingAnnouncementId = null;
        $("announcementForm").reset();
        loadAnnouncements();
      }
    };
  });
}

function setupAnnouncementsForm() {
  const form = $("announcementForm");
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();
    const title = $("announcementTitle").value.trim();
    const message = $("announcementMessage").value.trim();

    if (!title && !message) {
      status("Enter a title or message.", "error");
      return;
    }

    const data = {
      title,
      message,
      createdAt: serverTimestamp()
    };

    if (editingAnnouncementId) {
      await updateDoc(doc(db, "announcements", editingAnnouncementId), data);
      status("Announcement updated.");
    } else {
      await addDoc(collection(db, "announcements"), data);
      status("Announcement created.");
    }

    editingAnnouncementId = null;
    form.reset();
    loadAnnouncements();
  };
}

/* ------------------------------------------------------------------ */
/*  SCHEDULE (simple example)                                         */
/* ------------------------------------------------------------------ */

let editingScheduleId = null;

async function loadSchedule() {
  const list = $("scheduleList");
  if (!list) return;
  list.innerHTML = "Loading…";

  const q = query(
    collection(db, "schedule"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);

  list.innerHTML = "";
  snap.forEach(docSnap => {
    const s = docSnap.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div class="list-item-main">
        <strong>${s.title || "(no title)"} </strong><br>
        <div>${s.time || ""}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn small outline" data-id="${docSnap.id}" data-action="edit">Edit</button>
        <button class="btn small outline" data-id="${docSnap.id}" data-action="delete">Delete</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll("button").forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.onclick = async () => {
      if (action === "edit") {
        const ref = doc(db, "schedule", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const s = snap.data();
          $("scheduleTitle").value = s.title || "";
          $("scheduleTime").value = s.time || "";
          editingScheduleId = id;
          status("Editing schedule item…");
        }
      } else if (action === "delete") {
        await deleteDoc(doc(db, "schedule", id));
        status("Schedule item deleted.");
        editingScheduleId = null;
        $("scheduleForm").reset();
        loadSchedule();
      }
    };
  });
}

function setupScheduleForm() {
  const form = $("scheduleForm");
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();
    const title = $("scheduleTitle").value.trim();
    const time = $("scheduleTime").value.trim();

    if (!title) {
      status("Enter a title.", "error");
      return;
    }

    const data = {
      title,
      time,
      createdAt: serverTimestamp()
    };

    if (editingScheduleId) {
      await updateDoc(doc(db, "schedule", editingScheduleId), data);
      status("Schedule item updated.");
    } else {
      await addDoc(collection(db, "schedule"), data);
      status("Schedule item created.");
    }

    editingScheduleId = null;
    form.reset();
    loadSchedule();
  };
}

/* ------------------------------------------------------------------ */
/*  TRACKS (simple example)                                           */
/* ------------------------------------------------------------------ */

let editingTrackId = null;

async function loadTracks() {
  const list = $("tracksList");
  if (!list) return;
  list.innerHTML = "Loading…";

  const q = query(
    collection(db, "tracks"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);

  list.innerHTML = "";
  snap.forEach(docSnap => {
    const t = docSnap.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div class="list-item-main">
        <strong>${t.name || "(no name)"}</strong>
      </div>
      <div class="list-item-actions">
        <button class="btn small outline" data-id="${docSnap.id}" data-action="edit">Edit</button>
        <button class="btn small outline" data-id="${docSnap.id}" data-action="delete">Delete</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll("button").forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.onclick = async () => {
      if (action === "edit") {
        const ref = doc(db, "tracks", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const t = snap.data();
          $("trackName").value = t.name || "";
          editingTrackId = id;
          status("Editing track…");
        }
      } else if (action === "delete") {
        await deleteDoc(doc(db, "tracks", id));
        status("Track deleted.");
        editingTrackId = null;
        $("trackForm").reset();
        loadTracks();
      }
    };
  });
}

function setupTracksForm() {
  const form = $("trackForm");
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();
    const name = $("trackName").value.trim();

    if (!name) {
      status("Enter a track name.", "error");
      return;
    }

    const data = {
      name,
      createdAt: serverTimestamp()
    };

    if (editingTrackId) {
      await updateDoc(doc(db, "tracks", editingTrackId), data);
      status("Track updated.");
    } else {
      await addDoc(collection(db, "tracks"), data);
      status("Track created.");
    }

    editingTrackId = null;
    form.reset();
    loadTracks();
  };
}

/* ------------------------------------------------------------------ */
/*  VIDEOS (simple example)                                           */
/* ------------------------------------------------------------------ */

let editingVideoId = null;

async function loadVideos() {
  const list = $("videosList");
  if (!list) return;
  list.innerHTML = "Loading…";

  const q = query(
    collection(db, "videos"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);

  list.innerHTML = "";
  snap.forEach(docSnap => {
    const v = docSnap.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div class="list-item-main">
        <strong>${v.title || "(no title)"}</strong><br>
        <div style="font-size:0.85rem; color:#666;">${v.url || ""}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn small outline" data-id="${docSnap.id}" data-action="edit">Edit</button>
        <button class="btn small outline" data-id="${docSnap.id}" data-action="delete">Delete</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll("button").forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.onclick = async () => {
      if (action === "edit") {
        const ref = doc(db, "videos", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const v = snap.data();
          $("videoTitle").value = v.title || "";
          $("videoUrl").value = v.url || "";
          editingVideoId = id;
          status("Editing video…");
        }
      } else if (action === "delete") {
        await deleteDoc(doc(db, "videos", id));
        status("Video deleted.");
        editingVideoId = null;
        $("videoForm").reset();
        loadVideos();
      }
    };
  });
}

function setupVideosForm() {
  const form = $("videoForm");
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();
    const title = $("videoTitle").value.trim();
    const url = $("videoUrl").value.trim();

    if (!title || !url) {
      status("Enter title and URL.", "error");
      return;
    }

    const data = {
      title,
      url,
      createdAt: serverTimestamp()
    };

    if (editingVideoId) {
      await updateDoc(doc(db, "videos", editingVideoId), data);
      status("Video updated.");
    } else {
      await addDoc(collection(db, "videos"), data);
      status("Video created.");
    }

    editingVideoId = null;
    form.reset();
    loadVideos();
  };
}

/* ------------------------------------------------------------------ */
/*  USERS (read‑only list)                                            */
/* ------------------------------------------------------------------ */

async function loadUsers() {
  const list = $("usersList");
  if (!list) return;
  list.innerHTML = "Loading…";

  const q = query(
    collection(db, "users"),
    orderBy("createdAt", "desc"),
    limit(200)
  );
  const snap = await getDocs(q);

  list.innerHTML = "";
  snap.forEach(docSnap => {
    const u = docSnap.data();
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div class="list-item-main">
        <strong>${u.username || "(no username)"}</strong><br>
        <div style="font-size:0.85rem; color:#666;">
          ${u.email || ""} — ${u.role || "cast"}
        </div>
      </div>
    `;
    list.appendChild(row);
  });
}

/* ------------------------------------------------------------------ */
/*  INIT                                                              */
/* ------------------------------------------------------------------ */

async function init() {
  status("Checking authentication…");

  onAuthStateChanged(auth, async user => {
    if (!user) {
      status("Not signed in.", "error");
      window.location.href = "/auth/login.html";
      return;
    }

    $("adminEmail").textContent = user.email || "";

    if (!(await isAdmin(user.uid))) {
      status("You are not an admin.", "error");
      window.location.href = "/cast/";
      return;
    }

    status("Admin verified.");

    setupNav();
    setupSignOut();
    setupAnnouncementsForm();
    setupScheduleForm();
    setupTracksForm();
    setupVideosForm();

    await Promise.all([
      loadAnnouncements(),
      loadSchedule(),
      loadTracks(),
      loadVideos(),
      loadUsers()
    ]);

    status("Admin ready.");
  });
}

init().catch(err => status(err.message, "error"));
