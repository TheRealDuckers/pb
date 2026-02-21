import {
  auth,
  db,
  signInWithEmailAndPassword,
  doc,
  getDoc
} from "../firebase.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // Find which PB this user belongs to
    const pbSnap = await getDoc(doc(db, "userToPB", uid));

    if (!pbSnap.exists()) {
      alert("Your account is not linked to a PracticeBase.");
      return;
    }

    const pbCode = pbSnap.data().pbCode;

    localStorage.setItem("pbCode", pbCode);

    window.location.href = "/";
  } catch (err) {
    alert(err.message);
  }
});
