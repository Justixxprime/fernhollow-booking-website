/* ============================================================
   QUIZ.JS — "Find your stay"
   Four quick questions, scored against real STAYS data. No
   external service involved — matching happens entirely in
   the browser against the same data every other page uses.
   ============================================================ */

const QUIZ_STEPS = ["1", "2", "3", "4", "results"];
let quizStep = 0;
const quizAnswers = { mood: null, group: null, budget: null, pets: false };

function initQuiz() {
  const panels = document.querySelectorAll("[data-quiz-panel]");
  const backBtn = document.querySelector("[data-quiz-back]");
  const nextBtn = document.querySelector("[data-quiz-next]");
  const seeResultsBtn = document.querySelector("[data-quiz-see-results]");
  const restartBtn = document.querySelector("[data-quiz-restart]");

  function showStep(i) {
    quizStep = i;
    panels.forEach((p) => p.classList.toggle("is-active", p.dataset.quizPanel === QUIZ_STEPS[i]));
    const isResults = QUIZ_STEPS[i] === "results";
    document.querySelector("[data-quiz-nav]").hidden = isResults;
    backBtn.hidden = i === 0;
    nextBtn.hidden = i === 3; // step 4 ("extras") has its own "See my matches" button instead
    document.querySelector("[data-quiz-caption]").textContent = isResults ? "" : `Question ${i + 1} of 4`;

    document.querySelectorAll("[data-quiz-step-dot]").forEach((dot) => {
      const dotIndex = Number(dot.dataset.quizStepDot) - 1;
      dot.classList.toggle("is-active", dotIndex === i);
      dot.classList.toggle("is-done", dotIndex < i);
    });
    const fillPct = isResults ? 100 : (i / (QUIZ_STEPS.length - 2)) * 100;
    document.querySelector("[data-quiz-progress-fill]").style.transform = `scaleX(${fillPct / 100})`;

    updateNextEnabled();
  }

  function updateNextEnabled() {
    const key = ["mood", "group", "budget"][quizStep];
    if (!key) return; // step 4 (extras) has its own "See my matches" button
    nextBtn.disabled = !quizAnswers[key];
  }

  panels.forEach((panel) => {
    panel.addEventListener("change", (e) => {
      const name = e.target.name;
      if (name === "pets") { quizAnswers.pets = e.target.checked; return; }
      if (name) quizAnswers[name] = e.target.value;
      panel.querySelectorAll(".radio-card").forEach((c) => c.classList.toggle("is-checked", c.querySelector("input").checked));
      updateNextEnabled();
    });
  });

  nextBtn.addEventListener("click", () => { if (quizStep < 3) showStep(quizStep + 1); });
  backBtn.addEventListener("click", () => { if (quizStep > 0) showStep(quizStep - 1); });
  seeResultsBtn.addEventListener("click", () => { renderQuizResults(); showStep(4); });
  restartBtn.addEventListener("click", () => {
    quizAnswers.mood = null; quizAnswers.group = null; quizAnswers.budget = null; quizAnswers.pets = false;
    document.querySelectorAll('[data-quiz-panel] input[type="radio"]').forEach((r) => (r.checked = false));
    document.querySelectorAll('[data-quiz-panel] input[type="checkbox"]').forEach((c) => (c.checked = false));
    document.querySelectorAll(".radio-card").forEach((c) => c.classList.remove("is-checked"));
    showStep(0);
  });

  showStep(0);
}

/* Scoring: mood match is worth the most since it's the strongest
   signal of taste, group size and budget are hard-ish filters
   (with a fallback if nothing fits exactly), pets is a hard filter
   when checked. Rating breaks ties. */
function scoreStay(stay, answers) {
  let score = 0;
  if (stay.moods.includes(answers.mood)) score += 5;
  if (stay.guests >= Number(answers.group)) score += 2;
  if (stay.price <= Number(answers.budget)) score += 2;
  score += stay.rating / 5; // small tiebreaker, max +1
  return score;
}

function renderQuizResults() {
  let pool = STAYS.slice();
  if (quizAnswers.pets) pool = pool.filter((s) => s.rules.pets);
  if (!pool.length) pool = STAYS.slice(); // never show zero results

  const ranked = pool
    .map((s) => ({ stay: s, score: scoreStay(s, quizAnswers) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const mount = document.querySelector("[data-quiz-results]");
  mount.innerHTML = ranked
    .map(
      ({ stay }, i) => `
    <a href="stay-detail.html?stay=${stay.slug}" class="stay-card" style="display:block;margin-bottom:${i === 0 ? "22px" : "14px"};${i === 0 ? "border-color:var(--brass);box-shadow:var(--glow-brass);" : ""}">
      <div style="display:flex;gap:16px;align-items:center;padding:14px;">
        <img src="${stay.images[0]}" alt="${stay.name}" style="width:${i === 0 ? "110px" : "76px"};height:${i === 0 ? "110px" : "76px"};object-fit:cover;border-radius:10px;flex:none;">
        <div>
          ${i === 0 ? `<span style="font-family:var(--font-mono);text-transform:uppercase;font-size:.7rem;letter-spacing:.08em;color:var(--brass-dark);font-weight:700;">Best match</span><br>` : ""}
          <b style="font-family:var(--font-display);font-size:${i === 0 ? "1.3rem" : "1.05rem"};">${stay.name}</b><br>
          <span style="font-size:.85rem;color:var(--text-on-light-soft);">${stay.location}</span><br>
          <span style="font-size:.85rem;margin-top:4px;display:inline-block;">★ ${stay.rating} · ${money(stay.price)}/night · sleeps ${stay.guests}</span>
        </div>
      </div>
    </a>`
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", initQuiz);
