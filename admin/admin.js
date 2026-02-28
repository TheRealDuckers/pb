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
  serverTimestamp,
  signOut
} from "../firebase.js";

/* ---------------------------------------------------
   DOWNTIME CHECK
--------------------------------------------------- */
async function checkDowntime() {
  const ref = doc(db, "config/app");
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data().isDown === true) {
    window.location.href = "/down.html";
  }
}

/* ---------------------------------------------------
   DOM ELEMENTS
--------------------------------------------------- */
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarItems = document.querySelectorAll(".sidebarItem");

const pbSelect = document.getElementById("pbSelect");

// Announcements
const announcementTitleInput = document.getElementById("announcementTitle");
const announcementBodyInput = document.getElementById("announcementBody");
const announcementTagSelector = document.getElementById("announcementTagSelector");
const addAnnouncementBtn = document.getElementById("addAnnouncementBtn");
const announcementList = document.getElementById("announcementList");

// Schedule
const scheduleDateInput = document.getElementById("scheduleDate");
const scheduleLocationInput = document.getElementById("scheduleLocation");
const scheduleNotesInput = document.getElementById("scheduleNotes");
const scheduleTagSelector = document.getElementById("scheduleTagSelector");
const addScheduleBtn = document.getElementById("addScheduleBtn");
const scheduleList = document.getElementById("scheduleList");

// Users
const userList = document.getElementById("userList");

// Tags
const tagList = document.getElementById("tagList");
const newTagNameInput = document.getElementById("newTagName");
const newTagColorInput = document.getElementById("newTagColor");
const addTagBtn = document.getElementById("addTagBtn");

// Media folders
const folderList = document.getElementById("folderList");
const newFolderNameInput = document.getElementById("newFolderName");
const addFolderBtn = document.getElementById("addFolderBtn");

// Media
const mediaNameInput = document.getElementById("mediaName");
const mediaURLInput = document.getElementById("mediaURL");
const mediaFolderSelect = document.getElementById("mediaFolderSelect");
const mediaTagSelector = document.getElementById("mediaTagSelector");
const addMediaBtn = document.getElementById("addMediaBtn");
const mediaList = document.getElementById("mediaList");

// Settings
const deletePBBtn = document.getElementById("deletePBBtn");

/* ---------------------------------------------------
   STATE
--------------------------------------------------- */
let currentUser = null;
let currentPBCode = null;
let currentTags = [];
let currentFolders = [];

/* ---------------------------------------------------
   AUTH INIT
--------------------------------------------------- */
onAuthStateChanged(auth, async (user) => {
  await checkDowntime();

  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  currentUser = user;
  await loadPBs();
  attachSidebarHandlers();
  attachEventHandlers();
});

/* ---------------------------------------------------
   HELPERS
--------------------------------------------------- */
function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function getSelectedTags(container) {
  return Array.from(container.querySelectorAll("input[type=checkbox]:checked"))
    .map((c) => c.value);
}

function createTagCheckboxes(container, tags) {
  clearElement(container);
  tags.forEach((tag) => {
    const label = document.createElement("label");
    label.className = "tagCheckbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = tag.name;

    const dot = document.createElement("span");
    dot.className = "tagColorDot";
    dot.style.backgroundColor = tag.color;

    const text = document.createElement("span");
    text.textContent = tag.name;

    label.appendChild(input);
    label.appendChild(dot);
    label.appendChild(text);
    container.appendChild(label);
  });
}

/* ---------------------------------------------------
   SIDEBAR LOGIC
--------------------------------------------------- */
function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("visible");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("visible");
}

menuBtn.addEventListener("click", openSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

function attachSidebarHandlers() {
  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;

      sidebarItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      document.querySelectorAll(".section").forEach((sec) => sec.classList.add("hidden"));
      document.getElementById(target).classList.remove("hidden");

      closeSidebar();
    });
  });
}

/* ---------------------------------------------------
   LOAD PRACTICEBASES
--------------------------------------------------- */
async function loadPBs() {
  const snap = await getDocs(collection(db, "practicebases"));
  pbSelect.innerHTML = "";

  const pbs = [];
  snap.forEach((docSnap) => pbs.push({ id: docSnap.id, ...docSnap.data() }));

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
    await loadAllForPB();
  }

  pbSelect.addEventListener("change", async () => {
    currentPBCode = pbSelect.value;
    await loadAllForPB();
  });
}

/* ---------------------------------------------------
   LOAD EVERYTHING FOR PB
--------------------------------------------------- */
async function loadAllForPB() {
  await Promise.all([
    loadTags(),
    loadFolders(),
    loadAnnouncements(),
    loadSchedule(),
    loadUsers(),
    loadMedia()
  ]);
}

/* ---------------------------------------------------
   TAGS
--------------------------------------------------- */
async function loadTags() {
  const snap = await getDocs(collection(db, `practicebases/${currentPBCode}/tags`));
  currentTags = [];
  snap.forEach((docSnap) => currentTags.push({ id: docSnap.id, ...docSnap.data() }));

  renderTagList();
  createTagCheckboxes(announcementTagSelector, currentTags);
  createTagCheckboxes(scheduleTagSelector, currentTags);
  createTagCheckboxes(mediaTagSelector, currentTags);
}

function renderTagList() {
  clearElement(tagList);

  currentTags.forEach((tag) => {
    const pill = document.createElement("div");
    pill.className = "tagPill";
    pill.style.borderColor = tag.color;

    const dot = document.createElement("span");
    dot.className = "tagColorDot";
    dot.style.backgroundColor = tag.color;

    const name = document.createElement("span");
    name.textContent = tag.name;

    const del = document.createElement("button");
    del.className = "tagDeleteBtn";
    del.textContent = "×";
    del.addEventListener("click", () => deleteTag(tag.id));

    pill.appendChild(dot);
    pill.appendChild(name);
    pill.appendChild(del);
    tagList.appendChild(pill);
  });
}

async function addTag() {
  const name = newTagNameInput.value.trim();
  const color = newTagColorInput.value;

  if (!name) return alert("Enter a tag name.");

  await addDoc(collection(db, `practicebases/${currentPBCode}/tags`), {
    name,
    color,
    createdAt: serverTimestamp()
  });

  newTagNameInput.value = "";
  await loadTags();
}

async function deleteTag(id) {
  if (!confirm("Delete this tag?")) return;
  await deleteDoc(doc(db, `practicebases/${currentPBCode}/tags/${id}`));
  await loadTags();
}

/* ---------------------------------------------------
   MEDIA FOLDERS
--------------------------------------------------- */
async function loadFolders() {
  const snap = await getDocs(collection(db, `practicebases/${currentPBCode}/mediaFolders`));
  currentFolders = [];
  snap.forEach((docSnap) => currentFolders.push({ id: docSnap.id, ...docSnap.data() }));

  renderFolderList();
  renderFolderSelect();
}

function renderFolderList() {
  clearElement(folderList);

  currentFolders.forEach((folder) => {
    const row = document.createElement("div");
    row.className = "folderRow";

    const name = document.createElement("span");
    name.textContent = folder.name;

    const del = document.createElement("button");
    del.className = "smallBtn";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteFolder(folder.id));

    row.appendChild(name);
    row.appendChild(del);
    folderList.appendChild(row);
  });
}

function renderFolderSelect() {
  clearElement(mediaFolderSelect);

  const none = document.createElement("option");
  none.value = "";
  none.textContent = "No folder";
  mediaFolderSelect.appendChild(none);

  currentFolders.forEach((folder) => {
    const opt = document.createElement("option");
    opt.value = folder.id;
    opt.textContent = folder.name;
    mediaFolderSelect.appendChild(opt);
  });
}

async function addFolder() {
  const name = newFolderNameInput.value.trim();
  if (!name) return alert("Enter a folder name.");

  await addDoc(collection(db, `practicebases/${currentPBCode}/mediaFolders`), {
    name,
    createdAt: serverTimestamp()
  });

  newFolderNameInput.value = "";
  await loadFolders();
}

async function deleteFolder(id) {
  if (!confirm("Delete this folder?")) return;
  await deleteDoc(doc(db, `practicebases/${currentPBCode}/mediaFolders/${id}`));
  await loadFolders();
}

/* ---------------------------------------------------
   ANNOUNCEMENTS
--------------------------------------------------- */
async function loadAnnouncements() {
  clearElement(announcementList);

  const snap = await getDocs(collection(db, `practicebases/${currentPBCode}/announcements`));
  let items = [];
  snap.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));

  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  items.forEach((ann) => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h4");
    title.textContent = ann.title;

    const body = document.createElement("p");
    body.textContent = ann.body;

    const tags = document.createElement("div");
    tags.className = "cardTags";
    (ann.tags || []).forEach((t) => {
      const span = document.createElement("span");
      span.className = "cardTag";
      span.textContent = t;
      tags.appendChild(span);
    });

    const del = document.createElement("button");
    del.className = "smallBtn";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteAnnouncement(ann.id));

    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(tags);
    card.appendChild(del);
    announcementList.appendChild(card);
  });
}

async function addAnnouncement() {
  const title = announcementTitleInput.value.trim();
  const body = announcementBodyInput.value.trim();
  const tags = getSelectedTags(announcementTagSelector);

  if (!title && !body) return alert("Enter a title or body.");

  await addDoc(collection(db, `practicebases/${currentPBCode}/announcements`), {
    title,
    body,
    tags,
    createdAt: serverTimestamp()
  });

  announcementTitleInput.value = "";
  announcementBodyInput.value = "";
  await loadAnnouncements();
}

async function deleteAnnouncement(id) {
  if (!confirm("Delete this announcement?")) return;
  await deleteDoc(doc(db, `practicebases/${currentPBCode}/announcements/${id}`));
  await loadAnnouncements();
}

/* ---------------------------------------------------
   SCHEDULE
--------------------------------------------------- */
async function loadSchedule() {
  clearElement(scheduleList);

  const snap = await getDocs(collection(db, `practicebases/${currentPBCode}/schedule`));
  let items = [];
  snap.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));

  items.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h4");
    title.textContent = item.date;

    const loc = document.createElement("p");
    loc.textContent = item.location;

    const notes = document.createElement("p");
    notes.textContent = item.notes;

    const tags = document.createElement("div");
    tags.className = "cardTags";
    (item.tags || []).forEach((t) => {
      const span = document.createElement("span");
      span.className = "cardTag";
      span.textContent = t;
      tags.appendChild(span);
    });

    const del = document.createElement("button");
    del.className = "smallBtn";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteSchedule(item.id));

    card.appendChild(title);
    card.appendChild(loc);
    card.appendChild(notes);
    card.appendChild(tags);
    card.appendChild(del);
    scheduleList.appendChild(card);
  });
}

async function addSchedule() {
  const date = scheduleDateInput.value;
  const location = scheduleLocationInput.value.trim();
  const notes = scheduleNotesInput.value.trim();
  const tags = getSelectedTags(scheduleTagSelector);

  if (!date) return alert("Select a date/time.");

  await addDoc(collection(db, `practicebases/${currentPBCode}/schedule`), {
    date,
    location,
    notes,
    tags,
    createdAt: serverTimestamp()
  });

  scheduleDateInput.value = "";
  scheduleLocationInput.value = "";
  scheduleNotesInput.value = "";
  await loadSchedule();
}

async function deleteSchedule(id) {
  if (!confirm("Delete this rehearsal?")) return;
  await deleteDoc(doc(db, `practicebases/${currentPBCode}/schedule/${id}`));
  await loadSchedule();
}

/* ---------------------------------------------------
   USERS
--------------------------------------------------- */
async function loadUsers() {
  clearElement(userList);

  const snap = await getDocs(collection(db, `practicebases/${currentPBCode}/users`));
  let items = [];
  snap.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));

  items.sort((a, b) => (a.email || "").localeCompare(b.email || ""));

  items.forEach((user) => {
    const row = document.createElement("div");
    row.className = "userRow";
    row.textContent = `${user.email || "(no email)"} (${user.id})`;
    userList.appendChild(row);
  });
}

/* ---------------------------------------------------
   MEDIA
--------------------------------------------------- */
async function loadMedia() {
  clearElement(mediaList);

  const snap = await getDocs(collection(db, `practicebases/${currentPBCode}/media`));
  let items = [];
  snap.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));

  const byFolder = {};
  items.forEach((m) => {
    const folderId = m.folderId || "";
    if (!byFolder[folderId]) byFolder[folderId] = [];
    byFolder[folderId].push(m);
  });

  const folderSnap = await getDocs(collection(db, `practicebases/${currentPBCode}/mediaFolders`));
  const folders = {};
  folderSnap.forEach((docSnap) => folders[docSnap.id] = docSnap.data().name);

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
      title.textContent = m.name;

      const link = document.createElement("a");
      link.href = m.url;
      link.target = "_blank";
      link.textContent = m.url;

      const tags = document.createElement("div");
      tags.className = "cardTags";
      (m.tags || []).forEach((t) => {
        const span = document.createElement("span");
        span.className = "cardTag";
        span.textContent = t;
        tags.appendChild(span);
      });

      const del = document.createElement("button");
      del.className = "smallBtn";
      del.textContent = "Delete";
      del.addEventListener("click", () => deleteMedia(m.id));

      card.appendChild(title);
      card.appendChild(link);
      card.appendChild(tags);
      card.appendChild(del);
      group.appendChild(card);
    });

    mediaList.appendChild(group);
  });
}

async function addMedia() {
  const name = mediaNameInput.value.trim();
  const url = mediaURLInput.value.trim();
  const folderId = mediaFolderSelect.value || "";
  const tags = getSelectedTags(mediaTagSelector);

  if (!name || !url) return alert("Enter a name and URL.");

  await addDoc(collection(db, `practicebases/${currentPBCode}/media`), {
    name,
    url,
    folderId,
    tags,
    createdAt: serverTimestamp()
  });

  mediaNameInput.value = "";
  mediaURLInput.value = "";
  mediaFolderSelect.value = "";
  await loadMedia();
}

async function deleteMedia(id) {
  if (!confirm("Delete this media item?")) return;
  await deleteDoc(doc(db, `practicebases/${currentPBCode}/media/${id}`));
  await loadMedia();
}

/* ---------------------------------------------------
   SETTINGS
--------------------------------------------------- */
async function deletePracticeBase() {
  const confirmDelete = confirm(
    "This will permanently delete ALL announcements, schedule items, tags, media, folders, and users for this PracticeBase.\n\nThis cannot be undone.\n\nAre you sure?"
  );

  if (!confirmDelete) return;

  // Delete subcollections manually (Firestore has no recursive delete in rules)
  const collections = [
    "announcements",
    "schedule",
    "tags",
    "media",
    "mediaFolders",
    "users"
  ];

  for (const col of collections) {
    const colRef = collection(db, `practicebases/${currentPBCode}/${col}`);
    const snap = await getDocs(colRef);
    for (const docSnap of snap.docs) {
      await deleteDoc(docSnap.ref);
    }
  }

  // Delete PB root doc
  await deleteDoc(doc(db, `practicebases/${currentPBCode}`));

  alert("PracticeBase deleted.");
  window.location.reload();
}

/* ---------------------------------------------------
   EVENT HANDLERS
--------------------------------------------------- */
function attachEventHandlers() {
  addTagBtn.addEventListener("click", addTag);
  addFolderBtn.addEventListener("click", addFolder);
  addAnnouncementBtn.addEventListener("click", addAnnouncement);
  addScheduleBtn.addEventListener("click", addSchedule);
  addMediaBtn.addEventListener("click", addMedia);
  deletePBBtn.addEventListener("click", deletePracticeBase);
}

/* ---------------------------------------------------
   LOGOUT (optional)
--------------------------------------------------- */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/auth/login";
  });
}
