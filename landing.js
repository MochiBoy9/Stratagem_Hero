/* ==========================================================================
   LANDING ZONE SELECT — confirm the correct grid coordinate before the drop
   pod commits (e.g. "C3", "D5"). Click the matching cell on the coordinate
   grid; wrong cells cost no time bonus, so the clock keeps draining.
   ========================================================================== */

const LZ_COLS = ["A", "B", "C", "D", "E", "F"];
const LZ_ROWS = [1, 2, 3, 4, 5, 6];

document.addEventListener("DOMContentLoaded", () => {
  const gridEl = document.getElementById("landingGrid");
  const promptEl = document.getElementById("landingPrompt");
  const stageEl = document.getElementById("landingScreen");

  let targetCoord = null;
  let cellEls = {};
  let locked = false;

  function buildGrid() {
    gridEl.innerHTML = "";
    gridEl.appendChild(document.createElement("div")); // corner spacer
    LZ_COLS.forEach((col) => {
      const head = document.createElement("div");
      head.className = "landing-head";
      head.textContent = col;
      gridEl.appendChild(head);
    });

    cellEls = {};
    LZ_ROWS.forEach((row) => {
      const head = document.createElement("div");
      head.className = "landing-head";
      head.textContent = row;
      gridEl.appendChild(head);

      LZ_COLS.forEach((col) => {
        const coord = `${col}${row}`;
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "landing-cell";
        cell.dataset.coord = coord;
        cell.addEventListener("click", () => handleCellClick(coord, cell));
        gridEl.appendChild(cell);
        cellEls[coord] = cell;
      });
    });
  }

  function clearMarks() {
    Object.values(cellEls).forEach((c) => c.classList.remove("landing-correct", "landing-wrong"));
  }

  function newRound() {
    clearMarks();
    locked = false;
    targetCoord = `${choice(LZ_COLS)}${choice(LZ_ROWS)}`;
    promptEl.textContent = `Confirm landing zone ${targetCoord}!`;
  }

  function handleCellClick(coord, cell) {
    if (locked || !landingMode.active) return;
    locked = true;
    if (coord === targetCoord) {
      cell.classList.add("landing-correct");
      landingMode.correct(4);
    } else {
      cell.classList.add("landing-wrong");
      if (cellEls[targetCoord]) cellEls[targetCoord].classList.add("landing-correct");
      landingMode.wrong();
    }
    setTimeout(() => {
      if (landingMode.active) newRound();
    }, 450);
  }

  const landingMode = createTimedRoundMode({
    modeKey: "landing",
    timeStart: 30,
    timeMax: 45,
    bonusOnCorrect: 4,
    timeEl: document.getElementById("landingTime"),
    scoreEl: document.getElementById("landingScore"),
    bestEl: document.getElementById("landingBest"),
    timerFill: document.getElementById("landingTimerFill"),
    stageEl,
    idleOverlay: document.getElementById("landingIdleOverlay"),
    overOverlay: document.getElementById("landingOverOverlay"),
    finalScoreEl: document.getElementById("landingFinalScore"),
    finalBestEl: document.getElementById("landingFinalBest"),
    startBtn: document.getElementById("landingStartBtn"),
    restartBtn: document.getElementById("landingRestartBtn"),
    onNewRound: () => {
      buildGrid();
      newRound();
    },
  });
});
