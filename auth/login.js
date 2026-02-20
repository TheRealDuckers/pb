// /auth/login.js
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.getElementById("btn-login").onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error-login");

  errorEl.textContent = "";

  try {
    // Sign in
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // Load user doc
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      errorEl.textContent = "User record missing.";
      return;
    }

    const data = snap.data();

    // Email verification check
    if (!data.emailVerified) {
      errorEl.textContent = "Please verify your email first.";
      return;
    }

    // Role-based redirect
    if (data.role === "super") {
      window.location.href = "/super-user/";
      return;
    }

    if (data.role === "admin") {
      window.location.href = "/admin/";
      return;
    }

    // Default: cast
    window.location.href = "/cast/";

  } catch (err) {
    errorEl.textContent = err.message;
  }
};
