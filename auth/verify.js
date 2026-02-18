import { auth, db } from "/firebase.js";
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

async function verifyEmail() {
  try {
    await applyActionCode(auth, oobCode);
  } catch (err) {
    errorEl.textContent = "Invalid or expired verification link.";
  }
}

verifyEmail();

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

    window.location.href = "/dashboard.html";

  } catch (err) {
    errorEl.textContent = err.message;
  }

  finishBtn.classList.remove("loading");
};
