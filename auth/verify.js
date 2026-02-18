import { auth, db } from "./firebase.js";
import {
  applyActionCode,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const oobCode = params.get("oobCode");

const finishBtn = document.getElementById("btn-finish");
const errorEl = document.getElementById("error");

// 1. Apply the verification code
async function verifyEmail() {
  try {
    await applyActionCode(auth, oobCode);
  } catch (err) {
    errorEl.textContent = "Invalid or expired verification link.";
  }
}

verifyEmail();

// 2. Handle Finish button
finishBtn.onclick = async () => {
  finishBtn.classList.add("loading");

  const username = document.getElementById("username").value.trim();
  if (!username) {
    errorEl.textContent = "Please enter a username.";
    finishBtn.classList.remove("loading");
    return;
  }

  const email = localStorage.getItem("signupEmail");
  const pbId = localStorage.getItem("pbId");
  const pbCode = localStorage.getItem("pbCode");

  try {
    // 3. Sign the user in using the email link
    await signInWithEmailLink(auth, email, window.location.href);

    const user = auth.currentUser;

    // 4. Write user profile to Firestore
    await setDoc(doc(db, "users", user.uid), {
      username,
      practiceBaseId: pbId,
      practiceBaseCode: pbCode,
      role: "cast",
      emailVerified: true,
      createdAt: new Date().toISOString()
    });

    // 5. Redirect to your app
    window.location.href = "/dashboard.html";

  } catch (err) {
    errorEl.textContent = err.message;
  }

  finishBtn.classList.remove("loading");
};
