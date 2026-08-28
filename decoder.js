/* ==========================================================================
   AUTOMATON DECODER — memorize the intercepted signal, then repeat it back.
   Sequence length grows each successful decode; the tile layout is reshuffled
   every round so the puzzle is always randomized but, being a memory task,
   is always solvable by definition.
   ========================================================================== */

const DECODER_GLYPHS = ["\u25B2", "\u25BC", "\u25C0", "\u25B6", "\u25CF", "\u25A0", "\u25C6", "\u2716"];
const DECODER_START_LEN = 3;
const DECODER_MAX_LEN = 9;
const DECODER_STEP_MS = 550;

document.addEventListener("DOMContentLoaded", () => {
  const gridEl = document.getElementById("decoderGrid");
  const statusEl = document.getElementById("decoderStatus");
  const stageEl = document.getElementById("decoderScreen");

  let sequence = [];
  let seqLen = DECODER_START_LEN;
  let playerIndex = 0;
  let tileEls = [];
  let inputLocked = true;

  function buildTiles() {
    gridEl.innerHTML = "";
    tileEls = shuffled(DECODER_GLYPHS).map((glyph) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "decoder-tile";
      tile.textContent = glyph;
      tile.dataset.glyph = glyph;
      tile.addEventListener("click", () => handleTileClick(glyph, tile));
      gridEl.appendChild(tile);
      return tile;
    });
  }

  function tileFor(glyph) {
    return tileEls.find((t) => t.dataset.glyph === glyph);
  }

  function flashTile(tile, cls, duration) {
    tile.classList.add(cls);
    setTimeout(() => tile.classList.remove(cls), duration);
  }

  function playSequence() {
    inputLocked = true;
    playerIndex = 0;
    statusEl.textContent = "Receiving signal...";
    sequence.forEach((glyph, i) => {
      setTimeout(() => {
        const tile = tileFor(glyph);
        if (tile) flashTile(tile, "decoder-playback", DECODER_STEP_MS - 150);
        if (typeof sfx !== "undefined" && sfx.tick) sfx.tick();
      }, i * DECODER_STEP_MS);
    });
    setTimeout(() => {
      if (!decoderMode.active) return;
      inputLocked = false;
      statusEl.textContent = `Repeat the signal (${sequence.length} steps)`;
    }, sequence.length * DECODER_STEP_MS + 150);
  }

  function newRound() {
    buildTiles();
    sequence = Array.from({ length: seqLen }, () => choice(DECODER_GLYPHS));
    playSequence();
  }

  function handleTileClick(glyph, tile) {
    if (inputLocked || !decoderMode.active) return;
    if (glyph === sequence[playerIndex]) {
      flashTile(tile, "decoder-correct", 300);
      playerIndex += 1;
      if (playerIndex === sequence.length) {
        inputLocked = true;
        statusEl.textContent = "Signal decoded.";
        seqLen = Math.min(DECODER_MAX_LEN, seqLen + 1);
        decoderMode.correct(3 + Math.floor(sequence.length / 2));
        setTimeout(() => {
          if (decoderMode.active) newRound();
        }, 600);
      }
    } else {
      flashTile(tile, "decoder-wrong", 300);
      inputLocked = true;
      statusEl.textContent = "Signal lost — retrying...";
      decoderMode.wrong();
      setTimeout(() => {
        if (decoderMode.active) playSequence();
      }, 700);
    }
  }

  const decoderMode = createTimedRoundMode({
    modeKey: "decoder",
    timeStart: 45,
    timeMax: 60,
    bonusOnCorrect: 4,
    timeEl: document.getElementById("decoderTime"),
    scoreEl: document.getElementById("decoderScore"),
    bestEl: document.getElementById("decoderBest"),
    timerFill: document.getElementById("decoderTimerFill"),
    stageEl,
    idleOverlay: document.getElementById("decoderIdleOverlay"),
    overOverlay: document.getElementById("decoderOverOverlay"),
    finalScoreEl: document.getElementById("decoderFinalScore"),
    finalBestEl: document.getElementById("decoderFinalBest"),
    startBtn: document.getElementById("decoderStartBtn"),
    restartBtn: document.getElementById("decoderRestartBtn"),
    onNewRound: () => {
      seqLen = DECODER_START_LEN;
      newRound();
    },
  });
});
