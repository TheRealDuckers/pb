import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ---------------- SCREEN SWITCHER ---------------- */
function show(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

function startLoading(btn) {
  btn.classList.add("loading");
}

function stopLoading(btn) {
  btn.classList.remove("loading");
}

/* ---------------- HANDLE REDIRECT FROM EMAIL VERIFIED PAGE ---------------- */
if (window.location.hash === "#verified") {
  show("screen-verify");

  const tick = document.getElementById("tick");
  const status = document.getElementById("verify-status");

  tick.classList.add("show");
  status.style.color = "green";
  status.textContent = "Email verified! You’re all set.";
}

/* ---------------- STEP 1: PB CODE ---------------- */
document.getElementById("btn-code-next").onclick = async (e) => {
  const btn = e.currentTarget;
  startLoading(btn);

  const code = document.getElementById("pb-code").value.trim().toUpperCase();
  const error = document.getElementById("error-code");

  const q = query(
    collection(db, "practicebases"),
    where("code", "==", code),
    where("active", "==", true)
  );

  const snap = await getDocs(q);

  stopLoading(btn);

  if (snap.empty) {
    error.textContent = "Invalid PracticeBase code.";
    return;
  }

  const pb = snap.docs[0];
  localStorage.setItem("pbId", pb.id);
  localStorage.setItem("pbCode", code);

  show("screen-signup");
};

/* ---------------- STEP 2: SIGNUP ---------------- */
document.getElementById("btn-signup").onclick = async (e) => {
  const btn = e.currentTarget;
  startLoading(btn);

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("error-signup");

  const pbId = localStorage.getItem("pbId");
  const pbCode = localStorage.getItem("pbCode");

  if (!pbId) {
    error.textContent = "No PracticeBase selected.";
    stopLoading(btn);
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      practiceBaseId: pbId,
      practiceBaseCode: pbCode,
      role: "cast",          // DEFAULT ROLE
      createdAt: new Date().toISOString(),
    });

    await sendEmailVerification(cred.user);

    stopLoading(btn);
    show("screen-verify");
  } catch (err) {
    error.textContent = err.message;
    stopLoading(btn);
  }
};

/* ---------------- STEP 3: VERIFY EMAIL ---------------- */
document.getElementById("btn-check").onclick = async (e) => {
  const btn = e.currentTarget;
  startLoading(btn);

  const user = auth.currentUser;
  const status = document.getElementById("verify-status");
  const tick = document.getElementById("tick");

  await user.reload();

  stopLoading(btn);

  if (user.emailVerified) {
    status.style.color = "green";
    status.textContent = "Email verified! You’re all set.";
    tick.classList.add("show");
  } else {
    status.style.color = "red";
    status.textContent = "Not verified yet.";
  }
};
