import { auth, db } from "./firebase.js";
import {
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const finishBtn = document.getElementById("btn-finish");
const errorEl = document.getElementById("error");

finishBtn.onclick = async () => {
  finishBtn.classList.add("loading");

  const username = document.getElementById("username").value.trim();
  if (!username) {
    errorEl.textContent = "Please enter a username.";
    finishBtn.classList.remove("loading");
    return;
  }

  let email = localStorage.getItem("signupEmail");
  if (!email) {
    email = prompt("Enter the email you used to sign up:");
    if (!email) {
      errorEl.textContent = "Email is required.";
      finishBtn.classList.remove("loading");
      return;
    }
  }

  const pbId = localStorage.getItem("pbId");
  const pbCode = localStorage.getItem("pbCode");

  try {
    // Sign the user in using the email link
    await signInWithEmailLink(auth, email, window.location.href);
    const user = auth.currentUser;

    await setDoc(doc(db, "users", user.uid), {
      username,
      practiceBaseId: pbId,
      practiceBaseCode: pbCode,
      role: "cast",
      emailVerified: true,
      createdAt: new Date().toISOString()
    });

    window.location.href = "/cast/";

  } catch (err) {
    errorEl.textContent = err.message;
  }

  finishBtn.classList.remove("loading");
};
