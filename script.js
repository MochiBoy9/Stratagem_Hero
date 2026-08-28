/* ==========================================================================
   STRATAGEM HERO — game logic
   ========================================================================== */

const STRATAGEMS = [
  // --- Offensive permit: Orbital Strikes ---
  { name: "Orbital Precision Strike", type: "offensive", seq: ["right","right","up"] },
  { name: "Orbital Gatling Barrage", type: "offensive", seq: ["right","down","left","up","up"] },
  { name: "Orbital Gas Strike", type: "offensive", seq: ["right","right","down","right"] },
  { name: "Orbital 120mm HE Barrage", type: "offensive", seq: ["right","right","down","left","right","down"] },
  { name: "Orbital Airburst Strike", type: "offensive", seq: ["right","right","right"] },
  { name: "Orbital Smoke Strike", type: "offensive", seq: ["right","right","down","up"] },
  { name: "Orbital EMS Strike", type: "offensive", seq: ["right","right","left","down"] },
  { name: "Orbital 380mm HE Barrage", type: "offensive", seq: ["right","down","up","up","left","down","down"] },
  { name: "Orbital Walking Barrage", type: "offensive", seq: ["right","down","right","down","right","down"] },
  { name: "Orbital Laser", type: "offensive", seq: ["right","down","up","right","down"] },
  { name: "Orbital Napalm Barrage", type: "offensive", seq: ["right","right","down","left","right","up"] },
  { name: "Orbital Railcannon Strike", type: "offensive", seq: ["right","up","down","down","right"] },

  // --- Offensive permit: Eagle Strikes ---
  { name: "Eagle Strafing Run", type: "offensive", seq: ["up","right","right"] },
  { name: "Eagle Airstrike", type: "offensive", seq: ["up","right","down","right"] },
  { name: "Eagle Cluster Bomb", type: "offensive", seq: ["up","right","down","down","right"] },
  { name: "Eagle Smoke Strike", type: "offensive", seq: ["up","right","up","down"] },
  { name: "Eagle Napalm Airstrike", type: "offensive", seq: ["up","right","down","up"] },
  { name: "Eagle 110mm Rocket Pods", type: "offensive", seq: ["up","right","up","left"] },
  { name: "Eagle 500kg Bomb", type: "offensive", seq: ["up","right","down","down","down"] },
  { name: "Eagle Rearm", type: "offensive", seq: ["up","up","left","up","right"] },

  // --- Supply permit: Support Weapons ---
  { name: "MG-43 Machine Gun", type: "supply", seq: ["down","left","down","up","right"] },
  { name: "EAT-17 Expendable Anti-Tank", type: "supply", seq: ["down","down","left","up","right"] },
  { name: "M-105 Stalwart", type: "supply", seq: ["down","left","down","up","up","left"] },
  { name: "LAS-98 Laser Cannon", type: "supply", seq: ["down","left","down","up","left"] },
  { name: "APW-1 Anti-Materiel Rifle", type: "supply", seq: ["down","left","right","up","down"] },
  { name: "GR-8 Recoilless Rifle", type: "supply", seq: ["down","left","right","right","left"] },
  { name: "GL-21 Grenade Launcher", type: "supply", seq: ["down","left","up","left","down"] },
  { name: "FLAM-40 Flamethrower", type: "supply", seq: ["down","left","up","down","up"] },
  { name: "MG-206 Heavy Machine Gun", type: "supply", seq: ["down","left","up","down","down"] },
  { name: "AC-8 Autocannon", type: "supply", seq: ["down","left","down","up","up","right"] },
  { name: "ARC-3 Arc Thrower", type: "supply", seq: ["down","right","down","up","left","left"] },
  { name: "LAS-99 Quasar Cannon", type: "supply", seq: ["down","down","up","left","right"] },
  { name: "RL-77 Airburst Rocket Launcher", type: "supply", seq: ["down","up","up","left","right"] },
  { name: "MLS-4X Commando", type: "supply", seq: ["down","left","up","down","right"] },
  { name: "FAF-14 Spear", type: "supply", seq: ["down","down","up","down","down"] },
  { name: "RS-422 Railgun", type: "supply", seq: ["down","right","down","up","left","right"] },
  { name: "StA-X3 W.A.S.P. Launcher", type: "supply", seq: ["down","down","up","down","right"] },
  { name: "CQC-20 Breaching Hammer", type: "supply", seq: ["down","left","right","left","up"] },
  { name: "PLAS-45 Epoch", type: "supply", seq: ["down","left","up","left","right"] },
  { name: "MGX-42 Bullet Storm", type: "supply", seq: ["down","left","down","right","up","left"] },
  { name: "S-11 Speargun", type: "supply", seq: ["down","right","down","left","up","right"] },
  { name: "CQC-9 Defoliation Tool", type: "supply", seq: ["down","left","right","right","down"] },
  { name: "GL-52 De-Escalator", type: "supply", seq: ["down","right","up","left","right"] },
  { name: "EAT-700 Expendable Napalm", type: "supply", seq: ["down","down","left","up","left"] },
  { name: "TX-41 Sterilizer", type: "supply", seq: ["down","left","up","down","left"] },
  { name: "EAT-411 Leveller", type: "supply", seq: ["down","down","left","up","down"] },
  { name: "GL-28 Belt-Fed Grenade Launcher", type: "supply", seq: ["down","left","up","left","up","up"] },
  { name: "B/MD C4 Pack", type: "supply", seq: ["down","right","up","up","right","up"] },
  { name: "MS-11 Solo Silo", type: "supply", seq: ["down","up","right","down","down"] },
  { name: "B/FLAM-80 Cremator", type: "supply", seq: ["down","down","right","down","up","up"] },
  { name: "M-1000 Maxigun", type: "supply", seq: ["down","left","right","down","up","up"] },
  { name: "CQC-1 One True Flag", type: "supply", seq: ["down","left","right","right","up"] },
  { name: "40-K Meltagun", type: "supply", seq: ["down","left","up","left","left","down"] },

  // --- Supply permit: Backpacks ---
  { name: "B-1 Supply Pack", type: "supply", seq: ["down","left","down","up","up","down"] },
  { name: "LIFT-850 Jump Pack", type: "supply", seq: ["down","up","up","down","up"] },
  { name: "SH-20 Ballistic Shield Backpack", type: "supply", seq: ["down","left","down","down","up","left"] },
  { name: "AX/AR-23 Guard Dog", type: "supply", seq: ["down","up","left","up","right","down"] },
  { name: "AX/LAS-5 Rover", type: "supply", seq: ["down","up","left","up","right","right"] },
  { name: "SH-32 Shield Generator Pack", type: "supply", seq: ["down","up","left","right","left","right"] },
  { name: "SH-51 Directional Shield", type: "supply", seq: ["down","up","left","right","up","up"] },
  { name: "AX/FLAM-75 Hot Dog", type: "supply", seq: ["down","up","left","up","left","left"] },
  { name: "B-100 Portable Hellbomb", type: "supply", seq: ["down","right","up","up","up"] },
  { name: "AX/ARC-3 K-9", type: "supply", seq: ["down","up","left","up","right","left"] },
  { name: "LIFT-860 Hover Pack", type: "supply", seq: ["down","up","up","down","left","right"] },
  { name: "AX/TX-13 Dog Breath", type: "supply", seq: ["down","up","left","up","right","up"] },
  { name: "LIFT-182 Warp Pack", type: "supply", seq: ["down","left","right","down","left","right"] },

  // --- Supply permit: Vehicles ---
  { name: "M-103 Supply FRV", type: "supply", seq: ["left","down","left","left","down","up","right"] },
  { name: "M-104 Incinerator FRV", type: "supply", seq: ["left","down","right","left","down","up","up"] },
  { name: "EXO-49 Emancipator Exosuit", type: "supply", seq: ["left","down","right","up","left","down","up"] },
  { name: "EXO-45 Patriot Exosuit", type: "supply", seq: ["left","down","right","up","left","down","down"] },
  { name: "M-102 Gunner FRV", type: "supply", seq: ["left","down","right","down","right","down","up"] },
  { name: "TD-220 Bastion MK XVI", type: "supply", seq: ["left","down","right","down","left","down","up","down","up"] },
  { name: "EXO-55 Breakthrough Exosuit", type: "supply", seq: ["left","down","right","left","right","down","up"] },
  { name: "EXO-51 Lumberer Exosuit", type: "supply", seq: ["left","down","right","up","right","left","up"] },

  // --- Defensive permit: Sentries ---
  { name: "A/MG-43 Machine Gun Sentry", type: "defensive", seq: ["down","up","right","right","up"] },
  { name: "A/G-16 Gatling Sentry", type: "defensive", seq: ["down","up","right","left"] },
  { name: "A/AC-8 Autocannon Sentry", type: "defensive", seq: ["down","up","right","up","left","up"] },
  { name: "A/M-12 Mortar Sentry", type: "defensive", seq: ["down","up","right","right","down"] },
  { name: "EMS Mortar Sentry", type: "defensive", seq: ["down","up","right","down","right"] },
  { name: "Rocket Sentry", type: "defensive", seq: ["down","up","right","right","left"] },

  // --- Defensive permit: Emplacements ---
  { name: "HMG Emplacement", type: "defensive", seq: ["up","down","left","right","right","left"] },
  { name: "Shield Generator Relay", type: "defensive", seq: ["down","up","left","right","left","down"] },
  { name: "Tesla Tower", type: "defensive", seq: ["down","up","right","up","left","right"] },

  // --- Defensive permit: Mines ---
  { name: "Anti-Personnel Minefield", type: "defensive", seq: ["down","left","up","right"] },
  { name: "Incendiary Mines", type: "defensive", seq: ["down","left","left","down"] },

  // --- Mission permit ---
  { name: "Reinforce", type: "mission", seq: ["up","down","right","left","up"] },
  { name: "Resupply", type: "mission", seq: ["down","down","up","right"] },
  { name: "SOS Beacon", type: "mission", seq: ["up","down","right","up"] },
  { name: "Hellbomb", type: "mission", seq: ["down","up","left","down","up","right","down","up"] },
  { name: "Orbital Illumination Flare", type: "mission", seq: ["right","right","left","left"] },
  { name: "Super Earth Flag", type: "mission", seq: ["down","up","down","up"] },
  { name: "SEAF Artillery", type: "mission", seq: ["right","up","up","down"] },
];

const CATEGORY_META = {
  offensive: { label: "Offensive", className: "cat-offensive" },
  supply: { label: "Supply", className: "cat-supply" },
  defensive: { label: "Defensive", className: "cat-defensive" },
  mission: { label: "Mission", className: "cat-mission" },
};

/* ---------------------------------------------------------------------
   2. CONSTANTS & DOM REFERENCES
   --------------------------------------------------------------------- */
const TIME_ADD_ON_CLEAR = 2;         
const SPEED_STEP_PER_WAVE = 0.08;
const MAX_SPEED_MULTIPLIER = 3.5;
const LOW_TIME_THRESHOLD = 3;
const TICK_INTERVAL_MS = 100;
const BASE_TRANSITION_DELAY_MS = 260;
const MIN_TRANSITION_DELAY_MS = 110;

const arrowContainer = document.getElementById("arrow-container");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const clearedEl = document.getElementById("cleared");
const sessionBestEl = document.getElementById("sessionBest");
const timeEl = document.getElementById("time");
const waveEl = document.getElementById("wave");
const waveTimerFill = document.getElementById("waveTimerFill");
const categoryBadge = document.getElementById("categoryBadge");
const stratagemName = document.getElementById("stratagemName");
const stageFrame = document.getElementById("stageFrame");
const idleOverlay = document.getElementById("idleOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const totalCountEl = document.getElementById("totalCount");
const finalScoreEl = document.getElementById("finalScore");
const finalWaveEl = document.getElementById("finalWave");
const finalComboEl = document.getElementById("finalCombo");
const finalClearedEl = document.getElementById("finalCleared");
const finalSessionBestEl = document.getElementById("finalSessionBest");
const dpad = document.getElementById("dpad");

// Icon references
const stratagemIcon = document.getElementById("stratagemIcon");
const stratagemIconFallback = document.getElementById("stratagemIconFallback");

// Preview DOM elements
const next1El = document.getElementById("next1");
const next1Name = document.getElementById("next1Name");
const next1Icon = document.getElementById("next1Icon");

const next2El = document.getElementById("next2");
const next2Name = document.getElementById("next2Name");
const next2Icon = document.getElementById("next2Icon");

/* ---------------------------------------------------------------------
   3. GAME STATE
   --------------------------------------------------------------------- */
let gameState = "idle";
let bag = [];
let activeWaveQueue = [];
let currentStratagem = null;
let currentStep = 0;
let score = 0;
let combo = 0;
let bestCombo = 0;
let cleared = 0;
let sessionBest = 0;
let timerId = null;

let waveNumber = 1;
let waveTimeMax = 10;
let waveTimeLeft = 10;
let waveTimeAllotted = 10; // For fill calculations
let speedMultiplier = 1;

/* ---------------------------------------------------------------------
   4. AUDIO
   --------------------------------------------------------------------- */
let audioCtx = null;

function ensureAudioCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone({ freq = 440, duration = 0.08, type = "square", volume = 0.15, delay = 0 }) {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const startTime = ctx.currentTime + delay;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

const sfx = {
  correctStep(stepIndex) { playTone({ freq: 440 + stepIndex * 45, duration: 0.07, type: "square", volume: 0.12 }); },
  wrong() { playTone({ freq: 130, duration: 0.2, type: "sawtooth", volume: 0.18 }); },
  complete() {
    playTone({ freq: 523.25, duration: 0.09, volume: 0.14 });
    playTone({ freq: 659.25, duration: 0.09, volume: 0.14, delay: 0.08 });
    playTone({ freq: 784.0, duration: 0.16, volume: 0.16, delay: 0.16 });
  },
  tick() { playTone({ freq: 880, duration: 0.04, volume: 0.07 }); },
  start() {
    playTone({ freq: 220, duration: 0.1, volume: 0.15 });
    playTone({ freq: 440, duration: 0.16, volume: 0.15, delay: 0.1 });
  },
  waveUp() {
    playTone({ freq: 659.25, duration: 0.07, volume: 0.12 });
    playTone({ freq: 880, duration: 0.1, volume: 0.12, delay: 0.06 });
  },
  gameOver() {
    playTone({ freq: 392, duration: 0.16, volume: 0.15 });
    playTone({ freq: 330, duration: 0.16, volume: 0.15, delay: 0.15 });
    playTone({ freq: 261.63, duration: 0.32, volume: 0.15, delay: 0.3 });
  },
};

/* ---------------------------------------------------------------------
   5. BAG RANDOMIZER
   --------------------------------------------------------------------- */
function refillBag() {
  bag = STRATAGEMS.map((_, i) => i);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
}

function drawStratagem() {
  if (bag.length === 0) refillBag();
  return STRATAGEMS[bag.pop()];
}

/* ---------------------------------------------------------------------
   6. STRATAGEM ICON — LOCAL FOLDER LOOKUP (Queue Compatible)
   --------------------------------------------------------------------- */
const ICON_FOLDER = "Stratagem/";
const ICON_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg", "gif"];
const MANIFEST_URL = `${ICON_FOLDER}manifest.json`;
const MANIFEST_FETCH_TIMEOUT_MS = 1500;

let manifest = null;
let manifestLoaded = false;
let manifestLoadingPromise = null;

// Multi-token tracker so async loaders don't overwrite each other.
const iconTokens = { main: 0, next1: 0, next2: 0 };

function loadManifest() {
  if (manifestLoadingPromise) return manifestLoadingPromise;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MANIFEST_FETCH_TIMEOUT_MS);
  manifestLoadingPromise = fetch(MANIFEST_URL, { signal: controller.signal })
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => { manifest = json && typeof json === "object" ? json : null; })
    .catch(() => { manifest = null; })
    .finally(() => {
      manifestLoaded = true;
      clearTimeout(timeout);
    });
  return manifestLoadingPromise;
}

function slugVariants(name) {
  const trimmed = name.trim();
  const underscored = trimmed.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const hyphenated = trimmed.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const compact = trimmed.replace(/[^A-Za-z0-9]+/g, "");
  return [...new Set([underscored, hyphenated, compact])];
}

function candidateUrls(stratagem) {
  const urls = [];
  const manifestName = manifest && manifest[stratagem.name];
  if (manifestName) urls.push(`${ICON_FOLDER}${manifestName}`);
  for (const variant of slugVariants(stratagem.name)) {
    for (const ext of ICON_EXTENSIONS) {
      urls.push(`${ICON_FOLDER}${variant}.${ext}`);
    }
  }
  return urls;
}

function applyIconToElement(stratagem, imgEl, fallbackEl, slotKey) {
  iconTokens[slotKey]++;
  const myToken = iconTokens[slotKey];

  imgEl.classList.remove("loaded");
  imgEl.removeAttribute("src");
  if(fallbackEl) {
      fallbackEl.textContent = stratagem.name.trim().charAt(0).toUpperCase() || "?";
      fallbackEl.classList.remove("hidden");
  }

  const start = () => {
    if (myToken !== iconTokens[slotKey]) return;
    imgEl.alt = stratagem.name;
    imgEl.title = stratagem.name;
    tryNextCandidate(candidateUrls(stratagem), 0, myToken, imgEl, fallbackEl, slotKey);
  };

  if (manifestLoaded) start();
  else loadManifest().then(start);
}

function tryNextCandidate(urls, index, token, imgEl, fallbackEl, slotKey) {
  if (token !== iconTokens[slotKey]) return;
  if (index >= urls.length) return;

  const probe = new Image();
  probe.onload = () => {
    if (token !== iconTokens[slotKey]) return;
    imgEl.src = urls[index];
    imgEl.classList.add("loaded");
    if(fallbackEl) fallbackEl.classList.add("hidden");
  };
  probe.onerror = () => tryNextCandidate(urls, index + 1, token, imgEl, fallbackEl, slotKey);
  probe.src = urls[index];
}

/* ---------------------------------------------------------------------
   7. DIFFICULTY & WAVES
   --------------------------------------------------------------------- */
function speedForWave(wave) {
  return Math.min(MAX_SPEED_MULTIPLIER, 1 + (wave - 1) * SPEED_STEP_PER_WAVE);
}

function transitionDelayForWave(wave) {
  return Math.max(MIN_TRANSITION_DELAY_MS, BASE_TRANSITION_DELAY_MS - wave * 6);
}

function generateWave() {
  let stratagemCount;
  if (waveNumber % 5 === 0) {
    stratagemCount = Math.floor(Math.random() * 7) + 9; // 9 to 15
    waveTimeMax = 15;
  } else {
    stratagemCount = Math.floor(Math.random() * 4) + 5; // 5 to 8
    waveTimeMax = 10;
  }

  waveTimeLeft = waveTimeMax;
  waveTimeAllotted = waveTimeMax;
  activeWaveQueue = [];
  
  for (let i = 0; i < stratagemCount; i++) {
    activeWaveQueue.push(drawStratagem());
  }
  
  currentStratagem = activeWaveQueue.shift();
  speedMultiplier = speedForWave(waveNumber);
  
  renderSequence();
  renderPreviews();
}

/* ---------------------------------------------------------------------
   8. RENDERING
   --------------------------------------------------------------------- */
function createArrowIcon(direction) {
  const el = document.createElement("div");
  el.className = `arrow-icon dir-${direction}`;
  el.innerHTML =
    '<svg class="arrow-svg" viewBox="0 0 100 100" aria-hidden="true">' +
    '<polygon points="15,10 85,50 15,90 32,50"></polygon>' +
    "</svg>";
  return el;
}

function renderSequence() {
  arrowContainer.innerHTML = "";
  currentStratagem.seq.forEach((dir, i) => {
    const icon = createArrowIcon(dir);
    if (i === 0) icon.classList.add("next");
    arrowContainer.appendChild(icon);
  });

  const meta = CATEGORY_META[currentStratagem.type];
  categoryBadge.textContent = meta.label;
  categoryBadge.className = `category-badge ${meta.className}`;
  stratagemName.textContent = currentStratagem.name;

  applyIconToElement(currentStratagem, stratagemIcon, stratagemIconFallback, "main");
}

function renderPreviews() {
  if (activeWaveQueue.length > 0) {
    next1El.classList.remove("hidden");
    next1Name.textContent = activeWaveQueue[0].name;
    applyIconToElement(activeWaveQueue[0], next1Icon, null, "next1");
  } else {
    next1El.classList.add("hidden");
  }

  if (activeWaveQueue.length > 1) {
    next2El.classList.remove("hidden");
    next2Name.textContent = activeWaveQueue[1].name;
    applyIconToElement(activeWaveQueue[1], next2Icon, null, "next2");
  } else {
    next2El.classList.add("hidden");
  }
}

function updateHUD() {
  scoreEl.textContent = score;
  comboEl.textContent = combo;
  clearedEl.textContent = cleared;
  sessionBestEl.textContent = sessionBest;
  waveEl.textContent = waveNumber;
  timeEl.textContent = Math.max(0, Math.ceil(waveTimeLeft));

  const pct = Math.max(0, Math.min(100, (waveTimeLeft / waveTimeAllotted) * 100));
  waveTimerFill.style.width = `${pct}%`;
  waveTimerFill.classList.toggle("low", waveTimeLeft <= LOW_TIME_THRESHOLD);
}

function renderGameOver() {
  finalScoreEl.textContent = score;
  finalWaveEl.textContent = waveNumber;
  finalComboEl.textContent = bestCombo;
  finalClearedEl.textContent = cleared;
  finalSessionBestEl.textContent = sessionBest;
}

function flashError() {
  stageFrame.classList.remove("shake", "flash-error");
  void stageFrame.offsetWidth;
  stageFrame.classList.add("shake", "flash-error");
  setTimeout(() => stageFrame.classList.remove("shake", "flash-error"), 420);
}

function flashSuccess() {
  stageFrame.classList.remove("flash-success");
  void stageFrame.offsetWidth;
  stageFrame.classList.add("flash-success");
  setTimeout(() => stageFrame.classList.remove("flash-success"), 420);
}

/* ---------------------------------------------------------------------
   9. GAME FLOW
   --------------------------------------------------------------------- */
function initIdlePreview() {
  refillBag();
  waveNumber = 1;
  generateWave();
  updateHUD();
}

function startGame() {
  ensureAudioCtx();
  gameState = "playing";
  score = 0;
  combo = 0;
  bestCombo = 0;
  cleared = 0;
  
  refillBag();
  waveNumber = 1;
  generateWave();
  
  currentStep = 0;

  updateHUD();

  idleOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  stageFrame.classList.remove("time-low");

  clearInterval(timerId);
  timerId = setInterval(tickWaveTimer, TICK_INTERVAL_MS);
  sfx.start();
}

function tickWaveTimer() {
  const wasLow = waveTimeLeft <= LOW_TIME_THRESHOLD;
  const prevWhole = Math.ceil(waveTimeLeft);

  waveTimeLeft -= (TICK_INTERVAL_MS / 1000) * speedMultiplier;

  if (waveTimeLeft <= 0) {
    waveTimeLeft = 0;
    updateHUD();
    endGame();
    return;
  }

  const isLow = waveTimeLeft <= LOW_TIME_THRESHOLD;
  if (isLow) {
    stageFrame.classList.add("time-low");
    if (!wasLow || Math.ceil(waveTimeLeft) !== prevWhole) sfx.tick();
  } else {
    stageFrame.classList.remove("time-low");
  }

  updateHUD();
}

function endGame() {
  gameState = "gameover";
  clearInterval(timerId);
  stageFrame.classList.remove("time-low");
  if (score > sessionBest) sessionBest = score;
  if (typeof saveHighScore === "function") saveHighScore("stratagemHero", score);
  updateHUD();
  renderGameOver();
  gameOverOverlay.classList.remove("hidden");
  sfx.gameOver();
}

function completeStratagem() {
  const gained = Math.round(currentStratagem.seq.length * 50 * (1 + Math.min(combo, 20) * 0.15));
  score += gained;
  combo += 1;
  bestCombo = Math.max(bestCombo, combo);
  cleared += 1;
  currentStep = 0;

  waveTimeLeft = Math.min(waveTimeMax, waveTimeLeft + TIME_ADD_ON_CLEAR);

  updateHUD();
  flashSuccess();
  sfx.complete();

  setTimeout(() => {
    if (gameState === "playing") {
      if (activeWaveQueue.length === 0) {
        waveNumber += 1;
        sfx.waveUp();
        generateWave();
      } else {
        currentStratagem = activeWaveQueue.shift();
        renderSequence();
        renderPreviews();
      }
    }
  }, transitionDelayForWave(waveNumber));
}

function handleCorrectInput() {
  const icons = arrowContainer.querySelectorAll(".arrow-icon");
  icons[currentStep].classList.remove("next");
  icons[currentStep].classList.add("completed");
  sfx.correctStep(currentStep);
  currentStep += 1;
  if (currentStep < icons.length) {
    icons[currentStep].classList.add("next");
  }
  if (currentStep === currentStratagem.seq.length) {
    completeStratagem();
  }
}

function handleWrongInput() {
  combo = 0;
  currentStep = 0;
  const icons = arrowContainer.querySelectorAll(".arrow-icon");
  icons.forEach((icon, i) => {
    icon.classList.remove("completed");
    icon.classList.toggle("next", i === 0);
  });
  updateHUD();
  flashError();
  sfx.wrong();
}

function handleDirection(direction) {
  if (gameState !== "playing" || !currentStratagem) return;
  const expected = currentStratagem.seq[currentStep];
  if (direction === expected) {
    handleCorrectInput();
  } else {
    handleWrongInput();
  }
}

/* ---------------------------------------------------------------------
   10. INPUT
   --------------------------------------------------------------------- */
const keyMap = {
  ArrowUp: "up", w: "up", W: "up",
  ArrowDown: "down", s: "down", S: "down",
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
};

document.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && gameState !== "playing") {
    event.preventDefault();
    startGame();
    return;
  }
  const direction = keyMap[event.key];
  if (!direction) return;
  event.preventDefault();
  handleDirection(direction);
});

dpad.querySelectorAll(".dpad-btn").forEach((btn) => {
  btn.addEventListener("click", () => handleDirection(btn.dataset.dir));
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

/* ---------------------------------------------------------------------
   11. BOOT
   --------------------------------------------------------------------- */
totalCountEl.textContent = STRATAGEMS.length;
loadManifest();
initIdlePreview();

if (typeof registerModeStopper === "function") {
  registerModeStopper(() => {
    clearInterval(timerId);
    if (gameState === "playing") {
      gameState = "idle";
      stageFrame.classList.remove("time-low");
      idleOverlay.classList.remove("hidden");
      gameOverOverlay.classList.add("hidden");
    }
  });
}
if (typeof sessionBestEl !== "undefined" && typeof getHighScores === "function") {
  const saved = getHighScores().stratagemHero;
  if (saved) {
    sessionBest = Math.max(sessionBest, saved);
    updateHUD();
  }
}
