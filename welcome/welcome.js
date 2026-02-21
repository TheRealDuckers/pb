const joinBtn = document.getElementById("joinBtn");
const loginBtn = document.getElementById("loginBtn");
const qrModal = document.getElementById("qrModal");
const closeQR = document.getElementById("closeQR");
const video = document.getElementById("qrVideo");

let stream;
let scanning = false;

// ------------------------------
// OPEN QR SCANNER
// ------------------------------
joinBtn.addEventListener("click", async () => {
  qrModal.classList.remove("hidden");

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    video.setAttribute("playsinline", true); // iOS fix
    video.srcObject = stream;
    video.play();

    scanning = true;
    scanLoop();
  } catch (err) {
    alert("Camera access denied or unavailable.");
  }
});

// ------------------------------
// CLOSE QR SCANNER
// ------------------------------
closeQR.addEventListener("click", () => {
  scanning = false;
  qrModal.classList.add("hidden");
  if (stream) stream.getTracks().forEach(t => t.stop());
});

// ------------------------------
// LOGIN BUTTON
// ------------------------------
loginBtn.addEventListener("click", () => {
  window.location.href = "/auth/login.html";
});

// ------------------------------
// QR SCAN LOOP
// ------------------------------
function scanLoop() {
  if (!scanning) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const tick = () => {
    if (!scanning) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, canvas.width, canvas.height, {
        inversionAttempts: "dontInvert"
      });

      if (code) {
        const url = code.data;

        // Extract ?code=PBCODE
        const pbCode = new URL(url).searchParams.get("code");

        if (pbCode) {
          scanning = false;
          stream.getTracks().forEach(t => t.stop());
          window.location.href = `/auth/signup.html?code=${pbCode}`;
          return;
        }
      }
    }

    requestAnimationFrame(tick);
  };

  tick();
}
