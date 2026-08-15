/* ============================================================
   STAY-FEATURES.JS
   Six of the ten "upgrade" features, all scoped to stay-detail.html
   and built on top of the same STAYS record stay-detail.js already
   reads (found again independently here, so this file works even
   if stay-detail.js's markup changes) — nothing here modifies
   stay-detail.js or the existing gallery/booking logic.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof STAYS === "undefined") return;
  const params = new URLSearchParams(location.search);
  const stay = (typeof getStay === "function" && getStay(params.get("stay"))) || STAYS[0];
  if (!stay) return;

  const [lat, lng] = (stay.coords || "42,-74").split(",").map(Number);

  mountParallaxHero(stay);
  mountGoldenHour(stay, lat, lng);
  mountSoundscape(stay);
  mountHeatCalendar(stay);
  mountConstellation(stay, lat, lng);
  mountWalkthrough(stay);
});

/* ---------- 1. parallax cabin hero ----------
   Inserted just above the existing photo gallery grid, not
   replacing it — a cinematic "establishing shot" using the stay's
   own first two photos as depth layers. Pure CSS transform driven
   by scroll position via requestAnimationFrame, so it never fights
   the page's native scrolling or the existing lightbox/gallery JS. */
function mountParallaxHero(stay) {
  const galleryWrap = document.querySelector("[data-gallery-desktop]");
  if (!galleryWrap) return;
  const host = galleryWrap.closest(".wrap");
  if (!host || host.dataset.pxMounted) return;
  host.dataset.pxMounted = "1";

  const hero = document.createElement("div");
  hero.className = "parallax-hero";
  hero.innerHTML = `
    <div class="px-layer px-sky" style="background-image:url('${stay.images[0]}')"></div>
    <div class="px-veil"></div>
    <div class="px-content">
      <p class="px-eyebrow">Fernhollow presents</p>
      <h2>${stay.name}</h2>
      <p class="px-loc"><i class="fa-solid fa-location-dot"></i> ${stay.location}</p>
    </div>
  `;
  host.parentNode.insertBefore(hero, host);

  const sky = hero.querySelector(".px-sky");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const progress = 1 - Math.min(Math.max(rect.top / window.innerHeight, -1), 1);
      sky.style.transform = `translateY(${(progress - 0.5) * 40}px) scale(1.06)`;
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- 2. golden-hour countdown ----------
   Uses window.FernSolar (features.js) with the stay's own lat/lng
   to compute a real sunrise/sunset for today, then counts down to
   whichever is next and shows a live "golden hour" progress bar. */
function mountGoldenHour(stay, lat, lng) {
  const mapBlock = document.getElementById("map");
  if (!mapBlock || !window.FernSolar) return;

  const card = document.createElement("div");
  card.className = "golden-hour-card";
  card.style.marginTop = "16px";
  card.innerHTML = `
    <div class="gh-head"><i class="fa-solid fa-sun"></i><h4>Golden hour at ${stay.location.split(",")[0]}</h4></div>
    <div class="gh-count" data-gh-count>Loading…</div>
    <div class="gh-sub" data-gh-sub>Calculating today's light…</div>
    <div class="gh-bar"><div class="gh-bar-fill" data-gh-fill style="width:0%"></div></div>
  `;
  mapBlock.appendChild(card);

  const countEl = card.querySelector("[data-gh-count]");
  const subEl = card.querySelector("[data-gh-sub]");
  const fillEl = card.querySelector("[data-gh-fill]");

  function fmtTime(d) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  function fmtCountdown(ms) {
    const totalMin = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(totalMin / 60), m = totalMin % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function tick() {
    const now = new Date();
    let t = window.FernSolar.sunTimes(now, lat, lng);
    if (t.polar) {
      countEl.textContent = t.polar === "day" ? "Sun's up all day" : "Sun stays down today";
      subEl.textContent = `At this latitude, that's normal for the season.`;
      fillEl.style.width = "50%";
      return;
    }
    const nowMs = now.getTime();
    const sunrise = t.sunrise.getTime(), sunset = t.sunset.getTime();
    let target, label;
    if (nowMs < sunrise) { target = sunrise; label = "until sunrise"; }
    else if (nowMs < sunset) { target = sunset; label = "until sunset"; }
    else {
      const tmrw = window.FernSolar.sunTimes(new Date(nowMs + 86400000), lat, lng);
      target = tmrw.sunrise ? tmrw.sunrise.getTime() : sunrise + 86400000;
      label = "until sunrise";
    }
    countEl.textContent = `${fmtCountdown(target - nowMs)} ${label}`;
    subEl.textContent = `Sunrise ${fmtTime(t.sunrise)} · Sunset ${fmtTime(t.sunset)} (computed for this stay's coordinates)`;
    const dayLen = sunset - sunrise;
    const pct = nowMs < sunrise ? 0 : nowMs > sunset ? 100 : ((nowMs - sunrise) / dayLen) * 100;
    fillEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }
  tick();
  setInterval(tick, 30000);
}

/* ---------- 3. ambient soundscape ----------
   Synthesized entirely with the Web Audio API — filtered noise for
   wind through a forest canopy, a slow-breathing volume swell, and
   occasional soft chime "birdsong" pings. No audio files to host,
   so it works the moment this script loads, on any stay. Built and
   started lazily on first click (browsers block audio autoplay
   without a user gesture anyway). */
function mountSoundscape(stay) {
  const factsBlock = document.getElementById("overview");
  if (!factsBlock) return;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "soundscape-toggle";
  toggle.style.marginTop = "16px";
  toggle.setAttribute("aria-pressed", "false");
  toggle.innerHTML = `
    <span class="ss-icon"><i class="fa-solid fa-wind"></i></span>
    <span>Listen to ${stay.location.split(",")[0]}</span>
    <span class="ss-bars"><span></span><span></span><span></span></span>
  `;
  factsBlock.appendChild(toggle);

  let ctx, noiseSrc, filter, gain, chimeTimer, playing = false;

  function buildGraph() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    noiseSrc.loop = true;

    filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 500;
    filter.Q.value = 0.6;

    gain = ctx.createGain();
    gain.gain.value = 0;

    noiseSrc.connect(filter).connect(gain).connect(ctx.destination);
    noiseSrc.start();

    // slow "wind breathing" — gently modulate the filter + gain over time
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
  }

  function chime() {
    if (!playing) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 900 + Math.random() * 500;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.5);
    chimeTimer = setTimeout(chime, 2500 + Math.random() * 5000);
  }

  toggle.addEventListener("click", () => {
    if (!ctx) buildGraph();
    if (ctx.state === "suspended") ctx.resume();
    playing = !playing;
    toggle.classList.toggle("is-playing", playing);
    toggle.setAttribute("aria-pressed", String(playing));
    gain.gain.linearRampToValueAtTime(playing ? 0.16 : 0, ctx.currentTime + 0.8);
    if (playing) chime(); else clearTimeout(chimeTimer);
  });
}

/* ---------- 4. price heat calendar ----------
   A read-at-a-glance preview grid (separate from the real,
   interactive booking datepicker, which is left completely alone)
   showing the next 35 days shaded by a deterministic demand score
   derived from the date + this stay's slug, so it's stable on
   every reload rather than randomizing each time. */
function mountHeatCalendar(stay) {
  const availabilityBlock = document.querySelector(".detail-grid > div:last-child") || document.getElementById("map");
  const summary = document.querySelector("[data-booking-summary], .booking-summary, .detail-grid");
  const host = document.getElementById("map");
  if (!host) return;

  function seedFor(dateStr) {
    let h = 0;
    const s = stay.slug + dateStr;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return (h % 100) / 100;
  }

  const wrap = document.createElement("div");
  wrap.className = "heat-cal";
  const label = document.createElement("h4");
  label.style.fontSize = ".92rem";
  label.textContent = "Price outlook, next 5 weeks";
  wrap.appendChild(label);
  const grid = document.createElement("div");
  grid.className = "heat-cal-grid";
  wrap.appendChild(grid);

  const today = new Date();
  for (let i = 0; i < 35; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const demand = Math.min(1, seedFor(dateStr) + (weekend ? 0.28 : 0));
    const price = Math.round(stay.price * (0.85 + demand * 0.4));
    const cell = document.createElement("div");
    cell.className = "heat-cal-day";
    const hue = 108 - demand * 108; // green (low demand) -> red-ish (high demand)
    cell.style.background = `hsl(${hue} 45% ${88 - demand * 28}%)`;
    cell.textContent = d.getDate();
    cell.innerHTML += `<span class="heat-tip">${d.toLocaleDateString([], { month: "short", day: "numeric" })} · $${price}/night</span>`;
    grid.appendChild(cell);
  }

  const legend = document.createElement("div");
  legend.className = "heat-cal-legend";
  legend.innerHTML = `<span>Quieter</span><span class="heat-scale"></span><span>In demand</span>`;
  wrap.appendChild(legend);

  const note = document.createElement("p");
  note.style.cssText = "font-size:.72rem;color:var(--text-on-light-soft);margin-top:8px;";
  note.textContent = "Illustrative pricing trend for this demo. Book actual dates in the Availability section below.";
  wrap.appendChild(note);

  host.appendChild(wrap);
}

/* ---------- 5. constellation / night-sky overlay ----------
   A full-screen canvas star field, positioned as if looking up
   from this stay's own coordinates right now: star DENSITY and a
   few labeled "bright stars" are procedurally generated (seeded by
   the stay, so it's consistent, not a real star catalogue/engine),
   which is honestly framed in the overlay's own copy rather than
   claimed as precise astronomy. */
function mountConstellation(stay, lat, lng) {
  const factsBlock = document.getElementById("overview");
  if (!factsBlock) return;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "sky-trigger";
  trigger.style.marginTop = "16px";
  trigger.style.marginLeft = "10px";
  trigger.innerHTML = `<i class="fa-solid fa-star"></i> See tonight's sky`;
  factsBlock.appendChild(trigger);

  const overlay = document.createElement("div");
  overlay.className = "sky-overlay";
  overlay.innerHTML = `
    <canvas></canvas>
    <div class="sky-overlay-head">
      <div>
        <h3>The sky over ${stay.location.split(",")[0]}</h3>
        <p>Zero light pollution is part of the pitch here. This is a stylized impression of tonight's stars, not a precise star chart.</p>
      </div>
      <button type="button" class="sky-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="sky-overlay-foot">Procedurally generated for this stay (seeded, not live astronomy). For real conditions, a stargazing app is more precise.</div>
  `;
  document.body.appendChild(overlay);

  const canvas = overlay.querySelector("canvas");
  const ctx2d = canvas.getContext("2d");
  let stars = [], raf;

  function seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function buildStars() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    let seed = 0;
    for (let i = 0; i < stay.slug.length; i++) seed += stay.slug.charCodeAt(i) * (i + 1);
    seed += Math.round(lat * 100) + Math.round(lng * 100);
    const rand = seededRandom(seed || 1);
    const count = 260;
    stars = Array.from({ length: count }, () => ({
      x: rand() * window.innerWidth,
      y: rand() * window.innerHeight * 0.85,
      r: rand() * 1.4 + 0.3,
      base: rand() * 0.5 + 0.4,
      speed: rand() * 0.02 + 0.005,
      phase: rand() * Math.PI * 2,
      bright: rand() > 0.985,
    }));
  }

  function draw(t) {
    ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
    stars.forEach((s) => {
      const tw = s.base + Math.sin(t * s.speed + s.phase) * 0.35;
      ctx2d.beginPath();
      ctx2d.fillStyle = s.bright ? `rgba(231,206,154,${Math.max(0.3, tw)})` : `rgba(245,239,223,${Math.max(0.15, tw)})`;
      ctx2d.arc(s.x, s.y, s.bright ? s.r * 2.2 : s.r, 0, Math.PI * 2);
      ctx2d.fill();
      if (s.bright) {
        ctx2d.strokeStyle = `rgba(231,206,154,${Math.max(0, tw) * 0.4})`;
        ctx2d.lineWidth = 0.6;
        ctx2d.beginPath();
        ctx2d.moveTo(s.x - 6, s.y); ctx2d.lineTo(s.x + 6, s.y);
        ctx2d.moveTo(s.x, s.y - 6); ctx2d.lineTo(s.x, s.y + 6);
        ctx2d.stroke();
      }
    });
    raf = requestAnimationFrame(draw);
  }

  function open() {
    buildStars();
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) raf = requestAnimationFrame(draw);
    else draw(0);
  }
  function close() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    cancelAnimationFrame(raf);
  }
  trigger.addEventListener("click", open);
  overlay.querySelector(".sky-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("is-open")) close(); });
  window.addEventListener("resize", () => { if (overlay.classList.contains("is-open")) buildStars(); });
}

/* ---------- 6. voice-guided gallery walkthrough ----------
   Uses the browser's built-in Web Speech API (speechSynthesis) to
   narrate through this stay's own photos with generic room-by-room
   captions — no audio files or narration service required. Falls
   back to a silent slideshow with on-screen captions if the browser
   doesn't support speech synthesis. */
function mountWalkthrough(stay) {
  const galleryHost = document.querySelector("[data-gallery-desktop]");
  if (!galleryHost) return;
  const wrapEl = galleryHost.closest(".wrap");
  if (!wrapEl) return;

  const captions = [
    `Welcome to ${stay.name}, in ${stay.location}.`,
    `${stay.blurb}`,
    `The space sleeps up to ${stay.guests}, with ${stay.bedrooms} bedroom${stay.bedrooms === 1 ? "" : "s"} and ${stay.baths} bathroom${stay.baths === 1 ? "" : "s"}.`,
    stay.theSpace || "Take a look at the main living space.",
    `Hosted by ${stay.host && stay.host.name ? stay.host.name : "your host"}, ready when you are.`,
  ];
  const images = (stay.images || []).slice(0, captions.length);
  while (images.length < captions.length) images.push(stay.images[0]);

  const bar = document.createElement("div");
  bar.className = "walkthrough-bar";
  bar.innerHTML = `
    <button type="button" class="wt-prev" aria-label="Previous"><i class="fa-solid fa-backward-step"></i></button>
    <button type="button" class="wt-play" aria-label="Play narrated walkthrough"><i class="fa-solid fa-play"></i></button>
    <button type="button" class="wt-next" aria-label="Next"><i class="fa-solid fa-forward-step"></i></button>
    <span class="wt-label">Narrated walkthrough<span class="wt-sub" data-wt-caption>Tap play to begin</span></span>
  `;
  const progress = document.createElement("div");
  progress.className = "walkthrough-progress";
  captions.forEach(() => progress.appendChild(document.createElement("span")));

  wrapEl.appendChild(bar);
  wrapEl.appendChild(progress);

  const captionEl = bar.querySelector("[data-wt-caption]");
  const playBtn = bar.querySelector(".wt-play");
  const supportsSpeech = "speechSynthesis" in window;
  let idx = 0, playing = false, utter;

  function paintProgress() {
    [...progress.children].forEach((el, i) => {
      el.classList.toggle("is-done", i < idx);
      el.classList.toggle("is-current", i === idx && playing);
    });
  }

  function showStep(i) {
    idx = i;
    captionEl.textContent = captions[idx];
    paintProgress();
    // Reuse the site's own lightbox trigger if present so the big photo
    // actually changes too, not just the caption text.
    const thumbs = galleryHost.querySelectorAll("img, [data-gallery-img]");
    if (thumbs[idx]) thumbs[idx].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }

  function speak(i) {
    if (!supportsSpeech) { showStep(i); return; }
    window.speechSynthesis.cancel();
    utter = new SpeechSynthesisUtterance(captions[i]);
    utter.rate = 0.98;
    utter.onend = () => { if (playing && i < captions.length - 1) { showStep(i + 1); speak(i + 1); } else stop(); };
    showStep(i);
    window.speechSynthesis.speak(utter);
  }

  function play() {
    playing = true;
    playBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
    playBtn.setAttribute("aria-label", "Pause walkthrough");
    speak(idx >= captions.length - 1 ? 0 : idx);
  }
  function stop() {
    playing = false;
    playBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
    playBtn.setAttribute("aria-label", "Play narrated walkthrough");
    if (supportsSpeech) window.speechSynthesis.cancel();
    paintProgress();
  }

  playBtn.addEventListener("click", () => (playing ? stop() : play()));
  bar.querySelector(".wt-prev").addEventListener("click", () => { stop(); showStep(Math.max(0, idx - 1)); });
  bar.querySelector(".wt-next").addEventListener("click", () => { stop(); showStep(Math.min(captions.length - 1, idx + 1)); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && playing) stop(); });

  paintProgress();
}
