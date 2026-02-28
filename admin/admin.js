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

// ------------------------------
// DOM ELEMENTS
// ------------------------------
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

// ------------------------------
// STATE
// ------------------------------
let currentUser = null;
let currentPBCode = null;
let currentTags = [];
let currentFolders = [];

// ------------------------------
// AUTH INIT
// ------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }
  currentUser = user;
  await loadPBs();
  attachEventHandlers();
});

// ------------------------------
// HELPERS
// ------------------------------
function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function getSelectedTags(container) {
  const checked = Array.from(container.querySelectorAll("input[type=checkbox]:checked"));
  return checked.map((c) => c.value);
}

function createTagCheckboxes(container, tags) {
  clearElement(container);

  // "All" is a UI filter concept, not stored on docs, so we don't add it here.
  tags.forEach((tag) => {
    const label = document.createElement("label");
    label.className = "tagCheckbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = tag.name;

    const colorDot = document.createElement("span");
    colorDot.className = "tagColorDot";
    colorDot.style.backgroundColor = tag.color || "#888";

    const text = document.createElement("span");
    text.textContent = tag.name;

    label.appendChild(input);
    label.appendChild(colorDot);
    label.appendChild(text);
    container.appendChild(label);
  });
}

// ------------------------------
// LOAD PRACTICEBASES
// ------------------------------
async function loadPBs() {
  clearElement(pbSelect);

  const snap = await getDocs(collection(db, "practicebases"));
  const options = [];
  snap.forEach((docSnap) => {
    options.push({ id: docSnap.id, data: docSnap.data() });
  });

  options.sort((a, b) => (a.data.name || a.id).localeCompare(b.data.name || b.id));

  options.forEach((pb) => {
    const opt = document.createElement("option");
    opt.value = pb.id;
    opt.textContent = pb.data.name || pb.id;
    pbSelect.appendChild(opt);
  });

  if (options.length > 0) {
    currentPBCode = options[0].id;
    pbSelect.value = currentPBCode;
    await loadAllForPB();
  }
}

// ------------------------------
// LOAD EVERYTHING FOR CURRENT PB
// ------------------------------
async function loadAllForPB() {
  if (!currentPBCode) return;
  await Promise.all([
    loadTags(),
    loadFolders(),
    loadAnnouncements(),
    loadSchedule(),
    loadUsers(),
    loadMedia()
  ]);
}

// ------------------------------
// TAGS
// ------------------------------
async function loadTags() {
  if (!currentPBCode) return;
  const tagsRef = collection(db, `practicebases/${currentPBCode}/tags`);
  const snap = await getDocs(tagsRef);

  currentTags = [];
  snap.forEach((docSnap) => {
    currentTags.push({ id: docSnap.id, ...docSnap.data() });
  });

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
    pill.style.borderColor = tag.color || "#888";

    const colorDot = document.createElement("span");
    colorDot.className = "tagColorDot";
    colorDot.style.backgroundColor = tag.color || "#888";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = tag.name;

    const delBtn = document.createElement("button");
    delBtn.textContent = "×";
    delBtn.className = "tagDeleteBtn";
    delBtn.addEventListener("click", () => deleteTag(tag.id));

    pill.appendChild(colorDot);
    pill.appendChild(nameSpan);
    pill.appendChild(delBtn);
    tagList.appendChild(pill);
  });
}

async function addTag() {
  if (!currentPBCode) return;
  const name = newTagNameInput.value.trim();
  const color = newTagColorInput.value || "#888";

  if (!name) {
    alert("Enter a tag name.");
    return;
  }

  const tagsRef = collection(db, `practicebases/${currentPBCode}/tags`);
  await addDoc(tagsRef, {
    name,
    color,
    createdAt: serverTimestamp()
  });

  newTagNameInput.value = "";
  await loadTags();
}

async function deleteTag(tagId) {
  if (!currentPBCode) return;
  if (!confirm("Delete this tag? It will remain on existing items as plain text.")) return;

  const tagRef = doc(db, `practicebases/${currentPBCode}/tags/${tagId}`);
  await deleteDoc(tagRef);
  await loadTags();
}

// ------------------------------
// MEDIA FOLDERS
// ------------------------------
async function loadFolders() {
  if (!currentPBCode) return;
  const foldersRef = collection(db, `practicebases/${currentPBCode}/mediaFolders`);
  const snap = await getDocs(foldersRef);

  currentFolders = [];
  snap.forEach((docSnap) => {
    currentFolders.push({ id: docSnap.id, ...docSnap.data() });
  });

  renderFolderList();
  renderFolderSelect();
}

function renderFolderList() {
  clearElement(folderList);

  currentFolders.forEach((folder) => {
    const row = document.createElement("div");
    row.className = "folderRow";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = folder.name;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "smallBtn";
    delBtn.addEventListener("click", () => deleteFolder(folder.id));

    row.appendChild(nameSpan);
    row.appendChild(delBtn);
    folderList.appendChild(row);
  });
}

function renderFolderSelect() {
  clearElement(mediaFolderSelect);

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "No folder";
  mediaFolderSelect.appendChild(defaultOpt);

  currentFolders.forEach((folder) => {
    const opt = document.createElement("option");
    opt.value = folder.id;
    opt.textContent = folder.name;
    mediaFolderSelect.appendChild(opt);
  });
}

async function addFolder() {
  if (!currentPBCode) return;
  const name = newFolderNameInput.value.trim();
  if (!name) {
    alert("Enter a folder name.");
    return;
  }

  const foldersRef = collection(db, `practicebases/${currentPBCode}/mediaFolders`);
  await addDoc(foldersRef, {
    name,
    createdAt: serverTimestamp()
  });

  newFolderNameInput.value = "";
  await loadFolders();
}

async function deleteFolder(folderId) {
  if (!currentPBCode) return;
  if (!confirm("Delete this folder? Media items will keep their folderId reference.")) return;

  const folderRef = doc(db, `practicebases/${currentPBCode}/mediaFolders/${folderId}`);
  await deleteDoc(folderRef);
  await loadFolders();
}

// ------------------------------
// ANNOUNCEMENTS
// ------------------------------
async function loadAnnouncements() {
  if (!currentPBCode) return;
  clearElement(announcementList);

  const annRef = collection(db, `practicebases/${currentPBCode}/announcements`);
  const snap = await getDocs(annRef);

  const items = [];
  snap.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });

  items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  items.forEach((ann) => {
    const div = document.createElement("div");
    div.className = "card";

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

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "smallBtn";
    delBtn.addEventListener("click", () => deleteAnnouncement(ann.id));

    div.appendChild(title);
    div.appendChild(body);
    div.appendChild(tags);
    div.appendChild(delBtn);
    announcementList.appendChild(div);
  });
}

async function addAnnouncement() {
  if (!currentPBCode) return;
  const title = announcementTitleInput.value.trim();
  const body = announcementBodyInput.value.trim();
  const tags = getSelectedTags(announcementTagSelector);

  if (!title && !body) {
    alert("Enter a title or body.");
    return;
  }

  const annRef = collection(db, `practicebases/${currentPBCode}/announcements`);
  await addDoc(annRef, {
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
  if (!currentPBCode) return;
  if (!confirm("Delete this announcement?")) return;

  const annRef = doc(db, `practicebases/${currentPBCode}/announcements/${id}`);
  await deleteDoc(annRef);
  await loadAnnouncements();
}

// ------------------------------
// SCHEDULE / REHEARSALS
// ------------------------------
async function loadSchedule() {
  if (!currentPBCode) return;
  clearElement(scheduleList);

  const schedRef = collection(db, `practicebases/${currentPBCode}/schedule`);
  const snap = await getDocs(schedRef);

  const items = [];
  snap.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });

  items.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "card";

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

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "smallBtn";
    delBtn.addEventListener("click", () => deleteSchedule(item.id));

    div.appendChild(title);
    div.appendChild(loc);
    div.appendChild(notes);
    div.appendChild(tags);
    div.appendChild(delBtn);
    scheduleList.appendChild(div);
  });
}

async function addSchedule() {
  if (!currentPBCode) return;
  const date = scheduleDateInput.value;
  const location = scheduleLocationInput.value.trim();
  const notes = scheduleNotesInput.value.trim();
  const tags = getSelectedTags(scheduleTagSelector);

  if (!date) {
    alert("Select a date/time.");
    return;
  }

  const schedRef = collection(db, `practicebases/${currentPBCode}/schedule`);
  await addDoc(schedRef, {
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
  if (!currentPBCode) return;
  if (!confirm("Delete this rehearsal?")) return;

  const schedRef = doc(db, `practicebases/${currentPBCode}/schedule/${id}`);
  await deleteDoc(schedRef);
  await loadSchedule();
}

// ------------------------------
// USERS
// ------------------------------
async function loadUsers() {
  if (!currentPBCode) return;
  clearElement(userList);

  const usersRef = collection(db, `practicebases/${currentPBCode}/users`);
  const snap = await getDocs(usersRef);

  const items = [];
  snap.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });

  items.sort((a, b) => (a.email || a.id).localeCompare(b.email || b.id));

  items.forEach((user) => {
    const row = document.createElement("div");
    row.className = "userRow";

    const main = document.createElement("span");
    main.textContent = `${user.email || "(no email)"} (${user.id})`;

    row.appendChild(main);
    userList.appendChild(row);
  });
}

// ------------------------------
// MEDIA
// ------------------------------
async function loadMedia() {
  if (!currentPBCode) return;
  clearElement(mediaList);

  const mediaRef = collection(db, `practicebases/${currentPBCode}/media`);
  const snap = await getDocs(mediaRef);

  const items = [];
  snap.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Group by folderId
  const byFolder = {};
  items.forEach((m) => {
    const folderId = m.folderId || "";
    if (!byFolder[folderId]) byFolder[folderId] = [];
    byFolder[folderId].push(m);
  });

  Object.keys(byFolder).forEach((folderId) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "mediaGroup";

    const folderName =
      folderId === ""
        ? "No folder"
        : currentFolders.find((f) => f.id === folderId)?.name || folderId;

    const heading = document.createElement("h3");
    heading.textContent = folderName;
    groupDiv.appendChild(heading);

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

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "smallBtn";
      delBtn.addEventListener("click", () => deleteMedia(m.id));

      card.appendChild(title);
      card.appendChild(link);
      card.appendChild(tags);
      card.appendChild(delBtn);
      groupDiv.appendChild(card);
    });

    mediaList.appendChild(groupDiv);
  });
}

async function addMedia() {
  if (!currentPBCode) return;
  const name = mediaNameInput.value.trim();
  const url = mediaURLInput.value.trim();
  const folderId = mediaFolderSelect.value || "";
  const tags = getSelectedTags(mediaTagSelector);

  if (!name || !url) {
    alert("Enter a name and URL.");
    return;
  }

  const mediaRef = collection(db, `practicebases/${currentPBCode}/media`);
  await addDoc(mediaRef, {
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
  if (!currentPBCode) return;
  if (!confirm("Delete this media item?")) return;

  const mediaRef = doc(db, `practicebases/${currentPBCode}/media/${id}`);
  await deleteDoc(mediaRef);
  await loadMedia();
}

// ------------------------------
// SETTINGS
// ------------------------------
async function deletePracticeBase() {
  if (!currentPBCode) return;
  alert(
    "Full PB deletion (with all subcollections) needs a backend/Cloud Function. This button is a placeholder."
  );
}

// ------------------------------
// EVENT HANDLERS
// ------------------------------
function attachEventHandlers() {
  pbSelect.addEventListener("change", async () => {
    currentPBCode = pbSelect.value;
    await loadAllForPB();
  });

  addTagBtn.addEventListener("click", addTag);
  addFolderBtn.addEventListener("click", addFolder);
  addAnnouncementBtn.addEventListener("click", addAnnouncement);
  addScheduleBtn.addEventListener("click", addSchedule);
  addMediaBtn.addEventListener("click", addMedia);
  deletePBBtn.addEventListener("click", deletePracticeBase);
}
