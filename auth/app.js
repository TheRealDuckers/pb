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

function startLoading(btn) { btn.classList.add("loading"); }
function stopLoading(btn) { btn.classList.remove("loading"); }

function switchScreen(fromId, toId) {
  const from = document.getElementById(fromId);
  const to = document.getElementById(toId);

  from.classList.remove("active");
  from.classList.add("exit-left");

  to.classList.add("active");

  setTimeout(() => {
    from.classList.remove("exit-left");
  }, 450);
}

/* PB CODE SCREEN */
document.getElementById("btn-next").onclick = async () => {
  const btn = document.getElementById("btn-next");
  startLoading(btn);

  const code = document.getElementById("pb-code").value.trim().toUpperCase();
  const errorEl = document.getElementById("error-code");

  const q = query(
    collection(db, "practicebases"),
    where("code", "==", code),
    where("active", "==", true)
  );

  const snap = await getDocs(q);
  stopLoading(btn);

  if (snap.empty) {
    errorEl.textContent = "Invalid PracticeBase code.";
    return;
  }

  const pb = snap.docs[0];
  localStorage.setItem("pbId", pb.id);
  localStorage.setItem("pbCode", code);

  switchScreen("screen-code", "screen-signup");
};

/* SIGNUP SCREEN */
document.getElementById("btn-signup").onclick = async () => {
  const btn = document.getElementById("btn-signup");
  startLoading(btn);

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error-signup");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);

    localStorage.setItem("signupEmail", email);

    errorEl.style.color = "green";
    errorEl.textContent = "Check your email to verify your account.";
  } catch (err) {
    errorEl.textContent = err.message;
  }

  stopLoading(btn);
};
