/* ============================================================
   STAYS.JS — the browse/listing page
   ============================================================ */

function initStaysPage() {
  const params = new URLSearchParams(location.search);
  const grid = document.querySelector("[data-stay-grid]");
  const countEl = document.querySelector("[data-results-count]");
  const emptyState = document.querySelector("[data-empty-state]");
  const sortSelect = document.querySelector("[data-sort]");
  const chipButtons = document.querySelectorAll("[data-mood-chip]");
  const searchInput = document.querySelector("[data-search-input]");
  const searchClear = document.querySelector("[data-search-clear]");

  // Restore the last-used filters (e.g. after navigating to a stay and back)
  // so a stray reload doesn't silently reset sort/price/amenities the guest
  // already set up. Anything present in the URL itself always wins, since
  // that reflects an explicit link (e.g. a shared "lakefront stays" URL).
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem("fernhollow_stays_filters")) || {}; } catch { saved = {}; }

  const state = {
    mood: params.get("mood") || saved.mood || "all",
    sort: saved.sort || "recommended",
    guests: 1,
    q: params.get("q") || saved.q || "",
    maxPrice: saved.maxPrice ?? 400,
    minRating: saved.minRating ?? 0,
    minGuests: saved.minGuests ?? 0,
    amenities: saved.amenities || [],
    checkin: saved.checkin ? new Date(saved.checkin) : null,
    checkout: saved.checkout ? new Date(saved.checkout) : null,
    flexible: saved.flexible || false,
  };
  if (searchInput) searchInput.value = state.q;
  if (searchClear) searchClear.hidden = !state.q;

  const datesBtn = document.querySelector("[data-stays-dates]");
  const flexibleCheckbox = document.querySelector("[data-flexible-dates]");
  function paintDatesButton() {
    if (!datesBtn) return;
    datesBtn.textContent = state.checkin && state.checkout
      ? `${formatDate(state.checkin)} – ${formatDate(state.checkout)}`
      : "Any dates";
  }
  paintDatesButton();
  if (flexibleCheckbox) flexibleCheckbox.checked = state.flexible;

  if (datesBtn) {
    attachDatePickerPopover(datesBtn, document.body, {
      minDate: new Date(),
      initialStart: state.checkin,
      initialEnd: state.checkout,
      onChange: ({ start, end }) => {
        state.checkin = start;
        state.checkout = end;
        paintDatesButton();
        render();
      },
      onDone: () => {},
    });
  }
  flexibleCheckbox?.addEventListener("change", () => {
    state.flexible = flexibleCheckbox.checked;
    render();
  });

  chipButtons.forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.moodChip === state.mood));
    chip.addEventListener("click", () => {
      state.mood = chip.dataset.moodChip;
      chipButtons.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      render();
    });
  });

  if (sortSelect) sortSelect.value = state.sort;
  sortSelect?.addEventListener("change", () => {
    state.sort = sortSelect.value;
    render();
  });

  let searchDebounce;
  searchInput?.addEventListener("input", () => {
    state.q = searchInput.value;
    searchClear.hidden = !state.q;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(render, 250);
  });
  searchClear?.addEventListener("click", () => {
    state.q = "";
    searchInput.value = "";
    searchClear.hidden = true;
    render();
  });

  initFilterDrawer(state, render);

  function render() {
    sessionStorage.setItem("fernhollow_stays_filters", JSON.stringify(state));
    let list = STAYS.slice();
    if (state.mood !== "all") list = list.filter((s) => s.moods.includes(state.mood));
    if (state.q.trim()) {
      const q = state.q.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q));
    }
    list = list.filter((s) => s.price <= state.maxPrice);
    if (state.minRating) list = list.filter((s) => s.rating >= state.minRating);
    if (state.minGuests) list = list.filter((s) => s.guests >= state.minGuests);
    if (state.amenities.length) {
      list = list.filter((s) => state.amenities.every((kw) => s.amenities.some((a) => a.toLowerCase().includes(kw))));
    }
    if (state.checkin && state.checkout) {
      let from = state.checkin, to = state.checkout;
      if (state.flexible) {
        from = new Date(from); from.setDate(from.getDate() - 3);
        to = new Date(to); to.setDate(to.getDate() + 3);
      }
      list = list.filter((s) => !s.unavailable.some((block) => from < block.end && to > block.start));
    }

    if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (state.sort === "rating") list.sort((a, b) => b.rating - a.rating);

    countEl.textContent = `${list.length} stay${list.length !== 1 ? "s" : ""} found${state.q.trim() ? ` for "${state.q.trim()}"` : ""}`;

    if (!list.length) {
      grid.innerHTML = "";
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";
    renderStayCards(list, grid);
  }

  renderSkeletonCards(grid, 6);
  setTimeout(render, 380);
  // A currency change doesn't affect which stays match the current
  // filters, so just patch the price text on the cards already on
  // screen instead of re-filtering and rebuilding the whole grid.
  window.__refreshPrices = () => updateCardPrices(grid);
}

function initFilterDrawer(state, render) {
  const drawer = document.querySelector("[data-filter-drawer]");
  if (!drawer) return;
  const openBtn = document.querySelector("[data-open-filters]");
  const closeBtn = document.querySelector("[data-close-filters]");
  const priceSlider = document.querySelector("[data-price-max-slider]");
  const priceLabel = document.querySelector("[data-price-max-label]");
  const countBadge = document.querySelector("[data-filter-count]");
  let release = null;

  function open() {
    drawer.classList.add("is-open");
    release = trapFocus(drawer.querySelector(".filter-drawer-panel"), close);
  }
  function close() {
    drawer.classList.remove("is-open");
    release?.();
    openBtn.focus();
  }
  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  drawer.addEventListener("click", (e) => { if (e.target === drawer) close(); });

  priceSlider?.addEventListener("input", () => {
    priceLabel.textContent = money(Number(priceSlider.value));
  });

  // Reflect any restored filter state (from sessionStorage) in the drawer's
  // own controls — otherwise the drawer would show its HTML defaults even
  // though `state` itself was already restored, and hitting "Apply" without
  // touching anything would silently wipe the restored filters back out.
  if (priceSlider && state.maxPrice !== 400) {
    priceSlider.value = state.maxPrice;
    priceLabel.textContent = money(state.maxPrice);
  }
  if (state.minRating) {
    document.querySelectorAll("[data-rating-filter] button").forEach((b) => b.classList.remove("is-active"));
    document.querySelector(`[data-rating-filter] [data-rating="${state.minRating}"]`)?.classList.add("is-active");
  }
  if (state.minGuests) {
    document.querySelectorAll("[data-guests-filter] button").forEach((b) => b.classList.remove("is-active"));
    document.querySelector(`[data-guests-filter] [data-guests="${state.minGuests}"]`)?.classList.add("is-active");
  }
  if (state.amenities.length) {
    document.querySelectorAll("[data-amenity-filter] input").forEach((i) => {
      i.checked = state.amenities.includes(i.value);
    });
  }
  countActive();

  document.querySelectorAll("[data-rating-filter] button").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-rating-filter] button").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    })
  );
  document.querySelectorAll("[data-guests-filter] button").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-guests-filter] button").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    })
  );

  function countActive() {
    let n = 0;
    if (Number(priceSlider.value) < 400) n++;
    if (document.querySelector("[data-rating-filter] .is-active")?.dataset.rating !== "0") n++;
    if (document.querySelector("[data-guests-filter] .is-active")?.dataset.guests !== "0") n++;
    n += document.querySelectorAll('[data-amenity-filter] input:checked').length;
    if (state.checkin && state.checkout) n++;
    countBadge.textContent = n;
    countBadge.hidden = n === 0;
  }

  document.querySelector("[data-apply-filters]")?.addEventListener("click", () => {
    state.maxPrice = Number(priceSlider.value);
    state.minRating = Number(document.querySelector("[data-rating-filter] .is-active")?.dataset.rating || 0);
    state.minGuests = Number(document.querySelector("[data-guests-filter] .is-active")?.dataset.guests || 0);
    state.amenities = [...document.querySelectorAll('[data-amenity-filter] input:checked')].map((i) => i.value);
    countActive();
    render();
    close();
  });

  document.querySelector("[data-clear-filters]")?.addEventListener("click", () => {
    priceSlider.value = 400;
    priceLabel.textContent = "$400";
    document.querySelectorAll("[data-rating-filter] button, [data-guests-filter] button").forEach((b) => b.classList.remove("is-active"));
    document.querySelector('[data-rating-filter] [data-rating="0"]').classList.add("is-active");
    document.querySelector('[data-guests-filter] [data-guests="0"]').classList.add("is-active");
    document.querySelectorAll('[data-amenity-filter] input').forEach((i) => (i.checked = false));
    state.maxPrice = 400;
    state.minRating = 0;
    state.minGuests = 0;
    state.amenities = [];
    state.checkin = null;
    state.checkout = null;
    state.flexible = false;
    if (flexibleCheckbox) flexibleCheckbox.checked = false;
    paintDatesButton();
    countActive();
    render();
  });
}

document.addEventListener("DOMContentLoaded", initStaysPage);
