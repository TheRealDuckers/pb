const joinBtn = document.getElementById("joinBtn");
const loginBtn = document.getElementById("loginBtn");
const qrModal = document.getElementById("qrModal");
const closeQR = document.getElementById("closeQR");
const video = document.getElementById("qrVideo");

let stream;

// ------------------------------
// OPEN QR SCANNER
// ------------------------------
joinBtn.addEventListener("click", async () => {
  qrModal.classList.remove("hidden");

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });

  video.srcObject = stream;

  scanLoop();
});

// ------------------------------
// CLOSE QR SCANNER
// ------------------------------
closeQR.addEventListener("click", () => {
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
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const tick = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, canvas.width, canvas.height);

      if (code) {
        const url = code.data;

        // Extract ?code=PBCODE
        const pbCode = new URL(url).searchParams.get("code");

        if (pbCode) {
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
