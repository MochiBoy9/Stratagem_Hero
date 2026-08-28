/* ==========================================================================
   SIGNAL DESCRAMBLER — Automaton pattern replication (DESIGN_SPEC.md §3)
   NOT a memory game. The reference pattern is on screen for the whole round.
   The player slides vertical rows until each symbol sits on the line the
   reference demands. The reference lists its symbols in a DIFFERENT order
   than the array, so the player must match by symbol identity, not position.
   ========================================================================== */

const GLYPH_PALETTE = ["\u25C6", "\u25B2", "\u25A0", "\u2716", "\u25CF",
                       "\u2B1F", "\u25C9", "\u2739", "\u25BC", "\u29D6"];
const GLYPH_KEY = "sh_descrambler_glyphs";

function loadChosenGlyphs() {
  try {
    const saved = JSON.parse(localStorage.getItem(GLYPH_KEY));
    if (Array.isArray(saved) && saved.length === ROW_COUNT) return saved;
  } catch (e) { /* fall through to default */ }
  return GLYPH_PALETTE.slice(0, ROW_COUNT);
}

function saveChosenGlyphs(glyphs) {
  try { localStorage.setItem(GLYPH_KEY, JSON.stringify(glyphs)); } catch (e) { /* ignore */ }
}

/* ---------------------------------------------------------------------
   GENERATION — symbolIndex is derived from the target, so a valid offset
   always exists for every row.
   --------------------------------------------------------------------- */
function generateDescramblerBoard(glyphs) {
  const rows = [];
  const assigned = shuffled(glyphs);

  for (let c = 0; c < ROW_COUNT; c++) {
    const targetY = randInt(0, WINDOW_H - 1);
    const requiredOffset = randInt(0, MAX_OFFSET);
    rows.push({
      index: c,
      symbol: assigned[c],
      symbolIndex: targetY + requiredOffset, // always lands inside 0..STRIP_H-1
      targetY,
      requiredOffset,
      offset: requiredOffset,
      locked: false,
    });
  }

  shuffled([0, 1, 2, 3, 4]).slice(0, LOCKED_ROWS).forEach((i) => {
    rows[i].locked = true;
    rows[i].offset = rows[i].requiredOffset;
  });

  rows.forEach((r) => {
    if (r.locked) return;
    let o;
    do { o = randInt(0, MAX_OFFSET); } while (o === r.requiredOffset && MAX_OFFSET > 0);
    r.offset = o; // unlocked rows never spawn already correct
  });

  // The reference must never list its symbols in the board's own order, or the
  // player can solve it positionally instead of by symbol identity.
  let referenceOrder;
  do {
    referenceOrder = shuffled([0, 1, 2, 3, 4]);
  } while (referenceOrder.every((v, i) => v === i));

  return { rows, referenceOrder };
}

function isDescrambled(board) {
  return board.rows.every((r) => r.symbolIndex - r.offset === r.targetY);
}

/* ---------------------------------------------------------------------
   MODE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const stageEl = document.getElementById("descScreen");
  const boardEl = document.getElementById("descBoard");
  const refEl = document.getElementById("descReference");
  const loadoutEl = document.getElementById("descLoadout");

  let board = null;
  let chosenGlyphs = loadChosenGlyphs();
  let selectedRow = 0;
  let solving = false;
  const rowEls = [];

  /* ---- loadout: pick 5 of 10 ---- */
  function renderLoadout() {
    loadoutEl.innerHTML = "";
    GLYPH_PALETTE.forEach((glyph) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "glyph-pick";
      btn.textContent = glyph;
      btn.setAttribute("aria-label", `Symbol ${glyph}`);
      btn.setAttribute("aria-pressed", String(chosenGlyphs.includes(glyph)));
      btn.classList.toggle("is-chosen", chosenGlyphs.includes(glyph));
      btn.addEventListener("click", () => toggleGlyph(glyph));
      loadoutEl.appendChild(btn);
    });
  }

  function toggleGlyph(glyph) {
    const i = chosenGlyphs.indexOf(glyph);
    if (i >= 0) {
      if (chosenGlyphs.length <= 1) return; // keep at least one to swap against
      chosenGlyphs.splice(i, 1);
    } else if (chosenGlyphs.length >= ROW_COUNT) {
      chosenGlyphs.shift(); // oldest out, newest in
      chosenGlyphs.push(glyph);
    } else {
      chosenGlyphs.push(glyph);
    }
    renderLoadout();
  }

  function commitGlyphs() {
    // Top up from the palette if the player under-selected.
    const pool = GLYPH_PALETTE.filter((g) => !chosenGlyphs.includes(g));
    while (chosenGlyphs.length < ROW_COUNT) chosenGlyphs.push(pool.shift());
    chosenGlyphs = chosenGlyphs.slice(0, ROW_COUNT);
    saveChosenGlyphs(chosenGlyphs);
  }

  /* ---- reference panel: always visible, deliberately reordered ---- */
  function renderReference() {
    refEl.innerHTML = "";
    board.referenceOrder.forEach((rowIndex) => {
      const row = board.rows[rowIndex];
      const col = document.createElement("div");
      col.className = "ref-col";
      for (let y = 0; y < WINDOW_H; y++) {
        const slot = document.createElement("div");
        slot.className = "ref-slot";
        if (y === row.targetY) {
          slot.classList.add("ref-mark");
          slot.textContent = row.symbol;
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
        }
        strip.appendChild(cell);
      }
      applyStripOffset(strip, row.offset);
      win.appendChild(strip);

      if (row.locked) {
        const plate = document.createElement("span");
        plate.className = "lock-plate";
        plate.dataset.tip = "Bolted down. This row is already in position.";
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
      rowEls.push({ col, strip });
    });

    selectRow(board.rows.find((r) => !r.locked).index);
    markCorrectRows();
  }

  function selectRow(index) {
    selectedRow = index;
    rowEls.forEach((r, i) => r.col.classList.toggle("is-selected", i === index));
  }

  function stepSelection(delta) {
    let i = selectedRow;
    for (let n = 0; n < ROW_COUNT; n++) {
      i = (i + delta + ROW_COUNT) % ROW_COUNT;
      if (!board.rows[i].locked) { selectRow(i); return; }
    }
  }

  function markCorrectRows() {
    board.rows.forEach((row, i) => {
      const ok = row.symbolIndex - row.offset === row.targetY;
      rowEls[i].col.classList.toggle("is-aligned", ok);
    });
  }

  function doShift(index, dir) {
    if (!descMode.active || solving) return;
    const row = board.rows[index];
    if (!shiftRow(row, dir)) return;
    selectRow(index);
    applyStripOffset(rowEls[index].strip, row.offset);
    if (typeof sfx !== "undefined" && sfx.tick) sfx.tick();
    markCorrectRows();

    if (isDescrambled(board)) {
      solving = true;
      descMode.correct(5);
      setTimeout(() => {
        solving = false;
        if (descMode.active) newBoard();
      }, 700);
    }
  }

  function newBoard() {
    board = generateDescramblerBoard(chosenGlyphs);
    renderReference();
    renderBoard();
  }

  document.addEventListener("keydown", (e) => {
    if (!descMode.active || solving) return;
    if (stageEl.classList.contains("hidden")) return;
    const k = e.key.toLowerCase();
    if (k === "a" || e.key === "ArrowLeft") { e.preventDefault(); stepSelection(-1); }
    else if (k === "d" || e.key === "ArrowRight") { e.preventDefault(); stepSelection(1); }
    else if (k === "w" || e.key === "ArrowUp") { e.preventDefault(); doShift(selectedRow, "UP"); }
    else if (k === "s" || e.key === "ArrowDown") { e.preventDefault(); doShift(selectedRow, "DOWN"); }
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
  });

  renderLoadout();
  newBoard(); // idle preview
});
