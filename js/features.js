/* ============================================================
   FEATURES.JS
   Shared logic for the site-wide "upgrade" features:
     - cinematic scroll-reveal ([data-cinematic])
     - a sunrise/sunset calculator (used by the golden-hour widget
       on stay-detail AND the time-of-day mood hero on index)
     - the rule-based concierge chat (mounted on every page)
   Page-specific features (parallax hero, soundscape, heat
   calendar, constellation, voice walkthrough, flight-path map)
   live in js/stay-features.js and js/locations-features.js so
   this file stays small and loads everywhere safely.
   ============================================================ */

/* ---------- cinematic scroll-reveal ---------- */
(function cinematicReveal() {
  const els = document.querySelectorAll("[data-cinematic]");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );
  els.forEach((el) => io.observe(el));
})();

/* ---------- sunrise / sunset calculator ----------
   A compact NOAA-style solar position approximation — accurate to
   within a minute or two, which is plenty for a "golden hour"
   widget. No API key, no network call: everything server-side
   sites usually fetch from a weather/astronomy API is computed
   right here from latitude, longitude and the current date.
   Exposed as window.FernSolar so both the stay-detail golden-hour
   card and the index mood-hero can share one implementation. */
window.FernSolar = (function () {
  function toRad(d) { return (d * Math.PI) / 180; }
  function toDeg(r) { return (r * 180) / Math.PI; }

  // Returns { sunrise: Date, sunset: Date, solarNoon: Date } in local time,
  // or null values if the sun doesn't rise/set that day at that latitude.
  function sunTimes(date, lat, lng) {
    const julianDay = date.getTime() / 86400000 + 2440587.5;
    const n = julianDay - 2451545.0 + 0.0008;
    const meanSolarTime = n - lng / 360;
    const solarMeanAnomaly = (357.5291 + 0.98560028 * meanSolarTime) % 360;
    const M = toRad(solarMeanAnomaly);
    const C = 1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M);
    const eclipticLng = (solarMeanAnomaly + C + 180 + 102.9372) % 360;
    const L = toRad(eclipticLng);
    const solarTransit = 2451545.0 + meanSolarTime + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    const decl = Math.asin(Math.sin(L) * Math.sin(toRad(23.44)));
    const latR = toRad(lat);
    const cosH = (Math.sin(toRad(-0.83)) - Math.sin(latR) * Math.sin(decl)) / (Math.cos(latR) * Math.cos(decl));
    if (cosH > 1) return { sunrise: null, sunset: null, solarNoon: null, polar: "night" };
    if (cosH < -1) return { sunrise: null, sunset: null, solarNoon: null, polar: "day" };
    const H = toDeg(Math.acos(cosH));
    const jSet = solarTransit + H / 360;
    const jRise = solarTransit - H / 360;
    const jdToDate = (jd) => new Date((jd - 2440587.5) * 86400000);
    return { sunrise: jdToDate(jRise), sunset: jdToDate(jSet), solarNoon: jdToDate(solarTransit), polar: null };
  }

  // Coarse phase-of-day classifier, used for the index hero's mood overlay.
  function phase(date, lat, lng) {
    const t = sunTimes(date, lat, lng);
    if (t.polar === "night") return "night";
    if (t.polar === "day") return "day";
    const now = date.getTime();
    const goldenMs = 40 * 60000;
    const sr = t.sunrise.getTime(), ss = t.sunset.getTime();
    if (now < sr - goldenMs || now > ss + goldenMs) return "night";
    if (now < sr + goldenMs) return "dawn";
    if (now > ss - goldenMs) return "dusk";
    return "day";
  }

  return { sunTimes, phase };
})();

/* ---------- AI concierge chat (rule-based demo) ----------
   Floating chat, present on every page. Deliberately NOT wired to
   a real model: shipping an API key in client-side JS on a static
   GitHub Pages site would leak it to anyone who opens dev tools, so
   instead of pretending, this matches guest questions against the
   stay catalogue (location, mood, price, amenities) and a small set
   of FAQ patterns with plain keyword rules — genuinely useful for
   "somewhere with a hot tub under $300", clearly labeled as a demo,
   same honesty the rest of the site already uses for the fake
   auth/payments. */
(function concierge() {
  if (document.querySelector(".concierge-launcher")) return; // safety: never mount twice

  const launcher = document.createElement("button");
  launcher.className = "concierge-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open the Fernhollow concierge chat");
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML = `<span class="concierge-icon"><i class="fa-solid fa-feather-pointed cg-i-idle"></i><i class="fa-solid fa-xmark cg-i-open"></i></span><span class="concierge-dot"></span>`;

  const panel = document.createElement("div");
  panel.className = "concierge-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Fernhollow concierge chat");
  panel.innerHTML = `
    <div class="concierge-head">
      <div class="icon-wrap"><i class="fa-solid fa-feather-pointed"></i></div>
      <div>
        <h3><span class="cg-live"></span>Fernhollow concierge</h3>
        <p>Demo assistant. Try "hot tub under $300"</p>
      </div>
      <button type="button" class="concierge-close" aria-label="Close chat"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="concierge-body" data-concierge-body></div>
    <form class="concierge-form" data-concierge-form>
      <input type="text" placeholder="Ask about a stay, dates, policies…" aria-label="Message" data-concierge-input maxlength="200">
      <button type="submit" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button>
    </form>
    <p class="concierge-disclaimer">Rule-based demo, not a live AI model. See the README for why.</p>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const body = panel.querySelector("[data-concierge-body]");
  const form = panel.querySelector("[data-concierge-form]");
  const input = panel.querySelector("[data-concierge-input]");
  let opened = false;
  let greeted = false;

  function scrollToBottom() { body.scrollTop = body.scrollHeight; }

  function addMsg(text, from, chips) {
    const el = document.createElement("div");
    el.className = `concierge-msg from-${from}`;
    el.innerHTML = text;
    if (chips && chips.length) {
      const wrap = document.createElement("div");
      wrap.className = "concierge-suggest";
      chips.forEach((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = c;
        b.addEventListener("click", () => handleQuery(c));
        wrap.appendChild(b);
      });
      el.appendChild(wrap);
    }
    body.appendChild(el);
    scrollToBottom();
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "concierge-typing";
    el.dataset.typing = "1";
    el.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(el);
    scrollToBottom();
    return el;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function fmtStay(s) {
    return `<a href="stay-detail.html?stay=${s.slug}">${s.name}</a>, ${s.location.split(",")[0]}, $${s.price}/night`;
  }

  function findStays(q) {
    if (typeof STAYS === "undefined") return [];
    const words = q.toLowerCase();
    let list = STAYS.slice();

    // price ceiling: "under $300" / "under 300" / "below 250"
    const priceMatch = words.match(/(?:under|below|less than)\s*\$?(\d{2,4})/);
    if (priceMatch) list = list.filter((s) => s.price <= Number(priceMatch[1]));
    const priceOver = words.match(/(?:over|above|more than)\s*\$?(\d{2,4})/);
    if (priceOver) list = list.filter((s) => s.price >= Number(priceOver[1]));

    // guests: "for 6 people" / "sleeps 8" / "6 guests"
    const guestMatch = words.match(/(\d{1,2})\s*(?:people|guests|adults)|sleeps?\s*(\d{1,2})/);
    if (guestMatch) {
      const n = Number(guestMatch[1] || guestMatch[2]);
      list = list.filter((s) => s.guests >= n);
    }

    // amenity / feature keywords
    const amenityTerms = {
      "hot tub": "hot tub", tub: "hot tub", sauna: "sauna", pet: "Pet", dog: "Pet",
      fireplace: "stove", stove: "stove", fire: "fire pit", waterfront: "lake", lake: "lake",
      hammock: "Hammock", pool: "pool", "wood-burning": "stove",
    };
    const matchedAmenity = Object.keys(amenityTerms).find((k) => words.includes(k));
    if (matchedAmenity) {
      const needle = amenityTerms[matchedAmenity].toLowerCase();
      list = list.filter(
        (s) =>
          (s.amenities || []).some((a) => a.toLowerCase().includes(needle)) ||
          (s.rules && s.rules.pets && needle === "pet") ||
          (s.blurb || "").toLowerCase().includes(needle) ||
          (s.location || "").toLowerCase().includes(needle)
      );
    }

    // region / location keyword — try matching any word against location text
    const regionHit = list.filter((s) => words.split(/\s+/).some((w) => w.length > 3 && s.location.toLowerCase().includes(w)));
    if (regionHit.length && regionHit.length < list.length) list = regionHit;

    // mood keywords
    const moodTerms = ["fireside", "treetop", "lakeside", "secluded", "romantic", "family", "luxury"];
    const moodHit = moodTerms.find((m) => words.includes(m));
    if (moodHit) {
      const byMood = list.filter((s) => (s.moods || []).some((m) => m.toLowerCase().includes(moodHit)));
      if (byMood.length) list = byMood;
    }

    return list.slice(0, 3);
  }

  function handleQuery(raw) {
    const q = raw.trim();
    if (!q) return;
    addMsg(escapeHtml(q), "user");
    input.value = "";
    const typing = showTyping();

    setTimeout(() => {
      typing.remove();
      const lower = q.toLowerCase();

      if (/(cancel|refund)/.test(lower)) {
        addMsg("Free cancellation up to 5 days before check-in on every stay, no exceptions. Full details are on the FAQ.", "bot", ["Check-in time?", "Gift a stay", "Pet-friendly options"]);
        return;
      }
      if (/(check.?in|check.?out)/.test(lower)) {
        addMsg("Check-in is typically 4:00 PM and check-out 10:00 AM, though it varies slightly by host. The exact times are on each stay's Policies tab.", "bot", ["Cancellation policy", "Pet-friendly options"]);
        return;
      }
      if (/(gift)/.test(lower)) {
        addMsg(`You can send a stay as a gift card from the <a href="gift.html">Gift a stay</a> page, and the recipient picks their own dates later.`, "bot");
        return;
      }
      if (/(reward|point|loyalt)/.test(lower)) {
        addMsg(`Every booking earns points toward free nights. See the <a href="rewards.html">Rewards</a> page for tiers.`, "bot");
        return;
      }
      if (/(contact|host|question|help me\b$)/.test(lower) && !findStays(lower).length) {
        addMsg(`For anything I can't help with here, the <a href="contact.html">Contact page</a> reaches a real person.`, "bot", ["Somewhere with a hot tub", "Best for 6 guests"]);
        return;
      }

      const matches = findStays(lower);
      if (matches.length) {
        const list = matches.map(fmtStay).join("<br>");
        addMsg(`Here's what fits best:<br><br>${list}`, "bot", ["See all stays", "Something cheaper", "Pet-friendly options"]);
        return;
      }
      if (/see all stays/i.test(q)) {
        addMsg(`You can browse the full collection on the <a href="stays.html">Stays page</a>, with filters for price, guests, and amenities.`, "bot");
        return;
      }

      addMsg(
        "I can help you find a stay by price, guest count, region, or feature (hot tub, sauna, pet-friendly, lakeside), or answer questions about check-in, cancellation, gifting, and rewards. What are you looking for?",
        "bot",
        ["Somewhere with a hot tub", "Best for 6 guests", "Cancellation policy"]
      );
    }, 500 + Math.random() * 500);
  }

  function open() {
    opened = true;
    panel.classList.add("is-open");
    launcher.classList.add("is-open");
    launcher.setAttribute("aria-expanded", "true");
    launcher.setAttribute("aria-label", "Close the Fernhollow concierge chat");
    if (!greeted) {
      greeted = true;
      setTimeout(() => {
        addMsg(
          "Welcome to Fernhollow. I'm the (demo) concierge. Ask me things like <em>\"somewhere with a hot tub under $300\"</em> or <em>\"best for 6 guests near a lake.\"</em>",
          "bot",
          ["Somewhere with a hot tub", "Best for 6 guests", "Cancellation policy"]
        );
      }, 300);
    }
    setTimeout(() => input.focus(), 260);
  }
  function close() {
    opened = false;
    panel.classList.remove("is-open");
    launcher.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-label", "Open the Fernhollow concierge chat");
  }

  launcher.addEventListener("click", () => (opened ? close() : open()));
  panel.querySelector(".concierge-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && opened) close(); });
  form.addEventListener("submit", (e) => { e.preventDefault(); handleQuery(input.value); });
})();
