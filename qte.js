/* ==========================================================================
   EMERGENCY DEPLOY — quick-time stratagem call-out (DESIGN_SPEC.md §5)
   Two options, not six. With a binary choice the distractor carries the whole
   mode, so it is drawn from the correct answer's own category — and ideally
   its own family — rather than at random.
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
