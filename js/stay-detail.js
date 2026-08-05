/* ============================================================
   STAY-DETAIL.JS
   Reads ?stay=<slug> from the URL, finds the matching record in
   data.js, and renders: breadcrumb, gallery, facts, amenities,
   sleeping arrangements, reviews, host card, map, related stays,
   and the sticky booking summary (desktop) / bottom bar (mobile).
   ============================================================ */

const ICON = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>`,
  clean: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4l16 16M9 4h11v11"/></svg>`,
  key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="15" r="4"/><path d="M10.6 12.4L20 3M16 7l3 3M18 5l3 3"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
  bed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18v2M21 18v2M3 12V7a1 1 0 011-1h6v6"/></svg>`,
  bath: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3zM7 12V6a2 2 0 012-2h1M4 19v2M18 19v2"/></svg>`,
  sofa: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 13V9a2 2 0 012-2h12a2 2 0 012 2v4M3 13h18v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM5 18v2M19 18v2"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6L22 9.6l-5 4.9 1.2 7-6.2-3.5L5.8 21.5 7 14.5l-5-4.9 7.1-1z"/></svg>`,
  paw: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="9" r="2"/><path d="M12 12c-3 0-6 2.4-6 5.4 0 1.9 1.6 2.6 3 2 1-.4 2-.6 3-.6s2 .2 3 .6c1.4.6 3-.1 3-2 0-3-3-5.4-6-5.4z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`,
};

function renderStructuredData(stay) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: stay.name,
    description: stay.blurb,
    image: stay.images,
    address: { "@type": "PostalAddress", addressLocality: stay.location },
    starRating: { "@type": "Rating", ratingValue: stay.rating },
    aggregateRating: { "@type": "AggregateRating", ratingValue: stay.rating, reviewCount: stay.reviews },
    priceRange: `$${stay.price}`,
    amenityFeature: stay.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })),
  };
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(ld);
  document.head.appendChild(el);
}

function initStayDetail() {
  const params = new URLSearchParams(location.search);
  const stay = getStay(params.get("stay")) || STAYS[0];
  document.title = `${stay.name}: Fernhollow`;

  renderBreadcrumb(stay);
  renderStructuredData(stay);
  renderMetaTags(stay);
  RecentlyViewed.add(stay.slug);
  renderTrustLine(stay);
  initShareButton(stay);
  initAddToTrip(stay);
  renderGallery(stay);
  renderHeader(stay);
  renderFacts(stay);
  renderSpace(stay);
  renderSleeping(stay);
  renderAmenities(stay);
  renderPolicies(stay);
  renderMap(stay);
  renderNearby(stay);
  renderReviews(stay);
  initReviewForm(stay);
  renderRelated(stay, true);
  const summary = initSummary(stay);
  renderAvailabilityPreview(stay, summary);
  renderPriceSparkline(stay);
  initWaitlistForm(stay);
}

/* Updates <title> and the og:/twitter: meta tags with this specific
   stay's real photo, name, and location — previously every stay page
   shared the same generic image and blurb for social sharing, so a
   link to any stay looked identical when posted anywhere. */
function renderMetaTags(stay) {
  const desc = `${stay.blurb} ${stay.location} · ${money(stay.price)}/night · ★ ${stay.rating}`;
  const url = `https://fernhollow.example/stay-detail.html?stay=${stay.slug}`;
  const image = stay.images[0];

  document.querySelectorAll("[data-meta-title],[data-meta-title-tw]").forEach((el) => el.setAttribute("content", `${stay.name}: Fernhollow`));
  document.querySelectorAll("[data-meta-desc],[data-meta-desc-tw]").forEach((el) => el.setAttribute("content", desc));
  document.querySelectorAll("[data-meta-image],[data-meta-image-tw]").forEach((el) => el.setAttribute("content", image));
  document.querySelector("[data-meta-url]")?.setAttribute("content", url);
}

function renderBreadcrumb(stay) {
  document.querySelector("[data-breadcrumb]").innerHTML = `
    <a href="index.html">Home</a><span>/</span>
    <a href="stays.html">Stays</a><span>/</span>
    <span>${stay.name}</span>`;
  renderBreadcrumbSchema();
}

function renderGallery(stay) {
  const desktop = document.querySelector("[data-gallery-desktop]");
  const mobile = document.querySelector("[data-gallery-mobile]");
  const strip = document.querySelector("[data-gallery-strip]");
  const [main, ...rest] = stay.images;

  const sideImages = [0, 1, 2, 3].map((i) => rest[i] || main);
  desktop.innerHTML = `
    <button class="main-shot" data-open-lightbox="0" aria-label="Open photo gallery">
      <img src="${main}" alt="${stay.name}, main photo" data-stay-image="${stay.slug}">
    </button>
    <div class="side-shots">
      ${sideImages
        .map((src, i) => {
          const isLast = i === sideImages.length - 1;
          return `<div>
            <button data-open-lightbox="${i + 1}" style="all:unset;cursor:pointer;display:block;width:100%;height:100%;">
              <img src="${src}" alt="${stay.name}, photo ${i + 2}">
            </button>
            ${isLast ? `<span class="gallery-all-btn" data-open-lightbox="0" style="pointer-events:none;"><i class="fa-solid fa-images"></i> ${stay.images.length} photos</span>` : ""}
          </div>`;
        })
        .join("")}
    </div>`;

  mobile.innerHTML = stay.images
    .map((src, i) => `<button class="m-gallery-shot" data-open-lightbox="${i}" style="all:unset;cursor:pointer;flex:0 0 100%;scroll-snap-align:start;"><img src="${src}" alt="${stay.name}, photo ${i + 1}"></button>`)
    .join("");

  strip.innerHTML = stay.images
    .map((src, i) => `<img src="${src}" class="${i === 0 ? "active" : ""}" data-strip-thumb="${i}" alt="thumbnail ${i + 1}">`)
    .join("");
  strip.querySelectorAll("[data-strip-thumb]").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const i = Number(thumb.dataset.stripThumb);
      // update whichever view is actually visible: desktop main photo,
      // or the mobile swipe strip (this used to only touch the desktop
      // image, so tapping a thumbnail on mobile silently did nothing)
      const mainImg = desktop.querySelector(".main-shot img");
      if (mainImg) mainImg.src = stay.images[i];
      const mobileSlide = mobile.children[i];
      if (mobileSlide) mobile.scrollTo({ left: mobileSlide.offsetLeft, behavior: "smooth" });
      strip.querySelectorAll("img").forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  if ("startViewTransition" in document) {
    const mainImg = desktop.querySelector(".main-shot img");
    if (mainImg) mainImg.style.viewTransitionName = `stay-photo-${stay.slug}`;
  }

  // let a mouse click-and-drag scroll the mobile strip too (touch already
  // scrolls natively); guard the lightbox-open click so the end of a drag
  // doesn't also pop the lightbox open
  makeSwipeable(mobile);
  [...desktop.querySelectorAll("[data-open-lightbox]"), ...mobile.querySelectorAll("[data-open-lightbox]")].forEach((el) => {
    el.addEventListener("click", (e) => {
      if (isDragClick(mobile)) return;
      e.preventDefault();
      openLightbox(stay.images, Number(el.dataset.openLightbox), stay.name);
    });
  });

  // keep the thumbnail strip in sync when the guest swipes the mobile
  // gallery by hand instead of tapping a thumbnail
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = [...mobile.children].indexOf(entry.target);
          strip.querySelectorAll("img").forEach((t, ti) => t.classList.toggle("active", ti === i));
        });
      },
      { root: mobile, threshold: 0.6 }
    );
    [...mobile.children].forEach((c) => io.observe(c));
  }
}

function renderHeader(stay) {
  document.querySelector("[data-stay-name]").textContent = stay.name;
  document.querySelector("[data-stay-loc]").textContent = stay.location;
  document.querySelector("[data-stay-rating]").innerHTML = `${ICON.star} ${stay.rating} <span style="font-weight:400;color:var(--text-on-light-soft)">(${stay.reviews} reviews)</span>`;
  document.querySelector("[data-stay-quickfacts]").textContent = `${stay.guests} guests · ${stay.bedrooms} bedrooms · ${stay.beds} beds · ${stay.baths} baths`;
}

// A deterministic, honest "X people looked at this today" line: seeded
// from the stay's slug plus today's date, so it's stable for anyone
// looking at the same stay on the same day rather than randomly jittering
// on every reload (which would just look broken).
function renderTrustLine(stay) {
  const el = document.querySelector("[data-trust-line]");
  if (!el) return;
  const seedStr = stay.slug + new Date().toDateString();
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const viewers = 3 + (seed % 14);
  const bookedThisWeek = 1 + (seed % 6);
  el.innerHTML = `<i class="fa-solid fa-eye" style="color:var(--brass-dark);margin-right:6px;"></i>${viewers} people looked at this today, and it's been booked ${bookedThisWeek} time${bookedThisWeek > 1 ? "s" : ""} this week.`;
}

function initAddToTrip(stay) {
  const btn = document.querySelector("[data-add-to-trip]");
  if (!btn) return;

  function paint() {
    const on = TripPlanner.has(stay.slug);
    btn.classList.toggle("is-active", on);
    btn.innerHTML = on ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-suitcase-rolling"></i>';
    btn.setAttribute("aria-label", on ? "Added to trip planner" : "Add to trip planner");
  }
  paint();

  btn.addEventListener("click", () => {
    if (TripPlanner.has(stay.slug)) {
      TripPlanner.remove(stay.slug);
      showToast("Removed from your trip");
    } else {
      TripPlanner.add(stay.slug, null, null);
      showToast("Added to your trip", () => (location.href = "trip.html"), "View trip");
    }
    paint();
  });
}

function initShareButton(stay) {
  const btn = document.querySelector("[data-share-stay]");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}?stay=${stay.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: stay.name, text: stay.blurb, url });
      } catch {
        /* share cancelled, nothing to do */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard");
    } catch {
      showToast("Couldn't copy, here's the link: " + url);
    }
  });
}

function renderFacts(stay) {
  document.querySelector("[data-facts]").innerHTML = `
    <div class="fact">${ICON.home}<div><b>Entire cabin</b><span>You'll have ${stay.name} to yourselves, no shared spaces.</span></div></div>
    <div class="fact">${ICON.clean}<div><b>Enhanced clean</b><span>Every stay follows our 5-step turnover checklist between guests.</span></div></div>
    <div class="fact">${ICON.key}<div><b>Self check-in</b><span>Lockbox code sent the morning of arrival, no need to meet anyone.</span></div></div>
    <div class="fact">${ICON.cal}<div><b>Free cancellation</b><span>Full refund up to 5 days before check-in.</span></div></div>`;
  document.querySelector("[data-space-blurb]").innerHTML = stay.description.map((p) => `<p style="margin-bottom:12px;">${p}</p>`).join("");
}

function renderSpace(stay) {
  document.querySelector("[data-the-space]").textContent = stay.theSpace;
  document.querySelector("[data-guest-access]").textContent = stay.guestAccess;
  document.querySelector("[data-host-name]").textContent = stay.host.name;
  document.querySelector("[data-host-meta]").textContent = `Hosting since ${stay.host.since} · responds ${stay.host.responseTime}`;
}

function renderSleeping(stay) {
  const icons = [ICON.bed, ICON.bed, ICON.sofa, ICON.bed];
  document.querySelector("[data-sleeping]").innerHTML = stay.sleeping
    .map((s, i) => `<div class="arrangement-card">${icons[i % icons.length]}<b>${s.label}</b><span>${s.detail}</span></div>`)
    .join("");
}

/* Maps an amenity's own wording to a specific Font Awesome icon and a
   category, using keyword matching against the plain-text amenity list
   in data.js — richer than one generic checkmark for every single item. */
const AMENITY_ICONS = [
  [/wifi/i, "fa-wifi"],
  [/stove|fireplace/i, "fa-fire"],
  [/hot tub/i, "fa-hot-tub-person"],
  [/sauna/i, "fa-spa"],
  [/kitchen/i, "fa-kitchen-set"],
  [/parking/i, "fa-square-parking"],
  [/washer|dryer/i, "fa-shirt"],
  [/heating/i, "fa-temperature-high"],
  [/deck|porch/i, "fa-tree"],
  [/board game/i, "fa-dice"],
  [/first aid/i, "fa-suitcase-medical"],
  [/outdoor shower/i, "fa-shower"],
  [/fire pit/i, "fa-fire-flame-curved"],
  [/espresso|coffee/i, "fa-mug-hot"],
  [/hammock/i, "fa-person-falling"],
  [/trail/i, "fa-person-hiking"],
  [/hot water/i, "fa-droplet"],
  [/smoke alarm/i, "fa-triangle-exclamation"],
  [/hangers/i, "fa-shirt"],
  [/iron/i, "fa-shirt"],
  [/dog|pet/i, "fa-paw"],
  [/dock/i, "fa-anchor"],
  [/canoe|rowboat|kayak/i, "fa-ship"],
  [/life jacket/i, "fa-life-ring"],
  [/bbq|grill/i, "fa-fire-burner"],
  [/tv/i, "fa-tv"],
  [/creek|lake|water view/i, "fa-water"],
  [/snowshoe/i, "fa-mitten"],
  [/stargazing|deck/i, "fa-star"],
  [/books/i, "fa-book"],
];
const AMENITY_CATEGORIES = [
  { label: "Comfort", test: /stove|fireplace|hot tub|sauna|heating|hot water|tv|board game|books/i },
  { label: "Kitchen", test: /kitchen|espresso|coffee|bbq|grill/i },
  { label: "Outdoors", test: /deck|porch|fire pit|dock|canoe|rowboat|kayak|hammock|trail|creek|lake|snowshoe|outdoor shower|stargazing/i },
  { label: "Practical", test: /wifi|parking|washer|dryer|first aid|smoke alarm|hangers|iron|life jacket/i },
];
function amenityIcon(label) {
  const match = AMENITY_ICONS.find(([re]) => re.test(label));
  return match ? match[1] : "fa-circle-check";
}
function amenityCategory(label) {
  const match = AMENITY_CATEGORIES.find((c) => c.test.test(label));
  return match ? match.label : "More";
}

function renderAmenities(stay) {
  const wrap = document.querySelector("[data-amenities]");
  const groupItems = (list) => {
    const groups = {};
    list.forEach((a) => {
      const cat = amenityCategory(a);
      (groups[cat] = groups[cat] || []).push(a);
    });
    return groups;
  };
  const itemHTML = (a) => `<div class="amenity-item"><i class="fa-solid ${amenityIcon(a)}"></i>${a}</div>`;

  const showSome = () => {
    wrap.innerHTML = stay.amenities.slice(0, 8).map(itemHTML).join("");
  };
  const showAll = () => {
    const groups = groupItems(stay.amenities);
    wrap.innerHTML = Object.entries(groups)
      .map(([cat, items]) => `
        <div class="amenity-group">
          <h4 class="amenity-group-title">${cat}</h4>
          <div class="amenity-group-items">${items.map(itemHTML).join("")}</div>
        </div>`)
      .join("");
    wrap.classList.add("is-grouped");
  };
  showSome();
  const btn = document.querySelector("[data-show-all-amenities]");
  btn.innerHTML = `<i class="fa-solid fa-list"></i> Show all ${stay.amenities.length} amenities`;
  btn.addEventListener("click", () => {
    showAll();
    btn.style.display = "none";
  });
}

function renderPolicies(stay) {
  const r = stay.rules;
  document.querySelector("[data-policies]").innerHTML = `
    ${r.pets ? `<div class="pet-banner"><i class="fa-solid fa-paw"></i> This stay welcomes dogs, up to 2 per booking, just say so in special requests.</div>` : ""}
    <div class="fact-row" style="margin-bottom:18px;">
      <div class="fact"><i class="fa-solid fa-door-open" style="font-size:22px;color:var(--brass-dark);"></i><div><b>Check-in after</b><span>${r.checkIn}</span></div></div>
      <div class="fact"><i class="fa-solid fa-door-closed" style="font-size:22px;color:var(--brass-dark);"></i><div><b>Check-out before</b><span>${r.checkOut}</span></div></div>
    </div>
    <ul style="display:flex;flex-wrap:wrap;gap:10px;">
      <li class="chip">${r.pets ? '<i class="fa-solid fa-paw"></i> Pets allowed' : '<i class="fa-solid fa-ban"></i> No pets'}</li>
      <li class="chip">${r.smoking ? '<i class="fa-solid fa-smoking"></i> Smoking allowed' : '<i class="fa-solid fa-smoking-ban"></i> No smoking'}</li>
      <li class="chip">${r.events ? '<i class="fa-solid fa-champagne-glasses"></i> Events allowed' : '<i class="fa-solid fa-ban"></i> No events'}</li>
      <li class="chip"><i class="fa-solid fa-user-group"></i> Max ${r.maxGuests} guests</li>
      <li class="chip"><i class="fa-solid fa-id-card"></i> Min age ${r.minAge}</li>
    </ul>`;
}

function renderMap(stay) {
  const mount = document.querySelector("[data-map]");
  if (!mount || typeof L === "undefined") return;
  const [lat, lng] = stay.coords.split(",").map(Number);
  const map = L.map(mount, { scrollWheelZoom: false }).setView([lat, lng], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 14,
  }).addTo(map);
  L.circle([lat, lng], { radius: 4000, color: "#9C7B3E", fillColor: "#C6A15B", fillOpacity: 0.18, weight: 2 }).addTo(map)
    .bindPopup(`<b>${stay.name}</b><br><span style="font-size:.8rem;color:var(--text-on-light-soft);">${stay.location}</span><br><span style="font-size:.76rem;">Exact address is shared after booking.</span>`);
}

/* Curated "things to do" for the stay's region, pulled from the
   THINGS_TO_DO map in data.js. Editorial content, not a live feed —
   labelled as such in the heading. */
function renderNearby(stay) {
  const mount = document.querySelector("[data-nearby]");
  if (!mount) return;
  const region = stay.location.split(",")[0].trim();
  const ideas = THINGS_TO_DO[region];
  if (!ideas || !ideas.length) { mount.innerHTML = ""; return; }

  mount.innerHTML = `
    <h4 style="font-size:1rem;margin-bottom:4px;">Things to do nearby</h4>
    <p style="font-size:.8rem;color:var(--text-on-light-soft);margin-bottom:14px;">Editor's picks for the ${region} area, not a live listings feed.</p>
    <div style="display:grid;gap:14px;">
      ${ideas.map((idea) => `
        <div style="display:flex;gap:14px;align-items:flex-start;">
          <div style="width:36px;height:36px;flex:none;border-radius:50%;background:var(--parchment-soft);display:flex;align-items:center;justify-content:center;color:var(--brass-dark);">
            <i class="fa-solid ${idea.icon}"></i>
          </div>
          <div>
            <b style="font-size:.92rem;">${idea.title}</b>
            <p style="font-size:.85rem;color:var(--text-on-light-soft);margin-top:2px;">${idea.text}</p>
          </div>
        </div>`).join("")}
    </div>`;
}

/* Reuses the same day-grid markup/CSS as the interactive DatePicker,
   but with no click handlers, purely to show at a glance which
   nights are already booked over the next two months. */
/* A real, clickable calendar (not just a preview) — shares the exact same
   state object as the sticky summary card, so picking dates here updates
   the price and Reserve button too, and vice versa. */
function renderAvailabilityPreview(stay, summary) {
  const mount = document.querySelector("[data-availability-preview]");
  if (!mount) return;

  new DatePicker(mount, {
    ...summary.sharedDatePickerOptions(),
    onDone: undefined, // no popover to close, this calendar just stays open inline
  });

  document.querySelector("[data-jump-to-dates]")?.addEventListener("click", () => {
    const target = document.querySelector(".summary-card") || document.querySelector(".summary-bar-mobile");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

/* Small deterministic hash, matches the pattern used by renderTrustLine,
   so the same stay always gets the same "random" numbers instead of
   different ones on every reload. */
function seedFrom(str) {
  let seed = 0;
  for (let i = 0; i < str.length; i++) seed = (seed * 31 + str.charCodeAt(i)) >>> 0;
  return seed;
}

/* Reviews typed in on this device, kept separate from the shipped demo
   data so they survive page reloads without ever touching a server —
   see the note printed under the review form itself. */
const LocalReviews = {
  key: "fernhollow_local_reviews",
  all() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch { return {}; }
  },
  forStay(slug) {
    return this.all()[slug] || [];
  },
  add(slug, review) {
    const data = this.all();
    data[slug] = [review, ...(data[slug] || [])];
    localStorage.setItem(this.key, JSON.stringify(data));
  },
};

function getAllReviews(stay) {
  return [...LocalReviews.forStay(stay.slug), ...stay.reviewsList];
}

function renderReviews(stay) {
  const all = getAllReviews(stay);
  const localCount = LocalReviews.forStay(stay.slug).length;
  document.querySelector("[data-reviews-count]").textContent =
    `${stay.rating} · ${stay.reviews + localCount} reviews`;
  document.querySelector("[data-reviews]").innerHTML = all
    .map(
      (r) => `
    <div class="review-card">
      <div class="review-head">
        <div class="review-avatar">${r.name[0]}</div>
        <div><div class="review-name">${r.name}</div><div class="review-date">${r.date}</div></div>
      </div>
      ${r.rating ? `<div style="color:var(--brass-dark);font-size:.78rem;margin:2px 0 6px;">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>` : ""}
      <p>${r.text}</p>
      ${r.photo ? `<img src="${r.photo}" alt="Photo from ${r.name}'s review" style="width:100%;max-width:220px;border-radius:10px;margin-top:10px;object-fit:cover;">` : ""}
    </div>`
    )
    .join("");

  renderRatingBreakdown(stay);
}

/* Category sub-scores aren't in the demo data individually, so they're
   derived deterministically from the stay's overall rating (same seed
   pattern as the trust line) rather than left out entirely. Real data
   would replace this function's body with actual per-category averages. */
function renderRatingBreakdown(stay) {
  const mount = document.querySelector("[data-rating-breakdown]");
  if (!mount) return;
  const seed = seedFrom(stay.slug);
  const categories = ["Cleanliness", "Location", "Value", "Accuracy"];
  const rows = categories.map((label, i) => {
    const wobble = ((seed >> (i * 4)) % 7) / 10 - 0.3; // -0.3..+0.3
    const score = Math.max(3.8, Math.min(5, stay.rating + wobble));
    const pct = ((score - 3) / 2) * 100; // scale 3-5 stars across the bar width
    return `
      <div style="display:grid;grid-template-columns:100px 1fr 34px;align-items:center;gap:10px;margin-bottom:8px;font-size:.82rem;">
        <span style="color:var(--text-on-light-soft);">${label}</span>
        <span style="height:6px;border-radius:4px;background:var(--parchment-line);overflow:hidden;">
          <span style="display:block;height:100%;width:${pct.toFixed(0)}%;background:var(--brass);"></span>
        </span>
        <span style="font-weight:700;">${score.toFixed(1)}</span>
      </div>`;
  }).join("");
  mount.innerHTML = rows;
}

function initReviewForm(stay) {
  const toggleBtn = document.querySelector("[data-toggle-review-form]");
  const form = document.querySelector("[data-review-form]");
  if (!toggleBtn || !form) return;

  toggleBtn.addEventListener("click", () => {
    const nowHidden = !form.hidden;
    form.hidden = nowHidden;
    toggleBtn.setAttribute("aria-expanded", String(!nowHidden));
    if (!form.hidden) document.getElementById("review-name")?.focus();
  });

  const stars = [...form.querySelectorAll("[data-star-picker] [data-star]")];
  const starValue = form.querySelector("[data-star-value]");
  function paintStars(n) {
    stars.forEach((s) => s.style.color = Number(s.dataset.star) <= n ? "var(--brass)" : "var(--parchment-line)");
  }
  stars.forEach((s) =>
    s.addEventListener("click", () => {
      starValue.value = s.dataset.star;
      paintStars(Number(s.dataset.star));
    })
  );

  const photoInput = document.getElementById("review-photo");
  const photoPreview = form.querySelector("[data-review-photo-preview]");
  let photoDataUrl = null;

  photoInput?.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("That file isn't an image");
      photoInput.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Photo's too large, please pick one under 2MB");
      photoInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      photoDataUrl = reader.result;
      photoPreview.querySelector("img").src = photoDataUrl;
      photoPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
  form.querySelector("[data-review-photo-remove]")?.addEventListener("click", () => {
    photoDataUrl = null;
    photoInput.value = "";
    photoPreview.style.display = "none";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const errorEl = form.querySelector("[data-review-error]");
    const name = document.getElementById("review-name").value.trim();
    const text = document.getElementById("review-text").value.trim();
    const rating = Number(starValue.value);

    if (!name || !text || !rating) {
      errorEl.textContent = "Please add your name, a rating, and a few words before posting.";
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;

    LocalReviews.add(stay.slug, { name, text, rating, date: "Just now", photo: photoDataUrl });
    renderReviews(stay);
    form.reset();
    starValue.value = "0";
    paintStars(0);
    photoDataUrl = null;
    photoPreview.style.display = "none";
    form.hidden = true;
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.focus();
  });
}

/* A simple inline SVG sparkline. Points are a seeded pseudo-random walk
   that ends at the stay's real current price, clearly labelled in the
   markup as illustrative demo data rather than a live pricing feed. */
function renderPriceSparkline(stay) {
  const mount = document.querySelector("[data-price-sparkline]");
  if (!mount) return;
  const seed = seedFrom(stay.slug + "-price");
  const weeks = 12;
  const points = [];
  let value = stay.price * (0.9 + ((seed % 10) / 100));
  for (let i = 0; i < weeks; i++) {
    const step = (((seed >> (i % 24)) % 21) - 10) / 100; // -10%..+10% wobble per week
    value = value * (1 + step * 0.3);
    points.push(value);
  }
  points[weeks - 1] = stay.price; // always end on the real current price

  const w = 320, h = 70, pad = 6;
  const min = Math.min(...points), max = Math.max(...points);
  const range = Math.max(1, max - min);
  const coords = points.map((p, i) => {
    const x = pad + (i / (weeks - 1)) * (w - pad * 2);
    const y = h - pad - ((p - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1];

  mount.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="Illustrative price trend over the last 12 weeks, ending at today's price of ${money(stay.price)}">
      <path d="${path}" fill="none" stroke="var(--brass)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${lastX}" cy="${lastY}" r="4" fill="var(--brass-dark)"/>
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:.76rem;color:var(--text-on-light-soft);margin-top:2px;">
      <span>12 weeks ago</span><span>Today: ${money(stay.price)}/night</span>
    </div>`;
}

function initWaitlistForm(stay) {
  const form = document.querySelector("[data-waitlist-form]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("waitlist-email").value.trim();
    if (!email) return;
    const key = "fernhollow_waitlist";
    let list = [];
    try { list = JSON.parse(localStorage.getItem(key)) || []; } catch { list = []; }
    list.push({ slug: stay.slug, email, date: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list));
    const confirm = form.parentElement.querySelector("[data-waitlist-confirm]");
    confirm.textContent = `You're on the list for ${stay.name}. We'll use this browser to remember it (demo only, no real emails are sent).`;
    confirm.hidden = false;
    form.reset();
  });
}

function renderRelated(stay, withSkeleton) {
  const others = STAYS.filter((s) => s.slug !== stay.slug).slice(0, 3);
  const mount = document.querySelector("[data-related]");
  if (!mount) return;
  if (withSkeleton) {
    renderSkeletonCards(mount, 3);
    setTimeout(() => renderStayCards(others, mount), 380);
  } else {
    renderStayCards(others, mount);
  }
}

/* ---------- sticky booking summary + mobile bar ---------- */
function initSummary(stay) {
  const draft = BookingState.getDraft();
  const state = {
    checkin: draft && draft.slug === stay.slug ? draft.checkin : null,
    checkout: draft && draft.slug === stay.slug ? draft.checkout : null,
    guests: draft && draft.slug === stay.slug ? draft.guests || 1 : 1,
  };
  let splitCount = null; // null until dates are picked, then defaults to guest count

  document.querySelectorAll("[data-summary-rating]").forEach((el) => (el.innerHTML = `${ICON.star} ${stay.rating} <span style="font-weight:400">(${stay.reviews})</span>`));

  const checkinFields = document.querySelectorAll("[data-checkin-field]");
  const checkoutFields = document.querySelectorAll("[data-checkout-field]");
  const mobileDateBtn = document.querySelector(".summary-bar-mobile [data-summary-dates]");
  const guestLabel = document.querySelectorAll("[data-summary-guests]");
  const breakdown = document.querySelectorAll("[data-price-breakdown]");
  const reserveBtns = document.querySelectorAll("[data-reserve-btn]");

  function refreshUI() {
    document.querySelectorAll("[data-summary-price]").forEach((el) => (el.innerHTML = `<b>${money(stay.price)}</b><span> / night</span>`));
    checkinFields.forEach((b) => (b.textContent = state.checkin ? formatDate(state.checkin) : "Add date"));
    checkoutFields.forEach((b) => (b.textContent = state.checkout ? formatDate(state.checkout) : "Add date"));
    if (mobileDateBtn) {
      mobileDateBtn.textContent = state.checkin && state.checkout ? `${formatDate(state.checkin)} to ${formatDate(state.checkout)}` : "Add dates";
    }
    guestLabel.forEach((g) => (g.textContent = `${state.guests} guest${state.guests > 1 ? "s" : ""}`));

    const nights = nightsBetween(state.checkin, state.checkout);
    const splitEl = document.querySelector("[data-split-cost]");
    breakdown.forEach((el) => {
      if (!nights) {
        el.innerHTML = `<p class="summary-note">Add your dates to see the total.</p>`;
        if (splitEl) splitEl.hidden = true;
        return;
      }
      const subtotal = nights * stay.price;
      const fee = Math.round(subtotal * SERVICE_FEE_RATE);
      const tax = Math.round(subtotal * TAX_RATE);
      const total = subtotal + fee + tax;
      el.innerHTML = `
        <div class="row"><span>${money(stay.price)} × ${nights} night${nights > 1 ? "s" : ""}</span><span>${money(subtotal)}</span></div>
        <div class="row"><span>Service fee</span><span>${money(fee)}</span></div>
        <div class="row"><span>Taxes</span><span>${money(tax)}</span></div>
        <div class="row total"><span>Total</span><span>${money(total)}</span></div>`;

      if (splitEl) {
        if (splitCount === null) splitCount = state.guests; // default to current guest count once dates are set
        splitEl.hidden = false;
        splitEl.querySelector("[data-split-count]").textContent = splitCount;
        splitEl.querySelector("[data-split-each]").textContent = money(Math.ceil(total / splitCount));
      }
    });
    reserveBtns.forEach((b) => (b.disabled = !nights));
  }

  refreshUI();
  window.__refreshPrices = () => {
    refreshUI();
    renderRelated(stay);
  };

  // Check-in and check-out are two visual halves of one calendar, and the
  // mobile sticky bar has its own separate trigger for the same thing.
  // Each gets its own attachDatePickerPopover call so the popover is
  // always positioned from a trigger that's actually visible right now —
  // forwarding a mobile tap to the (display:none on mobile) desktop
  // button used to open the calendar anchored at (0,0) instead of near
  // where you tapped, since a hidden element has a zero-size bounding box.
  const sharedDatePickerOptions = () => ({
    unavailable: stay.unavailable,
    minDate: new Date(),
    initialStart: state.checkin,
    initialEnd: state.checkout,
    onBlockedCross: () => {},
    onChange: ({ start, end }) => {
      state.checkin = start;
      state.checkout = end;
      refreshUI();
    },
    onDone: refreshUI,
  });
  [...checkinFields, ...checkoutFields, ...(mobileDateBtn ? [mobileDateBtn] : [])].forEach((btn) => {
    attachDatePickerPopover(btn, document.body, sharedDatePickerOptions());
  });

  document.querySelectorAll("[data-guest-minus]").forEach((b) =>
    b.addEventListener("click", () => {
      state.guests = Math.max(1, state.guests - 1);
      refreshUI();
    })
  );
  document.querySelectorAll("[data-guest-plus]").forEach((b) =>
    b.addEventListener("click", () => {
      state.guests = Math.min(stay.guests, state.guests + 1);
      refreshUI();
    })
  );

  document.querySelector("[data-split-minus]")?.addEventListener("click", () => {
    if (splitCount === null) return;
    splitCount = Math.max(1, splitCount - 1);
    refreshUI();
  });
  document.querySelector("[data-split-plus]")?.addEventListener("click", () => {
    if (splitCount === null) return;
    splitCount = Math.min(20, splitCount + 1);
    refreshUI();
  });

  reserveBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!state.checkin || !state.checkout) return;
      if (!requireLogin({ message: `Sign in to book ${stay.name}, it takes a few seconds and there's no email verification in this demo.` })) return;
      BookingState.saveDraft({
        slug: stay.slug,
        checkin: state.checkin,
        checkout: state.checkout,
        guests: state.guests,
      });
      tagOutgoingImage(stay.slug);
      location.href = `booking.html?stay=${stay.slug}`;
    })
  );

  return { state, refreshUI, sharedDatePickerOptions };
}

function initTabNav() {
  const tabs = [...document.querySelectorAll("[data-tab]")];
  if (!tabs.length) return;
  const sections = tabs.map((t) => document.querySelector(t.getAttribute("href"))).filter(Boolean);

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(tab.getAttribute("href"));
      if (!target) return;
      const offset = document.querySelector(".tab-nav").offsetHeight + document.querySelector(".site-header").offsetHeight + 12;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
    });
  });

  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = sections.indexOf(entry.target);
        tabs.forEach((t) => t.classList.remove("is-active"));
        tabs[idx]?.classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => io.observe(s));
}

document.addEventListener("DOMContentLoaded", initTabNav);
document.addEventListener("DOMContentLoaded", initStayDetail);
