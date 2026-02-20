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

    const udoc = await getDoc(doc(db, "users", user.uid));
    if (!udoc.exists()) {
      window.location.href = "/auth/login.html";
      return;
    }

    const data = udoc.data();
    if (data.role !== "admin") {
      // if super, send to super-user; if cast, send to cast
      if (data.role === "super") window.location.href = "/super-user/";
      else window.location.href = "/cast/";
      return;
    }

    currentUser = user;
    currentPB = data.practiceBaseId;

    if (!currentPB) {
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
    <div class="card">
      <form id="announcementForm">
        <div class="field">
          <label>Title</label>
          <input id="announcementTitle">
        </div>
        <div class="field">
          <label>Message</label>
          <textarea id="announcementMessage"></textarea>
        </div>
        <button class="btn" type="submit">Save</button>
      </form>
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
        <div>
          <button class="btn outline small" onclick="editAnnouncement('${d.id}')">Edit</button>
          <button class="btn outline small" onclick="deleteAnnouncement('${d.id}')">Delete</button>
        </div>
      </div>
    `;
  });

  $("#announcementForm").onsubmit = async (e) => {
    e.preventDefault();
    const title = $("#announcementTitle").value.trim();
    const message = $("#announcementMessage").value.trim();
    if (!title && !message) return;

    const payload = {
      title,
      message,
      practiceBaseId: currentPB,
      createdAt: serverTimestamp()
    };

    if (window.editingAnnouncementId) {
      await updateDoc(doc(db, "announcements", window.editingAnnouncementId), payload);
      window.editingAnnouncementId = null;
    } else {
      await addDoc(collection(db, "announcements"), payload);
    }
    loadAnnouncements();
  };
}

window.editAnnouncement = async (id) => {
  const snap = await getDoc(doc(db, "announcements", id));
  if (!snap.exists()) return;
  const x = snap.data();
  $("#announcementTitle").value = x.title;
  $("#announcementMessage").value = x.message;
  window.editingAnnouncementId = id;
};

window.deleteAnnouncement = async (id) => {
  await deleteDoc(doc(db, "announcements", id));
  loadAnnouncements();
};

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
    <div class="card">
      <form id="scheduleForm">
        <div class="field"><label>Title</label><input id="scheduleTitle"></div>
        <div class="field"><label>Date</label><input id="scheduleDate" type="date"></div>
        <div class="field"><label>Time</label><input id="scheduleTime" type="time"></div>
        <div class="field"><label>Who</label><input id="scheduleWho"></div>
        <div class="field"><label>Extra</label><input id="scheduleExtra"></div>
        <button class="btn" type="submit">Save</button>
      </form>
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
        <div>
          <button class="btn outline small" onclick="editSchedule('${d.id}')">Edit</button>
          <button class="btn outline small" onclick="deleteSchedule('${d.id}')">Delete</button>
        </div>
      </div>
    `;
  });

  $("#scheduleForm").onsubmit = async (e) => {
    e.preventDefault();
    const title = $("#scheduleTitle").value.trim();
    const date = $("#scheduleDate").value.trim();
    const time = $("#scheduleTime").value.trim();
    const who = $("#scheduleWho").value.trim();
    const extra = $("#scheduleExtra").value.trim();

    const payload = {
      title,
      date,
      time,
      who,
      extra,
      practiceBaseId: currentPB,
      sortTimestamp: new Date(`${date} ${time}`).getTime(),
      createdAt: serverTimestamp()
    };

    if (window.editingScheduleId) {
      await updateDoc(doc(db, "schedule", window.editingScheduleId), payload);
      window.editingScheduleId = null;
    } else {
      await addDoc(collection(db, "schedule"), payload);
    }
    loadSchedule();
  };
}

window.editSchedule = async (id) => {
  const snap = await getDoc(doc(db, "schedule", id));
  if (!snap.exists()) return;
  const x = snap.data();
  $("#scheduleTitle").value = x.title;
  $("#scheduleDate").value = x.date;
  $("#scheduleTime").value = x.time;
  $("#scheduleWho").value = x.who;
  $("#scheduleExtra").value = x.extra || "";
  window.editingScheduleId = id;
};

window.deleteSchedule = async (id) => {
  await deleteDoc(doc(db, "schedule", id));
  loadSchedule();
};

function startUI() {
  document.querySelectorAll(".nav-item[data-section]").forEach(item => {
    item.addEventListener("click", () => {
      const s = item.dataset.section;
      setActive(s);
      if (s === "announcements") loadAnnouncements();
      if (s === "schedule") loadSchedule();
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
