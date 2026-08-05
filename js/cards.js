/* ============================================================
   CARDS.JS
   Builds the stay-card markup used on the homepage and the
   browse page, and wires up the per-card swipeable image
   carousel (drag/swipe on touch, click-arrows on desktop, plus
   dot indicators) — each card gets its own independent carousel.
   ============================================================ */

const ICON_HEART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.2-4.6-9.6-9C.7 8.4 2 4.8 5.6 4.1c2-.4 4 .5 5.1 2.2C11.9 4.6 14 3.7 16 4.1c3.6.7 4.9 4.3 3.2 7.9-2.4 4.4-9.6 9-9.6 9z"/></svg>`;
const ICON_CHEV_L = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 18l-6-6 6-6"/></svg>`;
const ICON_CHEV_R = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 18l6-6-6-6"/></svg>`;
const ICON_STAR = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6L22 9.6l-5 4.9 1.2 7-6.2-3.5L5.8 21.5 7 14.5l-5-4.9 7.1-1z"/></svg>`;

const ICON_GUESTS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><circle cx="17" cy="8" r="2.4"/><path d="M17 14c2.8.2 5 2.5 5 6"/></svg>`;
const ICON_BED = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 18v2M21 18v2M3 12V7a1 1 0 011-1h6v6"/></svg>`;
const ICON_BATH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3zM7 12V6a2 2 0 012-2h1M4 19v2M18 19v2"/></svg>`;

// derives a smaller-width companion image from an existing Unsplash URL,
// so the browser can pick a phone-appropriate size instead of always
// downloading the desktop-resolution photo
function responsiveSrcset(url) {
  const m = url.match(/[?&]w=(\d+).*?[?&]h=(\d+)/);
  if (!m) return "";
  const w = Number(m[1]), h = Number(m[2]);
  const half = url.replace(`w=${w}`, `w=${Math.round(w / 2)}`).replace(`h=${h}`, `h=${Math.round(h / 2)}`);
  return `${half} ${Math.round(w / 2)}w, ${url} ${w}w`;
}

function stayCardHTML(stay) {
  const slides = stay.images
    .slice(0, 4)
    .map(
      (src, i) =>
        `<img src="${src}" srcset="${responsiveSrcset(src)}" sizes="(max-width:620px) 100vw, 33vw" alt="${stay.name}, photo ${i + 1}" loading="lazy" ${i === 0 ? `data-stay-image="${stay.slug}"` : ""}>`
    )
    .join("");
  const dots = stay.images
    .slice(0, 4)
    .map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`)
    .join("");

  return `
  <article class="stay-card" data-mood="${stay.moods.join(" ")}" data-price="${stay.price}" data-rating="${stay.rating}">
    <div class="card-carousel" data-carousel>
      <div class="card-scrim"></div>
      ${stay.badge ? `<span class="card-badge">${ICON_STAR} ${stay.badge}</span>` : ""}
      <button class="card-save" type="button" data-save="${stay.slug}" aria-pressed="false" aria-label="Save ${stay.name}">${ICON_HEART}</button>
      <button class="card-compare" type="button" data-compare-toggle="${stay.slug}" aria-pressed="false" aria-label="Add ${stay.name} to compare"><i class="fa-solid fa-scale-balanced"></i></button>
      <div class="track" data-track>${slides}</div>
      <div class="arrows">
        <button type="button" data-prev aria-label="Previous photo">${ICON_CHEV_L}</button>
        <button type="button" data-next aria-label="Next photo">${ICON_CHEV_R}</button>
      </div>
      <div class="dots" data-dots>${dots}</div>
    </div>
    <a href="stay-detail.html?stay=${stay.slug}" class="stay-card-body" data-open-detail="${stay.slug}" onclick="tagOutgoingImage('${stay.slug}')">
      <div class="stay-card-top">
        <div>
          <h3>${stay.name}</h3>
          <p class="stay-card-loc">${stay.location}</p>
        </div>
        <span class="rating">${ICON_STAR} ${stay.rating}</span>
      </div>
      <div class="stay-card-facts">
        <span>${ICON_GUESTS} ${stay.guests}</span>
        <span>${ICON_BED} ${stay.beds}</span>
        <span>${ICON_BATH} ${stay.baths}</span>
      </div>
      <div class="stay-card-foot">
        <p class="stay-card-price"><b>${money(stay.price)}</b><span> / night</span></p>
        <span class="stay-card-cta">View stay →</span>
      </div>
      ${stay.price > 260 ? `<p class="savings-note"><i class="fa-solid fa-tag"></i> Save ~12% on weekday stays</p>` : ""}
    </a>
  </article>`;
}

/* Renders a handful of shimmering placeholder cards while "loading" —
   everything here is actually local data so this is a deliberately brief,
   honest simulation, not hiding real network latency. */
function renderSkeletonCards(mount, count = 3) {
  mount.innerHTML = Array.from({ length: count })
    .map(
      () => `
    <div class="skeleton-card">
      <div class="sk-photo"></div>
      <div class="sk-line sk-w60"></div>
      <div class="sk-line sk-w40"></div>
      <div class="sk-line sk-w30"></div>
    </div>`
    )
    .join("");
}

/* Currency changes only need the price text to change, nothing about
   the layout, photos, or carousel state. Tearing down and rebuilding
   every card for that (as a full re-render would) reloads every image
   and resets every carousel, which is what made the currency toggle
   feel "glitchy" on pages with a lot of cards. This just patches the
   number in place instead. */
function updateCardPrices(root = document) {
  root.querySelectorAll(".stay-card[data-price]").forEach((card) => {
    const priceEl = card.querySelector(".stay-card-price b");
    if (priceEl) priceEl.textContent = money(Number(card.dataset.price));
  });
}

function renderStayCards(list, mountEl) {
  mountEl.innerHTML = list.map(stayCardHTML).join("");
  initCardCarousels(mountEl);
  initSaveButtons(mountEl);
  if (typeof paintCompareTray === "function") paintCompareTray();
  if (typeof init3DTilt === "function") init3DTilt(".stay-card", 5);
}

/* Each card's .track is a horizontally scrolling flexbox with
   scroll-snap; "next/prev" just scrolls it by one card-width,
   and an IntersectionObserver on the slides keeps the dot
   indicator in sync however the user scrolls (swipe, arrow key,
   trackpad, or the buttons). */
function initCardCarousels(root) {
  root.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-track]");
    const dots = [...carousel.querySelectorAll("[data-dots] span")];
    const slides = [...track.children];
    if (!slides.length) return;

    const setActive = (i) => dots.forEach((d, di) => d.classList.toggle("active", di === i));
    const goTo = (i) => {
      const clamped = Math.max(0, Math.min(i, slides.length - 1));
      track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    };
    const currentIndex = () => Math.round(track.scrollLeft / track.clientWidth);

    carousel.querySelector("[data-prev]")?.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(currentIndex() - 1);
    });
    carousel.querySelector("[data-next]")?.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(currentIndex() + 1);
    });
    dots.forEach((dot, i) =>
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        goTo(i);
      })
    );

    // tapping the left/right half of the photo itself steps through it too,
    // this is what makes the carousel feel "swipeable" even with a single
    // click/tap rather than requiring an actual drag gesture; click-and-drag
    // with a mouse also works now via makeSwipeable
    makeSwipeable(track);
    slides.forEach((slide) => {
      slide.addEventListener("click", (e) => {
        if (isDragClick(track)) return; // this click was really the end of a drag
        e.preventDefault();
        const rect = slide.getBoundingClientRect();
        const clickedRight = e.clientX - rect.left > rect.width / 2;
        goTo(currentIndex() + (clickedRight ? 1 : -1));
      });
    });

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(slides.indexOf(entry.target));
          });
        },
        { root: track, threshold: 0.6 }
      );
      slides.forEach((s) => io.observe(s));
    }
  });
}

function initSaveButtons(root) {
  root.querySelectorAll("[data-save]").forEach((btn) => {
    const slug = btn.dataset.save;
    const isSaved = SavedStays.has(slug);
    btn.classList.toggle("is-saved", isSaved);
    btn.setAttribute("aria-pressed", String(isSaved));
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nowSaved = SavedStays.toggle(slug);
      btn.classList.toggle("is-saved", nowSaved);
      btn.setAttribute("aria-pressed", String(nowSaved));
      if (nowSaved) {
        showToast("Saved to your list");
      } else {
        showToast("Removed from your list", () => {
          SavedStays.toggle(slug);
          btn.classList.add("is-saved");
          btn.setAttribute("aria-pressed", "true");
          window.__onSaveToggle?.(slug, true);
        });
      }
      window.__onSaveToggle?.(slug, nowSaved);
    });
  });
}
