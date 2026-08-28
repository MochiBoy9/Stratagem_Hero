/* ==========================================================================
   FLOW REGULATION — E-710 pipe puzzle (DESIGN_SPEC.md §2)
   Five VERTICAL rows slide up and down. A row's right edge feeds the next
   row's left edge. Start and Finish sit on opposing sides at different Y.
   Two rows are locked, always already at their solution offset, which makes
   every generated board solvable.
   ========================================================================== */

const PORTS = {
  H: ["W", "E"], V: ["N", "S"],
  NE: ["N", "E"], NW: ["N", "W"],
  SE: ["S", "E"], SW: ["S", "W"],
  EMPTY: [],
};
const OPPOSITE = { N: "S", S: "N", E: "W", W: "E" };
const DECOY_TYPES = ["H", "V", "NE", "NW", "SE", "SW"];

/* Pipe artwork. Stroke uses currentColor so state lives in CSS. */
const PIPE_PATHS = {
  H: "M0,50 L100,50",
  V: "M50,0 L50,100",
  NE: "M50,0 L50,50 L100,50",
  NW: "M50,0 L50,50 L0,50",
  SE: "M50,100 L50,50 L100,50",
  SW: "M50,100 L50,50 L0,50",
};

function pipeSvg(type) {
  if (type === "EMPTY") return '<span class="pipe-rack"></span>';
  return (
    '<svg class="pipe-svg" viewBox="0 0 100 100" aria-hidden="true">' +
    `<path d="${PIPE_PATHS[type]}" fill="none" stroke="currentColor" ` +
    'stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  );
}

/* ---------------------------------------------------------------------
   COMPLETION DETECTION — a trace, not a flood fill
   --------------------------------------------------------------------- */
function traceFlow(board) {
  const path = [];
  let y = board.startY;
  let enteredFrom = "W";

  const fail = (reachedRow, deadEndY) => ({ complete: false, reachedRow, deadEndY, path });

  for (let c = 0; c < ROW_COUNT; c++) {
    const row = board.rows[c];
    let guard = 0;

    while (true) {
      if (++guard > WINDOW_H + 1) return fail(c, y);
      if (y < 0 || y >= WINDOW_H) return fail(c, y);

      const ports = PORTS[cellAt(row, y)];
      if (!ports.includes(enteredFrom)) return fail(c, y);

      path.push([c, y]);
      const exit = ports.find((p) => p !== enteredFrom);

      if (exit === "E") { enteredFrom = "W"; break; } // hand off to the next row
      y += exit === "S" ? 1 : -1;                     // travel within this row
      enteredFrom = OPPOSITE[exit];
    }
  }

  return y === board.finishY
    ? { complete: true, path }
    : { complete: false, nearMiss: true, exitY: y, path };
}

/* ---------------------------------------------------------------------
   GENERATION — guaranteed solvable
   --------------------------------------------------------------------- */
function generateFlowBoard() {
  let startY, finishY;
  do {
    startY = randInt(0, WINDOW_H - 1);
    finishY = randInt(0, WINDOW_H - 1);
  } while (startY === finishY); // hard rule: always cross the Y axis

  const rows = [];
  let y = startY;

  for (let c = 0; c < ROW_COUNT; c++) {
    const win = new Array(WINDOW_H).fill("EMPTY");
    const exitY = c === ROW_COUNT - 1 ? finishY : randInt(0, WINDOW_H - 1);

    if (exitY === y) {
      win[y] = "H";
    } else if (exitY > y) {
      win[y] = "SW";
      for (let k = y + 1; k < exitY; k++) win[k] = "V";
      win[exitY] = "NE";
    } else {
      win[y] = "NW";
      for (let k = exitY + 1; k < y; k++) win[k] = "V";
      win[exitY] = "SE";
    }

    const solutionOffset = randInt(0, MAX_OFFSET);
    const strip = new Array(STRIP_H).fill(null);
    for (let k = 0; k < WINDOW_H; k++) strip[solutionOffset + k] = win[k];
    for (let k = 0; k < STRIP_H; k++) {
      if (strip[k] === null) strip[k] = Math.random() < 0.6 ? "EMPTY" : choice(DECOY_TYPES);
    }

    rows.push({ index: c, strip, offset: solutionOffset, solutionOffset, locked: false });
    y = exitY;
  }

  shuffled([0, 1, 2, 3, 4]).slice(0, LOCKED_ROWS).forEach((i) => {
    rows[i].locked = true;
    rows[i].offset = rows[i].solutionOffset;
  });

  const board = { rows, startY, finishY };

  // Scramble unlocked rows; never hand the player a board that is already done.
  for (let attempt = 0; attempt < 10; attempt++) {
    rows.forEach((r) => {
      if (!r.locked) {
        let o;
        do { o = randInt(0, MAX_OFFSET); } while (o === r.solutionOffset && MAX_OFFSET > 0);
        r.offset = o;
      }
    });
    if (!traceFlow(board).complete) break;
  }

  return board;
}

/* ---------------------------------------------------------------------
   MODE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const stageEl = document.getElementById("flowScreen");
  const boardEl = document.getElementById("flowBoard");
  const startPortEl = document.getElementById("flowStartPort");
  const finishPortEl = document.getElementById("flowFinishPort");

  let board = null;
  let selectedRow = 0;
  let solving = false;
  const rowEls = [];

  function firstUnlockedRow() {
    const r = board.rows.find((row) => !row.locked);
    return r ? r.index : 0;
  }

  function renderPortColumn(el, y, tip) {
    el.innerHTML = "";
    for (let i = 0; i < WINDOW_H; i++) {
      const slot = document.createElement("div");
      slot.className = "flow-port-slot";
      if (i === y) {
        slot.classList.add("flow-port-live");
        slot.dataset.tip = tip;
      }
      el.appendChild(slot);
    }
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    rowEls.length = 0;

    board.rows.forEach((row) => {
      const col = document.createElement("div");
      col.className = "flow-col" + (row.locked ? " is-locked" : "");

      const up = document.createElement("button");
      up.type = "button";
      up.className = "row-shift";
      up.innerHTML = arrowSvg("up");
      up.setAttribute("aria-label", `Slide row ${row.index + 1} up`);
      up.disabled = row.locked;
      up.addEventListener("click", () => doShift(row.index, "UP"));

      const win = document.createElement("div");
      win.className = "flow-row";
      win.setAttribute("role", "gridcell");

      const strip = document.createElement("div");
      strip.className = "flow-strip";
      row.strip.forEach((type) => {
        const cell = document.createElement("div");
        cell.className = "pipe-cell";
        cell.innerHTML = pipeSvg(type);
        strip.appendChild(cell);
      });
      applyStripOffset(strip, row.offset);
      win.appendChild(strip);

      if (row.locked) {
        const plate = document.createElement("span");
        plate.className = "lock-plate";
        plate.dataset.tip = "Bolted down. This row is already in position.";
        plate.setAttribute("aria-label", "Locked row");
        win.appendChild(plate);
      }

      win.addEventListener("click", () => {
        if (row.locked) return;
        selectRow(row.index);
      });

      const down = document.createElement("button");
      down.type = "button";
      down.className = "row-shift";
      down.innerHTML = arrowSvg("down");
      down.setAttribute("aria-label", `Slide row ${row.index + 1} down`);
      down.disabled = row.locked;
      down.addEventListener("click", () => doShift(row.index, "DOWN"));

      col.appendChild(up);
      col.appendChild(win);
      col.appendChild(down);
      boardEl.appendChild(col);
      rowEls.push({ col, strip });
    });

    renderPortColumn(startPortEl, board.startY, "Flow enters here.");
    renderPortColumn(finishPortEl, board.finishY, "Flow must exit here.");
    selectRow(firstUnlockedRow());
    paintPath();
  }

  function selectRow(index) {
    selectedRow = index;
    rowEls.forEach((r, i) => r.col.classList.toggle("is-selected", i === index));
  }

  function stepSelection(delta) {
    let i = selectedRow;
    for (let n = 0; n < ROW_COUNT; n++) {
      i = (i + delta + ROW_COUNT) % ROW_COUNT;
      if (!board.rows[i].locked) { selectRow(i); return; } // never select a row you can't move
    }
  }

  /* Lights the solved run, or pulses the finish port on a near miss. */
  function paintPath() {
    boardEl.querySelectorAll(".pipe-cell.on-path").forEach((c) => c.classList.remove("on-path"));
    const result = traceFlow(board);

    if (result.complete) {
      result.path.forEach(([c, y], i) => {
        const cell = rowEls[c].strip.children[board.rows[c].offset + y];
        setTimeout(() => cell && cell.classList.add("on-path"), i * 40);
      });
    }
    finishPortEl.classList.toggle("near-miss", !!result.nearMiss);
    return result;
  }

  function doShift(index, dir) {
    if (!flowMode.active || solving) return;
    const row = board.rows[index];
    if (!shiftRow(row, dir)) return;
    selectRow(index);
    applyStripOffset(rowEls[index].strip, row.offset);
    if (typeof sfx !== "undefined" && sfx.tick) sfx.tick();

    const result = paintPath();
    if (result.complete) {
      solving = true;
      flowMode.correct(6);
      setTimeout(() => {
        solving = false;
        if (flowMode.active) newBoard();
      }, 700);
    }
  }

  function newBoard() {
    board = generateFlowBoard();
    renderBoard();
  }

  document.addEventListener("keydown", (e) => {
    if (!flowMode.active || solving) return;
    if (stageEl.classList.contains("hidden")) return;
    const k = e.key.toLowerCase();
    if (k === "a" || e.key === "ArrowLeft") { e.preventDefault(); stepSelection(-1); }
    else if (k === "d" || e.key === "ArrowRight") { e.preventDefault(); stepSelection(1); }
    else if (k === "w" || e.key === "ArrowUp") { e.preventDefault(); doShift(selectedRow, "UP"); }
    else if (k === "s" || e.key === "ArrowDown") { e.preventDefault(); doShift(selectedRow, "DOWN"); }
  });

  const flowMode = createTimedRoundMode({
    modeKey: "flow",
    timeStart: 45,
    timeMax: 60,
    bonusOnCorrect: 6,
    timeEl: document.getElementById("flowTime"),
    scoreEl: document.getElementById("flowScore"),
    bestEl: document.getElementById("flowBest"),
    timerFill: document.getElementById("flowClockFill"),
    stageEl,
    idleOverlay: document.getElementById("flowIdleOverlay"),
    overOverlay: document.getElementById("flowOverOverlay"),
    finalScoreEl: document.getElementById("flowFinalScore"),
    finalBestEl: document.getElementById("flowFinalBest"),
    startBtn: document.getElementById("flowStartBtn"),
    restartBtn: document.getElementById("flowRestartBtn"),
    onNewRound: newBoard,
  });

  newBoard(); // idle preview
});
