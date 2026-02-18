import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* UTILITIES */
function startLoading(btn) { btn?.classList.add("loading"); }
function stopLoading(btn) { btn?.classList.remove("loading"); }

/* Detect page */
const page = document.body.dataset.page;

/* ---------------------------------------------------------
   PAGE 1: SIGNUP FLOW (PB code → email/password)
--------------------------------------------------------- */
if (page === "signup") {

  /* PB CODE SCREEN */
  const nextBtn = document.getElementById("btn-next");
  const errorCode = document.getElementById("error-code");

  nextBtn.onclick = async () => {
    startLoading(nextBtn);

    const code = document.getElementById("pb-code").value.trim().toUpperCase();

    const q = query(
      collection(db, "practicebases"),
      where("code", "==", code),
      where("active", "==", true)
    );

    const snap = await getDocs(q);
    stopLoading(nextBtn);

    if (snap.empty) {
      errorCode.textContent = "Invalid PracticeBase code.";
      return;
    }

    const pb = snap.docs[0];

    localStorage.setItem("pbId", pb.id);
    localStorage.setItem("pbCode", code);

    // Switch screens
    document.getElementById("screen-code").classList.remove("active");
    document.getElementById("screen-signup").classList.add("active");
  };

  /* SIGNUP SCREEN */
  const signupBtn = document.getElementById("btn-signup");
  const errorSignup = document.getElementById("error-signup");

  signupBtn.onclick = async () => {
    startLoading(signupBtn);

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);

      // Store email for email-link login
      localStorage.setItem("signupEmail", email);

      errorSignup.style.color = "green";
      errorSignup.textContent = "Check your email to verify your account.";

    } catch (err) {
      errorSignup.textContent = err.message;
    }

    stopLoading(signupBtn);
  };
}

/* ---------------------------------------------------------
   PAGE 2: EMAIL VERIFIED (username setup)
--------------------------------------------------------- */
if (page === "verified") {

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
    startLoading(finishBtn);

    const username = document.getElementById("username").value.trim();
    if (!username) {
      errorEl.textContent = "Please enter a username.";
      stopLoading(finishBtn);
      return;
    }

    const email = localStorage.getItem("signupEmail");
    const pbId = localStorage.getItem("pbId");
    const pbCode = localStorage.getItem("pbCode");

    try {
      // Sign user in using the email link
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

    stopLoading(finishBtn);
  };
}
