/* ==========================================================================
   FLOW REGULATION — E-710 pipe puzzle (DESIGN_SPEC.md §2)
   Five VERTICAL rows slide up and down. A row's right edge feeds the next
   row's left edge. The INTAKE and the OUTLET are fixed, marked, and always on
   different lines: pressure enters on the intake line or it does not enter at
   all, and it has to leave the last row on the outlet line.
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
  if (type === "EMPTY" || !PIPE_PATHS[type]) return '<span class="pipe-rack"></span>';
  return (
    '<svg class="pipe-svg" viewBox="0 0 100 100" aria-hidden="true">' +
    `<path d="${PIPE_PATHS[type]}" fill="none" stroke="currentColor" ` +
    'stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  );
}

/* ---------------------------------------------------------------------
   COMPLETION DETECTION — a trace, not a flood fill
   Always begins at the intake line entering from the west, so a board whose
   first row has nothing on that line carries no flow at all. The result
   reports how far the flow actually got, which is what the board paints.
   --------------------------------------------------------------------- */
function traceFlow(board) {
  const path = [];
  let y = board.startY;
  let enteredFrom = "W";

  const stoppedAt = (row, wy) => ({
    complete: false, path, breakRow: row,
    breakY: wy, leak: wy < 0 ? "top" : wy >= WINDOW_H ? "bottom" : null,
  });

  for (let c = 0; c < ROW_COUNT; c++) {
    const row = board.rows[c];
    let handedOff = false;

    /* A 2-port pipe never doubles back, so a row can be crossed in at most
       WINDOW_H steps — past that the flow has left the window. */
    for (let step = 0; step < WINDOW_H; step++) {
      if (y < 0 || y >= WINDOW_H) return stoppedAt(c, y);

      const ports = PORTS[cellAt(row, y)] || PORTS.EMPTY;
      if (!ports.includes(enteredFrom)) return stoppedAt(c, y);

      path.push([c, y]);
      const exit = ports.find((p) => p !== enteredFrom);

      if (exit === "E") { enteredFrom = "W"; handedOff = true; break; } // next row

      /* A pipe that bends back west is a dead end — flow does not re-enter the
         row it came from. Folding W in with N would light a run through pipes
         that visibly do not join. */
      if (exit !== "N" && exit !== "S") return stoppedAt(c, y);
      y += exit === "S" ? 1 : -1;                                       // within this row
      enteredFrom = OPPOSITE[exit];
    }

    if (!handedOff) return stoppedAt(c, y);
  }

  return y === board.finishY
    ? { complete: true, path, exitY: y }
    : { complete: false, nearMiss: true, exitY: y, path };
}

/* ---------------------------------------------------------------------
   GENERATION — guaranteed solvable
   The solution is laid down first, from the intake line to the outlet line,
   then buried under decoys and scrambled.
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

  lockRandomRows(rows);

  const board = { rows, startY, finishY };
  const unlocked = rows.filter((r) => !r.locked);

  // Scramble unlocked rows; never hand the player a board that is already done.
  for (let attempt = 0; attempt < 12; attempt++) {
    unlocked.forEach((r) => {
      let o;
      do { o = randInt(0, MAX_OFFSET); } while (o === r.solutionOffset && MAX_OFFSET > 0);
      r.offset = o;
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
  let solveTimer = null;
  const rowEls = [];

  function firstUnlockedRow() {
    const r = board.rows.find((row) => !row.locked);
    return r ? r.index : 0;
  }

  function renderPortColumn(el, liveY, tip) {
    el.innerHTML = "";
    for (let i = 0; i < WINDOW_H; i++) {
      const slot = document.createElement("div");
      slot.className = "flow-port-slot";
      if (i === liveY) {
        slot.classList.add("flow-port-live");
        slot.dataset.tip = tip;
        slot.setAttribute("aria-label", `${tip} Line ${liveY + 1}.`);
        slot.setAttribute("tabindex", "0"); // the tip is reachable by keyboard
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
      col.setAttribute("role", "group");
      col.setAttribute("aria-label", `Pipe row ${row.index + 1}`);

      const up = document.createElement("button");
      up.type = "button";
      up.className = "row-shift";
      up.innerHTML = arrowSvg("up");
      up.setAttribute("aria-label", `Slide row ${row.index + 1} up`);
      up.disabled = row.locked;
      up.addEventListener("click", () => doShift(row.index, "UP"));

      const win = document.createElement("div");
      win.className = "flow-row";

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
      rowEls.push({ col, win, strip, cells: Array.from(strip.children) });
    });

    renderPortColumn(startPortEl, board.startY, "Intake. Flow enters the first row on this line.");
    renderPortColumn(finishPortEl, board.finishY, "Outlet. Flow must leave the last row on this line.");
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

  function clearPaint() {
    rowEls.forEach((r) => {
      r.win.classList.remove("leak-top", "leak-bottom");
      r.cells.forEach((cell) => {
        cell.classList.remove("is-flowing", "is-break");
        cell.style.removeProperty("--flow-i");
      });
    });
    boardEl.classList.remove("is-solved");
    startPortEl.classList.remove("is-blocked");
    finishPortEl.classList.remove("is-fed");
  }

  /* Paints the run the flow actually makes, not just the winning one. Seeing
     the amber stop dead at the intake is what teaches that the intake line is
     the only way in. */
  function paintPath() {
    clearPaint();
    const result = traceFlow(board);

    result.path.forEach(([c, y], i) => {
      const cell = rowEls[c].cells[board.rows[c].offset + y];
      if (!cell) return;
      cell.classList.add("is-flowing");
      cell.style.setProperty("--flow-i", i); // drives the staggered win sweep
    });

    if (result.leak) {
      rowEls[result.breakRow].win.classList.add(`leak-${result.leak}`);
    } else if (result.breakRow !== undefined) {
      const cell = rowEls[result.breakRow].cells[board.rows[result.breakRow].offset + result.breakY];
      if (cell) cell.classList.add("is-break");
    }

    if (result.path.length === 0) startPortEl.classList.add("is-blocked");
    if (result.complete) {
      boardEl.classList.add("is-solved");
      finishPortEl.classList.add("is-fed");
    }

    /* Restart the pulse every time, or a second near miss in a row is silent. */
    finishPortEl.classList.remove("near-miss");
    if (result.nearMiss) {
      void finishPortEl.offsetWidth;
      finishPortEl.classList.add("near-miss");
    }
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
      clearTimeout(solveTimer);
      solveTimer = setTimeout(() => {
        solveTimer = null;
        solving = false;
        if (flowMode.active) newBoard();
      }, 820); // long enough for the green sweep to reach the outlet
    }
  }

  function newBoard() {
    clearTimeout(solveTimer);
    solveTimer = null;
    solving = false;
    board = generateFlowBoard();
    renderBoard();
  }

  document.addEventListener("keydown", (e) => {
    if (!flowMode.active || solving) return;
    if (stageEl.classList.contains("hidden")) return;
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key) return;
    const k = e.key.toLowerCase();
    if (k === "a" || k === "arrowleft") { e.preventDefault(); stepSelection(-1); }
    else if (k === "d" || k === "arrowright") { e.preventDefault(); stepSelection(1); }
    else if (k === "w" || k === "arrowup") { e.preventDefault(); doShift(selectedRow, "UP"); }
    else if (k === "s" || k === "arrowdown") { e.preventDefault(); doShift(selectedRow, "DOWN"); }
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
    // A solve pending when the clock runs out must not rebuild the next round.
    onStop: () => { clearTimeout(solveTimer); solveTimer = null; solving = false; },
  });

  newBoard(); // idle preview
});
