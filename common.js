/* ==========================================================================
   COMMON — shared across every mode.
   Loaded BEFORE script.js and all mode files.
   Contains: high scores, screen nav, the shared Row/Strip model used by
   Flow Regulation and Signal Descrambler, the canonical arrow glyph, and the
   timed-round controller.
   ========================================================================== */

/* ---------------------------------------------------------------------
   HIGH SCORES
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
      /* storage unavailable — scores just won't persist */
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
      /* a mode failing to stop must not block navigation */
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

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (window.LZ && window.LZ.active) return; // the event owns Esc while open
  if (!document.getElementById("mainMenu").classList.contains("hidden")) return;
  showScreen("mainMenu");
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
   SHARED ROW / STRIP MODEL  (see DESIGN_SPEC.md §1)
   A "Row" is a VERTICAL strip of cells that slides on the Y axis.
   Strips are 9 cells; a 5-cell window is visible; offset is the strip index
   shown at window y=0. Sliding DOWN decreases offset. Never wraps.
   --------------------------------------------------------------------- */
const WINDOW_H = 5;
const STRIP_H = 9;
const ROW_COUNT = 5;
const LOCKED_ROWS = 2;
const MAX_OFFSET = STRIP_H - WINDOW_H; // 4

function cellAt(row, y) {
  return row.strip[row.offset + y];
}

function shiftRow(row, dir) {
  if (row.locked) return false;
  const next = row.offset + (dir === "DOWN" ? -1 : 1);
  if (next < 0 || next > MAX_OFFSET) return false; // clamp, never wrap
  row.offset = next;
  return true;
}

/* Applies the strip translation. Strip is STRIP_H tall inside a WINDOW_H
   window, so one cell of travel is (100 / STRIP_H)% of the strip. */
function applyStripOffset(stripEl, offset) {
  stripEl.style.transform = `translateY(-${(offset * 100) / STRIP_H}%)`;
}

/* ---------------------------------------------------------------------
   CANONICAL ARROW GLYPH
   The same polygon script.js draws for stratagem inputs, so combat and
   non-combat arrows are visibly one family. No arrow characters anywhere.
   --------------------------------------------------------------------- */
function arrowSvg(direction) {
  return (
    `<svg class="hd-arrow dir-${direction}" viewBox="0 0 100 100" aria-hidden="true">` +
    '<polygon points="15,10 85,50 15,90 32,50"></polygon></svg>'
  );
}

/* Every back control gets the same glyph, so nothing in the markup has to
   carry an arrow character. */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".hd-back").forEach((btn) => {
    btn.insertAdjacentHTML("afterbegin", arrowSvg("left"));
  });
});

/* ---------------------------------------------------------------------
   ICON LOADER — reuses script.js's manifest so icons stay in sync
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
    attempt(candidateUrls(stratagem), 0);
  };

  if (typeof manifestLoaded !== "undefined" && manifestLoaded) start();
  else if (typeof loadManifest === "function") loadManifest().then(start);
  else start();
}

/* ---------------------------------------------------------------------
   FEEDBACK
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
   TIMED-ROUND CONTROLLER
   Modes supply onNewRound() and call correct() / wrong().
   --------------------------------------------------------------------- */
function createTimedRoundMode(cfg) {
  const {
    modeKey, timeStart, timeMax, bonusOnCorrect,
    timeEl, scoreEl, bestEl, timerFill, stageEl,
    idleOverlay, overOverlay, finalScoreEl, finalBestEl,
    startBtn, restartBtn, onNewRound, onEnd,
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
      timerFill.classList.toggle("low", timeLeft <= 5);
    }
  }

  function tick() {
    timeLeft -= 0.1;
    if (stageEl) stageEl.classList.toggle("time-low", timeLeft > 0 && timeLeft <= 5);
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
