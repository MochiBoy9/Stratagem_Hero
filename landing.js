/* ==========================================================================
   LANDING ZONE CONFIRMATION — pop-up event inside Stratagem Hero
   (DESIGN_SPEC.md §4)
   Not a standalone mode. Cursor moves with WASD / arrows and commits with
   Enter or Space. Clicking a cell does nothing by design. The wave clock
   keeps running throughout — success refunds the time it cost.
   ========================================================================== */

const LZ_COLS = ["A", "B", "C", "D", "E", "F"];
const LZ_ROWS = [1, 2, 3, 4, 5, 6];
const LZ_WINDOW_MS = 6000;
const LZ_REWARD_S = 5;
const LZ_CHANCE = 0.2;
const LZ_MIN_WAVE = 2;
const LZ_COOLDOWN_WAVES = 2;
const LZ_MIN_CLOCK_S = 4;

/* Shared flag. script.js reads window.LZ.active to yield the keyboard. */
window.LZ = { active: false, confirmed: 0 };

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("lzOverlay");
  const gridEl = document.getElementById("lzGrid");
  const callEl = document.getElementById("lzCall");
  const barEl = document.getElementById("lzBar");
  const confirmBtn = document.getElementById("lzConfirmBtn");

  let cursor = { col: 0, row: 0 };
  let target = { col: 0, row: 0 };
  let cells = {};
  let timeoutId = null;
  let rafId = null;
  let lastWave = -99;

  const randomCell = () => ({ col: randInt(0, 5), row: randInt(0, 5) });
  const chebyshev = (a, b) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
  const label = (c) => `${LZ_COLS[c.col]}${LZ_ROWS[c.row]}`;

  function buildGrid() {
    gridEl.innerHTML = "";
    cells = {};

    gridEl.appendChild(document.createElement("div")); // corner spacer
    LZ_COLS.forEach((col) => {
      const h = document.createElement("div");
      h.className = "lz-head";
      h.textContent = col;
      gridEl.appendChild(h);
    });

    LZ_ROWS.forEach((rowLabel, r) => {
      const h = document.createElement("div");
      h.className = "lz-head";
      h.textContent = rowLabel;
      gridEl.appendChild(h);

      LZ_COLS.forEach((_, c) => {
        const cell = document.createElement("div"); // a div, not a button: no clicking
        cell.className = "lz-cell";
        gridEl.appendChild(cell);
        cells[`${c},${r}`] = cell;
      });
    });
  }

  function paint() {
    Object.values(cells).forEach((c) => c.classList.remove("lz-cursor", "lz-target"));
    const cur = cells[`${cursor.col},${cursor.row}`];
    if (cur) cur.classList.add("lz-cursor");
  }

  function revealTarget(hit) {
    const t = cells[`${target.col},${target.row}`];
    if (t) t.classList.add("lz-target");
    const cur = cells[`${cursor.col},${cursor.row}`];
    if (cur) cur.classList.toggle(hit ? "lz-hit" : "lz-miss", true);
  }

  function animateBar(startedAt) {
    const step = () => {
      const pct = Math.max(0, 100 - ((Date.now() - startedAt) / LZ_WINDOW_MS) * 100);
      barEl.style.width = pct + "%";
      if (pct > 0 && window.LZ.active) rafId = requestAnimationFrame(step);
    };
    step();
  }

  function open() {
    window.LZ.active = true;
    target = randomCell();
    do { cursor = randomCell(); } while (chebyshev(cursor, target) < 3);

    buildGrid();
    paint();
    callEl.textContent = label(target);
    overlay.classList.remove("hidden");
    animateBar(Date.now());
    if (typeof sfx !== "undefined" && sfx.waveUp) sfx.waveUp();

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => close(false, true), LZ_WINDOW_MS);
  }

  /* silent = the player never answered (timeout or mode exit). Expiring is
     already punished by the clock; it doesn't also get an error sting. */
  function close(success, silent) {
    clearTimeout(timeoutId);
    cancelAnimationFrame(rafId);
    window.LZ.active = false; // ALWAYS clears — a stuck flag soft-locks the run
    overlay.classList.add("hidden");

    if (success) {
      window.LZ.confirmed += 1;
      if (typeof window.grantWaveTime === "function") window.grantWaveTime(LZ_REWARD_S);
      if (typeof sfx !== "undefined" && sfx.complete) sfx.complete();
    } else if (!silent && typeof sfx !== "undefined" && sfx.wrong) {
      sfx.wrong();
    }
  }

  function commit() {
    const hit = cursor.col === target.col && cursor.row === target.row;
    revealTarget(hit);
    setTimeout(() => close(hit, false), 260);
  }

  function moveCursor(dir) {
    if (dir === "up") cursor.row = Math.max(0, cursor.row - 1);
    else if (dir === "down") cursor.row = Math.min(5, cursor.row + 1);
    else if (dir === "left") cursor.col = Math.max(0, cursor.col - 1);
    else if (dir === "right") cursor.col = Math.min(5, cursor.col + 1);
    paint();
    if (typeof sfx !== "undefined" && sfx.tick) sfx.tick();
  }

  /* Capture phase so this runs before Stratagem Hero's own listener. */
  document.addEventListener("keydown", (e) => {
    if (!window.LZ.active) return;
    const dir = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down",
                  ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" }[
      e.key.length === 1 ? e.key.toLowerCase() : e.key
    ];
    if (dir) { e.preventDefault(); e.stopPropagation(); moveCursor(dir); return; }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      commit();
    }
  }, true);

  confirmBtn.addEventListener("click", commit); // touch parity
  document.getElementById("lzPad").querySelectorAll("[data-dir]").forEach((btn) => {
    btn.addEventListener("click", () => { if (window.LZ.active) moveCursor(btn.dataset.dir); });
  });

  /* Trigger hook — called by script.js at the start of each wave. */
  window.maybeTriggerLz = function (waveNumber, waveTimeLeft) {
    if (window.LZ.active) return;
    if (waveNumber < LZ_MIN_WAVE) return;
    if (waveNumber - lastWave < LZ_COOLDOWN_WAVES) return;
    if (waveTimeLeft < LZ_MIN_CLOCK_S) return;
    if (Math.random() > LZ_CHANCE) return;
    lastWave = waveNumber;
    open();
  };

  window.resetLzSession = function () {
    lastWave = -99;
    window.LZ.confirmed = 0;
    if (window.LZ.active) close(false, true);
  };

  registerModeStopper(() => { if (window.LZ.active) close(false, true); });
});
