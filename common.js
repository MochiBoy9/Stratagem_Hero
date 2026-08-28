/* ==========================================================================
   COMMON — shared across all game modes (menu nav, high scores, icons, RNG)
   Loaded BEFORE script.js and all mode files.
   ========================================================================== */

/* ---------------------------------------------------------------------
   HIGH SCORES (localStorage)
   --------------------------------------------------------------------- */
const HIGH_SCORE_KEY = "sh_highscores_v1";

function getHighScores() {
  try {
    return JSON.parse(localStorage.getItem(HIGH_SCORE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveHighScore(modeKey, value) {
  const scores = getHighScores();
  if (!scores[modeKey] || value > scores[modeKey]) {
    scores[modeKey] = value;
    try {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
    } catch (e) {
      /* storage unavailable — ignore */
    }
  }
  return scores[modeKey] || 0;
}

/* ---------------------------------------------------------------------
   SCREEN NAVIGATION
   --------------------------------------------------------------------- */
window._modeStoppers = [];

function registerModeStopper(fn) {
  window._modeStoppers.push(fn);
}

function showScreen(id) {
  window._modeStoppers.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      /* a mode failing to stop shouldn't block navigation */
    }
  });
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");
  if (id === "mainMenu" && typeof refreshMenuScores === "function") refreshMenuScores();
}

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-exit]")) showScreen("mainMenu");
});

/* ---------------------------------------------------------------------
   RANDOM HELPERS
   --------------------------------------------------------------------- */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------------------------------------------------------------
   STRATAGEM ICON LOADER (independent token tracking, reuses script.js's
   manifest/candidateUrls/loadManifest so icons stay in sync everywhere)
   --------------------------------------------------------------------- */
const _iconLoadTokens = new WeakMap();

function loadStratIcon(stratagem, imgEl, fallbackEl) {
  const token = {};
  _iconLoadTokens.set(imgEl, token);

  imgEl.classList.remove("loaded");
  imgEl.removeAttribute("src");
  if (fallbackEl) {
    fallbackEl.textContent = stratagem.name.trim().charAt(0).toUpperCase() || "?";
    fallbackEl.classList.remove("hidden");
  }

  const attempt = (urls, i) => {
    if (_iconLoadTokens.get(imgEl) !== token) return;
    if (i >= urls.length) return;
    const probe = new Image();
    probe.onload = () => {
      if (_iconLoadTokens.get(imgEl) !== token) return;
      imgEl.src = urls[i];
      imgEl.classList.add("loaded");
      if (fallbackEl) fallbackEl.classList.add("hidden");
    };
    probe.onerror = () => attempt(urls, i + 1);
    probe.src = urls[i];
  };

  const start = () => {
    imgEl.alt = stratagem.name;
    imgEl.title = stratagem.name;
    attempt(candidateUrls(stratagem), 0);
  };

  if (typeof manifestLoaded !== "undefined" && manifestLoaded) start();
  else if (typeof loadManifest === "function") loadManifest().then(start);
  else start();
}

/* ---------------------------------------------------------------------
   VISUAL FEEDBACK (generic version of script.js's flash helpers)
   --------------------------------------------------------------------- */
function flashElement(el, cls) {
  if (!el) return;
  el.classList.remove("flash-error", "flash-success", "shake");
  void el.offsetWidth;
  el.classList.add(cls);
  if (cls === "flash-error") el.classList.add("shake");
  setTimeout(() => el.classList.remove(cls, "shake"), 420);
}

/* ---------------------------------------------------------------------
   GENERIC TIMED-ROUND MODE CONTROLLER
   Used by Emergency Deploy, Oil Line Repair, Automaton Decoder and
   Landing Zone Select — each just supplies onNewRound() and calls
   controller.correct()/wrong() when the player answers.
   --------------------------------------------------------------------- */
function createTimedRoundMode(cfg) {
  const {
    modeKey,
    timeStart,
    timeMax,
    bonusOnCorrect,
    timeEl, scoreEl, bestEl, timerFill, stageEl,
    idleOverlay, overOverlay, finalScoreEl, finalBestEl,
    startBtn, restartBtn,
    onNewRound,
    onEnd,
  } = cfg;

  let timeLeft = timeStart;
  let score = 0;
  let best = getHighScores()[modeKey] || 0;
  let timerId = null;
  let active = false;

  function updateHud() {
    if (timeEl) timeEl.textContent = Math.max(0, Math.ceil(timeLeft));
    if (scoreEl) scoreEl.textContent = score;
    if (bestEl) bestEl.textContent = best;
    if (timerFill) {
      const pct = Math.max(0, Math.min(100, (timeLeft / timeMax) * 100));
      timerFill.style.width = pct + "%";
      timerFill.classList.toggle("low", timeLeft <= 3);
    }
  }

  function tick() {
    timeLeft -= 0.1;
    if (stageEl) stageEl.classList.toggle("time-low", timeLeft > 0 && timeLeft <= 3);
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateHud();
      end();
      return;
    }
    updateHud();
  }

  function stop() {
    active = false;
    clearInterval(timerId);
  }
  registerModeStopper(stop);

  function start() {
    if (typeof ensureAudioCtx === "function") ensureAudioCtx();
    active = true;
    timeLeft = timeStart;
    score = 0;
    if (idleOverlay) idleOverlay.classList.add("hidden");
    if (overOverlay) overOverlay.classList.add("hidden");
    if (stageEl) stageEl.classList.remove("time-low");
    updateHud();
    clearInterval(timerId);
    timerId = setInterval(tick, 100);
    if (typeof sfx !== "undefined" && sfx.start) sfx.start();
    onNewRound();
  }

  function end() {
    stop();
    best = saveHighScore(modeKey, score);
    updateHud();
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalBestEl) finalBestEl.textContent = best;
    if (overOverlay) overOverlay.classList.remove("hidden");
    if (typeof sfx !== "undefined" && sfx.gameOver) sfx.gameOver();
    if (onEnd) onEnd();
  }

  function correct(bonus) {
    if (!active) return;
    score += 1;
    timeLeft = Math.min(timeMax, timeLeft + (bonus === undefined ? bonusOnCorrect : bonus));
    updateHud();
    if (typeof sfx !== "undefined" && sfx.complete) sfx.complete();
    if (stageEl) flashElement(stageEl, "flash-success");
  }

  function wrong() {
    if (!active) return;
    if (typeof sfx !== "undefined" && sfx.wrong) sfx.wrong();
    if (stageEl) flashElement(stageEl, "flash-error");
  }

  if (startBtn) startBtn.addEventListener("click", start);
  if (restartBtn) restartBtn.addEventListener("click", start);
  updateHud();

  return {
    start, stop, correct, wrong,
    get score() { return score; },
    get active() { return active; },
  };
}
