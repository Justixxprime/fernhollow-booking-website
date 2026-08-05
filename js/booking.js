/* ============================================================
   BOOKING.JS
   Drives the 3-step booking flow on booking.html.

   Design note on the "multi-step form, not one long scroll":
   all three steps already exist in the DOM (three <section
   class="step-panel">), we just toggle which one is visible and
   move a progress indicator. This keeps the browser's Back
   button, autofill and validation all working normally — nothing
   exotic, just show/hide plus a state object.
   ============================================================ */

const STEP_LABELS = ["Dates", "Your details", "Confirm"];

function initBooking() {
  // Reaching this page while signed out (direct link, bookmark, browser
  // back button after signing out in another tab) shouldn't be possible —
  // the "Reserve" button on the stay page already gates this, but that's
  // a UI convenience, not a source of truth, so it's checked again here
  // as the real gate. Cancelling sends you back to where you'd actually
  // want to be instead of leaving you stranded on an empty booking page.
  if (!requireLogin({
    message: "Sign in to continue this booking, it takes a few seconds and there's no email verification in this demo.",
    onCancel: () => { location.href = "stays.html"; },
  })) return;

  const params = new URLSearchParams(location.search);
  const draft = BookingState.getDraft();
  const slug = params.get("stay") || draft?.slug;
  const stay = getStay(slug) || STAYS[0];

  document.title = `Book ${stay.name}: Fernhollow`;

  const state = {
    stay,
    checkin: draft && draft.slug === stay.slug ? draft.checkin : null,
    checkout: draft && draft.slug === stay.slug ? draft.checkout : null,
    guests: draft && draft.slug === stay.slug ? draft.guests || 1 : 1,
    addons: draft?.addons || {},
    details: draft?.details || {},
    payment: draft?.payment || "card",
    giftCode: null,
    giftBalance: 0,
    step: 1,
  };

  // A signed-in account (see account.html) is a nice-to-have convenience
  // here, nothing more — it only fills in blanks, never overwrites a
  // draft the guest already had in progress.
  if (typeof Account !== "undefined" && Account.isLoggedIn() && !state.details.name) {
    const acc = Account.get();
    state.details.name = acc.name;
    state.details.email = acc.email;
  }

  renderStayHeader(stay);
  buildStep1(state);
  buildStep2(state);
  buildStep3(state);
  bindNav(state);
  updateProgress(state);
  updateSummaryEverywhere(state);
  window.__refreshPrices = () => updateSummaryEverywhere(state);
}

function renderStayHeader(stay) {
  document.querySelectorAll("[data-booking-stay-name]").forEach((el) => (el.textContent = stay.name));
  document.querySelectorAll("[data-booking-stay-loc]").forEach((el) => (el.innerHTML = `<i class="fa-solid fa-location-dot" style="color:var(--brass-dark);margin-right:5px;"></i>${stay.location}`));
  document.querySelectorAll("[data-booking-stay-photo]").forEach((el) => (el.src = stay.images[0]));
}

/* ---------- STEP 1: dates + guests ---------- */
function buildStep1(state) {
  const host = document.querySelector("[data-step1-calendar]");
  const dp = new DatePicker(host, {
    unavailable: state.stay.unavailable,
    minDate: new Date(),
    initialStart: state.checkin,
    initialEnd: state.checkout,
    onBlockedCross: () => showToast("That range includes an unavailable night, restarting from your new check-in date"),
    onChange: ({ start, end }) => {
      state.checkin = start;
      state.checkout = end;
      updateSummaryEverywhere(state);
      validateStep(1, state);
    },
  });

  document.querySelector("[data-step1-guests]").textContent = `${state.guests} guest${state.guests > 1 ? "s" : ""}`;
  document.querySelector("[data-guest-minus]").addEventListener("click", () => {
    state.guests = Math.max(1, state.guests - 1);
    document.querySelector("[data-step1-guests]").textContent = `${state.guests} guest${state.guests > 1 ? "s" : ""}`;
    updateSummaryEverywhere(state);
  });
  document.querySelector("[data-guest-plus]").addEventListener("click", () => {
    state.guests = Math.min(state.stay.guests, state.guests + 1);
    document.querySelector("[data-step1-guests]").textContent = `${state.guests} guest${state.guests > 1 ? "s" : ""}`;
    updateSummaryEverywhere(state);
  });
}

/* ---------- STEP 2: guest details + add-ons ---------- */
function buildStep2(state) {
  const addonMount = document.querySelector("[data-addons]");
  addonMount.innerHTML = ADDONS.map(
    (a) => `
    <label class="check-row">
      <input type="checkbox" data-addon="${a.key}" ${state.addons[a.key] ? "checked" : ""}>
      <i class="fa-solid ${a.icon}" style="color:var(--brass-dark);margin-top:2px;width:16px;"></i>
      <span style="flex:1;"><b>${a.label}</b><span>${a.detail}</span></span>
      <span class="addon-price">+${money(a.price)}</span>
    </label>`
  ).join("");

  addonMount.querySelectorAll("[data-addon]").forEach((cb) =>
    cb.addEventListener("change", () => {
      state.addons[cb.dataset.addon] = cb.checked;
      updateSummaryEverywhere(state);
    })
  );

  const form = document.querySelector("[data-details-form]");
  ["name", "email", "phone", "arrival", "requests"].forEach((field) => {
    const el = form.querySelector(`[name="${field}"]`);
    if (!el) return;
    if (state.details[field]) el.value = state.details[field];
    el.addEventListener("input", () => {
      state.details[field] = el.value;
      clearFieldError(el);
    });
  });
}

function clearFieldError(el) {
  el.closest(".field")?.classList.remove("has-error");
}

/* One well-chosen upsell, shown once if the guest hasn't added any
   extras before moving to review. Accepting checks the same checkbox
   in the step-2 add-ons list (so the price breakdown and the actual
   checkbox state stay in sync), rather than adding a hidden line item
   the guest never actually agreed to in the visible form. */
function showUpsellModal(state, onClose) {
  const suggestion = ADDONS.find((a) => a.key === "breakfast") || ADDONS[0];
  const overlay = document.querySelector("[data-upsell-modal]");
  document.querySelector("[data-upsell-icon]").className = `fa-solid ${suggestion.icon}`;
  document.querySelector("[data-upsell-title]").textContent = suggestion.label;
  document.querySelector("[data-upsell-detail]").textContent = suggestion.detail;
  document.querySelector("[data-upsell-price]").textContent = `+${money(suggestion.price)}, added to your total`;

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");

  function onBackdropClick(e) { if (e.target === overlay) onDecline(); }
  function onEscKey(e) { if (e.key === "Escape") onDecline(); }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    acceptBtn.removeEventListener("click", onAccept);
    declineBtn.removeEventListener("click", onDecline);
    overlay.removeEventListener("click", onBackdropClick);
    document.removeEventListener("keydown", onEscKey);
    onClose();
  }
  function onAccept() {
    state.addons[suggestion.key] = true;
    const checkbox = document.querySelector(`[data-addon="${suggestion.key}"]`);
    if (checkbox) checkbox.checked = true;
    updateSummaryEverywhere(state);
    close();
  }
  function onDecline() {
    close();
  }

  const acceptBtn = document.querySelector("[data-upsell-accept]");
  const declineBtn = document.querySelector("[data-upsell-decline]");
  acceptBtn.addEventListener("click", onAccept);
  declineBtn.addEventListener("click", onDecline);
  overlay.addEventListener("click", onBackdropClick);
  document.addEventListener("keydown", onEscKey);
}

/* ---------- STEP 3: confirm ---------- */
function buildStep3(state) {
  document.querySelectorAll('[name="payment"]').forEach((r) => {
    r.checked = r.value === state.payment;
    r.addEventListener("change", () => {
      state.payment = r.value;
      document.querySelectorAll(".radio-card").forEach((c) => c.classList.toggle("is-checked", c.querySelector("input").checked));
      document.querySelector("[data-card-fields]")?.classList.toggle("is-open", state.payment === "card");
    });
  });
  document.querySelectorAll(".radio-card").forEach((c) => c.classList.toggle("is-checked", c.querySelector("input").checked));
  document.querySelector("[data-card-fields]")?.classList.toggle("is-open", state.payment === "card");

  initCardFormatting();
  initGiftApply(state);
  updateGiftPaymentOption(state);
}

function initGiftApply(state) {
  const form = document.querySelector("[data-gift-apply-form]");
  const resultEl = document.querySelector("[data-gift-apply-result]");
  if (!form || form.dataset.wired) return;
  form.dataset.wired = "1";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("gift-apply-code");
    const code = input.value.trim().toUpperCase();
    const record = getGiftCodes()[code];
    resultEl.hidden = false;

    if (!record) {
      resultEl.style.color = "#b23a3a";
      resultEl.textContent = "That code isn't in this browser's records.";
      return;
    }
    if (record.balance <= 0) {
      resultEl.style.color = "#b23a3a";
      resultEl.textContent = "That gift card has already been fully used.";
      return;
    }
    state.giftCode = code;
    state.giftBalance = record.balance;
    resultEl.style.color = "var(--pine-700,#3a5a40)";
    resultEl.textContent = `Applied. ${money(record.balance)} available, will be deducted from your total below.`;
    input.value = "";
    updateSummaryEverywhere(state);
  });
}

/* Shows/hides the "Pay entirely with gift card" option and keeps it in
   sync with the applied balance. Previously a gift card could only ever
   knock money off whatever payment method you'd already picked; there
   was no way to actually pay with just the gift card itself, even when
   it fully covered the stay, you'd still be looking at an open card
   form asking for a number. */
function updateGiftPaymentOption(state) {
  const option = document.querySelector("[data-payment-giftcard-option]");
  if (!option) return;
  const { preDiscount } = computeTotal(state);
  const fullyCovered = state.giftCode && (state.giftBalance || 0) >= preDiscount && preDiscount > 0;
  const wasHidden = option.hidden;

  option.hidden = !fullyCovered;
  const radio = option.querySelector('input[value="giftcard"]');

  if (fullyCovered) {
    const hint = option.querySelector("[data-giftcard-option-hint]");
    if (hint) hint.textContent = `Your gift card (${state.giftCode}) covers the full ${money(preDiscount)}, nothing else charged today.`;
    // Auto-select it the moment it *becomes* enough to cover everything —
    // that's the whole point of applying the code. But only on that
    // transition, so someone who deliberately switches back to paying by
    // card instead (to save the gift balance for another trip, say) isn't
    // fought with every time the summary refreshes.
    if (wasHidden) {
      radio.checked = true;
      state.payment = "giftcard";
    }
  } else if (state.payment === "giftcard") {
    // The option just stopped covering things (an add-on was added, say),
    // so fall back to card rather than leaving an impossible state selected.
    state.payment = "card";
    document.querySelector('input[name="payment"][value="card"]').checked = true;
  }
  document.querySelectorAll(".radio-card").forEach((c) => c.classList.toggle("is-checked", c.querySelector("input").checked));
  document.querySelector("[data-card-fields]")?.classList.toggle("is-open", state.payment === "card");
}

function initCardFormatting() {
  const numberInput = document.querySelector("[data-card-number]");
  const expiryInput = document.querySelector("[data-card-expiry]");
  const cvcInput = document.querySelector("[data-card-cvc]");
  const brandIcon = document.querySelector("[data-card-brand-icon]");
  if (!numberInput || numberInput.dataset.wired) return;
  numberInput.dataset.wired = "1";

  const BRANDS = [
    { test: /^4/, icon: "fa-cc-visa" },
    { test: /^5[1-5]/, icon: "fa-cc-mastercard" },
    { test: /^3[47]/, icon: "fa-cc-amex" },
    { test: /^6(?:011|5)/, icon: "fa-cc-discover" },
  ];

  numberInput.addEventListener("input", () => {
    const digits = numberInput.value.replace(/\D/g, "").slice(0, 16);
    numberInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
    const brand = BRANDS.find((b) => b.test.test(digits));
    brandIcon.className = `fa-brands card-brand-icon ${brand ? brand.icon + " is-detected" : "fa-credit-card"}`;
  });

  expiryInput.addEventListener("input", () => {
    let digits = expiryInput.value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) digits = digits.slice(0, 2) + "/" + digits.slice(2);
    expiryInput.value = digits;
  });

  cvcInput.addEventListener("input", () => {
    cvcInput.value = cvcInput.value.replace(/\D/g, "").slice(0, 4);
  });
}

function renderStep3Review(state) {
  const nights = nightsBetween(state.checkin, state.checkout);
  document.querySelector("[data-review-dates]").textContent =
    state.checkin && state.checkout ? `${formatDate(state.checkin)} to ${formatDate(state.checkout)} · ${nights} nights` : "Not set";
  document.querySelector("[data-review-guests]").textContent = `${state.guests} guest${state.guests > 1 ? "s" : ""}`;
  document.querySelector("[data-review-name]").textContent = state.details.name || "Not set";
  document.querySelector("[data-review-email]").textContent = state.details.email || "Not set";
  document.querySelector("[data-review-phone]").textContent = state.details.phone || "Not set";

  const chosenAddons = ADDONS.filter((a) => state.addons[a.key]);
  document.querySelector("[data-review-addons]").innerHTML = chosenAddons.length
    ? chosenAddons.map((a) => `<li>${a.label}: ${money(a.price)}</li>`).join("")
    : `<li style="color:var(--text-on-light-soft)">No add-ons selected</li>`;
}

/* ---------- shared price computation ---------- */
function computeTotal(state) {
  const nights = nightsBetween(state.checkin, state.checkout);
  const subtotal = nights * state.stay.price;
  const addonsTotal = ADDONS.filter((a) => state.addons[a.key]).reduce((sum, a) => sum + a.price, 0);
  const fee = Math.round(subtotal * SERVICE_FEE_RATE);
  const tax = Math.round((subtotal + addonsTotal) * TAX_RATE);
  const preDiscount = subtotal + addonsTotal + fee + tax;
  const giftDiscount = Math.min(state.giftBalance || 0, preDiscount);
  const total = preDiscount - giftDiscount;
  return { nights, subtotal, addonsTotal, fee, tax, preDiscount, giftDiscount, total };
}

function updateSummaryEverywhere(state) {
  const nights = nightsBetween(state.checkin, state.checkout);
  document.querySelectorAll("[data-summary-dates]").forEach((el) => (el.textContent = state.checkin && state.checkout ? `${formatDate(state.checkin)} – ${formatDate(state.checkout)}` : "Select dates"));
  document.querySelectorAll("[data-summary-guests]").forEach((el) => (el.textContent = `${state.guests} guest${state.guests > 1 ? "s" : ""}`));

  const { subtotal, addonsTotal, fee, tax, giftDiscount, total } = computeTotal(state);
  document.querySelectorAll("[data-price-breakdown]").forEach((el) => {
    if (!nights) {
      el.innerHTML = `<p class="summary-note">Choose your dates to see pricing.</p>`;
      return;
    }
    el.innerHTML = `
      <div class="row"><span>${money(state.stay.price)} × ${nights} night${nights > 1 ? "s" : ""}</span><span>${money(subtotal)}</span></div>
      ${addonsTotal ? `<div class="row"><span>Add-ons</span><span>${money(addonsTotal)}</span></div>` : ""}
      <div class="row"><span>Service fee</span><span>${money(fee)}</span></div>
      <div class="row"><span>Taxes</span><span>${money(tax)}</span></div>
      ${giftDiscount ? `<div class="row" style="color:var(--pine-700,#3a5a40);"><span>Gift card${state.giftCode ? ` (${state.giftCode})` : ""}</span><span>−${money(giftDiscount)}</span></div>` : ""}
      <div class="row total"><span>Total</span><span>${money(total)}</span></div>`;
  });
  document.querySelectorAll("[data-summary-total-mini]").forEach((el) => (el.textContent = nights ? money(total) : "$0"));
  updateGiftPaymentOption(state);

  BookingState.saveDraft({
    slug: state.stay.slug,
    checkin: state.checkin,
    checkout: state.checkout,
    guests: state.guests,
    addons: state.addons,
    details: state.details,
    payment: state.payment,
  });
}

/* ---------- step navigation + validation ---------- */
function validateStep(step, state) {
  if (step === 1) return !!(state.checkin && state.checkout);
  if (step === 2) {
    const form = document.querySelector("[data-details-form]");
    let ok = true;
    [
      { name: "name", test: (v) => v.trim().length > 1 },
      { name: "email", test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
      { name: "phone", test: (v) => v.trim().length > 6 },
    ].forEach(({ name, test }) => {
      const el = form.querySelector(`[name="${name}"]`);
      const valid = test(el.value || "");
      el.closest(".field").classList.toggle("has-error", !valid);
      if (!valid) ok = false;
    });
    return ok;
  }
  if (step === 3) {
    const terms = document.querySelector("[data-terms]");
    const valid = terms.checked;
    terms.closest(".check-row").style.outline = valid ? "none" : "1px solid var(--rust)";
    return valid;
  }
  return true;
}

function goToStep(n, state) {
  state.step = n;
  document.querySelectorAll(".step-panel").forEach((p) => p.classList.toggle("is-active", Number(p.dataset.step) === n));
  updateProgress(state);
  if (n === 3) renderStep3Review(state);
  window.scrollTo({ top: document.querySelector(".progress-rail").offsetTop - 90, behavior: "smooth" });
}

function updateProgress(state) {
  document.querySelectorAll(".p-step").forEach((el) => {
    const n = Number(el.dataset.step);
    el.classList.toggle("is-active", n === state.step);
    el.classList.toggle("is-done", n < state.step);
    const numSpan = el.querySelector(".num span");
    if (numSpan) numSpan.textContent = n;
  });
  const fill = document.querySelector(".progress-line-fill");
  const pct = state.step === 1 ? 0 : state.step === 2 ? 50 : 100;
  fill.style.transform = `scaleX(${pct / 100})`;
  document.querySelectorAll("[data-step-caption]").forEach((el) => (el.textContent = `Step ${state.step} of 3: ${STEP_LABELS[state.step - 1]}`));
}

function bindNav(state) {
  let upsellShown = false; // only interrupt once per visit, not on every attempt to advance
  document.querySelectorAll("[data-next-step]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!validateStep(state.step, state)) {
        showToast("Please fix the highlighted fields");
        return;
      }
      if (state.step === 2 && !upsellShown && !Object.values(state.addons).some(Boolean)) {
        upsellShown = true;
        showUpsellModal(state, () => goToStep(3, state));
        return;
      }
      if (state.step < 3) goToStep(state.step + 1, state);
    })
  );
  document.querySelectorAll("[data-prev-step]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (state.step > 1) goToStep(state.step - 1, state);
    })
  );
  document.querySelector("[data-confirm-booking]").addEventListener("click", (e) => {
    if (!validateStep(3, state)) {
      showToast("Please accept the terms to continue");
      return;
    }
    const btn = e.currentTarget;
    if (btn.disabled) return; // already processing this click — a second click (double-click, or the
    btn.disabled = true;      // page taking a moment to navigate away) must not create a second booking
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirming…';

    const { total, nights, giftDiscount } = computeTotal(state);
    if (state.giftCode && giftDiscount > 0) deductGiftBalance(state.giftCode, giftDiscount);
    const record = BookingState.finalize({
      slug: state.stay.slug,
      name: state.stay.name,
      location: state.stay.location,
      photo: state.stay.images[0],
      checkin: state.checkin,
      checkout: state.checkout,
      nights,
      guests: state.guests,
      addons: Object.keys(state.addons).filter((k) => state.addons[k]),
      details: state.details,
      payment: state.payment,
      giftCode: state.giftCode,
      giftDiscount,
      total,
    });
    location.href = "confirmation.html";
  });
}

document.addEventListener("DOMContentLoaded", initBooking);
