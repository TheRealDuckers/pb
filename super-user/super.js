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

  await loadPBs();
  await loadAdmins();
  await loadPBDropdown();
});

// ------------------------------
// CREATE PRACTICEBASE
// ------------------------------
document.getElementById("createPBBtn").addEventListener("click", async () => {
  const code = document.getElementById("pbCode").value.trim();
  const name = document.getElementById("pbName").value.trim();

  if (!code || !name) {
    alert("Enter PB code and name.");
    return;
  }

  await setDoc(doc(db, `practicebases/${code}/meta/info`), {
    name,
    createdAt: serverTimestamp()
  });

  alert("PracticeBase created!");
  document.getElementById("pbCode").value = "";
  document.getElementById("pbName").value = "";
  await loadPBs();
  await loadPBDropdown();
});

// ------------------------------
// ASSIGN ADMIN (simple)
// ------------------------------
document.getElementById("assignAdminBtn").addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value.trim();
  const pbCode = document.getElementById("assignPBCode").value.trim();

  if (!email || !pbCode) {
    alert("Enter admin email and PB code.");
    return;
  }

  const usersSnap = await getDocs(collection(db, "userEmails"));
  let adminUid = null;

  usersSnap.forEach(docSnap => {
    if (docSnap.data().email === email) adminUid = docSnap.id;
  });

  if (!adminUid) {
    alert("No user found with that email.");
    return;
  }

  const adminRef = doc(db, "admins", adminUid);
  const adminSnap = await getDoc(adminRef);
  let pbCodes = adminSnap.exists() ? (adminSnap.data().pbCodes || []) : [];

  if (!pbCodes.includes(pbCode)) pbCodes.push(pbCode);

  await setDoc(adminRef, {
    email,
    pbCodes
  }, { merge: true });

  alert("Admin assigned!");
  document.getElementById("adminEmail").value = "";
  document.getElementById("assignPBCode").value = "";
  await loadAdmins();
});

// ------------------------------
// MAKE ADMIN (with PB dropdown)
// ------------------------------
document.getElementById("makeAdminBtn").addEventListener("click", async () => {
  const email = document.getElementById("makeAdminEmail").value.trim();
  const pbCode = document.getElementById("makeAdminPB").value;

  if (!email || !pbCode) {
    alert("Enter email and select a PB.");
    return;
  }

  const usersSnap = await getDocs(collection(db, "userEmails"));
  let uid = null;

  usersSnap.forEach(docSnap => {
    if (docSnap.data().email === email) uid = docSnap.id;
  });

  if (!uid) {
    alert("No user found with that email.");
    return;
  }

  const adminRef = doc(db, "admins", uid);
  const adminSnap = await getDoc(adminRef);
  let pbCodes = adminSnap.exists() ? (adminSnap.data().pbCodes || []) : [];

  if (!pbCodes.includes(pbCode)) pbCodes.push(pbCode);

  await setDoc(adminRef, { email, pbCodes }, { merge: true });

  alert("User is now an admin!");
  document.getElementById("makeAdminEmail").value = "";
  await loadAdmins();
});

// ------------------------------
// GENERATE QR CODE
// ------------------------------
document.getElementById("generateQRBtn").addEventListener("click", () => {
  const pbCode = document.getElementById("qrPBCode").value.trim();
  if (!pbCode) {
    alert("Enter PB code.");
    return;
  }

  const url = `${window.location.origin}/auth/signup.html?code=${pbCode}`;

  QRCode.toCanvas(url, { width: 220 }, (err, canvas) => {
    if (err) {
      alert("QR error");
      return;
    }
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
// LOAD PB DROPDOWN (for Make Admin)
// ------------------------------
async function loadPBDropdown() {
  const select = document.getElementById("makeAdminPB");
  select.innerHTML = "";

  const snap = await getDocs(collection(db, "practicebases"));
  snap.forEach(docSnap => {
    const opt = document.createElement("option");
    opt.value = docSnap.id;
    opt.textContent = docSnap.id;
    select.appendChild(opt);
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

// RENAME PB
document.getElementById("renamePBBtn").addEventListener("click", async () => {
  const newName = prompt("Enter new PB name:");
  if (!newName) return;

  await updateDoc(doc(db, `practicebases/${currentPB}/meta/info`), {
    name: newName
  });

  alert("PB renamed!");
  await loadPBs();
});

// DELETE PB
document.getElementById("deletePBBtn").addEventListener("click", async () => {
  if (!confirm("Delete this PB? This cannot be undone.")) return;

  await deleteDoc(doc(db, "practicebases", currentPB));

  alert("PB deleted!");
  pbModal.classList.add("hidden");
  await loadPBs();
});

// VIEW USERS IN PB
document.getElementById("viewUsersBtn").addEventListener("click", async () => {
  usersModal.classList.remove("hidden");
  usersList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, `practicebases/${currentPB}/users`));
  usersList.innerHTML = "";

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.textContent = data.email || data.name || docSnap.id;
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
    const pbCodes = data.pbCodes || [];

    const div = document.createElement("div");
    div.innerHTML = `
      <span>${data.email || docSnap.id} → ${pbCodes.join(", ")}</span>
      <button data-id="${docSnap.id}" class="removeAdmin">Remove Admin</button>
      <button data-id="${docSnap.id}" class="removePBAdmin">Remove From PB</button>
      <button data-id="${docSnap.id}" class="demoteCast">Demote to Cast</button>
    `;

    adminList.appendChild(div);
  });

  // Remove admin entirely
  document.querySelectorAll(".removeAdmin").forEach(btn => {
    btn.addEventListener("click", async () => {
      const uid = btn.dataset.id;
      await deleteDoc(doc(db, "admins", uid));
      alert("Admin removed.");
      await loadAdmins();
    });
  });

  // Remove admin from specific PB
  document.querySelectorAll(".removePBAdmin").forEach(btn => {
    btn.addEventListener("click", async () => {
      const uid = btn.dataset.id;
      const pbCode = prompt("Enter PB code to remove admin from:");
      if (!pbCode) return;

      const adminRef = doc(db, "admins", uid);
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) return;

      let pbCodes = adminSnap.data().pbCodes || [];
      pbCodes = pbCodes.filter(pb => pb !== pbCode);

      if (pbCodes.length === 0) {
        await deleteDoc(adminRef);
        alert("Admin removed from PB and demoted to cast.");
      } else {
        await updateDoc(adminRef, { pbCodes });
        alert("Admin removed from PB.");
      }

      await loadAdmins();
    });
  });

  // Demote to cast
  document.querySelectorAll(".demoteCast").forEach(btn => {
    btn.addEventListener("click", async () => {
      const uid = btn.dataset.id;
      await deleteDoc(doc(db, "admins", uid));
      alert("User demoted to cast.");
      await loadAdmins();
    });
  });
}

// ------------------------------
// USER SEARCH & MANAGEMENT
// ------------------------------
document.getElementById("searchUserBtn").addEventListener("click", async () => {
  const query = document.getElementById("searchUserInput").value.trim().toLowerCase();
  const resultsEl = document.getElementById("searchResults");

  if (!query) {
    resultsEl.innerHTML = "<div>Enter something to search.</div>";
    return;
  }

  resultsEl.innerHTML = "Searching…";

  const usersSnap = await getDocs(collection(db, "userEmails"));
  resultsEl.innerHTML = "";

  usersSnap.forEach(docSnap => {
    const data = docSnap.data();
    const email = (data.email || "").toLowerCase();

    if (email.includes(query)) {
      const div = document.createElement("div");
      div.innerHTML = `
        <span>${data.email}</span>
        <button class="promoteAdmin" data-uid="${docSnap.id}">Make Admin</button>
        <button class="promoteSU" data-uid="${docSnap.id}">Make Super‑User</button>
      `;
      resultsEl.appendChild(div);
    }
  });

  attachUserSearchButtons();
});

function attachUserSearchButtons() {
  // Promote to Admin (from search)
  document.querySelectorAll(".promoteAdmin").forEach(btn => {
    btn.addEventListener("click", async () => {
      const uid = btn.dataset.uid;
      const pbCode = prompt("Enter PB code to assign admin:");
      if (!pbCode) return;

      const adminRef = doc(db, "admins", uid);
      const adminSnap = await getDoc(adminRef);
      let pbCodes = adminSnap.exists() ? (adminSnap.data().pbCodes || []) : [];

      if (!pbCodes.includes(pbCode)) pbCodes.push(pbCode);

      await setDoc(adminRef, { pbCodes }, { merge: true });
      alert("User promoted to admin.");
      await loadAdmins();
    });
  });

  // Promote to Super‑User
  document.querySelectorAll(".promoteSU").forEach(btn => {
    btn.addEventListener("click", async () => {
      const uid = btn.dataset.uid;
      await setDoc(doc(db, "superusers", uid), { super: true });
      alert("User is now a super‑user!");
    });
  });
}
