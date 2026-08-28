/* ==========================================================================
   EMERGENCY DEPLOY — quick-time stratagem call-out (DESIGN_SPEC.md §5)
   Two options, not six. With a binary choice the distractor carries the whole
   mode, so it is drawn from the correct answer's own category — and ideally
   its own family — rather than at random.

   Runs in two places off the same scenario generator: as a standalone mode,
   and as the interrupt event that overlays a live Stratagem Hero wave.
   ========================================================================== */

const QTE_FLAVOR_LINES = {
  "Reinforce": ["A Helldiver's down. Get them back in the fight."],
  "Resupply": ["Squad's dry on ammo. Call it in."],
  "SOS Beacon": ["Stranded diver signalling. Bring help."],
  "Hellbomb": ["Command wants that installation gone. Arm it."],
  "Orbital Illumination Flare": ["Zero visibility. Light the field."],
  "Orbital Laser": ["Heavy armour closing fast. Burn it down."],
  "Orbital Railcannon Strike": ["One shot on that heavy. Make it count."],
  "Eagle 500kg Bomb": ["Fortified position. Level it."],
  "EAT-17 Expendable Anti-Tank": ["No launcher on hand. Throw one down."],
  "Orbital Gas Strike": ["The horde's massing. Gas them before they close."],
  "Orbital EMS Strike": ["Slow that pack down before it overruns us."],
  "Shield Generator Relay": ["Squad's pinned. Put a bubble over us."],
  "Anti-Personnel Minefield": ["Cover the retreat route."],
  "SEAF Artillery": ["Call the SEAF guns."],
  "Eagle Rearm": ["Eagle's out of payload. Send her up."],
};

const QTE_CATEGORY_LINES = {
  offensive: ["Enemies massing on our position. Bring the heavy firepower.",
              "That nest needs hitting, hard."],
  supply: ["We're under-equipped down here. Requisition a weapon.",
           "Command, we need better hardware."],
  defensive: ["Set up a position before they arrive.",
              "We need cover. Dig in."],
  mission: ["Command needs this one deployed. Now."],
};

function qteScenario() {
  const strat = choice(STRATAGEMS);
  const lines = QTE_FLAVOR_LINES[strat.name] || QTE_CATEGORY_LINES[strat.type];
  return { strat, text: choice(lines) };
}

/* Distractor rules, in priority order:
   1. same category AND same name prefix (family) — e.g. Orbital vs Orbital
   2. same category
   3. anything else                                                          */
function qteDistractor(correct) {
  const family = correct.name.split(/[\s-]/)[0];
  const sameCategory = STRATAGEMS.filter(
    (s) => s.name !== correct.name && s.type === correct.type
  );
  const sameFamily = sameCategory.filter((s) => s.name.split(/[\s-]/)[0] === family);

  if (sameFamily.length) return choice(sameFamily);
  if (sameCategory.length) return choice(sameCategory);
  return choice(STRATAGEMS.filter((s) => s.name !== correct.name));
}

document.addEventListener("DOMContentLoaded", () => {
  const promptEl = document.getElementById("qtePrompt");
  const optionsEl = document.getElementById("qteOptions");
  const stageEl = document.getElementById("qteScreen");

  let currentAnswer = null;
  let locked = false;

  function renderOptions() {
    const { strat, text } = qteScenario();
    currentAnswer = strat.name;
    promptEl.textContent = text;
    optionsEl.innerHTML = "";
    locked = false;

    shuffled([strat, qteDistractor(strat)]).forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "qte-option";
      btn.type = "button";

      const iconWrap = document.createElement("div");
      iconWrap.className = "qte-option-icon-wrap";
      const img = document.createElement("img");
      img.className = "qte-option-icon";
      const fallback = document.createElement("div");
      fallback.className = "qte-option-icon-fallback";
      iconWrap.appendChild(img);
      iconWrap.appendChild(fallback);
      loadStratIcon(opt, img, fallback);

      const label = document.createElement("span");
      label.className = "qte-option-name";
      label.textContent = opt.name;

      btn.appendChild(iconWrap);
      btn.appendChild(label);

      btn.addEventListener("click", () => {
        if (locked || !qteMode.active) return;
        locked = true;
        if (opt.name === currentAnswer) {
          btn.classList.add("qte-correct");
          qteMode.correct();
        } else {
          btn.classList.add("qte-wrong");
          qteMode.wrong();
        }
        setTimeout(() => { if (qteMode.active) renderOptions(); }, 420);
      });

      optionsEl.appendChild(btn);
    });
  }

  const qteMode = createTimedRoundMode({
    modeKey: "qte",
    timeStart: 25,   // binary rounds resolve fast; shorter clock keeps the pressure
    timeMax: 35,
    bonusOnCorrect: 2,
    timeEl: document.getElementById("qteTime"),
    scoreEl: document.getElementById("qteScore"),
    bestEl: document.getElementById("qteBest"),
    timerFill: document.getElementById("qteClockFill"),
    stageEl,
    idleOverlay: document.getElementById("qteIdleOverlay"),
    overOverlay: document.getElementById("qteOverOverlay"),
    finalScoreEl: document.getElementById("qteFinalScore"),
    finalBestEl: document.getElementById("qteFinalBest"),
    startBtn: document.getElementById("qteStartBtn"),
    restartBtn: document.getElementById("qteRestartBtn"),
    onNewRound: renderOptions,
  });
});


/* ==========================================================================
   THE SAME CALL, AS A RUN EVENT
   Overlays a live wave rather than replacing it. The wave clock keeps running
   throughout, so the reward is a refund of the time the call cost.
   ========================================================================== */
const ED_WINDOW_MS = 6000;
const ED_REWARD_S = 5;
const ED_CHANCE = 0.2;
const ED_MIN_WAVE = 2;
const ED_COOLDOWN_WAVES = 2;
const ED_MIN_CLOCK_S = 4;

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("edOverlay");
  const callEl = document.getElementById("edCall");
  const optionsEl = document.getElementById("edOptions");
  const barEl = document.getElementById("edBar");
  const finalEl = document.getElementById("finalEd");

  let answer = null;
  let buttons = [];
  let locked = false;
  let answered = 0;
  let lastWave = -99;
  let timeoutId = null;
  let rafId = null;

  function animateBar(startedAt) {
    const step = () => {
      const pct = Math.max(0, 100 - ((Date.now() - startedAt) / ED_WINDOW_MS) * 100);
      barEl.style.width = pct + "%";
      if (pct > 0 && window.RunEvent.active) rafId = requestAnimationFrame(step);
    };
    step();
  }

  function open() {
    const { strat, text } = qteScenario();
    answer = strat.name;
    locked = false;
    callEl.textContent = text;
    optionsEl.innerHTML = "";
    buttons = [];

    shuffled([strat, qteDistractor(strat)]).forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qte-option";

      const key = document.createElement("span");
      key.className = "ed-option-key";
      key.textContent = i + 1;

      const label = document.createElement("span");
      label.className = "qte-option-name";
      label.textContent = opt.name;

      btn.appendChild(key);
      btn.appendChild(label);
      btn.addEventListener("click", () => pick(i));
      optionsEl.appendChild(btn);
      buttons.push({ btn, name: opt.name });
    });

    window.RunEvent.active = true;
    overlay.classList.remove("hidden");
    animateBar(Date.now());
    if (typeof sfx !== "undefined" && sfx.waveUp) sfx.waveUp();

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => close(false, true), ED_WINDOW_MS);
  }

  /* silent = the player never answered. Letting the window expire is already
     punished by the clock; it doesn't also get an error sting. */
  function close(success, silent) {
    clearTimeout(timeoutId);
    cancelAnimationFrame(rafId);
    window.RunEvent.active = false; // ALWAYS clears — a stuck flag soft-locks the run
    overlay.classList.add("hidden");

    if (success) {
      answered += 1;
      if (typeof window.grantWaveTime === "function") window.grantWaveTime(ED_REWARD_S);
      if (typeof sfx !== "undefined" && sfx.complete) sfx.complete();
    } else if (!silent && typeof sfx !== "undefined" && sfx.wrong) {
      sfx.wrong();
    }
  }

  function pick(i) {
    if (locked || !window.RunEvent.active) return;
    const chosen = buttons[i];
    if (!chosen) return;
    locked = true;
    const hit = chosen.name === answer;
    chosen.btn.classList.add(hit ? "qte-correct" : "qte-wrong");
    if (!hit) {
      const right = buttons.find((b) => b.name === answer);
      if (right) right.btn.classList.add("qte-correct");
    }
    setTimeout(() => close(hit, false), 320);
  }

  /* Capture phase so this runs before Stratagem Hero's own listener. */
  document.addEventListener("keydown", (e) => {
    if (!window.RunEvent.active) return;
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key) return;
    const k = e.key.toLowerCase();
    const i = { 1: 0, a: 0, arrowleft: 0, 2: 1, d: 1, arrowright: 1 }[k];
    if (i === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    pick(i);
  }, true);

  window.registerRunEvent({
    maybeTrigger(waveNumber, waveTimeLeft) {
      if (window.RunEvent.active) return false;
      if (waveNumber < ED_MIN_WAVE) return false;
      if (waveNumber - lastWave < ED_COOLDOWN_WAVES) return false;
      if (waveTimeLeft < ED_MIN_CLOCK_S) return false;
      if (Math.random() > ED_CHANCE) return false;
      lastWave = waveNumber;
      open();
      return true;
    },
    reset() {
      lastWave = -99;
      answered = 0;
      if (window.RunEvent.active) close(false, true);
    },
    // The run ended under an open call: take it off screen, keep the tally.
    dismiss() {
      if (window.RunEvent.active) close(false, true);
    },
    renderStat() {
      if (finalEl) finalEl.textContent = answered;
    },
  });

  registerModeStopper(() => { if (window.RunEvent.active) close(false, true); });
});
