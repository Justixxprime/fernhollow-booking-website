/* ============================================================
   LOCATIONS.JS
   ============================================================ */

function initLocationsPage() {
  const mount = document.querySelector("[data-location-rows]");
  const seenStates = new Set();
  mount.innerHTML = STAYS.map(
    (stay) => {
      const state = stay.location.split(",").pop().trim();
      const slug = slugifyState(state);
      // Only the first stay in a given state gets the anchor id — a state
      // with two stays (New York, California) would otherwise produce two
      // elements sharing the same id, which is invalid HTML and makes
      // anchor-jump behavior unreliable across browsers.
      const idAttr = seenStates.has(slug) ? "" : ` id="state-${slug}"`;
      seenStates.add(slug);
      return `
    <div class="location-row" data-reveal${idAttr}>
      <div class="location-media">
        <img src="${stay.images[0]}" alt="${stay.location}" loading="lazy">
      </div>
      <div>
        <p class="eyebrow">${stay.location}</p>
        <h2 style="font-size:1.7rem;margin-top:10px;">${stay.name}</h2>
        <p style="color:var(--text-on-light-soft);margin-top:12px;max-width:52ch;">${stay.blurb}</p>
        <div style="display:flex;gap:18px;margin-top:18px;">
          <a href="stay-detail.html?stay=${stay.slug}" class="btn btn-primary">View stay</a>
          <span class="rating" style="align-self:center;">★ ${stay.rating} <span style="font-weight:400;color:var(--text-on-light-soft);">(${stay.reviews} reviews)</span></span>
        </div>
      </div>
    </div>`;
    }
  ).join("");

  renderAllStaysMap();
  renderRegionStats();
  renderStateChips();
}

function slugifyState(state) {
  return state.toLowerCase().replace(/\s+/g, "-");
}

/* Real numbers pulled from STAYS, not hand-typed, so they can't go
   stale the way the hero copy kept doing every time the collection grew. */
function renderRegionStats() {
  const mount = document.querySelector("[data-region-stats]");
  if (!mount) return;
  const states = [...new Set(STAYS.map((s) => s.location.split(",").pop().trim()))];
  const prices = STAYS.map((s) => s.price);
  const ratings = STAYS.map((s) => s.rating);
  const cards = [
    { icon: "fa-house-chimney", title: `${STAYS.length} stays`, text: `Spread across ${states.length} states, from Pacific coastline to Appalachian ridgelines.` },
    { icon: "fa-map-location-dot", title: `${states.length} states`, text: `Farthest east in Maine, farthest west on the California coast.` },
    { icon: "fa-sack-dollar", title: `${money(Math.min(...prices))}–${money(Math.max(...prices))}`, text: "Nightly rate range across the whole collection." },
    { icon: "fa-star", title: `${Math.min(...ratings)}–${Math.max(...ratings)}★`, text: "Guest rating range, every stay clears 4.6." },
  ];
  mount.innerHTML = cards.map((c) => `
    <div class="feature-card">
      <i class="fa-solid ${c.icon}" style="font-size:1.3rem;color:var(--brass-dark);"></i>
      <h3 style="margin-top:12px;font-size:1.05rem;">${c.title}</h3>
      <p style="margin-top:6px;font-size:.88rem;color:var(--text-on-light-soft);">${c.text}</p>
    </div>`).join("");
}

function renderStateChips() {
  const mount = document.querySelector("[data-state-chips]");
  if (!mount) return;
  const states = [...new Set(STAYS.map((s) => s.location.split(",").pop().trim()))].sort();
  mount.innerHTML = states.map((state) => `<a href="#state-${slugifyState(state)}" class="chip">${state}</a>`).join("");
}

/* One real, pannable/zoomable map with a pin for every stay — replaces
   the old single static Google embed. Uses Leaflet + OpenStreetMap tiles,
   which need no API key, so this works straight out of the box. */
function renderAllStaysMap() {
  const mount = document.querySelector("[data-map-all]");
  if (!mount) return;

  // Shown immediately so the map area is never a mysterious blank box —
  // replaced the moment Leaflet successfully takes over the container.
  mount.innerHTML = `
    <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--text-on-light-soft);">
      <i class="fa-solid fa-map-location-dot" style="font-size:1.6rem;"></i>
      <span style="font-size:.85rem;">Loading the map…</span>
    </div>`;

  if (typeof L === "undefined") {
    mount.querySelector("span").textContent = "Map couldn't load, check your connection and refresh.";
    return;
  }

  mount.innerHTML = "";
  let map;
  try {
    map = L.map(mount, { scrollWheelZoom: false }).setView([39, -96], 4);
  } catch {
    mount.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-on-light-soft);font-size:.85rem;">Map couldn't load, check your connection and refresh.</div>`;
    return;
  }
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 12,
  }).addTo(map);

  const bounds = [];
  STAYS.forEach((stay) => {
    const [lat, lng] = stay.coords.split(",").map(Number);
    bounds.push([lat, lng]);
    const icon = L.divIcon({
      className: "",
      html: `<div class="map-pin-price">${money(stay.price)}</div>`,
      iconSize: null,
    });
    L.marker([lat, lng], { icon }).addTo(map).bindPopup(`
      <div style="display:flex;gap:10px;align-items:center;min-width:180px;">
        <img class="map-pin-thumb" src="${stay.images[0]}" alt="">
        <div>
          <b style="display:block;font-size:.85rem;">${stay.name}</b>
          <span style="font-size:.76rem;color:var(--text-on-light-soft);">${stay.location}</span><br>
          <a href="stay-detail.html?stay=${stay.slug}" style="font-size:.78rem;font-weight:700;">View stay →</a>
        </div>
      </div>
    `);
  });
  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });

  // Leaflet's well-known gotcha: if the container's real size wasn't
  // settled at the moment L.map() ran (fonts/layout still shifting),
  // tiles can render into the wrong area, looking like broken empty
  // space. Re-checking the size shortly after load fixes that.
  setTimeout(() => map.invalidateSize(), 300);
}

document.addEventListener("DOMContentLoaded", initLocationsPage);
