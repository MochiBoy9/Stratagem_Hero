/* ==========================================================================
   STRATAGEM HERO — game logic
   Fan-made input trainer inspired by the Helldivers 2 arcade minigame.
   Arrows are drawn live as inline SVG, so nothing there can 404.

   WAVE STRUCTURE (replaces the old flat 60s countdown):
   - Each stratagem is its own "wave" with its own countdown.
   - Wave 1 gives you 10s. Every time you clear a wave, the NEXT wave's
     allotted time goes up by 2s (10 -> 12 -> 14 -> ...), so later waves
     give you a bigger nominal time budget.
   - But the clock also drains faster each wave (a rising speed
     multiplier), so the extra seconds don't make it easier forever —
     they just keep pace with harder/longer input strings.
   - Miss the sequence before the wave timer hits 0 and it's game over.

   STRATAGEM ICON:
   - When a wave loads, the game fires a quick, specialized search for
     an image tied to that stratagem's name (e.g. "Eagle 500kg Bomb")
     against the Wikimedia Commons search API — a free, key-less,
     CORS-open image source. First hit gets shown above the name; if
     nothing comes back (or the request is slow/offline) it falls back
     to a lettered badge instead of leaving a broken image.
   ========================================================================== */

/* ---------------------------------------------------------------------
   1. STRATAGEM DATABASE
   Every entry is { name, type, seq }. `type` drives the colored permit
   badge (offensive / supply / defensive / mission), and `seq` is the
   input code as an array of "up" | "down" | "left" | "right".
   Add more entries here any time Arrowhead ships a new one — nothing
   else in the file needs to change.
   --------------------------------------------------------------------- */
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
const INITIAL_WAVE_SECONDS = 10;     // wave 1's countdown
const WAVE_TIME_INCREMENT = 2;       // added to the allotment after each clear
const SPEED_STEP_PER_WAVE = 0.08;    // +8% drain speed per wave cleared
const MAX_SPEED_MULTIPLIER = 3;      // cap so late waves stay theoretically possible
const LOW_TIME_THRESHOLD = 3;        // seconds left where the UI starts screaming
const TICK_INTERVAL_MS = 100;        // countdown resolution (10x/sec, smooth bar)
const BASE_TRANSITION_DELAY_MS = 260;
const MIN_TRANSITION_DELAY_MS = 110;
const ICON_FETCH_TIMEOUT_MS = 2500;  // don't let a slow search stall the vibe

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
const nextNameEl = document.getElementById("nextName");
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
const stratagemIcon = document.getElementById("stratagemIcon");
const stratagemIconFallback = document.getElementById("stratagemIconFallback");

/* ---------------------------------------------------------------------
   3. GAME STATE
   --------------------------------------------------------------------- */
let gameState = "idle"; // "idle" | "playing" | "gameover"
let bag = [];
let currentStratagem = null;
let nextStratagem = null;
let currentStep = 0;
let score = 0;
let combo = 0;
let bestCombo = 0;
let cleared = 0;
let sessionBest = 0;
let timerId = null;

// Wave state
let waveNumber = 1;
let waveTimeAllotted = INITIAL_WAVE_SECONDS;
let waveTimeLeft = INITIAL_WAVE_SECONDS;
let speedMultiplier = 1;

/* ---------------------------------------------------------------------
   4. AUDIO — everything here is synthesized, so there are no sound
   files to fetch and nothing that can fail to load.
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
  correctStep(stepIndex) {
    playTone({ freq: 440 + stepIndex * 45, duration: 0.07, type: "square", volume: 0.12 });
  },
  wrong() {
    playTone({ freq: 130, duration: 0.2, type: "sawtooth", volume: 0.18 });
  },
  complete() {
    playTone({ freq: 523.25, duration: 0.09, volume: 0.14 });
    playTone({ freq: 659.25, duration: 0.09, volume: 0.14, delay: 0.08 });
    playTone({ freq: 784.0, duration: 0.16, volume: 0.16, delay: 0.16 });
  },
  tick() {
    playTone({ freq: 880, duration: 0.04, volume: 0.07 });
  },
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
   5. BAG RANDOMIZER — draws every stratagem once before any repeats,
   so the same one can't show up three times in a row by bad luck.
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
   6. STRATAGEM ICON SEARCH
   Quick, per-stratagem image lookup against Wikimedia Commons (free,
   no API key, CORS-open). The query is built specifically from each
   stratagem's own name — e.g. "Eagle 500kg Bomb" — the same way you'd
   hand-search "Eagle_500KG" for a quick reference image. Results are
   cached per query so re-draws from the bag don't re-fetch, and a
   stale request from a wave the player already left can never clobber
   a newer one.
   --------------------------------------------------------------------- */
const iconCache = new Map(); // query -> resolved URL or null
let iconRequestToken = 0;

function buildIconQuery(name) {
  // Strip leading equipment codes like "MG-43 ", "APW-1 ", "A/MG-43 ",
  // "EAT-17 " etc. so the search targets the plain descriptive words.
  const stripped = name.replace(/^[A-Z0-9]+(?:[-/][A-Z0-9.]+)*\s+/i, "").trim();
  return stripped.length > 0 ? stripped : name;
}

async function searchIcon(query) {
  if (iconCache.has(query)) return iconCache.get(query);

  const endpoint =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&gsrnamespace=6` +
    "&prop=imageinfo&iiprop=url&iiurlwidth=160&format=json&origin=*";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ICON_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, { signal: controller.signal });
    const data = await res.json();
    const pages = data && data.query && data.query.pages;
    let url = null;
    if (pages) {
      const first = Object.values(pages)[0];
      const info = first && first.imageinfo && first.imageinfo[0];
      url = (info && (info.thumburl || info.url)) || null;
    }
    iconCache.set(query, url);
    return url;
  } catch (err) {
    iconCache.set(query, null);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function showIconFallback(name) {
  stratagemIcon.classList.remove("loaded");
  stratagemIcon.removeAttribute("src");
  stratagemIconFallback.textContent = name.trim().charAt(0).toUpperCase() || "?";
  stratagemIconFallback.classList.remove("hidden");
}

function loadStratagemIcon(stratagem) {
  const myToken = ++iconRequestToken;
  showIconFallback(stratagem.name); // instant placeholder while we search

  const query = buildIconQuery(stratagem.name);
  searchIcon(query).then((url) => {
    if (myToken !== iconRequestToken) return; // a newer wave has since loaded
    if (!url) return; // fallback badge stays as-is
    const img = new Image();
    img.onload = () => {
      if (myToken !== iconRequestToken) return;
      stratagemIcon.src = url;
      stratagemIcon.alt = stratagem.name;
      stratagemIcon.title = "Image via Wikimedia Commons";
      stratagemIcon.classList.add("loaded");
      stratagemIconFallback.classList.add("hidden");
    };
    img.onerror = () => {
      /* leave the fallback badge in place */
    };
    img.src = url;
  });
}

/* ---------------------------------------------------------------------
   7. DIFFICULTY CURVE
   --------------------------------------------------------------------- */
function speedForWave(wave) {
  return Math.min(MAX_SPEED_MULTIPLIER, 1 + (wave - 1) * SPEED_STEP_PER_WAVE);
}

function transitionDelayForWave(wave) {
  return Math.max(MIN_TRANSITION_DELAY_MS, BASE_TRANSITION_DELAY_MS - wave * 6);
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

  loadStratagemIcon(currentStratagem);
}

function renderNextPreview() {
  nextNameEl.textContent = nextStratagem.name;
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
  void stageFrame.offsetWidth; // restart the animation even on repeat mistakes
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
  currentStratagem = drawStratagem();
  nextStratagem = drawStratagem();
  currentStep = 0;
  waveNumber = 1;
  waveTimeAllotted = INITIAL_WAVE_SECONDS;
  waveTimeLeft = INITIAL_WAVE_SECONDS;
  renderSequence();
  renderNextPreview();
  updateHUD();
}

function startGame() {
  ensureAudioCtx();
  gameState = "playing";
  score = 0;
  combo = 0;
  bestCombo = 0;
  cleared = 0;

  waveNumber = 1;
  waveTimeAllotted = INITIAL_WAVE_SECONDS;
  waveTimeLeft = INITIAL_WAVE_SECONDS;
  speedMultiplier = speedForWave(waveNumber);

  refillBag();
  currentStratagem = drawStratagem();
  nextStratagem = drawStratagem();
  currentStep = 0;

  updateHUD();
  renderSequence();
  renderNextPreview();

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
  updateHUD();
  renderGameOver();
  gameOverOverlay.classList.remove("hidden");
  sfx.gameOver();
}

function loadNextStratagem() {
  currentStratagem = nextStratagem;
  nextStratagem = drawStratagem();
  currentStep = 0;
  waveTimeLeft = waveTimeAllotted;
  renderSequence();
  renderNextPreview();
}

function completeStratagem() {
  const gained = Math.round(currentStratagem.seq.length * 50 * (1 + Math.min(combo, 20) * 0.15));
  score += gained;
  combo += 1;
  bestCombo = Math.max(bestCombo, combo);
  cleared += 1;

  // Wave clear: next wave gets more nominal time, but drains faster.
  waveNumber += 1;
  waveTimeAllotted += WAVE_TIME_INCREMENT;
  speedMultiplier = speedForWave(waveNumber);

  updateHUD();
  flashSuccess();
  sfx.complete();
  sfx.waveUp();
  setTimeout(() => {
    if (gameState === "playing") loadNextStratagem();
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
   10. INPUT — keyboard, plus the on-screen pad for touch/mouse players
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
initIdlePreview();