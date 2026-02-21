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

    // Add user to PB
    await setDoc(doc(db, `practicebases/${pbCode}/users/${uid}`), {
      email,
      joinedAt: serverTimestamp()
    });

    // Map user → PB
    await setDoc(doc(db, "userToPB", uid), {
      pbCode
    });

    localStorage.setItem("pbCode", pbCode);

    window.location.href = "/"; // go to cast app
  } catch (err) {
    alert(err.message);
  }
});
