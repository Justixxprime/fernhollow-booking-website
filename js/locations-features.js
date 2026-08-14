/* ============================================================
   LOCATIONS-FEATURES.JS
   Feature 9: the flight-path route map. Projects every stay's
   real stay.coords (lat/lng, the same data the Leaflet map above
   it uses) onto a simple equirectangular grid inside an SVG, then
   draws animated dashed arcs between consecutive stays sorted
   west-to-east — a cinematic "connect the collection" visual, not
   a real routing/flight-planning tool. Entirely separate from
   locations.js and the real Leaflet map, so it can't affect it.
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const host = document.querySelector("[data-route-map]");
  if (!host || typeof STAYS === "undefined") return;

  const points = STAYS
    .filter((s) => s.coords)
    .map((s) => {
      const [lat, lng] = s.coords.split(",").map(Number);
      return { name: s.name, region: s.location.split(",")[0], slug: s.slug, lat, lng };
    })
    .sort((a, b) => a.lng - b.lng);

  if (points.length < 2) return;

  const W = 1000, H = 562.5;
  const pad = 60;
  const lats = points.map((p) => p.lat), lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  function project(lat, lng) {
    const x = pad + ((lng - minLng) / (maxLng - minLng || 1)) * (W - pad * 2);
    // invert y: higher latitude = further north = higher on screen = smaller y
    const y = pad + (1 - (lat - minLat) / (maxLat - minLat || 1)) * (H - pad * 2);
    return { x, y };
  }

  const pts = points.map((p) => ({ ...p, ...project(p.lat, p.lng) }));

  let arcs = "";
  let dots = "";
  let labels = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.18 - 14; // gentle arc lift
    arcs += `<path class="rm-arc" d="M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}" />`;
  }
  pts.forEach((p, i) => {
    dots += `<circle class="rm-dot-ring" cx="${p.x}" cy="${p.y}" r="7" />`;
    dots += `<circle class="rm-dot" cx="${p.x}" cy="${p.y}" r="3.2" />`;
    const anchor = p.x > W - 140 ? "end" : "start";
    const dx = p.x > W - 140 ? -10 : 10;
    labels += `<text class="rm-label" x="${p.x + dx}" y="${p.y + (i % 2 === 0 ? -12 : 20)}" text-anchor="${anchor}">${p.region}</text>`;
  });

  // a small plane glyph gently gliding along the very first arc, purely decorative
  const plane = pts.length > 1
    ? `<g class="rm-plane"><animateMotion dur="9s" repeatCount="indefinite" rotate="auto"
         path="M${pts[0].x},${pts[0].y} Q${(pts[0].x + pts[1].x) / 2},${(pts[0].y + pts[1].y) / 2 - Math.abs(pts[1].x - pts[0].x) * 0.18 - 14} ${pts[1].x},${pts[1].y}" />
         <path d="M0 -4 L6 0 L0 4 L1.5 0 Z" /></g>`
    : "";

  host.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Stylized route connecting every Fernhollow stay">
      <defs>
        <radialGradient id="rmBg" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stop-color="#1D3226" />
          <stop offset="100%" stop-color="#0D1610" />
        </radialGradient>
        <linearGradient id="rmArcGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#C6A15B" stop-opacity=".2" />
          <stop offset="50%" stop-color="#E7CE9A" stop-opacity=".9" />
          <stop offset="100%" stop-color="#C6A15B" stop-opacity=".2" />
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#rmBg)" />
      ${arcs}
      ${dots}
      ${labels}
      ${window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "" : plane}
    </svg>
  `;
});
