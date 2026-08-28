/* ==========================================================================
   EMERGENCY DEPLOY — Quick-Time Event mode
   A radio call describes the situation; pick the matching stratagem before
   time runs out. Correct = time bonus. Wrong = no bonus (time keeps ticking).
   ========================================================================== */

const QTE_FLAVOR_LINES = {
  "Reinforce": ["A Helldiver's down — call in reinforcements, now!"],
  "Resupply": ["Ammo's critical across the squad — request a resupply drop!"],
  "SOS Beacon": ["A stranded Helldiver is signaling — send the SOS beacon!"],
  "Hellbomb": ["Command wants that installation gone — arm the Hellbomb!"],
  "Orbital Illumination Flare": ["Zero visibility out here — light up the field!"],
  "Orbital Laser": ["Heavy armor inbound, fast — burn it with the Orbital Laser!"],
  "Orbital Railcannon Strike": ["One shot on that heavy target — make it count!"],
  "Eagle 500kg Bomb": ["Level that fortified position with a big bomb!"],
  "EAT-17 Expendable Anti-Tank": ["No launcher on hand — call in a throwaway anti-tank!"],
  "Orbital Gas Strike": ["The horde's massing — gas them before they close in!"],
  "Orbital EMS Strike": ["Slow that pack down before it overruns the line!"],
  "Shield Generator Relay": ["Set up a bubble shield to cover the squad!"],
  "Anti-Personnel Minefield": ["Cover our retreat route with a minefield!"],
  "SEAF Artillery": ["Call in SEAF support for the barrage!"],
  "Eagle Rearm": ["Eagle's out of payload — call for a rearm!"],
};

const QTE_CATEGORY_LINES = {
  offensive: [
    "Enemies are massing on our position — call down heavy firepower!",
    "We need to hit that nest hard, right now!",
  ],
  supply: [
    "We're under-equipped for this fight — requisition a weapon!",
    "Command, we need better hardware down here!",
  ],
  defensive: [
    "Set up a defensive position before they arrive!",
    "We need cover, fast — dig in!",
  ],
  mission: [
    "Command needs this mission stratagem deployed, stat!",
  ],
};

function qteScenario() {
  const strat = choice(STRATAGEMS);
  const lines = QTE_FLAVOR_LINES[strat.name] || QTE_CATEGORY_LINES[strat.type];
  return { strat, text: choice(lines) };
}

function qteOptionPool(correctStrat, count) {
  const pool = STRATAGEMS.filter((s) => s.name !== correctStrat.name);
  const distractors = shuffled(pool).slice(0, count - 1);
  return shuffled([correctStrat, ...distractors]);
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

    qteOptionPool(strat, 6).forEach((opt) => {
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
        setTimeout(() => {
          if (qteMode.active) renderOptions();
        }, 450);
      });

      optionsEl.appendChild(btn);
    });
  }

  const qteMode = createTimedRoundMode({
    modeKey: "qte",
    timeStart: 30,
    timeMax: 45,
    bonusOnCorrect: 4,
    timeEl: document.getElementById("qteTime"),
    scoreEl: document.getElementById("qteScore"),
    bestEl: document.getElementById("qteBest"),
    timerFill: document.getElementById("qteTimerFill"),
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
