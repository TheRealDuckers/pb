import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const pbInput = document.getElementById("pb-code");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const signupBtn = document.getElementById("btn-signup");
const errorEl = document.getElementById("error");

function startLoading(btn) { btn.classList.add("loading"); }
function stopLoading(btn) { btn.classList.remove("loading"); }

signupBtn.onclick = async () => {
  startLoading(signupBtn);

  const code = pbInput.value.trim().toUpperCase();
  const email = emailInput.value.trim();
  const password = passInput.value;

  const q = query(
    collection(db, "practicebases"),
    where("code", "==", code),
    where("active", "==", true)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    errorEl.textContent = "Invalid PracticeBase code.";
    stopLoading(signupBtn);
    return;
  }

  const pb = snap.docs[0];

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await sendEmailVerification(cred.user);

    // Save PB info for the next page
    localStorage.setItem("pbId", pb.id);
    localStorage.setItem("pbCode", code);

    errorEl.style.color = "green";
    errorEl.textContent = "Check your email to verify your account.";

  } catch (err) {
    errorEl.textContent = err.message;
  }

  stopLoading(signupBtn);
};
