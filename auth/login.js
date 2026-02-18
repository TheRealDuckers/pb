import { auth, db } from "/firebase.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginBtn = document.getElementById("btn-login");
const errorEl = document.getElementById("error");

function startLoading(btn) { btn.classList.add("loading"); }
function stopLoading(btn) { btn.classList.remove("loading"); }

loginBtn.onclick = async () => {
  startLoading(loginBtn);

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // Load Firestore profile
    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      errorEl.textContent = "Account profile not found.";
      stopLoading(loginBtn);
      return;
    }

    const data = snap.data();

    // Redirect based on role
    if (data.role === "admin") {
      window.location.href = "/admin/";
    } else {
      window.location.href = "/cast/";
    }

  } catch (err) {
    errorEl.textContent = err.message;
  }

  stopLoading(loginBtn);
};
