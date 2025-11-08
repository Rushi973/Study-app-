// ---- timer state ----
let startTime = 0;
let elapsed = 0;
let tick = null;

const $ = (id) => document.getElementById(id);
const timerEl = $("timer");
const statusEl = $("status");
const startBtn = $("start");
const pauseBtn = $("pause");
const resetBtn = $("reset");
const saveBtn  = $("save");
const achievementsEl = $("achievements");
const reportEl = $("report");

// audio controls
const audioUrlInput = $("audioUrl");
const saveAudioBtn  = $("saveAudio");
const autoPlayChk   = $("autoPlay");
let audio = null;

// ---- utilities ----
function fmt(ms){
  const s = Math.floor(ms/1000);
  const h = String(Math.floor(s/3600)).padStart(2,"0");
  const m = String(Math.floor((s%3600)/60)).padStart(2,"0");
  const sec = String(s%60).padStart(2,"0");
  return `${h}:${m}:${sec}`;
}

function nowTotal(){
  const running = tick ? (Date.now() - startTime) : 0;
  return elapsed + running;
}

function render(){
  const total = nowTotal();
  timerEl.textContent = fmt(total);

  // break reminder if > 2 hours
  if (total >= 2*60*60*1000) {
    // fire once per run
    if (tick) {
      clearInterval(tick);
      tick = null;
      elapsed += Date.now() - startTime;
      if (statusEl) statusEl.textContent = "Break time";
      alert("You crossed 2 hours. Take a break.");
      // optional audio
      if (autoPlayChk && autoPlayChk.checked && audio) {
        audio.currentTime = 0;
        audio.play().catch(()=>{ /* autoplay may be blocked */ });
      }
    }
  }
}

// ---- button handlers ----
startBtn.onclick = () => {
  if (tick) return;
  startTime = Date.now();
  tick = setInterval(render, 200);
  if (statusEl) statusEl.textContent = "Running";
};

pauseBtn.onclick = () => {
  if (!tick) return;
  clearInterval(tick);
  tick = null;
  elapsed += Date.now() - startTime;
  render();
  if (statusEl) statusEl.textContent = "Paused";
};

resetBtn.onclick = () => {
  clearInterval(tick);
  tick = null;
  startTime = 0;
  elapsed = 0;
  render();
  if (statusEl) statusEl.textContent = "Reset";
};

saveBtn.onclick = () => {
  const total = nowTotal();
  if (total < 1000) { alert("Timer too short to save."); return; }
  if (tick){
    clearInterval(tick);
    tick = null;
    elapsed += Date.now() - startTime;
  }
  addSession(elapsed);
  startTime = 0;
  elapsed = 0;
  render();
  if (statusEl) statusEl.textContent = "Saved";
  renderAchievements();
  renderWeeklyReport();
};

// ---- storage for sessions ----
function loadSessions(){ try{ return JSON.parse(localStorage.getItem("sessions")||"[]"); }catch{ return []; } }
function saveSessions(list){ localStorage.setItem("sessions", JSON.stringify(list)); }
function addSession(ms){ const list = loadSessions(); list.push({ ms, endedAt: Date.now() }); saveSessions(list); }

function renderAchievements(){
  const list = loadSessions().slice().reverse();
  achievementsEl.innerHTML = "";
  if (list.length === 0){ achievementsEl.innerHTML = "<li>No achievements yet.</li>"; return; }
  for (const item of list){
    const li = document.createElement("li");
    const d = new Date(item.endedAt);
    li.textContent = `${fmt(item.ms)} on ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    achievementsEl.appendChild(li);
  }
}

// ---- weekly report ----
function renderWeeklyReport(){
  const list = loadSessions();
  if (list.length === 0){ reportEl.textContent = "No data yet."; return; }

  const now = Date.now();
  const weekAgo = now - 7*24*3600*1000;
  const recent = list.filter(s => s.endedAt >= weekAgo);
  if (recent.length === 0){ reportEl.textContent = "No sessions in the last 7 days."; return; }

  const byDay = Array(7).fill(0);
  const byHour = Array(24).fill(0);

  for (const s of recent){
    const d = new Date(s.endedAt);
    byDay[d.getDay()] += s.ms;
    byHour[d.getHours()] += s.ms;
  }

  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  let bestDayIdx = 0, bestDayVal = -1;
  let bestHourIdx = 0, bestHourVal = -1;
  byDay.forEach((v,i)=>{ if (v>bestDayVal){ bestDayVal=v; bestDayIdx=i; }});
  byHour.forEach((v,i)=>{ if (v>bestHourVal){ bestHourVal=v; bestHourIdx=i; }});

  const totalMs = recent.reduce((a,b)=>a+b.ms,0);
  reportEl.innerHTML =
    `Total last 7 days: <b>${fmt(totalMs)}</b><br>` +
    `Most productive day: <b>${dayNames[bestDayIdx]}</b> (${fmt(bestDayVal)})<br>` +
    `Best study hour: <b>${String(bestHourIdx).padStart(2,"0")}:00</b> (${fmt(bestHourVal)})`;
}

// ---- audio prefs ----
function loadAudioPrefs(){
  const url = localStorage.getItem("audioUrl") || "";
  const ap  = localStorage.getItem("autoPlay") === "1";
  if (audioUrlInput) audioUrlInput.value = url;
  if (autoPlayChk) autoPlayChk.checked = ap;
  if (url) audio = new Audio(url);
}
saveAudioBtn && (saveAudioBtn.onclick = () => {
  const url = audioUrlInput.value.trim();
  localStorage.setItem("audioUrl", url);
  localStorage.setItem("autoPlay", autoPlayChk.checked ? "1" : "0");
  audio = url ? new Audio(url) : null;
  alert("Audio settings saved.");
});

// ---- init ----
render();
renderAchievements();
renderWeeklyReport();
loadAudioPrefs();}

function addSession(ms){
  const list = loadSessions();
  list.push({ ms, endedAt: Date.now() });
  saveSessions(list);
}

function renderAchievements(){
  const list = loadSessions().slice().reverse(); // newest first
  achievementsEl.innerHTML = "";
  if (list.length === 0){
    achievementsEl.innerHTML = "<li>No achievements yet.</li>";
    return;
  }
  for (const item of list){
    const li = document.createElement("li");
    const d = new Date(item.endedAt);
    li.textContent = `${fmt(item.ms)} on ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    achievementsEl.appendChild(li);
  }
}

saveBtn.onclick = () => {
  const total = nowTotal();
  if (total < 1000) { alert("Timer too short to save."); return; }
  // if running, convert current run into elapsed first
  if (tick){
    clearInterval(tick);
    tick = null;
    elapsed += Date.now() - startTime;
  }
  addSession(elapsed);
  // reset timer after save
  startTime = 0;
  elapsed = 0;
  render();
  if (statusEl) statusEl.textContent = "Saved";
  renderAchievements();
  renderWeeklyReport();
};

// ---- weekly report ----
function renderWeeklyReport(){
  const list = loadSessions();
  if (list.length === 0){ reportEl.textContent = "No data yet."; return; }

  const now = Date.now();
  const weekAgo = now - 7*24*3600*1000;
  const recent = list.filter(s => s.endedAt >= weekAgo);

  if (recent.length === 0){ reportEl.textContent = "No sessions in the last 7 days."; return; }

  // Totals by weekday and hour-of-day
  const byDay = Array(7).fill(0);     // 0=Sun..6=Sat
  const byHour = Array(24).fill(0);   // 0..23

  for (const s of recent){
    const d = new Date(s.endedAt);
    byDay[d.getDay()] += s.ms;
    byHour[d.getHours()] += s.ms;
  }

  // Find max day and hour
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  let bestDayIdx = 0, bestDayVal = -1;
  let bestHourIdx = 0, bestHourVal = -1;

  byDay.forEach((v,i)=>{ if (v>bestDayVal){ bestDayVal=v; bestDayIdx=i; }});
  byHour.forEach((v,i)=>{ if (v>bestHourVal){ bestHourVal=v; bestHourIdx=i; }});

  const totalMs = recent.reduce((a,b)=>a+b.ms,0);
  reportEl.innerHTML =
    `Total last 7 days: <b>${fmt(totalMs)}</b><br>` +
    `Most productive day: <b>${dayNames[bestDayIdx]}</b> (${fmt(bestDayVal)})<br>` +
    `Best study hour: <b>${String(bestHourIdx).padStart(2,"0")}:00</b> (${fmt(bestHourVal)})`;
}

// ---- init ----
render();
renderAchievements();
renderWeeklyReport();
// ---- Focus Mode: Wake Lock + Fullscreen + Exit guard ----
const focusOn  = document.getElementById("focusOn");
const focusOff = document.getElementById("focusOff");

let wakeLock = null;

async function requestWakeLock(){
  try {
    if ("wakeLock" in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", ()=>{ wakeLock = null; });
    }
  } catch(e){ console.log("WakeLock error", e); }
}

async function releaseWakeLock(){
  try { if (wakeLock) { await wakeLock.release(); wakeLock = null; } }
  catch(e){ /* ignore */ }
}

async function enterFullscreen(){
  const el = document.documentElement;
  if (el.requestFullscreen) await el.requestFullscreen();
}

async function exitFullscreen(){
  if (document.fullscreenElement && document.exitFullscreen) {
    await document.exitFullscreen();
  }
}

// warn if leaving while timer running
function beforeUnloadHandler(e){
  if (tick) { e.preventDefault(); e.returnValue = ""; }
}
window.addEventListener("visibilitychange", ()=>{
  // auto-pause if user switches apps or tabs
  if (document.visibilityState === "hidden" && tick) {
    pauseBtn.click();
  }
});

focusOn.onclick = async () => {
  await enterFullscreen();
  await requestWakeLock();
  window.addEventListener("beforeunload", beforeUnloadHandler);
  alert("Focus Mode on. Screen stays awake. Exiting will ask for confirmation.");
};

focusOff.onclick = async () => {
  await releaseWakeLock();
  await exitFullscreen();
  window.removeEventListener("beforeunload", beforeUnloadHandler);
  alert("Focus Mode off.");
};
