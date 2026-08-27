/* ==========================================================================
   SUPER EARTH OS — Multi-Mode Stratagem Game
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

/* --- Global State --- */
const TIME_ADD = 2.5;         
const MAX_SPEED = 3.5;
let currentMode = "hero";
let gameState = "idle";
let score = 0, combo = 0, cleared = 0, waveNumber = 1;
let waveTimeMax = 12, waveTimeLeft = 12, timerId = null;
let activeTarget = null, currentStep = 0;
let highscores = { hero: 0, critical: 0, qte: 0, grid: 0, decoder: 0, pipes: 0 };

/* --- DOM Elements --- */
const UI = {
  score: document.getElementById("score"), time: document.getElementById("time"), 
  wave: document.getElementById("wave"), timerFill: document.getElementById("waveTimerFill"),
  mainMenu: document.getElementById("mainMenuOverlay"), gameOver: document.getElementById("gameOverOverlay"),
  containers: document.querySelectorAll(".mode-container")
};

/* --- Audio Engine (Reusing yours) --- */
let audioCtx = null;
function playTone(f, d, t="square", v=0.1, del=0) {
  if(!audioCtx) { const A = window.AudioContext||window.webkitAudioContext; if(!A)return; audioCtx = new A(); }
  if(audioCtx.state==="suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.type = t; osc.frequency.value = f; osc.connect(gain); gain.connect(audioCtx.destination);
  const start = audioCtx.currentTime + del;
  gain.gain.setValueAtTime(v, start); gain.gain.exponentialRampToValueAtTime(0.001, start + d);
  osc.start(start); osc.stop(start + d + 0.02);
}
const sfx = {
  tick:()=>playTone(880,0.04,"square",0.05), wrong:()=>playTone(130,0.2,"sawtooth",0.15),
  correct:()=>playTone(600,0.08), complete:()=>playTone(800,0.2)
};

/* --- Game Loop --- */
function openMenu() {
  gameState = "idle"; clearInterval(timerId);
  UI.mainMenu.classList.remove("hidden"); UI.gameOver.classList.add("hidden");
  Object.keys(highscores).forEach(k => document.getElementById(`hs${k.charAt(0).toUpperCase()+k.slice(1)}`).textContent = highscores[k]);
}

document.querySelectorAll(".menu-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    currentMode = e.target.dataset.mode;
    startGame();
  });
});

document.getElementById("restartBtn").addEventListener("click", startGame);
document.getElementById("menuBtn").addEventListener("click", openMenu);

function startGame() {
  gameState = "playing"; score = 0; waveNumber = 1; waveTimeLeft = waveTimeMax; cleared = 0;
  UI.mainMenu.classList.add("hidden"); UI.gameOver.classList.add("hidden");
  UI.containers.forEach(c => c.classList.remove("active-mode"));
  
  if(currentMode === "hero" || currentMode === "critical") document.getElementById("heroContainer").classList.add("active-mode");
  else document.getElementById(`${currentMode}Container`).classList.add("active-mode");

  clearInterval(timerId);
  timerId = setInterval(() => {
    waveTimeLeft -= 0.1;
    if(waveTimeLeft <= 3) sfx.tick();
    if(waveTimeLeft <= 0) { waveTimeLeft = 0; endGame(); }
    UI.time.textContent = Math.ceil(waveTimeLeft);
    UI.timerFill.style.width = `${(waveTimeLeft/waveTimeMax)*100}%`;
  }, 100);
  
  generateTask();
  updateHUD();
}

function endGame() {
  gameState = "gameover"; clearInterval(timerId);
  if(score > highscores[currentMode]) highscores[currentMode] = score;
  document.getElementById("finalScore").textContent = score;
  document.getElementById("finalWave").textContent = waveNumber;
  UI.gameOver.classList.remove("hidden");
  playTone(300, 0.5, "sawtooth", 0.2);
}

function successRoute() {
  score += 100 + (waveNumber * 10); cleared++; waveNumber++;
  waveTimeLeft = Math.min(waveTimeMax, waveTimeLeft + TIME_ADD);
  sfx.complete(); updateHUD(); generateTask();
}

function failRoute() { sfx.wrong(); }
function updateHUD() { UI.score.textContent = score; UI.wave.textContent = waveNumber; UI.cleared.textContent = cleared; }

/* --- Mode Generators --- */
function generateTask() {
  currentStep = 0;
  if(currentMode === "hero") initHero(STRATAGEMS);
  if(currentMode === "critical") initHero(STRATAGEMS.filter(s => s.type === "mission"));
  if(currentMode === "qte") initQTE();
  if(currentMode === "grid") initGrid();
  if(currentMode === "decoder") initDecoder();
  if(currentMode === "pipes") initPipes();
}

/* 1. Hero / Critical Inputs */
function initHero(pool) {
  activeTarget = pool[Math.floor(Math.random() * pool.length)];
  const ac = document.getElementById("arrow-container"); ac.innerHTML = "";
  activeTarget.seq.forEach((dir, i) => {
    const el = document.createElement("div"); el.className = `arrow-icon dir-${dir} ${i===0?'next':''}`;
    el.innerHTML = '<svg class="arrow-svg" viewBox="0 0 100 100"><polygon points="15,10 85,50 15,90 32,50"></polygon></svg>';
    ac.appendChild(el);
  });
  document.getElementById("stratagemName").textContent = activeTarget.name;
}

/* 2. Combat QTE */
const situations = [
  { p: "Bile Titan Approaching!", a: "Orbital Railcannon Strike" },
  { p: "Out of Ammo!", a: "Resupply" },
  { p: "Dropships Incoming!", a: "Eagle Airstrike" },
  { p: "Need to extract!", a: "Reinforce" }
];
function initQTE() {
  const sit = situations[Math.floor(Math.random() * situations.length)];
  document.getElementById("qtePrompt").textContent = sit.p;
  
  let options = [sit.a];
  while(options.length < 4) {
    let r = STRATAGEMS[Math.floor(Math.random() * STRATAGEMS.length)].name;
    if(!options.includes(r)) options.push(r);
  }
  options.sort(() => Math.random() - 0.5);
  
  const container = document.getElementById("qteButtons"); container.innerHTML = "";
  options.forEach(opt => {
    let btn = document.createElement("button"); btn.className = "qte-btn"; btn.textContent = opt;
    btn.onclick = () => { if(opt === sit.a) successRoute(); else failRoute(); };
    container.appendChild(btn);
  });
}

/* 3. Grid Targeting */
function initGrid() {
  const cols = ['A','B','C','D','E'];
  const targetCol = cols[Math.floor(Math.random()*5)];
  const targetRow = Math.floor(Math.random()*5)+1;
  const targetId = targetCol + targetRow;
  document.getElementById("gridPrompt").textContent = `Target Coordinate: ${targetId}`;
  
  const gb = document.getElementById("gridBoard"); gb.innerHTML = "";
  for(let r=1; r<=5; r++) {
    for(let c=0; c<5; c++) {
      let cell = document.createElement("div");
      let id = cols[c] + r; cell.className = "grid-cell"; cell.textContent = id;
      cell.onclick = () => { if(id === targetId) successRoute(); else failRoute(); };
      gb.appendChild(cell);
    }
  }
}

/* 4. Automaton Decoder */
function initDecoder() {
  const dirs = ['up','down','left','right'];
  const symbols = { up:'▲', down:'▼', left:'◀', right:'▶' };
  activeTarget = Array.from({length: 5}, () => dirs[Math.floor(Math.random()*4)]);
  
  const db = document.getElementById("decoderBoard"); db.innerHTML = "";
  activeTarget.forEach((d, i) => {
    let el = document.createElement("div"); el.className = `decode-char ${i===0?'active':''}`;
    el.textContent = symbols[d]; db.appendChild(el);
  });
}

/* 5. Pump Control (Pipes) */
let pipeGrid = [];
function initPipes() {
  const chars = ['║','═','╔','╗','╝','╚']; 
  const pb = document.getElementById("pipeBoard"); pb.innerHTML = "";
  pipeGrid = [];
  
  // 3x3 layout. We assign random pieces, but ensure 2 are 'blocked'.
  // Simplified logic: the user must match a hardcoded orientation for a pre-solved path.
  let solutionAngles = [1, 0, 1, 0, 1, 0, 1, 0, 1]; // required rotation states (0-3)
  
  let blocked1 = 1 + Math.floor(Math.random()*3); // non-start/end
  let blocked2 = 5 + Math.floor(Math.random()*3);
  
  for(let i=0; i<9; i++) {
    let type = chars[Math.floor(Math.random()*chars.length)];
    let currentRot = Math.floor(Math.random()*4);
    let isBlocked = (i === blocked1 || i === blocked2);
    
    let cell = document.createElement("div");
    cell.className = `pipe-cell ${isBlocked ? 'blocked' : ''}`;
    cell.textContent = type;
    cell.style.transform = `rotate(${currentRot * 90}deg)`;
    
    cell.onclick = () => {
      if(isBlocked || gameState !== "playing") return failRoute();
      currentRot = (currentRot + 1) % 4;
      cell.style.transform = `rotate(${currentRot * 90}deg)`;
      sfx.tick(); checkPipes();
    };
    pipeGrid.push({ el: cell, req: solutionAngles[i], getRot: () => currentRot });
    pb.appendChild(cell);
  }
}
function checkPipes() {
  // Simple check: do all unblocked nodes match their required 'solution' state?
  let win = pipeGrid.every(p => p.el.classList.contains("blocked") || p.getRot() === p.req);
  if(win) successRoute();
}

/* --- Input Handling --- */
const keyMap = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
document.addEventListener("keydown", (e) => {
  if (gameState !== "playing") return;
  const dir = keyMap[e.key]; if(!dir) return;
  
  if (currentMode === "hero" || currentMode === "critical") {
    if (dir === activeTarget.seq[currentStep]) {
      const icons = document.getElementById("arrow-container").children;
      icons[currentStep].classList.replace("next", "completed");
      sfx.correct(); currentStep++;
      if (currentStep < icons.length) icons[currentStep].classList.add("next");
      else successRoute();
    } else { currentStep = 0; Array.from(document.getElementById("arrow-container").children).forEach((el, i) => { el.className = `arrow-icon dir-${activeTarget.seq[i]} ${i===0?'next':''}`; }); failRoute(); }
  }
  
  if (currentMode === "decoder") {
    if (dir === activeTarget[currentStep]) {
      const chars = document.getElementById("decoderBoard").children;
      chars[currentStep].classList.replace("active", "done");
      sfx.correct(); currentStep++;
      if(currentStep < chars.length) chars[currentStep].classList.add("active");
      else successRoute();
    } else failRoute();
  }
});
document.querySelectorAll(".dpad-btn").forEach(btn => btn.addEventListener("click", () => document.dispatchEvent(new KeyboardEvent('keydown', { key: btn.dataset.dir }))));

// Boot
document.getElementById("totalCount").textContent = STRATAGEMS.length;
openMenu();
