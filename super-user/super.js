import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp
} from "../firebase.js";

// DOM
const suEmail = document.getElementById("suEmail");
const pbList = document.getElementById("pbList");
const adminList = document.getElementById("adminList");

// Modals
const pbModal = document.getElementById("pbModal");
const pbModalTitle = document.getElementById("pbModalTitle");
const closePBModal = document.getElementById("closePBModal");

const usersModal = document.getElementById("usersModal");
const usersList = document.getElementById("usersList");
const closeUsersModal = document.getElementById("closeUsersModal");

let currentPB = null;

// ------------------------------
// AUTH CHECK
// ------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/auth/login.html";
    return;
  }

  suEmail.textContent = user.email;

  const suRef = doc(db, "superusers", user.uid);
  const suSnap = await getDoc(suRef);

  if (!suSnap.exists()) {
    alert("You are not a super user.");
    window.location.href = "/";
    return;
  }

  loadPBs();
  loadAdmins();
});

// ------------------------------
// CREATE PB
// ------------------------------
document.getElementById("createPBBtn").addEventListener("click", async () => {
  const code = document.getElementById("pbCode").value.trim();
  const name = document.getElementById("pbName").value.trim();

  if (!code || !name) return alert("Enter PB code and name.");

  await setDoc(doc(db, `practicebases/${code}/meta/info`), {
    name,
    createdAt: serverTimestamp()
  });

  alert("PracticeBase created!");
  loadPBs();
});

// ------------------------------
// ASSIGN ADMIN
// ------------------------------
document.getElementById("assignAdminBtn").addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value.trim();
  const pbCode = document.getElementById("assignPBCode").value.trim();

  if (!email || !pbCode) return alert("Enter admin email and PB code.");

  const usersSnap = await getDocs(collection(db, "userEmails"));
  let adminUid = null;

  usersSnap.forEach(docSnap => {
    if (docSnap.data().email === email) adminUid = docSnap.id;
  });

  if (!adminUid) return alert("No user found with that email.");

  await setDoc(doc(db, "admins", adminUid), {
    pbCodes: [pbCode],
    email
  }, { merge: true });

  alert("Admin assigned!");
  loadAdmins();
});

// ------------------------------
// GENERATE QR
// ------------------------------
document.getElementById("generateQRBtn").addEventListener("click", () => {
  const pbCode = document.getElementById("qrPBCode").value.trim();
  if (!pbCode) return alert("Enter PB code.");

  const url = `${window.location.origin}/auth/signup.html?code=${pbCode}`;

  QRCode.toCanvas(url, { width: 220 }, (err, canvas) => {
    if (err) return alert("QR error");
    const out = document.getElementById("qrOutput");
    out.innerHTML = "";
    out.appendChild(canvas);
  });
});

// ------------------------------
// LOAD PB LIST
// ------------------------------
async function loadPBs() {
  pbList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, "practicebases"));
  pbList.innerHTML = "";

  snap.forEach(docSnap => {
    const code = docSnap.id;

    const div = document.createElement("div");
    div.innerHTML = `
      <span>${code}</span>
      <button data-code="${code}" class="openPB">Manage</button>
    `;

    pbList.appendChild(div);
  });

  document.querySelectorAll(".openPB").forEach(btn => {
    btn.addEventListener("click", () => openPBModal(btn.dataset.code));
  });
}

// ------------------------------
// PB MODAL
// ------------------------------
async function openPBModal(pbCode) {
  currentPB = pbCode;

  const metaSnap = await getDoc(doc(db, `practicebases/${pbCode}/meta/info`));
  const name = metaSnap.exists() ? metaSnap.data().name : pbCode;

  pbModalTitle.textContent = `${name} (${pbCode})`;
  pbModal.classList.remove("hidden");
}

closePBModal.addEventListener("click", () => {
  pbModal.classList.add("hidden");
});

// ------------------------------
// RENAME PB
// ------------------------------
document.getElementById("renamePBBtn").addEventListener("click", async () => {
  const newName = prompt("Enter new PB name:");
  if (!newName) return;

  await updateDoc(doc(db, `practicebases/${currentPB}/meta/info`), {
    name: newName
  });

  alert("PB renamed!");
  loadPBs();
});

// ------------------------------
// DELETE PB
// ------------------------------
document.getElementById("deletePBBtn").addEventListener("click", async () => {
  if (!confirm("Delete this PB? This cannot be undone.")) return;

  await deleteDoc(doc(db, "practicebases", currentPB));

  alert("PB deleted!");
  pbModal.classList.add("hidden");
  loadPBs();
});

// ------------------------------
// VIEW USERS IN PB
// ------------------------------
document.getElementById("viewUsersBtn").addEventListener("click", async () => {
  usersModal.classList.remove("hidden");
  usersList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, `practicebases/${currentPB}/users`));

  usersList.innerHTML = "";

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.textContent = data.email || docSnap.id;
    usersList.appendChild(div);
  });
});

closeUsersModal.addEventListener("click", () => {
  usersModal.classList.add("hidden");
});

// ------------------------------
// LOAD ADMINS
// ------------------------------
async function loadAdmins() {
  adminList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, "admins"));
  adminList.innerHTML = "";

  snap.forEach(docSnap => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.innerHTML = `
      <span>${data.email || docSnap.id} → ${data.pbCodes.join(", ")}</span>
      <button data-id="${docSnap.id}" class="removeAdmin">Remove</button>
    `;

    adminList.appendChild(div);
  });

  document.querySelectorAll(".removeAdmin").forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "admins", btn.dataset.id));
      alert("Admin removed!");
      loadAdmins();
    });
  });
}
