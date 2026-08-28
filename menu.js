/* ==========================================================================
   TERMINAL MENU — mode select + high scores
   Landing Zone is not listed here: it is an event inside Stratagem Hero.
   ========================================================================== */

function refreshMenuScores() {
  const scores = getHighScores();
  document.querySelectorAll("[data-score]").forEach((el) => {
    el.textContent = scores[el.dataset.score] || 0;
  });
}

document.querySelectorAll(".mode-card").forEach((card) => {
  card.addEventListener("click", () => showScreen(card.dataset.mode));
});

refreshMenuScores();
