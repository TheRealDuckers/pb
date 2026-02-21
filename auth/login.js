import {
  auth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  db,
  doc,
  getDoc
} from "../firebase.js";

const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

// Redirect if already logged in
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  // Check if super-user
  const suSnap = await getDoc(doc(db, "superusers", user.uid));
  if (suSnap.exists()) {
    window.location.href = "/super-user/";
    return;
  }

  // Check if admin
  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  if (adminSnap.exists()) {
    window.location.href = "/admin/";
    return;
  }

  // Otherwise cast
  window.location.href = "/cast/";
});

// LOGIN
loginBtn.addEventListener("click", async () => {
  const email = emailEl.value.trim();
  const password = passwordEl.value;

  if (!email || !password) {
    showError("Enter email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    showError(formatError(err.code));
  }
});

// ERROR HANDLING
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function formatError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return "Login failed. Try again.";
  }
}
