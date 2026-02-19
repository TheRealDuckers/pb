import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const actionCodeSettings = {
  url: "https://practicebase.github.io/PracticeBase/auth/verify.html",
  handleCodeInApp: true
};

document.getElementById("btn-signup").onclick = async () => {
  const pbCode = document.getElementById("pb-code").value.trim().toUpperCase();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error-signup");

  errorEl.textContent = "";

  if (!pbCode || !username || !email || !password) {
    errorEl.textContent = "Please fill out all fields.";
    return;
  }

  // Validate PB code
  const q = query(
    collection(db, "practicebases"),
    where("code", "==", pbCode),
    where("active", "==", true)
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    errorEl.textContent = "Invalid PracticeBase code.";
    return;
  }

  const pbDoc = snap.docs[0];
  const pbId = pbDoc.id;

  try {
    // Create Firebase user
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // Create Firestore user doc
    await setDoc(doc(db, "users", user.uid), {
      username,
      email,
      role: "cast",
      practiceBaseId: pbId,
      practiceBaseCode: pbCode,
      emailVerified: false,
      createdAt: new Date().toISOString()
    });

    // Send email verification link
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    // Save email for verify step
    localStorage.setItem("signupEmail", email);

    errorEl.style.color = "green";
    errorEl.textContent = "Account created! Check your email to verify.";

  } catch (err) {
    errorEl.textContent = err.message;
  }
};
