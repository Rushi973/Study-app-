// ================= Stopwatch core =================
document.addEventListener("DOMContentLoaded", () => {

  let startTime = 0;
  let elapsed = 0;
  let tick = null;

  const timerEl = document.getElementById("timer");
  const statusEl = document.getElementById("status");
  const startBtn = document.getElementById("start");
  const pauseBtn = document.getElementById("pause");
  const resetBtn = document.getElementById("reset");

  function fmt(ms){
    const s = Math.floor(ms/1000);
    const h = String(Math.floor(s/3600)).padStart(2,"0");
    const m = String(Math.floor((s%3600)/60)).padStart(2,"0");
    const sec = String(s%60).padStart(2,"0");
    return `${h}:${m}:${sec}`;
  }

  function nowTotal(){
    return elapsed + (tick ? Date.now() - startTime : 0);
  }

  function render(){
    timerEl.textContent = fmt(nowTotal());
  }

  startBtn.onclick = () => {
    if (tick) return;
    startTime = Date.now();
    tick = setInterval(render, 200);
    statusEl.textContent = "Running";
  };

  pauseBtn.onclick = () => {
    if (!tick) return;
    clearInterval(tick);
    tick = null;
    elapsed += Date.now() - startTime;
    render();
    statusEl.textContent = "Paused";
  };

  resetBtn.onclick = () => {
    clearInterval(tick);
    tick = null;
    startTime = 0;
    elapsed = 0;
    render();
    statusEl.textContent = "Reset";
  };

  render();
});
const CACHE = "studyapp-v2";
const ASSETS = [
  "/Study-app-/",
  "/Study-app-/index.html",
  "/Study-app-/manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
// ==================================================
