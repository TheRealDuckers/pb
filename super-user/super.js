import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  serverTimestamp
} from "../firebase.js";

// DOM
const suEmail = document.getElementById("suEmail");
const pbList = document.getElementById("pbList");
const adminList = document.getElementById("adminList");

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
  loadPBs();
});

// ------------------------------
// ASSIGN ADMIN
// ------------------------------
document.getElementById("assignAdminBtn").addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value.trim();
  const pbCode = document.getElementById("assignPBCode").value.trim();

  if (!email || !pbCode) {
    alert("Enter admin email and PB code.");
    return;
  }

  // Find user by email (requires you to store user emails in /users or /userEmails)
  const usersSnap = await getDocs(collection(db, "userEmails"));
  let adminUid = null;

  usersSnap.forEach(docSnap => {
    if (docSnap.data().email === email) {
      adminUid = docSnap.id;
    }
  });

  if (!adminUid) {
    alert("No user found with that email.");
    return;
  }

  await setDoc(doc(db, "admins", adminUid), {
    pbCodes: [pbCode]
  }, { merge: true });

  alert("Admin assigned!");
  loadAdmins();
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
    if (err) return alert("QR error");
    const out = document.getElementById("qrOutput");
    out.innerHTML = "";
    out.appendChild(canvas);
  });
});

// ------------------------------
// LIST PBs
// ------------------------------
async function loadPBs() {
  pbList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, "practicebases"));
  pbList.innerHTML = "";

  snap.forEach(docSnap => {
    const code = docSnap.id;
    const div = document.createElement("div");
    div.textContent = code;
    pbList.appendChild(div);
  });
}

// ------------------------------
// LIST ADMINS
// ------------------------------
async function loadAdmins() {
  adminList.innerHTML = "Loading…";

  const snap = await getDocs(collection(db, "admins"));
  adminList.innerHTML = "";

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.textContent = `${data.email || docSnap.id} → ${data.pbCodes.join(", ")}`;
    adminList.appendChild(div);
  });
}
