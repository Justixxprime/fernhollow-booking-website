/* ============================================================
   GIFT-REGISTRY.JS
   A group-gifting registry: pick a stay + goal amount, share a
   code, and any number of people can each contribute toward it.
   Same demo honesty as gift.js/js/main.js's gift codes — records
   live only in this browser's localStorage, under their own key
   so they never collide with the single-gift-code system on
   gift.html. Reuses money() (data.js) and STAYS (data.js).
   ============================================================ */

const REGISTRY_KEY = "fernhollow_registries";

function getRegistries() {
  try { return JSON.parse(localStorage.getItem(REGISTRY_KEY)) || {}; }
  catch { return {}; }
}
function saveRegistry(code, record) {
  const all = getRegistries();
  all[code] = record;
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(all));
}

function initGiftRegistryPage() {
  const staySelect = document.querySelector("[data-registry-stay]");
  const goalInput = document.querySelector("[data-registry-goal]");
  if (!staySelect || typeof STAYS === "undefined") return;

  STAYS.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.slug;
    opt.textContent = `${s.name} — ${s.location.split(",")[0]} ($${s.price}/night)`;
    staySelect.appendChild(opt);
  });

  function suggestGoal() {
    const stay = STAYS.find((s) => s.slug === staySelect.value) || STAYS[0];
    if (!goalInput.value || goalInput.dataset.auto === "1") {
      goalInput.value = stay.price * 7;
      goalInput.dataset.auto = "1";
    }
  }
  staySelect.addEventListener("change", suggestGoal);
  goalInput.addEventListener("input", () => (goalInput.dataset.auto = "0"));
  suggestGoal();

  document.querySelector("[data-registry-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const errorEl = document.querySelector("[data-registry-error]");
    const stay = STAYS.find((s) => s.slug === staySelect.value);
    const occasion = document.getElementById("reg-occasion").value.trim();
    const from = document.getElementById("reg-from").value.trim();
    const goal = Number(goalInput.value);

    const problems = [];
    if (!stay) problems.push("pick a stay");
    if (!occasion) problems.push("add the occasion");
    if (!from) problems.push("add your name");
    if (!goal || goal < 100) problems.push("set a goal of at least $100");
    if (problems.length) {
      errorEl.textContent = "Please " + problems.join(", and ") + " to continue.";
      errorEl.hidden = false;
      errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    errorEl.hidden = true;

    const code = "FH-REG-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    saveRegistry(code, { staySlug: stay.slug, stayName: stay.name, occasion, from, goal, raised: 0, contributions: [], createdAt: new Date().toISOString() });

    document.querySelector("[data-registry-code]").textContent = code;
    paintProgress(code);
    document.querySelector("[data-registry-result]").hidden = false;
    document.querySelector("[data-registry-result]").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  document.querySelector("[data-registry-copy]")?.addEventListener("click", () => {
    const code = document.querySelector("[data-registry-code]").textContent;
    navigator.clipboard?.writeText(code);
    const btn = document.querySelector("[data-registry-copy]");
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = original), 1500);
  });

  function paintProgress(code) {
    const record = getRegistries()[code];
    if (!record) return;
    const pct = Math.min(100, Math.round((record.raised / record.goal) * 100));
    document.querySelector("[data-registry-progress-fill]").style.width = pct + "%";
    document.querySelector("[data-registry-progress-label]").textContent =
      `${money(record.raised)} of ${money(record.goal)} raised toward ${record.stayName} (${pct}%)`;
  }

  document.querySelector("[data-contribute-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const codeInput = document.querySelector("[data-contribute-code]");
    const amountInput = document.querySelector("[data-contribute-amount]");
    const nameInput = document.querySelector("[data-contribute-name]");
    const resultEl = document.querySelector("[data-contribute-result]");
    const code = codeInput.value.trim().toUpperCase();
    const amount = Number(amountInput.value);
    const name = nameInput.value.trim();
    const record = getRegistries()[code];

    resultEl.hidden = false;
    if (!record) {
      resultEl.innerHTML = `<p style="color:#b23a3a;font-size:.9rem;">That code isn't in this browser's records. Registries are only saved on the device that created them.</p>`;
      return;
    }
    if (!amount || amount < 5) {
      resultEl.innerHTML = `<p style="color:#b23a3a;font-size:.9rem;">Enter an amount of at least $5.</p>`;
      return;
    }
    record.raised += amount;
    record.contributions.push({ name: name || "Someone lovely", amount, at: new Date().toISOString() });
    saveRegistry(code, record);

    const pct = Math.min(100, Math.round((record.raised / record.goal) * 100));
    resultEl.innerHTML = `
      <div class="golden-hour-card">
        <div class="gh-head"><i class="fa-solid fa-gift"></i><h4>${record.occasion}, for ${record.stayName}</h4></div>
        <div class="gh-bar"><div class="gh-bar-fill" style="width:${pct}%"></div></div>
        <p class="gh-sub" style="margin-top:8px;">${money(record.raised)} of ${money(record.goal)} raised (${pct}%) — thank you, ${name || "friend"}!</p>
      </div>`;
    codeInput.value = "";
    amountInput.value = "";
    nameInput.value = "";
  });
}

document.addEventListener("DOMContentLoaded", initGiftRegistryPage);
