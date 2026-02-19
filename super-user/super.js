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

let currentUser = null;
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
    if (data.role !== "super") {
      window.location.href = "/auth/login.html";
      return;
    }

    currentUser = user;
    startUI();
  });
}

// DASHBOARD
async function loadDashboard() {
  showLoader();
  const pbCount = (await getDocs(collection(db, "practicebases"))).size;
  const adminCount = (await getDocs(query(collection(db, "users"), where("role", "==", "admin")))).size;
  const userCount = (await getDocs(collection(db, "users"))).size;

  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">Dashboard Overview</h2>
    </div>
    <div class="grid">
      <div class="card"><strong>${pbCount}</strong><br>PracticeBases</div>
      <div class="card"><strong>${adminCount}</strong><br>Admins</div>
      <div class="card"><strong>${userCount}</strong><br>Total Users</div>
    </div>
  `;
}

// PRACTICEBASES
async function loadPracticeBases() {
  showLoader();
  const snap = await getDocs(collection(db, "practicebases"));

  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">PracticeBases</h2>
      <button class="btn outline" id="newPB">New PracticeBase</button>
    </div>
    <div class="list" id="pbList"></div>
  `;

  const list = $("#pbList");
  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div>
          <strong>${x.name}</strong><br>
          <div class="small">Code: ${x.code}</div>
        </div>
        <button class="btn outline small" onclick="editPB('${d.id}')">Edit</button>
      </div>
    `;
  });

  $("#newPB").onclick = () => showPBForm();
}

window.editPB = async (id) => {
  const snap = await getDoc(doc(db, "practicebases", id));
  if (!snap.exists()) return;
  showPBForm(id, snap.data());
};

function showPBForm(id = null, data = {}) {
  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">${id ? "Edit" : "New"} PracticeBase</h2>
    </div>
    <div class="card">
      <div class="field"><label>Name</label><input id="pbName" value="${data.name || ""}"></div>
      <div class="field"><label>Code</label><input id="pbCode" value="${data.code || ""}"></div>
      <button class="btn" id="savePB">Save</button>
    </div>
  `;

  $("#savePB").onclick = async () => {
    const name = $("#pbName").value.trim();
    const code = $("#pbCode").value.trim().toUpperCase();
    if (!name || !code) return;

    const payload = {
      name,
      code,
      active: true,
      createdAt: serverTimestamp()
    };

    if (id) {
      await updateDoc(doc(db, "practicebases", id), payload);
    } else {
      await addDoc(collection(db, "practicebases"), payload);
    }
    loadPracticeBases();
  };
}

// ADMINS
async function loadAdmins() {
  showLoader();
  const snap = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));

  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">Admins</h2>
    </div>
    <div class="list" id="adminList"></div>
  `;

  const list = $("#adminList");
  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div>
          <strong>${x.username}</strong><br>
          <div class="small">${x.email}</div>
          <div class="small">PB: ${x.practiceBaseId}</div>
        </div>
        <button class="btn outline small" onclick="editAdmin('${d.id}')">Edit</button>
      </div>
    `;
  });
}

window.editAdmin = async (id) => {
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return;
  const x = snap.data();
  const pbs = await getDocs(collection(db, "practicebases"));

  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">Edit Admin</h2>
    </div>
    <div class="card">
      <div class="field"><label>Email</label><input value="${x.email}" disabled></div>
      <div class="field">
        <label>PracticeBase</label>
        <select id="adminPB">
          ${pbs.docs.map(pb => `
            <option value="${pb.id}" ${pb.id === x.practiceBaseId ? "selected" : ""}>
              ${pb.data().name}
            </option>
          `).join("")}
        </select>
      </div>
      <button class="btn" id="saveAdmin">Save</button>
    </div>
  `;

  $("#saveAdmin").onclick = async () => {
    await updateDoc(doc(db, "users", id), {
      practiceBaseId: $("#adminPB").value,
      role: "admin"
    });
    loadAdmins();
  };
};

// USERS
async function loadUsers() {
  showLoader();
  const snap = await getDocs(collection(db, "users"));

  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">Users</h2>
    </div>
    <div class="list" id="userList"></div>
  `;

  const list = $("#userList");
  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <div class="list-item">
        <div>
          <strong>${x.username}</strong><br>
          <div class="small">${x.email}</div>
          <div class="small">Role: ${x.role}</div>
          <div class="small">PB: ${x.practiceBaseId}</div>
        </div>
        <button class="btn outline small" onclick="editUser('${d.id}')">Edit</button>
      </div>
    `;
  });
}

window.editUser = async (id) => {
  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return;
  const x = snap.data();
  const pbs = await getDocs(collection(db, "practicebases"));

  $("#main").innerHTML = `
    <div class="header-row">
      <h2 class="section-title">Edit User</h2>
    </div>
    <div class="card">
      <div class="field"><label>Email</label><input value="${x.email}" disabled></div>
      <div class="field">
        <label>Role</label>
        <select id="userRole">
          <option value="cast" ${x.role === "cast" ? "selected" : ""}>Cast</option>
          <option value="admin" ${x.role === "admin" ? "selected" : ""}>Admin</option>
          <option value="blocked" ${x.role === "blocked" ? "selected" : ""}>Blocked</option>
          <option value="super" ${x.role === "super" ? "selected" : ""}>Super</option>
        </select>
      </div>
      <div class="field">
        <label>PracticeBase</label>
        <select id="userPB">
          <option value="">None</option>
          ${pbs.docs.map(pb => `
            <option value="${pb.id}" ${pb.id === x.practiceBaseId ? "selected" : ""}>
              ${pb.data().name}
            </option>
          `).join("")}
        </select>
      </div>
      <button class="btn" id="saveUser">Save</button>
    </div>
  `;

  $("#saveUser").onclick = async () => {
    await updateDoc(doc(db, "users", id), {
      role: $("#userRole").value,
      practiceBaseId: $("#userPB").value || null
    });
    loadUsers();
  };
};

function startUI() {
  document.querySelectorAll(".nav-item[data-section]").forEach(item => {
    item.addEventListener("click", () => {
      const s = item.dataset.section;
      setActive(s);
      if (s === "dashboard") loadDashboard();
      if (s === "practicebases") loadPracticeBases();
      if (s === "admins") loadAdmins();
      if (s === "users") loadUsers();
    });
  });

  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    window.location.href = "/auth/login.html";
  };

  setActive("dashboard");
  loadDashboard();
}

initAuth();
