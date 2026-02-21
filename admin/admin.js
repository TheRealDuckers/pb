import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp
} from "../firebase.js";

// DOM
const pbNameEl = document.getElementById("pbName");
const logoutBtn = document.getElementById("logoutBtn");

// Pages
const pages = document.querySelectorAll(".page");
const navBtns = document.querySelectorAll(".nav-btn");

// Page sections
const annList = document.getElementById("annList");
const schedList = document.getElementById("schedList");
const mediaList = document.getElementById("mediaList");
const usersList = document.getElementById("usersList");

// Globals
let currentPB = null;

// ------------------------------
// AUTH + PB LOOKUP
// ------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/auth/login.html";
    return;
  }

  // Get PB code from userToPB
  const pbRef = doc(db, "userToPB", user.uid);
  const pbSnap = await getDoc(pbRef);

  if (!pbSnap.exists()) {
    alert("You are not assigned to a PracticeBase.");
    return;
  }

  currentPB = pbSnap.data().pbCode;

  // Check admin rights
  const adminRef = doc(db, "admins", user.uid);
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists() || !adminSnap.data().pbCodes.includes(currentPB)) {
    alert("You are not an admin for this PracticeBase.");
    window.location.href = "/";
    return;
  }

  // Load PB name
  const metaRef = doc(db, `practicebases/${currentPB}/meta/info`);
  const metaSnap = await getDoc(metaRef);
  pbNameEl.textContent = metaSnap.exists() ? metaSnap.data().name : currentPB;

  // Load all admin data
  loadAnnouncements();
  loadSchedule();
  loadMedia();
  loadUsers();
});

// ------------------------------
// SIDEBAR NAVIGATION
// ------------------------------
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;

    navBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(`page-${page}`).classList.add("active");
  });
});

// ------------------------------
// LOGOUT
// ------------------------------
logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// ------------------------------
// ANNOUNCEMENTS
// ------------------------------
document.getElementById("createAnnBtn").addEventListener("click", async () => {
  const title = document.getElementById("annTitle").value.trim();
  const body = document.getElementById("annBody").value.trim();

  if (!title || !body) return alert("Enter title and message.");

  await addDoc(collection(db, `practicebases/${currentPB}/announcements`), {
    title,
    body,
    createdAt: serverTimestamp()
  });

  document.getElementById("annTitle").value = "";
  document.getElementById("annBody").value = "";

  loadAnnouncements();
});

async function loadAnnouncements() {
  annList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, `practicebases/${currentPB}/announcements`));
  annList.innerHTML = "";

  snap.forEach(docSnap => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.innerHTML = `
      <span><strong>${data.title}</strong><br>${data.body}</span>
      <button data-id="${docSnap.id}" class="deleteAnn">Delete</button>
    `;

    annList.appendChild(div);
  });

  document.querySelectorAll(".deleteAnn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, `practicebases/${currentPB}/announcements`, btn.dataset.id));
      loadAnnouncements();
    });
  });
}

// ------------------------------
// SCHEDULE
// ------------------------------
document.getElementById("createSchedBtn").addEventListener("click", async () => {
  const title = document.getElementById("schedTitle").value.trim();
  const date = document.getElementById("schedDate").value;

  if (!title || !date) return alert("Enter title and date.");

  await addDoc(collection(db, `practicebases/${currentPB}/schedule`), {
    title,
    date,
    createdAt: serverTimestamp()
  });

  document.getElementById("schedTitle").value = "";
  document.getElementById("schedDate").value = "";

  loadSchedule();
});

async function loadSchedule() {
  schedList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, `practicebases/${currentPB}/schedule`));
  schedList.innerHTML = "";

  snap.forEach(docSnap => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.innerHTML = `
      <span><strong>${data.title}</strong><br>${new Date(data.date).toLocaleString()}</span>
      <button data-id="${docSnap.id}" class="deleteSched">Delete</button>
    `;

    schedList.appendChild(div);
  });

  document.querySelectorAll(".deleteSched").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, `practicebases/${currentPB}/schedule`, btn.dataset.id));
      loadSchedule();
    });
  });
}

// ------------------------------
// MEDIA
// ------------------------------
document.getElementById("uploadMediaBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("mediaFile");
  const file = fileInput.files[0];

  if (!file) return alert("Choose a file.");

  // Store metadata only (you can add Firebase Storage later)
  await addDoc(collection(db, `practicebases/${currentPB}/media`), {
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: serverTimestamp()
  });

  fileInput.value = "";
  loadMedia();
});

async function loadMedia() {
  mediaList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, `practicebases/${currentPB}/media`));
  mediaList.innerHTML = "";

  snap.forEach(docSnap => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.classList.add("media-item");
    div.innerHTML = `
      <span>${data.name} (${Math.round(data.size / 1024)} KB)</span>
      <button data-id="${docSnap.id}" class="deleteMedia">Delete</button>
    `;

    mediaList.appendChild(div);
  });

  document.querySelectorAll(".deleteMedia").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, `practicebases/${currentPB}/media`, btn.dataset.id));
      loadMedia();
    });
  });
}

// ------------------------------
// USERS
// ------------------------------
async function loadUsers() {
  usersList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, `practicebases/${currentPB}/users`));
  usersList.innerHTML = "";

  snap.forEach(docSnap => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.innerHTML = `
      <span>${data.name || data.email || docSnap.id}</span>
    `;

    usersList.appendChild(div);
  });
}
