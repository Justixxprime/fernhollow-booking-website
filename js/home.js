/* ============================================================
   HOME.JS
   ============================================================ */

function renderRecentlyViewed() {
  const slugs = RecentlyViewed.get();
  const section = document.querySelector("[data-recently-viewed-section]");
  if (!section || !slugs.length) return;
  const list = slugs.map((s) => getStay(s)).filter(Boolean);
  if (!list.length) return;
  section.hidden = false;
  renderStayCards(list, document.querySelector("[data-recently-viewed-grid]"));
}

function renderRecommendations() {
  const saved = SavedStays.get();
  const section = document.querySelector("[data-recs-section]");
  if (!section || !saved.length) return;
  const base = getStay(saved[0]);
  if (!base) return;
  const recs = STAYS.filter((s) => s.slug !== base.slug && s.moods.some((m) => base.moods.includes(m))).slice(0, 3);
  if (!recs.length) return;
  section.hidden = false;
  document.querySelector("[data-recs-based-on]").textContent = base.name;
  renderStayCards(recs, document.querySelector("[data-recs-grid]"));
}

function initHome() {
  const featuredMount = document.querySelector("[data-featured-grid]");
  if (featuredMount) renderSkeletonCards(featuredMount, 3);
  setTimeout(renderFeatured, 380);
  renderMoodTiles();
  renderRecentlyViewed();
  renderRecommendations();
  initHeroSearch();
  initHomeMoodChips();
  // Same reasoning as stays.js: a currency change never changes which
  // cards are showing (featured, recently viewed, or recommendations),
  // so just patch the price text everywhere on the page instead of
  // rebuilding those card grids and flashing every photo.
  window.__refreshPrices = () => updateCardPrices();
}

function renderFeatured(mood) {
  const mount = document.querySelector("[data-featured-grid]");
  if (!mount) return;
  let list;
  if (!mood || mood === "all") {
    const featured = STAYS.filter((s) => s.badge).slice(0, 3);
    list = featured.length >= 3 ? featured : STAYS.slice(0, 3);
  } else {
    list = STAYS.filter((s) => s.moods.includes(mood)).slice(0, 6);
  }
  renderStayCards(list, mount);
}

function initHomeMoodChips() {
  const chips = document.querySelectorAll("[data-home-mood-chip]");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      renderFeatured(chip.dataset.homeMoodChip);
    });
  });
}

function renderMoodTiles() {
  const mount = document.querySelector("[data-mood-grid]");
  if (!mount) return;
  mount.innerHTML = MOODS.map(
    (m) => `
    <a class="mood-tile" href="stays.html?mood=${m.key}">
      <img src="${m.image}" alt="${m.label} stays" loading="lazy">
      <span class="label"><b>${m.label}</b><span>Browse stays</span></span>
    </a>`
  ).join("");
}

function initHeroSearch() {
  const trigger = document.querySelector("[data-hero-dates]");
  const guestsBtn = document.querySelector("[data-hero-guests]");
  const whereInput = document.querySelector("#hero-where");
  if (!trigger) return;

  const state = { start: null, end: null, guests: 2 };

  attachDatePickerPopover(trigger, trigger.closest(".search-widget"), {
    unavailable: [],
    minDate: new Date(),
    onChange: ({ start, end }) => {
      state.start = start;
      state.end = end;
      trigger.textContent = start && end ? `${formatDate(start)} to ${formatDate(end)}` : start ? "Pick checkout" : "Add dates";
    },
  });

  guestsBtn?.addEventListener("click", () => {
    state.guests = state.guests >= 8 ? 1 : state.guests + 1;
    guestsBtn.textContent = `${state.guests} guest${state.guests > 1 ? "s" : ""}`;
  });

  // live search-as-you-type on "Where": suggests matching stays by name
  // or location, and lets you jump straight to one without hitting Search
  if (whereInput) {
    const field = whereInput.closest(".search-field");
    field.style.position = "relative";
    const dropdown = document.createElement("div");
    dropdown.className = "search-suggest";
    field.appendChild(dropdown);

    const closeDropdown = () => (dropdown.innerHTML = "");
    whereInput.addEventListener("focus", () => {
      if (whereInput.value.trim() && whereInput.value.trim() !== "Anywhere") renderSuggestions(whereInput.value);
    });
    whereInput.addEventListener("input", () => renderSuggestions(whereInput.value));
    document.addEventListener("click", (e) => {
      if (!field.contains(e.target)) closeDropdown();
    });

    function renderSuggestions(query) {
      const q = query.trim().toLowerCase();
      if (!q || q === "anywhere") return closeDropdown();
      const matches = STAYS.filter((s) => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)).slice(0, 5);
      if (!matches.length) {
        dropdown.innerHTML = `<div class="search-suggest-empty">No stays match "${query}"</div>`;
        return;
      }
      dropdown.innerHTML = matches
        .map(
          (s) => `
        <button type="button" class="search-suggest-item" data-suggest-slug="${s.slug}">
          <img src="${s.images[0]}" alt="">
          <span><b>${s.name}</b><span>${s.location}</span></span>
        </button>`
        )
        .join("");
      dropdown.querySelectorAll("[data-suggest-slug]").forEach((btn) =>
        btn.addEventListener("click", () => {
          tagOutgoingImage(btn.dataset.suggestSlug);
          location.href = `stay-detail.html?stay=${btn.dataset.suggestSlug}`;
        })
      );
    }
  }

  document.querySelector("[data-hero-search-submit]")?.addEventListener("click", (e) => {
    e.preventDefault();
    const q = whereInput?.value?.trim();
    const params = new URLSearchParams();
    if (q && q.toLowerCase() !== "anywhere") params.set("q", q);
    location.href = params.toString() ? `stays.html?${params}` : "stays.html";
  });
}

const TESTIMONIALS = [
  { name: "Priya", stay: "Birch Hollow A-Frame", quote: "The stove alone is worth the drive. We didn't want to leave, and the trailhead really is a ten minute walk." },
  { name: "Han", stay: "Lantern Lake Cabin", quote: "The hot tub on the dock at 6am with coffee is a top five life experience at this point." },
  { name: "Grace", stay: "Cinder Peak Lodge", quote: "Booked for a 30th birthday with ten of us. The great room fit everyone with room to spare." },
  { name: "Iris", stay: "Sierra Hollow Chalet", quote: "So new it still smells like cedar. The stargazing deck is the reason to book this one." },
  { name: "Callum", stay: "Quiet Pines Cottage", quote: "Unfussy and exactly what we needed. The porch swing is doing a lot of emotional labour for this listing, deservedly." },
];

function initTestimonials() {
  const quoteEl = document.querySelector("[data-testi-quote]");
  if (!quoteEl) return;
  const whoEl = document.querySelector("[data-testi-who]");
  const avatarWrap = document.querySelector("[data-testi-avatars]");
  let index = 0;
  let timer = null;

  avatarWrap.innerHTML = TESTIMONIALS.map((t, i) => `<button class="testi-avatar-btn" data-testi-index="${i}" aria-label="${t.name}'s review">${t.name[0]}</button>`).join("");
  const avatarBtns = [...avatarWrap.querySelectorAll("[data-testi-index]")];

  function render() {
    const t = TESTIMONIALS[index];
    quoteEl.classList.remove("is-visible");
    setTimeout(() => {
      quoteEl.textContent = `"${t.quote}"`;
      whoEl.innerHTML = `<b>${t.name}</b> &nbsp;·&nbsp; Stayed at ${t.stay}`;
      quoteEl.classList.add("is-visible");
    }, 120);
    avatarBtns.forEach((b, i) => b.classList.toggle("is-active", i === index));
  }

  function go(i) {
    index = (i + TESTIMONIALS.length) % TESTIMONIALS.length;
    render();
    restart();
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => go(index + 1), 6000);
  }

  document.querySelector("[data-testi-prev]").addEventListener("click", () => go(index - 1));
  document.querySelector("[data-testi-next]").addEventListener("click", () => go(index + 1));
  avatarBtns.forEach((btn) => btn.addEventListener("click", () => go(Number(btn.dataset.testiIndex))));

  render();
  restart();
}

/* Reuses the same BLOG_POSTS data and blog-card markup as blog.html,
   just capped to 3 posts for the homepage teaser. */
function renderHomeBlogTeaser() {
  const mount = document.querySelector("[data-home-blog-teaser]");
  if (!mount || typeof BLOG_POSTS === "undefined") return;
  mount.innerHTML = BLOG_POSTS.slice(0, 3)
    .map(
      (p) => `
    <a class="blog-card" href="blog-post.html?post=${p.slug}">
      <img src="${p.image}" alt="${p.title}" loading="lazy">
      <div class="blog-card-body">
        <div class="blog-card-tags">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
        <div class="blog-card-meta">
          <span><i class="fa-regular fa-calendar"></i> ${p.date}</span>
          <span><i class="fa-regular fa-clock"></i> ${p.readMins} min read</span>
        </div>
      </div>
    </a>`
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", initHome);
document.addEventListener("DOMContentLoaded", renderHomeBlogTeaser);
document.addEventListener("DOMContentLoaded", initTestimonials);
