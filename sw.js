/* ============================================================
   SW.JS — offline support
   Strategy:
   - Precache the core "app shell" (pages, CSS, JS) on install.
   - Same-origin navigations: network-first, falling back to the
     cached copy (or 404.html) when offline, so content stays
     fresh whenever there's a connection.
   - Same-origin CSS/JS: cache-first, refreshed in the background
     (stale-while-revalidate), so repeat visits feel instant.
   - Cross-origin requests (fonts, Font Awesome, Leaflet, Unsplash
     photos, the Google Maps embed) are left alone and go straight
     to the network — the browser's own HTTP cache handles those.
   Bump CACHE_VERSION any time the shell files below change
   meaningfully, so returning visitors pick up the new files
   instead of a stale cached copy.

   NOTE ON PATHS: this file lives under a project subpath on GitHub
   Pages (e.g. /fernhollow-booking-website/), not the domain root.
   Every path below is written WITHOUT a leading "/" so it resolves
   relative to this script's own location (self.location), landing
   correctly inside that subpath. A leading "/" would resolve
   against the domain root instead and silently 404 — that's what
   this whole app shell was doing until this fix.
   ============================================================ */

const CACHE_VERSION = "fernhollow-v4";

const APP_SHELL = [
  "./",
  "index.html",
  "stays.html",
  "stay-detail.html",
  "gallery.html",
  "locations.html",
  "saved.html",
  "rewards.html",
  "about.html",
  "contact.html",
  "compare.html",
  "blog.html",
  "404.html",
  "css/tokens.css",
  "css/base.css",
  "css/components.css",
  "css/pages.css",
  "js/data.js",
  "js/booking-state.js",
  "js/main.js",
  "js/cards.js",
  "manifest.json",
  "browserconfig.xml",
  "favicon.ico",
  "icons/favicon-16x16.png",
  "icons/favicon-32x32.png",
  "icons/favicon-48x48.png",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
];

// The service worker's own scope (e.g. https://…/fernhollow-booking-website/)
// gives us the subpath prefix once, so the fetch handler below can strip it
// off an incoming request's pathname and compare like-for-like, regardless
// of whether this site ends up served from a subpath or a domain root.
const SCOPE_PATH = new URL(self.registration.scope).pathname;

function relativePath(url) {
  return url.pathname.startsWith(SCOPE_PATH)
    ? url.pathname.slice(SCOPE_PATH.length)
    : url.pathname;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Precaching is best-effort: one missing/renamed file shouldn't
      // block the whole install, so each file is added individually.
      Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("404.html")))
    );
    return;
  }

  const relPath = relativePath(url);
  if (relPath.startsWith("css/") || relPath.startsWith("js/")) {
    // Network-first, not cache-first: this site is under active development,
    // and a cache-first strategy here was silently serving stale JS/CSS after
    // updates — a real fix could ship and still not show up until the cache
    // happened to be evicted. Falling back to cache only covers you offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
