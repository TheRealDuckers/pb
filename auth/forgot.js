import {
  auth,
  sendPasswordResetEmail
} from "../firebase.js";

const emailEl = document.getElementById("email");
const resetBtn = document.getElementById("resetBtn");
const msgEl = document.getElementById("msg");

resetBtn.addEventListener("click", async () => {
  const email = emailEl.value.trim();

  if (!email) {
    showMessage("Enter your email.", "error");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Reset link sent! Check your inbox. If you can't see it, check your spam/junk folder.", "success");
  } catch (err) {
    showMessage(formatError(err.code), "error");
  }
});

function showMessage(text, type) {
  msgEl.textContent = text;
  msgEl.className = `msg ${type}`;
  msgEl.classList.remove("hidden");
}

function formatError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return "Could not send reset link.";
  }
}
