/* ============================================================
   MAIN.JS — behaviour shared by every page
   ============================================================ */

/* ---------- currency toggle ----------
   Rather than reloading the whole page (which loses your place and
   flashes white), each page registers a small "how do I redraw my
   prices" function on window.__refreshPrices. The toggle just calls
   whatever is registered; if a page hasn't registered one, it falls
   back to a reload so prices are still never wrong. */
(function currencyToggle() {
  const order = ["USD", "EUR", "GBP"];
  document.querySelectorAll("[data-currency-toggle]").forEach((el) => {
    const paint = () => {
      const c = CURRENCIES[getCurrency()];
      el.textContent = `${c.flag} ${getCurrency()}`;
    };
    paint();
    const cycle = () => {
      const next = order[(order.indexOf(getCurrency()) + 1) % order.length];
      localStorage.setItem("fernhollow_currency", next);
      paint();
      document.querySelectorAll("[data-currency-toggle]").forEach((other) => other !== el && (other.textContent = `${CURRENCIES[next].flag} ${next}`));
      showToast(`Prices now shown in ${next} (illustrative conversion)`);
      if (typeof window.__refreshPrices === "function") window.__refreshPrices();
      else setTimeout(() => location.reload(), 500);
    };
    el.addEventListener("click", cycle);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycle(); }
    });
  });
})();

/* ---------- announcement bar ---------- */
(function announceBar() {
  const bar = document.querySelector("[data-announce-bar]");
  if (!bar) return;
  if (sessionStorage.getItem("fernhollow_announce_dismissed") === "1") {
    bar.hidden = true;
    return;
  }
  bar.querySelector("[data-announce-close]")?.addEventListener("click", () => {
    bar.hidden = true;
    sessionStorage.setItem("fernhollow_announce_dismissed", "1");
  });
})();

/* ---------- drag-to-swipe (mouse AND touch) ----------
   overflow-x:auto containers already swipe natively on a touchscreen,
   but a mouse has no equivalent gesture, so without this a desktop
   user has no way to "swipe" a photo strip at all. This adds real
   click-and-drag scrolling, and marks the track mid-drag so a
   click handler on the same element can tell a genuine tap apart
   from the end of a drag (see isDragEvent below). */
function makeSwipeable(track) {
  let down = false;
  let startX = 0;
  let startScroll = 0;
  let moved = 0;

  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // touch already scrolls natively
    down = true;
    moved = 0;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    track.scrollLeft = startScroll - dx;
  });
  const stop = () => {
    down = false;
    track.classList.remove("is-dragging");
    // stamp how far the pointer actually moved so a click handler
    // firing right after can ignore drags and only act on real taps
    track.dataset.lastDragDistance = String(moved);
  };
  track.addEventListener("pointerup", stop);
  track.addEventListener("pointerleave", stop);
  track.addEventListener("pointercancel", stop);
}

// a click that ends a drag of more than a few pixels isn't a tap
function isDragClick(track) {
  return Number(track.dataset.lastDragDistance || 0) > 6;
}

/* ---------- focus trap (shared by mobile menu + lightbox) ----------
   Keeps Tab/Shift+Tab cycling inside a container while it's open, so
   keyboard users can't silently tab out into content hidden behind an
   overlay. Returns a release() function that restores normal tabbing. */
function trapFocus(container, onEscape) {
  const focusable = () => [...container.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);

  function onKeydown(e) {
    if (e.key === "Escape") return onEscape?.();
    if (e.key !== "Tab") return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  document.addEventListener("keydown", onKeydown);
  const items = focusable();
  items[0]?.focus();
  return () => document.removeEventListener("keydown", onKeydown);
}

/* ---------- mobile nav ---------- */
(function navToggle() {
  const btn = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector(".nav-links");
  if (!btn || !links) return;
  let release = null;

  function close() {
    document.body.classList.remove("nav-open");
    btn.setAttribute("aria-expanded", "false");
    release?.();
    release = null;
    btn.focus();
  }
  btn.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    btn.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) release = trapFocus(links, close);
    else { release?.(); release = null; }
  });
  document.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", close));

  // A few more ways to close, beyond the X button, Escape, and tapping a
  // link — small things, but a full-screen menu with only one obvious
  // way out feels a bit like a trap.
  document.querySelector(".site-header")?.addEventListener("click", (e) => {
    if (document.body.classList.contains("nav-open") && !e.target.closest("[data-nav-toggle]") && !e.target.closest(".brand")) {
      close();
    }
  });
  let touchStartY = null;
  let touchStartScrollTop = 0;
  links.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartScrollTop = links.scrollTop;
  }, { passive: true });
  links.addEventListener("touchend", (e) => {
    if (touchStartY === null) return;
    const delta = touchStartY - e.changedTouches[0].clientY;
    // Swiping up 60px+ closes the menu, but only if that touch didn't
    // actually scroll the list — with the Explore submenu open, the
    // menu can run taller than the screen, and a genuine scroll drag
    // has exactly the same upward finger motion as the dismiss swipe.
    // Without this check, scrolling down the list would close the
    // whole menu out from under you, which is exactly what was
    // happening before: it only worked if you scrolled so fast the
    // list barely moved before your finger lifted.
    const actuallyScrolled = Math.abs(links.scrollTop - touchStartScrollTop) > 4;
    if (delta > 60 && !actuallyScrolled) close();
    touchStartY = null;
  }, { passive: true });
})();

/* ---------- nav dropdown ("Explore") ---------- */
(function navDropdown() {
  document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
    const trigger = dropdown.querySelector(".nav-dropdown-trigger");
    if (!trigger) return;

    function close() {
      dropdown.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }
    function open() {
      // Only one dropdown open at a time, and closing it if the mobile
      // nav itself closes keeps things from getting stuck open oddly.
      document.querySelectorAll(".nav-dropdown.is-open").forEach((d) => d !== dropdown && d.classList.remove("is-open"));
      dropdown.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.contains("is-open") ? close() : open();
    });
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dropdown.classList.contains("is-open")) {
        close();
        trigger.focus();
      }
    });
  });
})();

/* ---------- active-page highlighting (nav + footer) ----------
   Several pages already had aria-current="page" hand-written into their
   markup, but that only ever covered the top nav, not the footer, and a
   few pages didn't have it at all, so it was inconsistent site-wide.
   This does it once, everywhere, straight from the URL, so both the nav
   and the footer always agree on where you are. */
(function highlightCurrentPage() {
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const links = document.querySelectorAll(".nav-links a[href], .nav-dropdown-menu a[href], .footer-top a[href]");
  let matchedDropdown = null;
  links.forEach((a) => {
    const href = a.getAttribute("href").split("#")[0].split("?")[0].toLowerCase();
    const isMatch = href === current || (current === "" && href === "index.html");
    a.toggleAttribute("aria-current", isMatch);
    if (isMatch) {
      a.setAttribute("aria-current", "page");
      a.classList.add("is-current");
      const dropdown = a.closest(".nav-dropdown");
      if (dropdown) matchedDropdown = dropdown;
    } else {
      a.removeAttribute("aria-current");
      a.classList.remove("is-current");
    }
  });
  document.querySelectorAll(".nav-dropdown").forEach((d) => d.classList.toggle("is-current-section", d === matchedDropdown));
})();

/* ---------- header shadow on scroll ---------- */
(function headerScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  document.addEventListener("scroll", onScroll, { passive: true });
})();

/* ---------- scroll reveal ---------- */
(function scrollReveal() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll("[data-reveal]").forEach((i) => i.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll("[data-reveal]").forEach((i) => io.observe(i));

  // This script runs once, synchronously, before the DOM is fully parsed —
  // but plenty of pages render their real content later, dynamically, via
  // their own JS (locations.js building location-row divs, stays.js
  // building cards, etc.). Those elements didn't exist yet for the
  // querySelectorAll above to find, so without this they'd sit at their
  // CSS default of opacity:0 forever — invisible, but still taking up
  // their full layout space, which looks exactly like a broken empty gap.
  // A MutationObserver catches anything added after the fact and starts
  // observing it the same way.
  const mo = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.("[data-reveal]")) io.observe(node);
        node.querySelectorAll?.("[data-reveal]").forEach((el) => io.observe(el));
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();

/* ---------- top progress bar on navigation ---------- */
(function navProgressBar() {
  const bar = document.createElement("div");
  bar.className = "nav-progress";
  document.body.appendChild(bar);
  // fake but honest: this is a static site with no real network wait,
  // so the bar just gives outgoing link clicks a moment of visual feedback
  document.querySelectorAll('a[href$=".html"], a[href*=".html?"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      if (a.target === "_blank" || e.metaKey || e.ctrlKey) return;
      bar.classList.add("is-active");
    });
  });
})();

/* ---------- cookie consent (demo) ---------- */
(function cookieConsent() {
  if (localStorage.getItem("fernhollow_cookie_consent")) return;
  const bar = document.createElement("div");
  bar.className = "cookie-bar";
  bar.innerHTML = `
    <p><i class="fa-solid fa-cookie-bite"></i> This demo site doesn't actually use tracking cookies, this banner exists to show the pattern. <a href="accessibility.html">Learn more</a></p>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-ghost-dark btn-sm" data-cookie-decline>Decline</button>
      <button class="btn btn-primary btn-sm" data-cookie-accept>Accept</button>
    </div>`;
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar.classList.add("is-visible"));
  const dismiss = (val) => {
    localStorage.setItem("fernhollow_cookie_consent", val);
    bar.classList.remove("is-visible");
    setTimeout(() => bar.remove(), 400);
  };
  bar.querySelector("[data-cookie-accept]").addEventListener("click", () => dismiss("accepted"));
  bar.querySelector("[data-cookie-decline]").addEventListener("click", () => dismiss("declined"));
})();

/* ---------- command palette (Cmd+K / Ctrl+K) ---------- */
(function commandPalette() {
  const STATIC_COMMANDS = [
    { label: "Home", icon: "fa-house", href: "index.html" },
    { label: "All stays", icon: "fa-mountain-sun", href: "stays.html" },
    { label: "Photo gallery", icon: "fa-images", href: "gallery.html" },
    { label: "Saved stays", icon: "fa-heart", href: "saved.html" },
    { label: "Compare stays", icon: "fa-scale-balanced", href: "compare.html" },
    { label: "Journal", icon: "fa-feather", href: "blog.html" },
    { label: "About", icon: "fa-circle-info", href: "about.html" },
    { label: "Contact", icon: "fa-envelope", href: "contact.html" },
    { label: "Manage a booking", icon: "fa-ticket", href: "manage-booking.html" },
  ];

  let overlay = null;
  let release = null;

  function results(query) {
    const q = query.trim().toLowerCase();
    const stayResults = (typeof STAYS !== "undefined" ? STAYS : [])
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q))
      .slice(0, 5)
      .map((s) => ({ label: s.name, sub: s.location, icon: "fa-door-open", href: `stay-detail.html?stay=${s.slug}` }));
    const pageResults = STATIC_COMMANDS.filter((c) => !q || c.label.toLowerCase().includes(q));
    return [...stayResults, ...pageResults];
  }

  function render(query) {
    const list = results(query);
    const listEl = overlay.querySelector("[data-cmdk-list]");
    listEl.innerHTML = list.length
      ? list
          .map(
            (r, i) => `
      <button type="button" class="cmdk-item" data-cmdk-href="${r.href}" data-idx="${i}">
        <i class="fa-solid ${r.icon}"></i>
        <span><b>${r.label}</b>${r.sub ? `<span>${r.sub}</span>` : ""}</span>
      </button>`
          )
          .join("")
      : `<div class="cmdk-empty">No matches</div>`;
    listEl.querySelectorAll("[data-cmdk-href]").forEach((btn) =>
      btn.addEventListener("click", () => (location.href = btn.dataset.cmdkHref))
    );
    listEl.querySelector(".cmdk-item")?.classList.add("is-active");
  }

  function open() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "cmdk-overlay";
    overlay.innerHTML = `
      <div class="cmdk-box" role="dialog" aria-label="Quick navigation">
        <div class="cmdk-input-row">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" placeholder="Search stays or jump to a page…" data-cmdk-input>
          <kbd>Esc</kbd>
        </div>
        <div class="cmdk-list" data-cmdk-list></div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    render("");
    const input = overlay.querySelector("[data-cmdk-input]");
    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", (e) => {
      const items = [...overlay.querySelectorAll(".cmdk-item")];
      const activeIdx = items.findIndex((i) => i.classList.contains("is-active"));
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        items.forEach((i) => i.classList.remove("is-active"));
        const next = e.key === "ArrowDown" ? Math.min(activeIdx + 1, items.length - 1) : Math.max(activeIdx - 1, 0);
        items[next]?.classList.add("is-active");
        items[next]?.scrollIntoView({ block: "nearest" });
      }
      if (e.key === "Enter") {
        const active = overlay.querySelector(".cmdk-item.is-active");
        if (active) location.href = active.dataset.cmdkHref;
      }
    });
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    release = trapFocus(overlay, close);
    input.focus();
  }
  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.body.style.overflow = "";
    release?.();
  }

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      overlay ? close() : open();
    }
  });
  document.querySelectorAll("[data-open-cmdk]").forEach((btn) => btn.addEventListener("click", open));
})();

/* ---------- theme toggle (dark/light) ---------- */
(function themeToggle() {
  const btns = document.querySelectorAll("[data-theme-toggle]");
  if (!btns.length) return;
  const paintIcon = () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    btns.forEach((b) => (b.innerHTML = `<i class="fa-solid ${isDark ? "fa-sun" : "fa-moon"}"></i>`));
  };
  paintIcon();
  btns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      if (next === "dark") document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("fernhollow_theme", next);
      paintIcon();
    })
  );
})();


/* ---------- count-up numbers ----------
   Third attempt at this, redesigned after the first two caused real bugs:
   v1 was scroll-triggered only and could get stuck at 0 if the observer
   never fired (or fired on stale cached JS). v2 added a safety-fallback
   timer that could race the observer and cause visible flickering.
   This version has exactly one trigger — right here, on script execution,
   no scrolling involved — so there is nothing left to race or get stuck:
   either this line runs and it animates, or the HTML's real numbers
   (already correct, not "0") are what's shown. Nothing in between. */
(function countUp() {
  const els = document.querySelectorAll("[data-count-to]");
  if (!els.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // HTML already shows the real values

  const format = (el, value) => {
    const decimals = Number(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || "";
    let text = decimals ? value.toFixed(decimals) : Math.round(value).toString();
    if (!el.dataset.plain) text = Number(text).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return text + suffix;
  };

  els.forEach((el) => {
    const target = Number(el.dataset.countTo);
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
      el.textContent = format(el, target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
})();

/* ---------- staggered entrance for dynamically-inserted cards ----------
   Card grids are built by innerHTML after the page loads, so the
   scroll-reveal IntersectionObserver above (built for static elements
   already in the DOM at load time) never sees them individually. Instead
   each .stay-card plays its own small entrance animation via CSS, staggered
   by nth-child order — see .stay-card's animation rule in components.css. */

/* ---------- hero parallax drift ---------- */
(function heroParallax() {
  const media = document.querySelector(".hero-media");
  if (!media || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let ticking = false;
  document.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900);
        media.style.transform = `translateY(${y * 0.25}px)`;
        ticking = false;
      });
    },
    { passive: true }
  );
})();

/* ---------- 3D tilt on hover ----------
   Tracks the cursor over a card and tilts it slightly toward the pointer,
   like the card is a physical object catching the light. Pure CSS
   transform, no libraries. Skipped entirely on touch devices (no hover)
   and when the person has asked for reduced motion. */
function init3DTilt(selector, strength = 8) {
  if (window.matchMedia("(hover: none)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(selector).forEach((card) => {
    if (card.dataset.tiltWired) return;
    card.dataset.tiltWired = "1";
    card.style.transformStyle = "preserve-3d";
    let frame = null;

    card.addEventListener("mousemove", (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg) translateY(-4px)`;
        frame = null;
      });
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}
// re-applied after every dynamic card render, see cards.js
document.addEventListener("DOMContentLoaded", () => init3DTilt(".feature-card, .value-card, .mood-tile"));

/* ---------- footer newsletter form ---------- */
document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("Subscribed, welcome to the list!");
    form.reset();
  });
});

/* ---------- footer year ---------- */
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
document.querySelectorAll("[data-print-date]").forEach((el) => (el.textContent = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })));

/* ---------- toast ---------- */
function showToast(message, action, label = "Undo") {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.innerHTML = `<span>${message}</span>`;
  if (action) {
    const actionBtn = document.createElement("button");
    actionBtn.className = "toast-undo";
    actionBtn.textContent = label;
    actionBtn.addEventListener("click", () => {
      action();
      el.classList.remove("is-visible");
    });
    el.appendChild(actionBtn);
  }
  el.classList.add("is-visible");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("is-visible"), action ? 4500 : 2400);
}

/* ---------- recently viewed stays ---------- */
const RecentlyViewed = {
  key: "fernhollow_recent",
  max: 6,
  add(slug) {
    let list = this.get().filter((s) => s !== slug);
    list.unshift(slug);
    list = list.slice(0, this.max);
    localStorage.setItem(this.key, JSON.stringify(list));
  },
  get() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch { return []; }
  },
};

/* ---------- saved stays (heart icons), persisted locally ---------- */
const SavedStays = {
  key: "fernhollow_saved",
  get() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch { return []; }
  },
  toggle(slug) {
    const list = this.get();
    const idx = list.indexOf(slug);
    if (idx > -1) list.splice(idx, 1);
    else list.push(slug);
    localStorage.setItem(this.key, JSON.stringify(list));
    paintSaveBadge();
    return list.includes(slug);
  },
  has(slug) { return this.get().includes(slug); },
};

function paintSaveBadge() {
  const count = SavedStays.get().length;
  document.querySelectorAll("[data-nav-save-badge]").forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0;
  });
}
paintSaveBadge();

/* ---------- trip planner (multiple stays, each with its own dates) ----------
   Not a shared multi-item checkout — there's no backend to hold a real
   cart across a payment step. This is a genuinely useful lighter version:
   a running itinerary of stays with their own dates, a combined total,
   and each stop links into the existing single-stay booking flow when
   you're ready to actually reserve it. */
const TripPlanner = {
  key: "fernhollow_trip",
  get() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.key)) || [];
      return raw.map((s) => ({ ...s, checkin: s.checkin ? new Date(s.checkin) : null, checkout: s.checkout ? new Date(s.checkout) : null }));
    } catch { return []; }
  },
  save(list) {
    const serializable = list.map((s) => ({ ...s, checkin: s.checkin ? s.checkin.toISOString() : null, checkout: s.checkout ? s.checkout.toISOString() : null }));
    localStorage.setItem(this.key, JSON.stringify(serializable));
    paintTripBadge();
  },
  add(slug, checkin, checkout) {
    const list = this.get();
    if (list.some((s) => s.slug === slug)) return false; // already on the trip
    list.push({ slug, checkin: checkin || null, checkout: checkout || null });
    this.save(list);
    return true;
  },
  remove(slug) {
    this.save(this.get().filter((s) => s.slug !== slug));
  },
  update(slug, checkin, checkout) {
    const list = this.get();
    const stop = list.find((s) => s.slug === slug);
    if (stop) { stop.checkin = checkin; stop.checkout = checkout; this.save(list); }
  },
  has(slug) { return this.get().some((s) => s.slug === slug); },
};

function paintTripBadge() {
  const count = TripPlanner.get().length;
  document.querySelectorAll("[data-nav-trip-badge]").forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0;
  });
}
paintTripBadge();

/* ---------- compare tray ----------
   compare.html reads up to 3 stays from ?a=&b=&c= query params, so this
   caps at 3 to match — a 4th tap gets a toast explaining why instead of
   silently doing nothing. */
/* ---------- gift codes (shared by gift.js and booking.js) ----------
   A code's `amount` is the original face value; `balance` is what's
   left to spend. They're separate so a partly-used gift card can still
   be applied again on a later booking, rather than being all-or-nothing. */
/* ---------- account (local-only demo) ----------
   Not real authentication — there's no server to check a password
   against, so "logged in" just means this browser has an account
   record in localStorage and a session flag in sessionStorage (so
   closing the tab signs you out, same as most real sites' default
   behavior, without needing a server to expire anything). One account
   per browser, same device-scoped pattern as gift codes and referral
   codes elsewhere on this site — consistent, not hidden. */
const Account = {
  key: "fernhollow_account",
  sessionKey: "fernhollow_account_session",
  // "Signed in" used to live only in sessionStorage, which every browser
  // wipes the moment the tab or browser closes — the account itself was
  // never actually lost, but you'd land back on the sign-in screen every
  // time you came back, which looks exactly like it forgot you. This
  // splits it in two: with Remember me checked (the default), the signed
  // -in state goes in localStorage and survives closing the browser
  // entirely; unchecked, it behaves like before and only lasts the tab.
  rememberKey: "fernhollow_account_remember",
  get() {
    try { return JSON.parse(localStorage.getItem(this.key)); } catch { return null; }
  },
  isLoggedIn() {
    if (!this.get()) return false;
    return localStorage.getItem(this.rememberKey) === "1" || sessionStorage.getItem(this.sessionKey) === "1";
  },
  _setSession(remember) {
    if (remember) {
      localStorage.setItem(this.rememberKey, "1");
    } else {
      sessionStorage.setItem(this.sessionKey, "1");
      localStorage.removeItem(this.rememberKey);
    }
  },
  signUp(name, email, password, remember = true) {
    localStorage.setItem(this.key, JSON.stringify({ name, email, password, joinedAt: new Date().toISOString() }));
    this._setSession(remember);
    paintAccountNav();
  },
  logIn(email, password, remember = true) {
    const acc = this.get();
    if (!acc || acc.email.toLowerCase() !== email.trim().toLowerCase() || acc.password !== password) return false;
    this._setSession(remember);
    paintAccountNav();
    return true;
  },
  logOut() {
    sessionStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.rememberKey);
    paintAccountNav();
  },
  forget() {
    localStorage.removeItem(this.key);
    sessionStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.rememberKey);
    paintAccountNav();
  },
};

function paintAccountNav() {
  document.querySelectorAll("[data-account-nav-link]").forEach((el) => {
    el.classList.toggle("is-active", Account.isLoggedIn());
    el.setAttribute("aria-label", Account.isLoggedIn() ? `Signed in as ${Account.get().name}` : "Sign in or create an account");
  });
}
paintAccountNav();

/* Gate for actions that genuinely need an account behind them — booking a
   stay is the real one. Browsing, saving favorites, comparing, and the
   rest of the site stays open without an account, same as most real
   booking sites; it's specifically the "pay and reserve" step that
   shouldn't be reachable while signed out. Returns true and does nothing
   if already signed in; otherwise shows a real sign-in prompt (not just
   a silent redirect) and returns false so the caller can stop.
   `onCancel` runs if the person dismisses the prompt instead of signing
   in — callers on a page that shouldn't be viewable while signed out
   (booking.html itself) should pass one that sends them somewhere sane. */
function requireLogin({ message, onCancel } = {}) {
  if (Account.isLoggedIn()) return true;
  const returnTo = encodeURIComponent(location.pathname + location.search);
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="login-gate-title">
      <div class="modal-icon"><i class="fa-solid fa-lock"></i></div>
      <h3 id="login-gate-title" style="font-size:1.1rem;">Sign in to book</h3>
      <p style="color:var(--text-on-light-soft);font-size:.9rem;margin-top:8px;">${message || "You'll need an account on this device to complete a booking, it takes a few seconds to set up and there's no email verification in this demo."}</p>
      <div style="display:flex;gap:10px;margin-top:20px;">
        <button type="button" class="btn btn-ghost-light" style="flex:1;" data-login-gate-cancel>Not now</button>
        <a class="btn btn-primary" style="flex:1;text-align:center;" href="account.html?return=${returnTo}">Sign in</a>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  function close() {
    overlay.classList.remove("is-open");
    setTimeout(() => overlay.remove(), 200);
  }
  overlay.querySelector("[data-login-gate-cancel]").addEventListener("click", () => { close(); onCancel?.(); });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) { close(); onCancel?.(); } });
  return false;
}

const GIFT_KEY = "fernhollow_gift_codes";

function getGiftCodes() {
  try { return JSON.parse(localStorage.getItem(GIFT_KEY)) || {}; } catch { return {}; }
}
function saveGiftCode(code, record) {
  const all = getGiftCodes();
  all[code] = record;
  localStorage.setItem(GIFT_KEY, JSON.stringify(all));
}
function deductGiftBalance(code, amountUsed) {
  const all = getGiftCodes();
  if (!all[code]) return;
  all[code].balance = Math.max(0, (all[code].balance ?? all[code].amount) - amountUsed);
  localStorage.setItem(GIFT_KEY, JSON.stringify(all));
}
/* Sets every gift code on this device back to its original face value —
   used by the account page's "reset balances" control. Doesn't delete
   the codes themselves, just undoes whatever's been spent on them. */
function resetGiftBalances() {
  const all = getGiftCodes();
  Object.keys(all).forEach((code) => { all[code].balance = all[code].amount; });
  localStorage.setItem(GIFT_KEY, JSON.stringify(all));
}
/* Actually removes a single gift code from this device, rather than
   just zeroing its balance — for a code you generated by mistake, one
   that's fully spent and just cluttering the list, or one you'd rather
   this browser simply forgot about. */
function deleteGiftCode(code) {
  const all = getGiftCodes();
  delete all[code];
  localStorage.setItem(GIFT_KEY, JSON.stringify(all));
}
function deleteAllGiftCodes() {
  localStorage.setItem(GIFT_KEY, JSON.stringify({}));
}

/* ---------- referral bonus (shared with rewards.js and account.js) ---------- */
const MY_REFERRAL_KEY = "fernhollow_my_referral_code";
const REFERRAL_APPLIED_KEY = "fernhollow_referral_applied";
const REFERRAL_BONUS_POINTS = 500;

function getMyReferralCode() {
  let code = localStorage.getItem(MY_REFERRAL_KEY);
  if (!code) {
    code = "FH-REF-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    localStorage.setItem(MY_REFERRAL_KEY, code);
  }
  return code;
}
function getReferralBonusPoints() {
  return localStorage.getItem(REFERRAL_APPLIED_KEY) ? REFERRAL_BONUS_POINTS : 0;
}
/* Undoes an applied referral bonus on this device — the points it added
   go away too, since they were never really earned from a stay. */
function removeReferralBonus() {
  localStorage.removeItem(REFERRAL_APPLIED_KEY);
}

const CompareTray = {
  key: "fernhollow_compare",
  max: 3,
  get() {
    try { return JSON.parse(sessionStorage.getItem(this.key)) || []; } catch { return []; }
  },
  save(list) {
    sessionStorage.setItem(this.key, JSON.stringify(list));
    paintCompareTray();
  },
  has(slug) { return this.get().includes(slug); },
  toggle(slug) {
    let list = this.get();
    if (list.includes(slug)) {
      list = list.filter((s) => s !== slug);
    } else {
      if (list.length >= this.max) return "full";
      list.push(slug);
    }
    this.save(list);
    return list.includes(slug);
  },
  clear() { this.save([]); },
};

function paintCompareTray() {
  const list = CompareTray.get();
  document.querySelectorAll("[data-compare-toggle]").forEach((btn) => {
    const on = CompareTray.has(btn.dataset.compareToggle);
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });

  // compare.html has its own dropdown-driven picker for choosing stays to
  // compare, so this floating tray (built for other pages, driven by
  // sessionStorage and completely separate from the dropdowns) would just
  // sit there showing stale picks that don't match what's selected in the
  // dropdowns, and no amount of clearing a dropdown would touch it. Simplest
  // fix: this tray never appears on the compare page at all.
  let tray = document.querySelector(".compare-tray");
  if (/compare\.html/.test(location.pathname)) { tray?.remove(); return; }
  if (!list.length) { tray?.classList.remove("is-visible"); return; }

  if (!tray) {
    tray = document.createElement("div");
    tray.className = "compare-tray";
    document.body.appendChild(tray);
  }
  const names = list.map((slug) => getStay(slug)?.name).filter(Boolean);
  tray.innerHTML = `
    <span>${list.length} stay${list.length > 1 ? "s" : ""} selected: ${names.join(", ")}</span>
    <div style="display:flex;gap:8px;">
      ${list.length >= 2 ? `<a href="compare.html?${list.map((s, i) => `${["a", "b", "c"][i]}=${s}`).join("&")}" class="btn btn-primary btn-sm">Compare</a>` : `<span style="font-size:.82rem;color:var(--text-on-dark-soft);">Pick one more to compare</span>`}
      <button type="button" class="btn btn-ghost-dark btn-sm" data-compare-clear>Clear</button>
    </div>`;
  tray.querySelector("[data-compare-clear]").addEventListener("click", () => CompareTray.clear());
  requestAnimationFrame(() => tray.classList.add("is-visible"));
}
paintCompareTray();

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-compare-toggle]");
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const slug = btn.dataset.compareToggle;
  const result = CompareTray.toggle(slug);
  if (result === "full") {
    showToast(`You can compare up to ${CompareTray.max} stays at a time, remove one first.`);
    return;
  }
  showToast(result ? "Added to compare" : "Removed from compare");
});

/* ---------- format helpers ---------- */
function formatDate(d) {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function nightsBetween(a, b) {
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000);
}

/* ---------- view transitions helper ----------
   Cross-document View Transitions (the @view-transition rule in
   base.css) already animate every navigation on browsers that
   support it. This helper additionally tags a specific card's
   photo with a view-transition-name that matches the name we
   give the hero photo on the detail page, so that one image
   visually "grows" from the grid into the detail hero instead of
   just cross-fading with everything else. It's progressive
   enhancement only — nothing breaks if the browser ignores it. */
function tagOutgoingImage(slug) {
  if (!("startViewTransition" in document)) return;
  const img = document.querySelector(`[data-stay-image="${slug}"]`);
  if (img) img.style.viewTransitionName = `stay-photo-${slug}`;
}

/* ---------- offline support ----------
   Registers sw.js so the app shell (pages, CSS, JS) is available
   offline after a first visit. Wrapped in feature detection since
   this is progressive enhancement, not a requirement. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Relative, not "/sw.js": this site lives under a project subpath on
    // GitHub Pages (e.g. /fernhollow-booking-website/), and a leading "/"
    // would register against the domain root instead — where sw.js
    // doesn't exist — silently failing every session.
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* Offline support just won't be available this session — the
         rest of the site works fine without it. */
    });
  });
}

/* ---------- back-to-top button ----------
   Created dynamically (same pattern as showToast's .toast element)
   so it doesn't need markup added to every page. Appears after
   scrolling past one viewport height, hidden again near the top. */
(function backToTop() {
  const btn = document.createElement("button");
  btn.className = "back-to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
  if (document.querySelector(".summary-bar-mobile")) btn.classList.add("back-to-top--raised");
  document.body.appendChild(btn);

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      btn.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.8);
      ticking = false;
    });
  });
})();

/* ---------- keyboard shortcuts help ----------
   Built entirely in JS (same dynamic-injection pattern as the toast
   and back-to-top button) so it works on every page without adding
   markup to all 22 of them. Only lists shortcuts that actually exist
   elsewhere in the codebase — no point documenting ones that aren't real. */
(function keyboardShortcutsHelp() {
  let overlay = null;

  function isTyping() {
    const el = document.activeElement;
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  }

  function close() {
    overlay?.classList.remove("is-open");
    setTimeout(() => overlay?.remove(), 200);
    overlay = null;
    document.removeEventListener("keydown", onKeyInModal);
  }

  function onKeyInModal(e) {
    if (e.key === "Escape") close();
  }

  function open() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" style="text-align:left;">
        <p class="eyebrow" style="justify-content:center;">Keyboard shortcuts</p>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;"><span>Open search</span><kbd style="font-family:var(--font-mono);font-size:.78rem;border:1px solid var(--parchment-line);border-radius:5px;padding:3px 8px;">⌘K</kbd></div>
          <div style="display:flex;justify-content:space-between;align-items:center;"><span>Next / previous photo (in a gallery)</span><kbd style="font-family:var(--font-mono);font-size:.78rem;border:1px solid var(--parchment-line);border-radius:5px;padding:3px 8px;">← →</kbd></div>
          <div style="display:flex;justify-content:space-between;align-items:center;"><span>Close any open panel</span><kbd style="font-family:var(--font-mono);font-size:.78rem;border:1px solid var(--parchment-line);border-radius:5px;padding:3px 8px;">Esc</kbd></div>
          <div style="display:flex;justify-content:space-between;align-items:center;"><span>Show this list</span><kbd style="font-family:var(--font-mono);font-size:.78rem;border:1px solid var(--parchment-line);border-radius:5px;padding:3px 8px;">?</kbd></div>
        </div>
        <button type="button" class="btn btn-ghost-light btn-sm" style="margin-top:22px;width:100%;" data-shortcuts-close>Close</button>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    overlay.querySelector("[data-shortcuts-close]").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKeyInModal);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "?" && !isTyping() && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      open();
    }
  });
})();

/* ---------- breadcrumb structured data ----------
   Reads whatever's already in the page's .breadcrumb element (works for
   both static breadcrumbs already in the HTML and ones rendered by a
   page's own JS, like stay-detail.js calls this again once it's filled
   theirs in — calling it before that's populated is a harmless no-op). */
function renderBreadcrumbSchema() {
  const el = document.querySelector(".breadcrumb");
  if (!el) return;
  const crumbs = [...el.children].filter((c) => c.tagName === "A" || (c.tagName === "SPAN" && c.textContent.trim() && c.textContent.trim() !== "/"));
  if (crumbs.length < 2) return; // not populated yet, or nothing meaningful to describe

  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.textContent.trim(),
      ...(c.tagName === "A" ? { item: new URL(c.getAttribute("href"), location.href).href } : {}),
    })),
  };
  document.querySelector("script[data-breadcrumb-schema]")?.remove();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-breadcrumb-schema", "");
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);
}
document.addEventListener("DOMContentLoaded", renderBreadcrumbSchema);

/* ---------- confirm dialog ----------
   Replaces the browser's native confirm() — which shows the page's raw
   URL and looks jarringly out of place next to a designed site — with
   one built from the same .modal-overlay/.modal-card component used
   for the upsell modal and keyboard shortcuts help. Returns a Promise
   that resolves true/false, so call sites just add "await". */
function confirmDialog({ title = "Are you sure?", message = "", confirmLabel = "Yes, continue", cancelLabel = "Cancel", danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div class="modal-icon"${danger ? ' style="background:#e7b8b8;color:#7a1f1f;"' : ""}>
          <i class="fa-solid ${danger ? "fa-triangle-exclamation" : "fa-circle-question"}"></i>
        </div>
        <h3 id="confirm-dialog-title" style="font-size:1.1rem;">${title}</h3>
        ${message ? `<p style="color:var(--text-on-light-soft);font-size:.9rem;margin-top:8px;">${message}</p>` : ""}
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button type="button" class="btn btn-ghost-light" style="flex:1;" data-confirm-cancel>${cancelLabel}</button>
          <button type="button" class="btn btn-primary" style="flex:1;${danger ? "background:#b23a3a;border-color:#b23a3a;" : ""}" data-confirm-ok>${confirmLabel}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-open"));

    function close(result) {
      overlay.classList.remove("is-open");
      setTimeout(() => overlay.remove(), 200);
      document.removeEventListener("keydown", onKey);
      resolve(result);
    }
    function onKey(e) {
      if (e.key === "Escape") close(false);
    }
    overlay.querySelector("[data-confirm-ok]").addEventListener("click", () => close(true));
    overlay.querySelector("[data-confirm-cancel]").addEventListener("click", () => close(false));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(false); });
    document.addEventListener("keydown", onKey);
  });
}
