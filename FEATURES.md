# Fernhollow — Features

A full list of what's on this site and how it works. Fernhollow is a
**portfolio demo**: every flow below is fully functional, but nothing
is real — no payments, no server, no email verification. Everything
persists in your own browser's `localStorage`, per device, and nowhere
else.

---

## Core booking experience

- **Browse & search** — `stays.html` lists every stay with filters
  (price, guests, amenities, region) and a sort order; `index.html`
  highlights featured stays and locations.
- **Stay detail pages** — full photo gallery with lightbox, tabbed
  Overview / Amenities / Policies / Reviews, an interactive
  availability calendar, and a live booking summary.
- **Booking flow** — `booking.html` walks through dates → guest
  details → review → confirmation (`confirmation.html`), with a
  real (fake-data) price breakdown including service fee and tax.
- **Trip planner** (`trip.html`) — add multiple stays to one trip,
  set dates per stop, and see a combined total. Now also holds
  **experiences** (see below) in the same running total.
- **Compare stays** (`compare.html`) — put two or three stays
  side-by-side on price, guests, amenities.
- **Find Your Stay quiz** (`quiz.html`) — a few questions, one
  recommended stay at the end.
- **Reviews** — star ratings, written reviews, and a rating
  breakdown per stay; you can leave your own (stored locally).
- **Saved stays** (`saved.html`) — heart/bookmark any stay.
- **Manage a booking** (`manage-booking.html`) — look up a booking by
  confirmation code.
- **Host dashboard** (`host-dashboard.html`) — a demo host's-eye view:
  occupancy chart, upcoming bookings, stats.
- **Gift a stay** (`gift.html`) — generate a single-use gift code for
  a fixed amount.
- **Rewards** (`rewards.html`) — points, tiers, and booking history
  tied to the demo account.
- **Account** (`account.html`) — fake sign-in/sign-up (no email
  verification, ever), gates only the final "Reserve" step; browsing,
  saving, planning, and the gift/experience tools all work signed out.

---

## Newer pages

- **Experiences** (`experiences.html`) — six bookable add-ons
  (guided hike, private chef, stargazing, guided paddle, sauna
  evening, kids' scavenger hunt), each with a real "Add to trip"
  toggle. Added items appear on `trip.html` with a quantity stepper,
  a running subtotal, and roll into the trip's combined total —
  a real cart, not a toast that forgets what happened.
- **Gift registry** (`gift-registry.html`) — group gifting for
  weddings/honeymoons/big occasions. Pick a stay and a goal amount,
  get a share code, and anyone can contribute toward it. Full CRUD:
  every registry you've created is listed below the form, and each
  one can be **edited** (occasion/goal), **deleted**, or have its
  **contributions** reviewed — not just created once and forgotten.
- **Sustainability** (`sustainability.html`) — the off-grid/dark-sky
  story behind the collection, with animated stats.
- **Press** (`press.html`) — a fact sheet, brand assets, and a press
  contact.
- **Journal feature story** (`journal-feature.html`) — a cinematic,
  scroll-revealed long-form piece (a year at one cabin, told in four
  seasonal chapters), linked from `blog.html`.

---

## The ten "cinematic" upgrades

All ten avoid any paid API — no key is shipped in client-side code on
a static site, so anything that would normally need one (weather,
a real AI model) is substituted with something computed honestly
instead, explained inline in each case.

1. **Cinematic scroll-reveal** — a slower, "mask" style reveal
   (`[data-cinematic]`) used for hero-weight moments, on top of the
   site's existing lighter scroll-fade.

2. **AI concierge chat** — a lantern-glow chat bubble on every page
   (bottom-right by default). Matches what you ask ("somewhere with
   a hot tub under $300", "best for 6 guests near a lake") against
   the real stay catalogue with keyword rules — clearly labeled as a
   rule-based demo, not a live language model. **Draggable**: click
   and drag the bubble anywhere on screen; it remembers where you
   left it (per device) across every page, so it never has to sit on
   top of something else.

3. **Parallax cabin hero** — on each stay's page, a depth-layered
   establishing shot above the photo gallery, using the stay's own
   first photo.

4. **Golden-hour countdown** — a live countdown to the next sunrise
   or sunset, computed for that stay's actual coordinates using a
   real solar-position formula (not an API) — genuinely accurate,
   not decorative.

5. **Ambient soundscape** — a "Listen to [location]" toggle that
   synthesizes wind-through-canopy ambience and soft chimes with the
   Web Audio API, live, with no audio files to host.

6. **Price heat calendar** — a five-week color-coded preview of
   demand/pricing per stay (separate from the real interactive
   booking calendar below it).

7. **Constellation night-sky overlay** — "See tonight's sky," a
   full-screen procedural star field seeded to that stay, honestly
   framed as a stylized impression rather than real astronomy.

8. **Voice-guided walkthrough** — narrates through a stay's photos
   using the browser's own text-to-speech (`speechSynthesis`), no
   narration files needed.

9. **Flight-path route map** (`locations.html`) — an animated SVG
   connecting every real stay location with soft dashed arcs,
   projected from their actual coordinates.

10. **Time-of-day mood hero** (`index.html`) — the homepage hero tints
    for dawn/day/dusk/night based on real local time at the
    collection's home base, a genuine substitute for live weather
    (which would need a paid key this demo doesn't ship).

---

## Site-wide polish

- **Dark / light theme toggle** with a lantern-lit label that names
  whichever mode you're in.
- **Full responsive pass** — phones, tablets/iPads, and small
  laptops, including fixing a header breakpoint gap that broke
  specifically on iPad-Pro-landscape-sized screens.
- **Accessibility page** (`accessibility.html`) and semantic,
  keyboard-navigable markup throughout.
- **Print styles** for booking confirmations.
- **404 page** (`404.html`) and **sitemap** (`sitemap.html` /
  `sitemap.xml`).

---

## What's real vs. simulated

Everything above genuinely runs — nothing is a static mockup. The
honest caveats:

| Feature | What it really does | What it doesn't do |
|---|---|---|
| Payments / booking | Full flow, real math, persisted state | No real charge, ever |
| Account sign-in | Real local session, gates only "Reserve" | No email verification, no server |
| AI concierge | Real keyword matching against live stay data | Not a live language model |
| Weather / mood hero | Real sunrise/sunset math for the date & place | Not live sky conditions |
| Night-sky overlay | Real, seeded-per-stay procedural stars | Not a real star chart |
| Gift registry / experiences | Real, editable, persisted carts | No shared/synced backend — per-device only |
