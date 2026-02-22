import {
  auth,
  db,
  createUserWithEmailAndPassword,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "../firebase.js";

// Get PB code from URL
const urlParams = new URLSearchParams(window.location.search);
const pbCode = urlParams.get("code");

document.getElementById("pbCode").value = pbCode;

// Load PB name
async function loadPBName() {
  const banner = document.getElementById("pbNameBanner");

  const metaRef = doc(db, `practicebases/${pbCode}/meta/info`);
  const metaSnap = await getDoc(metaRef);

  if (!metaSnap.exists()) {
    banner.textContent = "Invalid PracticeBase";
    banner.style.background = "#b00020";
    return;
  }

  const name = metaSnap.data().name;
  banner.textContent = `Joining: ${name}`;
}

loadPBName();

// Signup
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // 1️ Map user → PB FIRST (so isMemberOf(pbCode) becomes true)
    await setDoc(doc(db, "userToPB", uid), {
      pbCode
    });

    // 2️ Now we can safely create the PB user profile
    await setDoc(doc(db, `practicebases/${pbCode}/users/${uid}`), {
      email,
      joinedAt: serverTimestamp()
    });

    // Optional: store PB locally
    localStorage.setItem("pbCode", pbCode);

    // Redirect to cast app
    window.location.href = "/";

  } catch (err) {
    alert(err.message);
  }
});

