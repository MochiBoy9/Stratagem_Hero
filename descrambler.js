/* ==========================================================================
   SIGNAL DESCRAMBLER — Automaton pattern replication (DESIGN_SPEC.md §3)
   NOT a memory game. The reference pattern is on screen for the whole round.
   The player slides vertical rows until each symbol sits on the line the
   reference demands. The reference lists its symbols in a DIFFERENT order
   than the array, so the player must match by symbol identity, not position —
   which is why both panels are ruled with the same numbered lines.
   ========================================================================== */

const GLYPH_PALETTE = ["\u25C6", "\u25B2", "\u25A0", "\u2716", "\u25CF",
                       "\u2B1F", "\u25C9", "\u2739", "\u25BC", "\u29D6"];
const GLYPH_KEY = "sh_descrambler_glyphs";

/* A symbol parked at the very top or bottom of a strip can only ever sit at
   one offset, which would force the row to spawn either solved or blank. */
const MIN_SYMBOL_INDEX = 1;
const MAX_SYMBOL_INDEX = STRIP_H - 2;

function loadChosenGlyphs() {
  try {
    const saved = JSON.parse(localStorage.getItem(GLYPH_KEY));
    const clean = Array.isArray(saved)
      ? saved.filter((g, i) => GLYPH_PALETTE.includes(g) && saved.indexOf(g) === i)
      : [];
    if (clean.length === ROW_COUNT) return clean;
  } catch (e) { /* fall through to default */ }
  return GLYPH_PALETTE.slice(0, ROW_COUNT);
}

function saveChosenGlyphs(glyphs) {
  try { localStorage.setItem(GLYPH_KEY, JSON.stringify(glyphs)); } catch (e) { /* ignore */ }
}

/* ---------------------------------------------------------------------
   GENERATION — symbolIndex is derived from the target, so a valid offset
   always exists for every row, and the spawn offset always leaves the
   symbol on screen so no row ever starts as a blank column.
   --------------------------------------------------------------------- */
function generateDescramblerBoard(glyphs) {
  const rows = [];
  const assigned = shuffled(glyphs);

  for (let c = 0; c < ROW_COUNT; c++) {
    const targetY = randInt(0, WINDOW_H - 1);
    const lo = Math.max(0, MIN_SYMBOL_INDEX - targetY);
    const hi = Math.min(MAX_OFFSET, MAX_SYMBOL_INDEX - targetY);
    const solutionOffset = randInt(lo, hi);

    rows.push({
      index: c,
      symbol: assigned[c],
      symbolIndex: targetY + solutionOffset, // always inside MIN..MAX_SYMBOL_INDEX
      targetY,
      solutionOffset,
      offset: solutionOffset,
      locked: false,
    });
  }

  lockRandomRows(rows);

  rows.forEach((r) => {
    if (r.locked) return;
    // Unlocked rows never spawn already correct, and never spawn off screen.
    const spawnable = offsetsShowing(r.symbolIndex).filter((o) => o !== r.solutionOffset);
    r.offset = choice(spawnable);
  });

  // The reference must never list its symbols in the board's own order, or the
  // player can solve it positionally instead of by symbol identity.
  let referenceOrder;
  do {
    referenceOrder = shuffled(rows.map((_, i) => i));
  } while (referenceOrder.every((v, i) => v === i));

  return { rows, referenceOrder };
}

function isRowAligned(row) {
  return row.symbolIndex - row.offset === row.targetY;
}

function isDescrambled(board) {
  return board.rows.every(isRowAligned);
}

/* ---------------------------------------------------------------------
   MODE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const stageEl = document.getElementById("descScreen");
  const boardEl = document.getElementById("descBoard");
  const refEl = document.getElementById("descReference");
  const loadoutEl = document.getElementById("descLoadout");
  const loadoutCountEl = document.getElementById("descLoadoutCount");

  let board = null;
  let chosenGlyphs = loadChosenGlyphs();
  let selectedRow = 0;
  let solving = false;
  let solveTimer = null;
  const rowEls = [];
  const refMarks = []; // reference mark element per board row index

  function firstUnlockedRow() {
    const r = board.rows.find((row) => !row.locked);
    return r ? r.index : 0;
  }

  /* ---- loadout: pick 5 of 10 ---- */
  function renderLoadout() {
    loadoutEl.innerHTML = "";
    GLYPH_PALETTE.forEach((glyph) => {
      const chosen = chosenGlyphs.includes(glyph);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "glyph-pick" + (chosen ? " is-chosen" : "");
      btn.textContent = glyph;
      btn.setAttribute("aria-label", `Symbol ${glyph}`);
      btn.setAttribute("aria-pressed", String(chosen));
      btn.addEventListener("click", () => toggleGlyph(glyph));
      loadoutEl.appendChild(btn);
    });
    if (loadoutCountEl) loadoutCountEl.textContent = `${chosenGlyphs.length} of ${ROW_COUNT}`;
  }

  function toggleGlyph(glyph) {
    const i = chosenGlyphs.indexOf(glyph);
    if (i >= 0) {
      chosenGlyphs.splice(i, 1);
    } else {
      if (chosenGlyphs.length >= ROW_COUNT) chosenGlyphs.shift(); // oldest out, newest in
      chosenGlyphs.push(glyph);
    }
    renderLoadout();
    if (!descMode.active) previewBoard(); // keep the board behind the overlay honest
  }

  /* Tops the set up if the player under-selected, then shows what was actually
     committed instead of leaving the loadout claiming something else. */
  function commitGlyphs() {
    const pool = GLYPH_PALETTE.filter((g) => !chosenGlyphs.includes(g));
    while (chosenGlyphs.length < ROW_COUNT && pool.length) chosenGlyphs.push(pool.shift());
    chosenGlyphs = chosenGlyphs.slice(0, ROW_COUNT);
    saveChosenGlyphs(chosenGlyphs);
    renderLoadout();
  }

  /* ---- reference panel: always visible, deliberately reordered ---- */
  function renderReference() {
    refEl.innerHTML = "";
    refMarks.length = 0;

    board.referenceOrder.forEach((rowIndex) => {
      const row = board.rows[rowIndex];
      const col = document.createElement("div");
      col.className = "ref-col";
      col.setAttribute("role", "img");
      col.setAttribute("aria-label", `${row.symbol} belongs on line ${row.targetY + 1}`);

      for (let y = 0; y < WINDOW_H; y++) {
        const slot = document.createElement("div");
        slot.className = "ref-slot";
        if (y === row.targetY) {
          slot.classList.add("ref-mark");
          slot.textContent = row.symbol;
          refMarks[rowIndex] = slot;
        }
        col.appendChild(slot);
      }
      refEl.appendChild(col);
    });
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    rowEls.length = 0;

    board.rows.forEach((row) => {
      const col = document.createElement("div");
      col.className = "desc-col" + (row.locked ? " is-locked" : "");
      col.setAttribute("role", "group");
      col.setAttribute("aria-label", `Array row ${row.index + 1}, symbol ${row.symbol}`);

      const up = document.createElement("button");
      up.type = "button";
      up.className = "row-shift";
      up.innerHTML = arrowSvg("up");
      up.setAttribute("aria-label", `Slide row ${row.index + 1} up`);
      up.disabled = row.locked;
      up.addEventListener("click", () => doShift(row.index, "UP"));

      const win = document.createElement("div");
      win.className = "desc-row";

      const strip = document.createElement("div");
      strip.className = "desc-strip";
      for (let i = 0; i < STRIP_H; i++) {
        const cell = document.createElement("div");
        cell.className = "glyph-cell";
        if (i === row.symbolIndex) {
          cell.textContent = row.symbol;
          cell.classList.add("has-glyph");
        } else {
          cell.innerHTML = '<span class="glyph-rung"></span>'; // so sliding reads
        }
        strip.appendChild(cell);
      }
      applyStripOffset(strip, row.offset);
      win.appendChild(strip);

      /* Points at a symbol that has been slid out of the window, so an
         apparently empty row is never a dead end. */
      const peek = document.createElement("span");
      peek.className = "desc-peek";
      peek.setAttribute("aria-hidden", "true");
      peek.innerHTML =
        `<span class="peek-up">${arrowSvg("up")}</span>` +
        `<span class="peek-down">${arrowSvg("down")}</span>`;
      win.appendChild(peek);

      if (row.locked) {
        const plate = document.createElement("span");
        plate.className = "lock-plate";
        plate.dataset.tip = "Bolted down. This row is already in position.";
        plate.setAttribute("aria-label", "Locked row");
        win.appendChild(plate);
      }

      win.addEventListener("click", () => {
        if (!row.locked) selectRow(row.index);
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
      rowEls.push({ col, win, strip });
    });

    selectRow(firstUnlockedRow());
    markRows();
  }

  function selectRow(index) {
    selectedRow = index;
    rowEls.forEach((r, i) => r.col.classList.toggle("is-selected", i === index));
    /* Calling out which reference mark belongs to the selected row is a
       reading aid, not a solve aid — the symbol already says which one. */
    refMarks.forEach((mark, i) => mark && mark.classList.toggle("is-cued", i === index));
  }

  function stepSelection(delta) {
    let i = selectedRow;
    for (let n = 0; n < ROW_COUNT; n++) {
      i = (i + delta + ROW_COUNT) % ROW_COUNT;
      if (!board.rows[i].locked) { selectRow(i); return; }
    }
  }

  function markRows() {
    board.rows.forEach((row, i) => {
      const ok = isRowAligned(row);
      rowEls[i].col.classList.toggle("is-aligned", ok);
      if (refMarks[i]) refMarks[i].classList.toggle("is-aligned", ok);

      rowEls[i].win.classList.toggle("peek-up", row.symbolIndex < row.offset);
      rowEls[i].win.classList.toggle("peek-down", row.symbolIndex > row.offset + WINDOW_H - 1);
    });
  }

  function doShift(index, dir) {
    if (!descMode.active || solving) return;
    const row = board.rows[index];
    if (!shiftRow(row, dir)) return;
    selectRow(index);
    applyStripOffset(rowEls[index].strip, row.offset);
    if (typeof sfx !== "undefined" && sfx.tick) sfx.tick();
    markRows();

    if (isDescrambled(board)) {
      solving = true;
      boardEl.classList.add("is-solved");
      descMode.correct(5);
      clearTimeout(solveTimer);
      solveTimer = setTimeout(() => {
        solveTimer = null;
        solving = false;
        if (descMode.active) newBoard();
      }, 700);
    }
  }

  function newBoard() {
    clearTimeout(solveTimer);
    solveTimer = null;
    solving = false;
    boardEl.classList.remove("is-solved");
    board = generateDescramblerBoard(chosenGlyphs);
    renderReference();
    renderBoard();
  }

  /* The idle preview runs off whatever is currently ticked in the loadout,
     without committing it — the player is still choosing. */
  function previewBoard() {
    const pool = GLYPH_PALETTE.filter((g) => !chosenGlyphs.includes(g));
    const set = chosenGlyphs.concat(pool).slice(0, ROW_COUNT);
    clearTimeout(solveTimer);
    solveTimer = null;
    solving = false;
    boardEl.classList.remove("is-solved");
    board = generateDescramblerBoard(set);
    renderReference();
    renderBoard();
  }

  document.addEventListener("keydown", (e) => {
    if (!descMode.active || solving) return;
    if (stageEl.classList.contains("hidden")) return;
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key) return;
    const k = e.key.toLowerCase();
    if (k === "a" || k === "arrowleft") { e.preventDefault(); stepSelection(-1); }
    else if (k === "d" || k === "arrowright") { e.preventDefault(); stepSelection(1); }
    else if (k === "w" || k === "arrowup") { e.preventDefault(); doShift(selectedRow, "UP"); }
    else if (k === "s" || k === "arrowdown") { e.preventDefault(); doShift(selectedRow, "DOWN"); }
  });

  const descMode = createTimedRoundMode({
    modeKey: "descrambler",
    timeStart: 45,
    timeMax: 60,
    bonusOnCorrect: 5,
    timeEl: document.getElementById("descTime"),
    scoreEl: document.getElementById("descScore"),
    bestEl: document.getElementById("descBest"),
    timerFill: document.getElementById("descClockFill"),
    stageEl,
    idleOverlay: document.getElementById("descIdleOverlay"),
    overOverlay: document.getElementById("descOverOverlay"),
    finalScoreEl: document.getElementById("descFinalScore"),
    finalBestEl: document.getElementById("descFinalBest"),
    startBtn: document.getElementById("descStartBtn"),
    restartBtn: document.getElementById("descRestartBtn"),
    onNewRound: () => { commitGlyphs(); newBoard(); },
    // A solve pending when the clock runs out must not rebuild the next round.
    onStop: () => { clearTimeout(solveTimer); solveTimer = null; solving = false; },
  });

  renderLoadout();
  previewBoard(); // idle preview
});
