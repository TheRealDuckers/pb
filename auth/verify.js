import { auth, db } from "./firebase.js";
import {
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const errorEl = document.getElementById("error");

(async () => {
  const email = localStorage.getItem("signupEmail");
  if (!email) {
    errorEl.textContent = "Missing signup email.";
    return;
  }

  try {
    await signInWithEmailLink(auth, email, window.location.href);
    const user = auth.currentUser;

    // Mark verified
    await updateDoc(doc(db, "users", user.uid), {
      emailVerified: true
    });

    // Get role to redirect
    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.data().role;

    if (role === "admin") window.location.href = "/admin/";
    else if (role === "super") window.location.href = "/super-user/";
    else window.location.href = "/cast/";

  } catch (err) {
    errorEl.textContent = err.message;
  }
})();
