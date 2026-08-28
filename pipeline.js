/* ==========================================================================
   OIL LINE REPAIR — pipe-rotation puzzle (Terminid oil mission style)
   A path is carved from the top inlet to the bottom outlet, every path pipe
   is scrambled, and a handful of pipes (locked, wrench icon) can't be
   turned. Locked path pipes are always pre-set to their correct rotation,
   so the puzzle is guaranteed solvable no matter what gets locked.
   ========================================================================== */

const PIPE_GRID_SIZE = 5;

function pipeDirFrom(a, b) {
  if (b.row === a.row - 1) return "N";
  if (b.row === a.row + 1) return "S";
  if (b.col === a.col - 1) return "W";
  return "E";
}

function pipeClassify(sideA, sideB) {
  const opposite =
    (sideA === "N" && sideB === "S") || (sideA === "S" && sideB === "N") ||
    (sideA === "E" && sideB === "W") || (sideA === "W" && sideB === "E");
  if (opposite) {
    return { shape: "straight", rotation: sideA === "N" || sideA === "S" ? 0 : 90 };
  }
  const map = { NE: 0, EN: 0, ES: 90, SE: 90, SW: 180, WS: 180, WN: 270, NW: 270 };
  return { shape: "corner", rotation: map[sideA + sideB] };
}

function generatePipelinePath(size) {
  const startCol = randInt(1, size - 2);
  const visited = new Set();
  const path = [];
  const key = (r, c) => r + "," + c;

  function neighborsOf(r, c) {
    return shuffled([
      [-1, 0, "N"], [1, 0, "S"], [0, -1, "W"], [0, 1, "E"],
    ])
      .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
      .filter((n) => n.r >= 0 && n.r < size && n.c >= 0 && n.c < size);
  }

  function dfs(r, c) {
    visited.add(key(r, c));
    path.push({ row: r, col: c });
    if (r === size - 1) return true;
    for (const n of neighborsOf(r, c)) {
      if (visited.has(key(n.r, n.c))) continue;
      if (dfs(n.r, n.c)) return true;
    }
    path.pop();
    return false;
  }

  dfs(0, startCol);
  return path;
}

function generatePipelinePuzzle(size) {
  let path = generatePipelinePath(size);
  // Extremely unlikely to fail on an open grid, but guard anyway.
  let attempts = 0;
  while (path.length < 2 && attempts < 10) {
    path = generatePipelinePath(size);
    attempts++;
  }

  const info = new Map();
  path.forEach((cell, i) => {
    const prevSide = i === 0 ? "N" : pipeDirFrom(cell, path[i - 1]);
    const nextSide = i === path.length - 1 ? "S" : pipeDirFrom(cell, path[i + 1]);
    const cls = pipeClassify(prevSide, nextSide);
    info.set(cell.row + "," + cell.col, cls);
  });

  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const k = r + "," + c;
      if (info.has(k)) {
        const { shape, rotation } = info.get(k);
        row.push({
          row: r, col: c, isPath: true, shape,
          correctRotation: rotation,
          rotation: choice([0, 90, 180, 270]),
          locked: false,
        });
      } else {
        row.push({
          row: r, col: c, isPath: false,
          shape: choice(["straight", "corner"]),
          correctRotation: null,
          rotation: choice([0, 90, 180, 270]),
          locked: false,
        });
      }
    }
    grid.push(row);
  }

  const allCells = grid.flat();
  const lockCount = randInt(2, Math.min(5, allCells.length));
  shuffled(allCells).slice(0, lockCount).forEach((cell) => {
    cell.locked = true;
    if (cell.isPath) cell.rotation = cell.correctRotation;
  });

  return { grid, size, entryCol: path[0].col, exitCol: path[path.length - 1].col };
}

function pipeSolved(cell) {
  if (!cell.isPath) return true;
  if (cell.shape === "straight") {
    return cell.rotation % 180 === cell.correctRotation % 180;
  }
  return cell.rotation === cell.correctRotation;
}

function pipeSvg(shape) {
  if (shape === "straight") {
    return '<svg viewBox="0 0 100 100"><line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" stroke-width="16" stroke-linecap="round"/></svg>';
  }
  return '<svg viewBox="0 0 100 100"><path d="M50,0 L50,50 L100,50" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

document.addEventListener("DOMContentLoaded", () => {
  const gridEl = document.getElementById("pipelineGrid");
  const stageEl = document.getElementById("pipelineScreen");
  let puzzle = null;

  function renderPuzzle() {
    puzzle = generatePipelinePuzzle(PIPE_GRID_SIZE);
    gridEl.style.setProperty("--pipe-cols", puzzle.size);
    gridEl.innerHTML = "";
    gridEl.classList.remove("pipe-flowing");

    puzzle.grid.flat().forEach((cell) => {
      const cellEl = document.createElement("div");
      cellEl.className = "pipe-cell" + (cell.locked ? " pipe-locked" : "");
      cellEl.innerHTML = pipeSvg(cell.shape);
      cellEl.style.transform = `rotate(${cell.rotation}deg)`;
      if (cell.locked) {
        const lock = document.createElement("span");
        lock.className = "pipe-lock-icon";
        lock.textContent = "\u{1F512}";
        cellEl.appendChild(lock);
      }
      if (cell.row === 0 && cell.col === puzzle.entryCol) cellEl.classList.add("pipe-entry");
      if (cell.row === puzzle.size - 1 && cell.col === puzzle.exitCol) cellEl.classList.add("pipe-exit");

      cellEl.addEventListener("click", () => {
        if (cell.locked || !pipelineMode.active) return;
        cell.rotation = (cell.rotation + 90) % 360;
        cellEl.style.transform = `rotate(${cell.rotation}deg)`;
        checkPipelineSolved();
      });

      gridEl.appendChild(cellEl);
    });
  }

  function checkPipelineSolved() {
    const solved = puzzle.grid.flat().every(pipeSolved);
    if (solved) {
      gridEl.classList.add("pipe-flowing");
      pipelineMode.correct(6);
      setTimeout(() => {
        if (pipelineMode.active) renderPuzzle();
      }, 500);
    }
  }

  const pipelineMode = createTimedRoundMode({
    modeKey: "pipeline",
    timeStart: 45,
    timeMax: 60,
    bonusOnCorrect: 6,
    timeEl: document.getElementById("pipelineTime"),
    scoreEl: document.getElementById("pipelineScore"),
    bestEl: document.getElementById("pipelineBest"),
    timerFill: document.getElementById("pipelineTimerFill"),
    stageEl,
    idleOverlay: document.getElementById("pipelineIdleOverlay"),
    overOverlay: document.getElementById("pipelineOverOverlay"),
    finalScoreEl: document.getElementById("pipelineFinalScore"),
    finalBestEl: document.getElementById("pipelineFinalBest"),
    startBtn: document.getElementById("pipelineStartBtn"),
    restartBtn: document.getElementById("pipelineRestartBtn"),
    onNewRound: renderPuzzle,
  });
});
