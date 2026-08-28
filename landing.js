/* ==========================================================================
   LANDING ZONE CONFIRMATION — standalone mode
   Command calls a grid reference; the player walks a cursor onto it and
   confirms. The cursor always spawns a few cells away, so every call costs
   real movement — that walk is the whole mode, which is why the cells are
   not clickable. A correct confirmation refunds the clock it burned.
   ========================================================================== */

const LZ_COLS = ["A", "B", "C", "D", "E", "F"];
const LZ_ROWS = [1, 2, 3, 4, 5, 6];
const LZ_MIN_WALK = 3;      // Chebyshev distance from spawn to target
const LZ_REWARD_S = 4;

document.addEventListener("DOMContentLoaded", () => {
  const stageEl = document.getElementById("lzScreen");
  const gridEl = document.getElementById("lzGrid");
  const callEl = document.getElementById("lzCall");
  const confirmBtn = document.getElementById("lzConfirmBtn");

  const LAST = LZ_COLS.length - 1;
  let cursor = { col: 0, row: 0 };
  let target = { col: 0, row: 0 };
  let cells = {};
  let resolving = false;
  let roundTimer = null;

  const randomCell = () => ({ col: randInt(0, LAST), row: randInt(0, LAST) });
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
    Object.values(cells).forEach((c) =>
      c.classList.remove("lz-cursor", "lz-target", "lz-hit", "lz-miss"));
    const cur = cells[`${cursor.col},${cursor.row}`];
    if (cur) cur.classList.add("lz-cursor");
  }

  function revealTarget(hit) {
    const t = cells[`${target.col},${target.row}`];
    if (t) t.classList.add("lz-target");
    const cur = cells[`${cursor.col},${cursor.row}`];
    if (cur) cur.classList.add(hit ? "lz-hit" : "lz-miss");
  }

  function newRound() {
    clearTimeout(roundTimer);
    roundTimer = null;
    resolving = false;
    target = randomCell();
    do { cursor = randomCell(); } while (chebyshev(cursor, target) < LZ_MIN_WALK);
    if (!Object.keys(cells).length) buildGrid();
    paint();
    callEl.textContent = label(target);
  }

  function commit() {
    if (!lzMode.active || resolving) return;
    resolving = true;
    const hit = cursor.col === target.col && cursor.row === target.row;
    revealTarget(hit);
    if (hit) lzMode.correct(LZ_REWARD_S);
    else lzMode.wrong();

    clearTimeout(roundTimer);
    roundTimer = setTimeout(() => {
      roundTimer = null;
      resolving = false;
      if (lzMode.active) newRound();
    }, 420);
  }

  function moveCursor(dir) {
    if (!lzMode.active || resolving) return;
    if (dir === "up") cursor.row = Math.max(0, cursor.row - 1);
    else if (dir === "down") cursor.row = Math.min(LAST, cursor.row + 1);
    else if (dir === "left") cursor.col = Math.max(0, cursor.col - 1);
    else if (dir === "right") cursor.col = Math.min(LAST, cursor.col + 1);
    paint();
    if (typeof sfx !== "undefined" && sfx.tick) sfx.tick();
  }

  const DIRS = { arrowup: "up", w: "up", arrowdown: "down", s: "down",
                 arrowleft: "left", a: "left", arrowright: "right", d: "right" };

  document.addEventListener("keydown", (e) => {
    if (!lzMode.active) return;
    if (stageEl.classList.contains("hidden")) return;
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key) return;

    const dir = DIRS[e.key.toLowerCase()];
    if (dir) { e.preventDefault(); moveCursor(dir); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); commit(); }
  });

  confirmBtn.addEventListener("click", commit); // touch parity
  document.getElementById("lzPad").querySelectorAll("[data-dir]").forEach((btn) => {
    btn.addEventListener("click", () => moveCursor(btn.dataset.dir));
  });

  const lzMode = createTimedRoundMode({
    modeKey: "landingZone",
    timeStart: 40,
    timeMax: 55,
    bonusOnCorrect: LZ_REWARD_S,
    timeEl: document.getElementById("lzTime"),
    scoreEl: document.getElementById("lzScore"),
    bestEl: document.getElementById("lzBest"),
    timerFill: document.getElementById("lzClockFill"),
    stageEl,
    idleOverlay: document.getElementById("lzIdleOverlay"),
    overOverlay: document.getElementById("lzOverOverlay"),
    finalScoreEl: document.getElementById("lzFinalScore"),
    finalBestEl: document.getElementById("lzFinalBest"),
    startBtn: document.getElementById("lzStartBtn"),
    restartBtn: document.getElementById("lzRestartBtn"),
    onNewRound: newRound,
    // A resolve pending when the clock runs out must not deal the next call.
    onStop: () => { clearTimeout(roundTimer); roundTimer = null; resolving = false; },
  });

  buildGrid();
  newRound(); // idle preview
});
