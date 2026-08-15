/* ============================================================
   GIFT-REGISTRY.JS
   A group-gifting registry: pick a stay + goal amount, share a
   code, and any number of people can each contribute toward it.
   Same demo honesty as gift.js/js/main.js's gift codes — records
   live only in this browser's localStorage, under their own key
   so they never collide with the single-gift-code system on
   gift.html. Reuses money() (data.js) and STAYS (data.js).

   Full CRUD, not just create: every registry made on this device
   is listed below the forms, editable (occasion/goal), deletable,
   and its contributions are viewable — a registry isn't a
   one-shot generator, it's something you can actually manage.
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
function deleteRegistry(code) {
  const all = getRegistries();
  delete all[code];
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(all));
}

function initGiftRegistryPage() {
  const staySelect = document.querySelector("[data-registry-stay]");
  const goalInput = document.querySelector("[data-registry-goal]");
  if (!staySelect || typeof STAYS === "undefined") return;

  STAYS.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.slug;
    opt.textContent = `${s.name}, ${s.location.split(",")[0]} ($${s.price}/night)`;
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

  /* ---------- create ---------- */
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
    paintCreatedProgress(code);
    document.querySelector("[data-registry-result]").hidden = false;
    document.querySelector("[data-registry-result]").scrollIntoView({ behavior: "smooth", block: "center" });
    document.querySelector("[data-registry-form]").reset();
    goalInput.dataset.auto = "1";
    renderMyRegistries();
  });

  document.querySelector("[data-registry-copy]")?.addEventListener("click", () => {
    const code = document.querySelector("[data-registry-code]").textContent;
    copyCode(code, document.querySelector("[data-registry-copy]"));
  });

  function paintCreatedProgress(code) {
    const record = getRegistries()[code];
    if (!record) return;
    const pct = Math.min(100, Math.round((record.raised / record.goal) * 100));
    document.querySelector("[data-registry-progress-fill]").style.width = pct + "%";
    document.querySelector("[data-registry-progress-label]").textContent =
      `${money(record.raised)} of ${money(record.goal)} raised toward ${record.stayName} (${pct}%)`;
  }

  /* ---------- contribute ---------- */
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
        <p class="gh-sub" style="margin-top:8px;">${money(record.raised)} of ${money(record.goal)} raised (${pct}%), thank you, ${name || "friend"}!</p>
      </div>`;
    codeInput.value = "";
    amountInput.value = "";
    nameInput.value = "";
    renderMyRegistries();
  });

  function copyCode(code, btn) {
    navigator.clipboard?.writeText(code);
    const original = btn.innerHTML;
    btn.innerHTML = btn === document.querySelector("[data-registry-copy]") ? "Copied!" : '<i class="fa-solid fa-check"></i>';
    setTimeout(() => (btn.innerHTML = original), 1500);
  }

  /* ---------- manage: list every registry on this device ---------- */
  function renderMyRegistries() {
    const mount = document.querySelector("[data-my-registries]");
    const emptyEl = document.querySelector("[data-my-registries-empty]");
    const template = document.getElementById("registry-card-template");
    if (!mount || !template) return;

    const all = getRegistries();
    const codes = Object.keys(all).sort((a, b) => new Date(all[b].createdAt) - new Date(all[a].createdAt));

    mount.innerHTML = "";
    if (!codes.length) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    codes.forEach((code) => {
      const record = all[code];
      const node = template.content.cloneNode(true);
      const card = node.querySelector(".registry-card");
      const pct = Math.min(100, Math.round((record.raised / record.goal) * 100));

      node.querySelector("[data-rc-code]").textContent = code;
      node.querySelector("[data-rc-occasion]").textContent = record.occasion;
      node.querySelector("[data-rc-stay]").textContent = `For ${record.stayName}, started by ${record.from}`;
      node.querySelector("[data-rc-fill]").style.width = pct + "%";
      node.querySelector("[data-rc-progress]").textContent = `${money(record.raised)} of ${money(record.goal)} raised (${pct}%)`;

      const contribList = node.querySelector("[data-rc-contributions]");
      const contribSummary = node.querySelector("[data-rc-contrib-summary]");
      contribSummary.textContent = `Contributions (${record.contributions.length})`;
      if (!record.contributions.length) {
        contribList.innerHTML = `<li style="font-size:.82rem;color:var(--text-on-light-soft);">No contributions yet.</li>`;
      } else {
        record.contributions
          .slice()
          .reverse()
          .forEach((c) => {
            const li = document.createElement("li");
            li.style.cssText = "display:flex;justify-content:space-between;font-size:.82rem;color:var(--text-on-light-soft);";
            li.innerHTML = `<span>${escapeHtml(c.name)}</span><span style="font-weight:700;color:var(--text-on-light);">${money(c.amount)}</span>`;
            contribList.appendChild(li);
          });
      }

      // edit
      const editForm = node.querySelector("[data-rc-edit-form]");
      const editOccasion = node.querySelector("[data-rc-edit-occasion]");
      const editGoal = node.querySelector("[data-rc-edit-goal]");
      node.querySelector("[data-rc-edit]").addEventListener("click", () => {
        editOccasion.value = record.occasion;
        editGoal.value = record.goal;
        editForm.style.display = editForm.style.display === "flex" ? "none" : "flex";
      });
      node.querySelector("[data-rc-edit-cancel]").addEventListener("click", () => (editForm.style.display = "none"));
      node.querySelector("[data-rc-edit-save]").addEventListener("click", () => {
        const newOccasion = editOccasion.value.trim();
        const newGoal = Number(editGoal.value);
        if (!newOccasion || !newGoal || newGoal < 50) {
          showToast("Enter an occasion and a goal of at least $50");
          return;
        }
        record.occasion = newOccasion;
        record.goal = newGoal;
        saveRegistry(code, record);
        showToast("Registry updated");
        renderMyRegistries();
      });

      // copy
      node.querySelector("[data-rc-copy]").addEventListener("click", (e) => copyCode(code, e.currentTarget));

      // delete
      node.querySelector("[data-rc-delete]").addEventListener("click", () => {
        if (!confirm(`Delete the registry for "${record.occasion}"? This can't be undone.`)) return;
        deleteRegistry(code);
        showToast("Registry deleted");
        renderMyRegistries();
      });

      mount.appendChild(node);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  renderMyRegistries();
}

document.addEventListener("DOMContentLoaded", initGiftRegistryPage);
