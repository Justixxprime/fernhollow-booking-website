/* ============================================================
   INDEX-FEATURES.JS
   Feature 10: the "weather-reactive" hero. Honest version of what
   was asked for — a live weather API needs a paid key that can't
   be safely shipped in client-side JS on a static site, so this
   uses window.FernSolar (features.js) against the visitor's own
   local time to classify dawn/day/dusk/night and tint the hero
   with a matching gradient + label. Genuinely live and changes
   through the day; just time-of-day rather than live sky
   conditions. Uses Fernhollow's own HQ-ish coordinates (the
   Catskills, where the first cabin was) as a stand-in "home base".
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.querySelector("[data-mood-overlay]");
  const badge = document.querySelector("[data-mood-badge]");
  const label = document.querySelector("[data-mood-label]");
  if (!overlay || !window.FernSolar) return;

  const HOME = { lat: 42.1, lng: -74.3 }; // Catskills — Birch Hollow, the original cabin

  const MOODS = {
    dawn:  { gradient: "linear-gradient(180deg, rgba(233,168,120,.35), rgba(120,90,110,.15))", label: "Dawn light", icon: "fa-cloud-sun" },
    day:   { gradient: "linear-gradient(180deg, rgba(255,244,214,.12), rgba(120,150,110,.08))", label: "Daylight", icon: "fa-sun" },
    dusk:  { gradient: "linear-gradient(180deg, rgba(198,110,90,.4), rgba(30,25,60,.25))", label: "Golden hour", icon: "fa-cloud-sun" },
    night: { gradient: "linear-gradient(180deg, rgba(15,25,45,.55), rgba(5,8,18,.35))", label: "After dark", icon: "fa-moon" },
  };

  function paint() {
    const phase = window.FernSolar.phase(new Date(), HOME.lat, HOME.lng);
    const mood = MOODS[phase] || MOODS.day;
    overlay.style.background = mood.gradient;
    if (badge && label) {
      label.textContent = `${mood.label} in the Catskills right now`;
      badge.querySelector("i").className = `fa-solid ${mood.icon}`;
      badge.hidden = false;
    }
  }

  paint();
  setInterval(paint, 5 * 60000);
});
