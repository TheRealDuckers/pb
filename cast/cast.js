import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  collection
} from "../firebase.js";

const pbNameEl = document.getElementById("pbName");
const userEmailEl = document.getElementById("userEmail");
const profileEmailEl = document.getElementById("profileEmail");
const profilePBEl = document.getElementById("profilePB");

const pages = document.querySelectorAll(".page");
const navBtns = document.querySelectorAll(".nav-btn");

const annList = document.getElementById("annList");
const schedList = document.getElementById("schedList");
const mediaList = document.getElementById("mediaList");
const logoutBtn = document.getElementById("logoutBtn");

let currentPB = null;
let currentUser = null;

// AUTH + PB LOOKUP
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/auth/login.html";
    return;
  }

  currentUser = user;
  userEmailEl.textContent = user.email || "";
  profileEmailEl.textContent = user.email || "";

  const pbRef = doc(db, "userToPB", user.uid);
  const pbSnap = await getDoc(pbRef);

  if (!pbSnap.exists()) {
    pbNameEl.textContent = "No PB assigned";
    profilePBEl.textContent = "None";
    return;
  }

  currentPB = pbSnap.data().pbCode;
  profilePBEl.textContent = currentPB;

  const metaRef = doc(db, `practicebases/${currentPB}/meta/info`);
  const metaSnap = await getDoc(metaRef);
  pbNameEl.textContent = metaSnap.exists() ? metaSnap.data().name : currentPB;

  loadAnnouncements();
  loadSchedule();
  loadMedia();
});

// NAV
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;

    navBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(`page-${page}`).classList.add("active");
  });
});

// LOGOUT
logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// ANNOUNCEMENTS
async function loadAnnouncements() {
  if (!currentPB) return;
  annList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, `practicebases/${currentPB}/announcements`));
  annList.innerHTML = "";

  if (snap.empty) {
    annList.innerHTML = "<div class='list-item'>No announcements yet.</div>";
    return;
  }

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.classList.add("list-item");
    div.innerHTML = `
      <div class="list-item-title">${data.title || "Announcement"}</div>
      <div class="list-item-sub">${data.body || ""}</div>
    `;
    annList.appendChild(div);
  });
}

// SCHEDULE
async function loadSchedule() {
  if (!currentPB) return;
  schedList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, `practicebases/${currentPB}/schedule`));
  schedList.innerHTML = "";

  if (snap.empty) {
    schedList.innerHTML = "<div class='list-item'>No rehearsals yet.</div>";
    return;
  }

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const dateStr = data.date ? new Date(data.date).toLocaleString() : "";
    const div = document.createElement("div");
    div.classList.add("list-item");
    div.innerHTML = `
      <div class="list-item-title">${data.title || "Rehearsal"}</div>
      <div class="list-item-sub">${dateStr}</div>
    `;
    schedList.appendChild(div);
  });
}

// MEDIA
async function loadMedia() {
  if (!currentPB) return;
  mediaList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, `practicebases/${currentPB}/media`));
  mediaList.innerHTML = "";

  if (snap.empty) {
    mediaList.innerHTML = "<div class='list-item'>No media yet.</div>";
    return;
  }

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const sizeKB = data.size ? Math.round(data.size / 1024) : null;
    const div = document.createElement("div");
    div.classList.add("list-item");
    div.innerHTML = `
      <div class="list-item-title">${data.name || "File"}</div>
      <div class="list-item-sub">
        ${data.type || ""}${sizeKB ? ` • ${sizeKB} KB` : ""}
      </div>
    `;
    mediaList.appendChild(div);
  });
}
