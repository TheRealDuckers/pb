/* DESIGN SYSTEM */
:root{
  --bg:#f5f5f7;
  --card:#fff;
  --soft:#fafafa;
  --text:#111;
  --muted:#666;
  --accent:#000;
  --border:#ddd;
  --radius-md:12px;
  --radius-lg:16px;
  --pill:999px;
  --shadow:0 8px 20px rgba(0,0,0,0.06);
  --space-2:8px;
  --space-3:12px;
  --space-4:16px;
}

body {
  font-family: system-ui, sans-serif;
  background: var(--bg);
  height: 100vh;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text);
}

/* SCREEN CONTAINER */
.screen {
  width: 340px;
  padding: var(--space-4);
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  text-align: center;
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
  transition: opacity .4s ease, transform .4s ease;
  position: absolute;
}

.screen.active {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

h2 {
  margin-bottom: var(--space-3);
  font-weight: 600;
}

input {
  width: 90%;
  padding: 12px;
  margin: var(--space-2) 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--soft);
  transition: border .2s ease, background .2s ease;
}

input:focus {
  border-color: var(--accent);
  background: #fff;
  outline: none;
}

/* BUTTON + LOADER */
button {
  width: 95%;
  padding: 12px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--pill);
  margin-top: var(--space-3);
  cursor: pointer;
  transition: transform .15s ease, opacity .2s ease;
  position: relative;
  overflow: hidden;
}

button:hover {
  transform: translateY(-2px);
  opacity: .9;
}

.loader {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  margin: 0 auto;
  display: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading .btn-text {
  opacity: 0;
}

.loading .loader {
  display: block;
}

/* SUCCESS TICK */
.tick {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #4CAF50;
  margin: 10px auto;
  position: relative;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity .3s ease, transform .3s ease;
}

.tick::after {
  content: "";
  position: absolute;
  left: 10px;
  top: 5px;
  width: 12px;
  height: 22px;
  border-right: 3px solid #4CAF50;
  border-bottom: 3px solid #4CAF50;
  transform: rotate(45deg);
}

.tick.show {
  opacity: 1;
  transform: scale(1);
}

#error-code, #error-signup, #verify-status {
  color: red;
  min-height: 20px;
  margin-top: var(--space-2);
}
