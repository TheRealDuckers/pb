import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  collection,
  signOut
} from "../firebase.js";

// ------------------------------
// DOM ELEMENTS
// ------------------------------
const pbSelect = document.getElementById("pbSelect");
const pbName = document.getElementById("pbName");

// Tag filter
const tagFilterScroll = document.getElementById("tagFilterScroll");

// Sections
const announcementsSection = document.getElementById("announcementsSection");
const scheduleSection = document.getElementById("scheduleSection");
const mediaSection = document.getElementById("mediaSection");
const profileSection = document.getElementById("profileSection");

// Lists
const announcementList = document.getElementById("announcementList");
const scheduleList = document.getElementById("scheduleList");
const mediaList = document.getElementById("mediaList");

// Profile
const profileEmail = document.getElementById("profileEmail");
const profilePB = document.getElementById("profilePB");
const logoutBtn = document.getElementById("logoutBtn");

// Bottom nav
const navItems = document.querySelectorAll(".navItem");

// ------------------------------
// STATE
// ------------------------------
let currentUser = null;
let currentPBCode = null;
let currentTags = [];
let selectedTag = "All";

// ------------------------------
// AUTH
// ------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  currentUser = user;
  profileEmail.textContent = user.email;

  await loadPBs();
  attachNavHandlers();
});

// ------------------------------
// LOAD PRACTICEBASES
// ------------------------------
async function loadPBs() {
  const snap = await getDocs(collection(db, "practicebases"));

  pbSelect.innerHTML = "";

  const pbs = [];
  snap.forEach((docSnap) => {
    pbs.push({ id: docSnap.id, ...docSnap.data() });
  });

  pbs.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));

  pbs.forEach((pb) => {
    const opt = document.createElement("option");
    opt.value = pb.id;
    opt.textContent = pb.name || pb.id;
    pbSelect.appendChild(opt);
  });

  if (pbs.length > 0) {
    currentPBCode = pbs[0].id;
    pbSelect.value = currentPBCode;
    pbName.textContent = pbs[0].name || pbs[0].id;
    profilePB.textContent = pbs[0].name || pbs[0].id;
    await loadAllForPB();
  }

  pbSelect.addEventListener("change", async () => {
    currentPBCode = pbSelect.value;
    const selected = pbs.find((p) => p.id === currentPBCode);
    pbName.textContent = selected?.name || currentPBCode;
    profilePB.textContent = selected?.name || currentPBCode;
    await loadAllForPB();
  });
}

// ------------------------------
// LOAD EVERYTHING FOR PB
// ------------------------------
async function loadAllForPB() {
  await Promise.all([
    loadTags(),
    loadAnnouncements(),
    loadSchedule(),
    loadMedia()
  ]);
}

// ------------------------------
// TAGS
// ------------------------------
async function loadTags() {
  const tagsRef = collection(db, `practicebases/${currentPBCode}/tags`);
  const snap = await getDocs(tagsRef);

  currentTags = [];
  snap.forEach((docSnap) => {
    currentTags.push({ id: docSnap.id, ...docSnap.data() });
  });

  renderTagFilter();
}

function renderTagFilter() {
  // Clear all except "All"
  tagFilterScroll.innerHTML = "";

  // Add "All"
  const allPill = document.createElement("div");
  allPill.className = "tagFilterPill active";
  allPill.dataset.tag = "All";
  allPill.textContent = "All";
  allPill.addEventListener("click", () => selectTag("All"));
  tagFilterScroll.appendChild(allPill);

  // Add dynamic tags
  currentTags.forEach((tag) => {
    const pill = document.createElement("div");
    pill.className = "tagFilterPill";
    pill.dataset.tag = tag.name;
    pill.textContent = tag.name;
    pill.style.borderLeft = `6px solid ${tag.color}`;
    pill.addEventListener("click", () => selectTag(tag.name));
    tagFilterScroll.appendChild(pill);
  });
}

function selectTag(tag) {
  selectedTag = tag;

  // Update UI
  document.querySelectorAll(".tagFilterPill").forEach((p) => {
    p.classList.toggle("active", p.dataset.tag === tag);
  });

  // Reload filtered content
  loadAnnouncements();
  loadSchedule();
  loadMedia();
}

// ------------------------------
// ANNOUNCEMENTS
// ------------------------------
async function loadAnnouncements() {
  announcementList.innerHTML = "";

  const annRef = collection(db, `practicebases/${currentPBCode}/announcements`);
  const snap = await getDocs(annRef);

  let items = [];
  snap.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Filter by tag
  if (selectedTag !== "All") {
    items = items.filter((a) => (a.tags || []).includes(selectedTag));
  }

  // Sort newest first
  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  items.forEach((ann) => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h4");
    title.textContent = ann.title || "(No title)";

    const body = document.createElement("p");
    body.textContent = ann.body || "";

    const tags = document.createElement("div");
    tags.className = "cardTags";
    (ann.tags || []).forEach((t) => {
      const span = document.createElement("span");
      span.className = "cardTag";
      span.textContent = t;
      tags.appendChild(span);
    });

    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(tags);
    announcementList.appendChild(card);
  });
}

// ------------------------------
// SCHEDULE
// ------------------------------
async function loadSchedule() {
  scheduleList.innerHTML = "";

  const schedRef = collection(db, `practicebases/${currentPBCode}/schedule`);
  const snap = await getDocs(schedRef);

  let items = [];
  snap.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Filter by tag
  if (selectedTag !== "All") {
    items = items.filter((a) => (a.tags || []).includes(selectedTag));
  }

  // Sort by date
  items.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h4");
    title.textContent = item.date || "(No date)";

    const loc = document.createElement("p");
    loc.textContent = item.location || "";

    const notes = document.createElement("p");
    notes.textContent = item.notes || "";

    const tags = document.createElement("div");
    tags.className = "cardTags";
    (item.tags || []).forEach((t) => {
      const span = document.createElement("span");
      span.className = "cardTag";
      span.textContent = t;
      tags.appendChild(span);
    });

    card.appendChild(title);
    card.appendChild(loc);
    card.appendChild(notes);
    card.appendChild(tags);
    scheduleList.appendChild(card);
  });
}

// ------------------------------
// MEDIA
// ------------------------------
async function loadMedia() {
  mediaList.innerHTML = "";

  const mediaRef = collection(db, `practicebases/${currentPBCode}/media`);
  const snap = await getDocs(mediaRef);

  let items = [];
  snap.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Filter by tag
  if (selectedTag !== "All") {
    items = items.filter((m) => (m.tags || []).includes(selectedTag));
  }

  // Group by folder
  const byFolder = {};
  items.forEach((m) => {
    const folderId = m.folderId || "";
    if (!byFolder[folderId]) byFolder[folderId] = [];
    byFolder[folderId].push(m);
  });

  // Load folder names
  const folderSnap = await getDocs(collection(db, `practicebases/${currentPBCode}/mediaFolders`));
  const folders = {};
  folderSnap.forEach((docSnap) => {
    folders[docSnap.id] = docSnap.data().name;
  });

  Object.keys(byFolder).forEach((folderId) => {
    const group = document.createElement("div");
    group.className = "mediaGroup";

    const heading = document.createElement("h3");
    heading.textContent = folderId === "" ? "No folder" : folders[folderId] || folderId;
    group.appendChild(heading);

    byFolder[folderId].forEach((m) => {
      const card = document.createElement("div");
      card.className = "card";

      const title = document.createElement("h4");
      title.textContent = m.name || "(No name)";

      const link = document.createElement("a");
      link.href = m.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = m.url;

      const tags = document.createElement("div");
      tags.className = "cardTags";
      (m.tags || []).forEach((t) => {
        const span = document.createElement("span");
        span.className = "cardTag";
        span.textContent = t;
        tags.appendChild(span);
      });

      card.appendChild(title);
      card.appendChild(link);
      card.appendChild(tags);
      group.appendChild(card);
    });

    mediaList.appendChild(group);
  });
}

// ------------------------------
// NAVIGATION
// ------------------------------
function attachNavHandlers() {
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;

      // Update nav UI
      navItems.forEach((n) => n.classList.remove("active"));
      item.classList.add("active");

      // Show correct section
      announcementsSection.classList.add("hidden");
      scheduleSection.classList.add("hidden");
      mediaSection.classList.add("hidden");
      profileSection.classList.add("hidden");

      document.getElementById(target).classList.remove("hidden");
    });
  });
}

// ------------------------------
// LOGOUT
// ------------------------------
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/login.html";
});
