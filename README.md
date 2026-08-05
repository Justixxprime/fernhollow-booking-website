# Fernhollow — booking site demo

## Round 28 — account icon bug fixed, Rewards moved into Explore, custom confirm dialogs, header/hero blend, redesigned printables

**Found the real cause of "account icon isn't showing," confirmed by screenshot.** The header row (Home, Stays, Explore▾, Saved, Rewards, About, Contact, plus Search/currency/CTA/theme/account in nav-cta) was wider than the site's 1240px container at common desktop widths, and with `overflow-x:hidden` on `body`, anything that overflowed wasn't scrolled to — it just vanished. Moving **Rewards into the Explore dropdown** (also explicitly requested) removes roughly 100px from the row, which should resolve this at most normal desktop widths without needing a more invasive restructure.

**Every native `confirm()` on the site replaced** with a real designed dialog — new `confirmDialog()` in `main.js`, built from the same `.modal-overlay`/`.modal-card` component as the upsell modal and keyboard shortcuts help, Promise-based so call sites just add `await`. No more raw browser popups showing the page's `127.0.0.1:5500` URL next to a designed site. Covers all 4 previous `confirm()` call sites: delete account, clear booking history, reset gift balances, cancel a booking.

**Header/hero "seam" softened — universally, not just the homepage.** Turned out every interior page had the same issue as the photo hero: a solid dark header sitting directly above a plain light `page-hero` with no blend at all. Added a soft gradient fade beneath the header (fades to transparent once scrolled) that bridges into whatever follows on any page, rather than restructuring the header to overlay hero content, which would've been a much riskier change across every page for a mostly-cosmetic ask.

**Printables actually redesigned, not just stripped down.** `confirmation.html` and `trip.html` now get a real branded letterhead when printed (logo, document title, print date) and print.css was rebuilt with real typography (serif throughout), a consistent brass accent color, bordered/radius'd cards instead of bare stripped divs, and a quiet footer disclosure note on every printed page.

## Round 27 — 2 more real unique photos

Continued the standing photo-sourcing task: Sierra Hollow Chalet and Shoal Creek Cabin now have real, verified, unique exterior photos (both confirmed free-license, not Unsplash+). The Shoal Creek one is a genuine match, not just a generic placeholder — a small cabin photographed near Mount Hood, Oregon, tagged "pacific northwest" and "pnw," for a stay whose actual listed location is the Willamette Valley, Oregon.

7 of 18 stays now have unique thumbnails, up from 5. 11 to go.

## Round 26 — nav crowding fixed, animated mobile menu with more ways out

**Found the actual bug behind "account button isn't visible well."** The currency toggle's "🇺🇸 USD" was a single text node with no `white-space:nowrap` — under any width pressure, the browser was free to wrap the line between the flag and the currency code, which is exactly the "US / EUR" stacked-in-a-pill look from the screenshot. Fixed, and gave the account/theme icons `flex:none` so they can never get squeezed by a crowded row. Also added a visual divider between the "Check availability" action and the theme/account utility icons — the row was previously six ungrouped items in a line with nothing distinguishing "things you click to do something" from "things you click to change a setting."

**Mobile menu, redone properly:**
- The hamburger icon is real animated bars now (three `<span>`s, not a static SVG) that morph into an X on open — CSS-only, respects `prefers-reduced-motion`.
- Smoother open/close transition (slight scale added alongside the fade/slide, longer duration, softer easing curve).
- More ways to close it, since a full-screen menu with exactly one obvious exit feels a bit like a trap: the X (toggle again), Escape (already existed, wired through the same focus-trap as other overlays on the site), tapping any link, tapping the header bar itself outside the menu button, and a swipe-up gesture on touch.

Rolled out identically across all 23 pages via script — spot-checked the output on `index.html` to confirm the divider and animated toggle both render as intended before shipping.

## Round 25 — reset controls for booking history and gift balances

New "Manage your demo data" section on `account.html`, available regardless of sign-in state (booking history and gift codes are separate from the account system, not locked behind it):
- **Clear booking history** — wipes `BookingState`'s history and last-booking record. New `BookingState.clearHistory()` method. Doesn't touch an in-progress draft.
- **Reset gift card balances** — sets every gift code on this device back to its original face value, undoing whatever's been spent without deleting the codes. New `resetGiftBalances()` in `main.js`, alongside the existing `deductGiftBalance()`.

Both show a live count before you commit (how many bookings, how many codes and total remaining balance) and require confirmation before doing anything irreversible.

## Round 24 — accounts (local-only demo, same honesty pattern as everything else)

New `account.html`: sign up, sign in, sign out, delete account — a person icon next to the theme toggle in the header, added consistently across all 22 existing pages plus the new one. Logged-in state lights up in brass, matching how the "Explore" dropdown already indicates the current section.

Said plainly, in the page copy itself, not just here: **this is not real authentication.** There's no server to check a password against, so "signed in" means this specific browser has an account record in `localStorage` and a session flag in `sessionStorage` — closing the tab signs you out, same default behavior as most real sites, just without a server enforcing it. One account per browser, the same device-scoped pattern gift codes and referral codes already use elsewhere on this site. The account page says this outright before anyone types a password into it.

When logged in: an account hub links out to rewards, saved stays, the trip planner, and manage-a-booking — plus, as a genuine convenience rather than padding, the booking flow now pre-fills your name and email from the account if you're signed in (only filling blanks, never overwriting a draft already in progress).

## Round 23 — gift cards that actually work at checkout, real email via Web3Forms

**Gift card balance now genuinely deducts at checkout.** New "Have a gift code?" field on the booking review step validates against real stored codes, shows the discount as its own line in the price breakdown, and — this is the part that matters — actually deducts the used amount from that code's balance on successful booking, not just a one-time redeemed/unredeemed flag. A $100 card used on a $60 booking now correctly leaves $40 for next time. Shows on the confirmation page too.

**Downloadable receipts already existed** — confirmation.html's "Print receipt" button already used `window.print()`, which is the standard way to get a PDF without a backend (browsers' print dialog has a Save as PDF destination). Just relabeled it so that's obvious.

**Real email sending via Web3Forms**, a free (250/month) form-to-email service that needs no backend — its access key is meant to be public/client-side by design, not a secret. Wired into two places:
- `gift.html` — optionally emails the gift code straight to the recipient
- `contact.html` — the contact form actually sends now, instead of just showing a success message and going nowhere

Both need a real access key from web3forms.com pasted into a clearly-marked constant at the top of the relevant script (`WEB3FORMS_ACCESS_KEY` in `gift.js`, `CONTACT_WEB3FORMS_KEY` in `contact.html`) before they'll deliver actual mail — until then they fail gracefully with an honest toast rather than pretending to have sent something. Getting a key takes about a minute and doesn't require adding a backend.

**Also shipped this round** (compare tray, 404 live search, flexible date search, printable trip itinerary, reviews with photo attachments): see the code — all six were finished and validated before this round started.

**Login/accounts**: not done yet. Scoped as a local-only demo account system (email/password stored in `localStorage`, clearly not real authentication, consistent with how gift codes and referral codes already work) — next up.

## Round 22 — the counter, back and actually bulletproof this time

Third design of this same feature. v1 (scroll-triggered only) could get stuck at 0. v2 (added a fallback timer) fixed that but introduced a race condition that caused the flickering. v3, here: exactly one trigger point — runs immediately on script execution, no scrolling involved at all. There's no second timer to race against because there's nothing else that could possibly call it. Either this line of code runs and the numbers count up, or they don't and the real values already sitting in the HTML (not "0" — a lesson from v1) are what's shown. No third state exists for it to get stuck in.

## Round 21 — stat strip redesign (no more counter fragility), nav dropdown for 7 pages

**Stats strip rebuilt from the ground up.** After three straight rounds of bugs tracing back to the scroll-triggered count-up animation (stuck at zero, then a race-condition glitch), made the call to remove that entire mechanism rather than patch it a fourth time. The real numbers are now in the HTML from the start — correct even with zero JS — with a new visual identity instead: icon badges in a brass gradient circle per stat, a subtle radial glow background, and a staggered fade-up entrance on load (pure CSS, no IntersectionObserver, no timing dependency, nothing left to race). `countUp()` removed from `main.js` entirely.

**Navigation reorganized with a real dropdown.** The site had grown to 22 pages, but the nav only surfaced 7 — Gallery, Locations, Compare, Find Your Stay, Trip Planner, Gift a Stay, and the Journal were footer-only, easy to miss. Added an "Explore" dropdown (new `.nav-dropdown` component, click-to-open, closes on outside click/Escape, degrades to an inline expandable section in the mobile full-screen menu) holding all 7. Rolled out identically across all 22 pages via script, with correct `aria-current` state per page — including the dropdown trigger itself highlighting in brass when you're on one of its pages, not just the specific link.

## Round 20 — two real, confirmed bugs: the "jump to state" gap, and the stat glitch race condition

**"Jump to a state" was landing on a permanently invisible section.** Root cause, found by reading `main.js`'s scroll-reveal system carefully: it runs a one-time `querySelectorAll("[data-reveal]")` at script-parse time — before `locations.js` has even run. `.location-row` elements are created dynamically, after that point, so they were never handed to the IntersectionObserver, meaning they stayed at their CSS default of `opacity:0` forever. The rows were real, took up real layout space, and were completely invisible — exactly matching "big empty section." Fixed with a MutationObserver that catches anything added later, site-wide, not just on this one page — `blog.js` had independently hit the same bug in an earlier round and worked around it locally (forcing instant visibility, skipping the fade-in) rather than fixing the root cause; that workaround is now redundant but harmless. Also fixed a real but separate issue found in the same area: New York and California each have 2 stays, which meant two elements were getting the identical `id="state-..."` — invalid HTML. Only the first stay per state gets the anchor now.

**The stat "glitching" was a race condition in my own Round 16 fix.** Tracing `countUp()` line by line: the IntersectionObserver-triggered animation and the 2.5-second safety-fallback timer had no way of knowing about each other. If both fired close together, two separate `requestAnimationFrame` loops could end up running on the same number at once, each overwriting the other's `textContent` — which looks exactly like flickering. Added a guard (a `WeakSet` tracking which elements have already started) so a second trigger is a safe no-op instead of a second competing animation. Likely compounded by Round 18's service-worker fix: the original "stuck at 0" video was almost certainly showing a stale cached version of the site from *before* the Round 16 fallback existed at all; once the Round 18 fix let the newer (but still race-condition-buggy) code through, the symptom would have shifted from "permanently 0" to "glitching" — which lines up with what was reported.

## Round 19 — locations page: map resilience + real enrichment

**Map hardening**: the Leaflet map on `locations.html` had no fallback state — if Leaflet failed to load (network hiccup, ad-blocker, timing issue) it just silently left an empty 460px box with nothing explaining why. Now shows a "Loading the map…" message that either gets replaced by the real map or an honest "couldn't load, refresh" message. Also added `map.invalidateSize()` shortly after init, guarding against Leaflet's known gotcha where a container's size isn't fully settled the instant the map object is created, which can otherwise misrender tiles into a broken-looking empty area.

**Real enrichment, not just padding**: added a "Regions at a glance" stat strip (stay count, state count, real nightly price range, real rating range — all computed from `STAYS`, not hand-typed, so they can't go stale) and a "Jump to a state" chip row that anchor-links straight to that state's stays further down the page.

**Another stale count caught**: the locations page hero said "seventeen states" — actual count is sixteen. Fixed.

**Honesty note**: I worked from a description and a video I could extract frames from, not a live interactive session, so I can't promise this was the exact pixel-level bug — but the map-loading fallback and layout enrichment address the most likely causes of an empty-looking gap in that specific area, and are worth having regardless of root cause.

## Round 18 — the service worker was serving stale JS/CSS

Found from a video showing the "Average guest rating" stat permanently stuck at 0 while the other three stats worked fine — even well past when the Round 16 safety-fallback fix should have kicked in. Root cause: `sw.js` (added back in Round 13/14 for offline support) was caching JS/CSS files **cache-first** — serving whatever was already cached immediately, and only refreshing that cache in the background for the *next* load. That's a reasonable trade-off for a stable production site; it's actively hostile during development, since it means a real fix can ship and still not visibly show up in the browser for a while.

Changed JS/CSS to network-first (matching how page navigations were already handled), and bumped the cache version so anything already stuck gets evicted. **If you were testing any of the fixes from Rounds 14 through 17 and they didn't seem to take effect, this is almost certainly why** — worth doing a hard refresh (or unregistering the old service worker in DevTools → Application → Service Workers) to make sure you're seeing current code going forward.

## Round 17 — the actual "flickering" bug, found from a screenshot

A screenshot made this one obvious in seconds after two rounds of guessing: `.search-widget` (the WHERE/DATES/GUESTS bar on the homepage hero) had `background: rgba(247,243,233,.96)` — 96% opaque, not fully solid. As the hero slideshow crossfades between photos of different brightness underneath it, that remaining 4% transparency let enough of the change bleed through to visibly "breathe" with the slideshow — exactly the "disappearing and appearing when pictures are changing" being described. Same issue existed in the dark-mode override. Both fixed to fully solid backgrounds.

Lesson noted: a screenshot resolved in one look what two rounds of code-reading and static analysis couldn't. Worth asking for one earlier next time something's this hard to describe in words.

Also sourced 2 more real unique photos while continuing the photo work (mosswood-retreat, quiet-pines-cottage) — 5 of 18 stays now have a unique thumbnail, up from 4.

## Round 16 — more stale-count bugs, hero animation clarity, gallery scroll polish

**Confirmed and fixed**: two more leftover stale counts survived every earlier "twelve → eighteen" sweep — "View all 6 stays" on the homepage CTA, "12 forest locations" in the hero eyebrow text, and "Across 6 stays" on the host dashboard. All three said an old number no matter how many times the collection grew.

**Hero animation simplified**: the Ken Burns effect combined a zoom with a diagonal pan (`scale()` + `translate()` together). On reflection that's a plausible source of "motion I can't explain" — two things moving at once reads as less intentional than one. Simplified to a clean zoom only, no pan.

**Count-up stats made more defensive**: lowered the visibility threshold that triggers the animation and added a safety fallback — if the numbers are still sitting at "0" a couple seconds after load for any reason, they get set directly instead of staying stuck. I could not find a concrete root cause for stats "not being visible" through code review (the CSS itself has correct contrast, no display/opacity bugs, and static analysis found no unguarded code that would crash and halt the page's script execution before the stats code runs) — this is a real defensive improvement regardless, but flagging that it's not a confirmed bug fix the way the stale-count ones are.

**Gallery filter scroll redesigned to actually look intentional**: edge-fade masking (so it's visually obvious there's more to scroll to), scroll-snap so it settles cleanly instead of stopping mid-chip, and a thinner brass-colored scrollbar matching the site's palette instead of a plain gray default.

**Not resolved with confidence**: "the stays aren't visible" — went through `stays.js`'s render logic, the filter-restoration code from Round 14, and the actual filter-drawer markup line by line and found no crash-causing bug. Without being able to see the actual screen, I can't responsibly guess further here — the honest answer is I need more specifics (which page, what you see instead of the stay cards, whether it's every visit or intermittent) rather than more speculative fixes.

## Round 15 — gallery bug fix, 10 verified frontend improvements, homepage "What's New"

**Real bug fix, reported by the site owner**: the gallery's per-stay filter row (19 chips now, up from 7 originally) was wrapping into several lines and, being sticky, permanently ate a big chunk of the viewport — "can't see the picture grid because of the stay nav." Fixed by making that one row scroll horizontally instead of wrapping.

**Audited a fresh batch of "10 frontend improvements" against the actual code before building anything** (same discipline as Round 14, since guessing costs more than checking). Result: 2 of the original 10 candidates turned out to already exist (mobile sticky book bar, `rel="noopener"` on every external link) — replaced with two things that were actually missing. Final list, all built:
- Favicon + apple-touch-icon added consistently across all 22 pages (previously only 1 page had one)
- `scroll-margin-top` added globally so anchor jump-links don't land under the sticky header
- New back-to-top button, site-wide, reduced-motion aware, correctly offsets above the mobile sticky book bar
- Double-submit guard on the booking confirm button (previously a double-click could create two loyalty-earning booking records for one booking)
- Debounced search input on `stays.html` (was re-filtering and re-writing to `sessionStorage` on every keystroke)
- `aria-live`/`role="status"` added to toast notifications for screen readers
- Keyboard shortcuts help modal (press `?`), built dynamically so it works on every page without new markup
- `BreadcrumbList` JSON-LD, generic enough to work off any page's existing `.breadcrumb` markup, not just stay pages
- **Fixed a real bug introduced in earlier rounds**: newsletter forms on `quiz.html`, `rewards.html`, and `trip.html` were missing the attribute that makes them submit via JS — clicking Subscribe was silently reloading the page instead of showing success. Fixed on all three.
- Fixed a stale stat: the homepage said "12 forest & lake locations" through two rounds of adding stays past 12 — now correctly says 18.

**Homepage now has a "What's New" section** — reframed for guests (not the internal Round-N changelog language), highlighting the 6 new stays, the quiz, the trip planner, and rewards.

**Photo guide refreshed** (`01-image-guide.md`) to reflect the real current state: 4 of 18 stays have genuine unique photos, 14 still share the old pool, with an exact per-stay table of what's done and what's left, plus a note that this guide gets revisited any time photo work comes up — not a one-time document.

## Round 14 — real unique photos (in progress), per-stay social sharing, filter memory

**Photos**: started replacing the shared 7-photo system with genuinely unique photos per stay. This is slower than it sounds — Unsplash's page URL uses a different ID than the actual image file, so each photo has to be individually verified by fetching its page and reading the real CDN URL out of the `og:image` tag; there's no bulk shortcut. 4 of 18 stays now have fully real, unique, verified-free photos (birch-hollow-aframe, lantern-lake-cabin, cinder-peak-lodge, maplewood-farmhouse), with 2 more photos placed toward a 5th. One candidate photo was caught and rejected mid-way because it turned out to be a paid Unsplash+ photo, not the free tier — worth mentioning since it's exactly the kind of mistake that would've quietly broken hotlinking. The remaining 14 stays still share the old photo pool; continuing this is straightforward but slow, same method, one stay at a time.

**Per-stay social sharing**: `og:image`, `og:title`, `og:description`, and their twitter: equivalents on the stay detail page were static and identical for all 18 stays — a link to any stay looked the same when shared. Now set dynamically per stay via a new `renderMetaTags()` in `stay-detail.js`.

**Filter memory on `stays.html`**: sort, price, minimum rating, minimum guests, and amenity filters are now persisted to `sessionStorage` and restored on load — including syncing the actual filter-drawer controls (slider position, active buttons, checked boxes), not just the internal state object, since this codebase reads filter values from the DOM controls, not the other way around. Previously a reload (or a browser that doesn't keep the page in its back-forward cache) silently reset everything except mood and search text.

**Also audited the full "10 frontend improvements" list against the actual code before touching anything** — turned out skeleton loading, the sticky filter bar, count-up stats, empty/error states, focus-visible outlines, hero layout-shift prevention, and the print stylesheet were already built in earlier rounds. Card hover video previews are still not done — that one genuinely needs real video assets, which don't exist yet.

## Round 13 — trip planner (the "multi-stay cart," scoped honestly)

The last big item from the original "deliberately not built" list: **`trip.html`**, a multi-stay itinerary. A new suitcase icon next to the share button on every stay page adds that stay to a running trip; the trip page lists every stop with its own real date-picker (the same popover component used on the stay detail page), a per-stop subtotal, and one combined total across the whole trip.

Deliberately **not** a shared cart-and-checkout: each stop's "Continue to book" hands off into the existing single-stay booking flow via `BookingState`, because combining several stays into one real payment would need an actual backend to hold that multi-item order — something the rest of this project has been honest about not having. The page says this outright rather than implying a checkout that doesn't exist.

Also added: a shared `TripPlanner` store in `main.js` (mirrors the existing `SavedStays` pattern), and extended `showToast()` to support a custom action-button label (it was hardcoded to "Undo"), used here for a "View trip" action after adding a stop.

**Now genuinely nothing meaningful is left on the "deliberately not built" list that doesn't require a real backend.** What's left — live weather, seasonal theming, custom cursor — is polish rather than functionality, and payments/accounts/a database remain the one dependency everything else has been working around.

## Round 12 — split-cost calculator, referral program, upsell modal

Three more items off the "still not built" list:

- **Split-cost calculator** on the stay detail page's booking summary — once dates are picked, a stepper lets you divide the total across however many people are actually paying, defaulting to the guest count.
- **Referral program** on the rewards page — every browser gets a persistent referral code (`FH-REF-XXXXX`) with a copy button, plus an "apply a friend's code" form that awards a one-time bonus. Honestly scoped: since there's no shared server, credit only works within one browser, which the page says outright rather than pretending otherwise.
- **Upsell modal** in the booking flow — if a guest reaches "Review and confirm" on step 2 with no add-ons selected, one well-chosen suggestion (the breakfast basket) appears once in a real modal (new `.modal-overlay`/`.modal-card` components, dismissible by backdrop click or Escape) before continuing. Accepting checks the actual add-on checkbox rather than silently adding a hidden line item.

**Still not built, on purpose**: multi-stay cart, gift-a-stay's real cross-device redemption, live weather, seasonal theming, custom cursor, and the real backend/payments everything above still ultimately wants.

## Round 11 — 6 more stays (18 total), plus a mobile-responsiveness pass

**6 new stays**, bringing the collection to eighteen: Cypress Spring Ranch (Hill Country, Texas), Cliffside Cypress Cottage (Central Coast, California), Copper Harbor Cabin (Upper Peninsula, Michigan), Shenandoah Ridge Cabin (Shenandoah Valley, Virginia), Presidential Range Cabin (White Mountains, New Hampshire), Sawtooth Basin Cabin (Sawtooth Mountains, Idaho). Same full schema as every other listing, plus matching `THINGS_TO_DO` entries for all 6 new regions — 18 regions covered now, one per stay. All "twelve..." copy updated to "eighteen..." site-wide; About page's timeline got a genuine 5th milestone instead of just renaming the old one.

**While in there**: found and fixed a handful of grid layouts (this round's new timeline/gift-amount/journal-teaser sections, plus two pre-existing ones — the stay-detail reviews grid and the blog-post "more posts" grid) that were hardcoding `grid-template-columns` inline with no mobile breakpoint, meaning they'd stay locked at desktop column counts on a phone. Replaced with proper CSS classes (`.timeline-grid`, `.gift-amount-grid`, `.blog-teaser-grid`, `.reviews-grid`) that each collapse to fewer columns at the appropriate breakpoints.

## Round 10 — "Find your stay" quiz, Gift a Stay

Two more items off the "still not built" list from Round 9:

- **`quiz.html`** — a real 4-question quiz (mood, group size, budget, pets) built on the existing `.radio-card` and step-progress components from the booking flow, scored against actual `STAYS` data (mood match weighted highest, group/budget as soft filters, rating as a tiebreaker) rather than a canned mapping. Shows a top match plus two alternates. Linked from the homepage's "Explore by mood" section and every page footer.
- **`gift.html`** — generate a demo gift code for a chosen or custom amount, stored in `localStorage`, plus a "check a code" flow that looks it up and reports its value. Clearly labelled as demo-only: no real charge, and checking a code confirms validity without silently pretending to apply it to a live checkout that doesn't exist yet.

**Still not built, on purpose**: multi-stay cart, referral codes, upsell modals, split-cost calculator, live weather, seasonal theming, custom cursor, and the real backend + payments that would make gift codes and bookings actually persist across devices instead of one browser's `localStorage`.

## Round 9 — a real bug fix, 6 new stays, and most of the "deliberately not built" list

**The bug**: the homepage search-suggestions dropdown was getting clipped by `.hero`'s `overflow: hidden` (there to contain the background Ken Burns zoom) — only the top sliver of the dropdown was visible before the stats section cut it off. Fixed by moving the clip to `.hero-media` specifically, so the hero itself no longer traps its own children.

**6 new stays**, bringing the collection to twelve: Maplewood Farmhouse (Vermont), Shoal Creek Cabin (Oregon), Silverpine Lodge (Colorado), Loon Point Cottage (Maine), Bitterroot Homestead (Montana), Cranberry Bog Cabin (Wisconsin) — each with full descriptions, amenities, house rules and reviews matching the existing schema. All site copy referencing the old count ("Six boutique...") updated site-wide.

**From the "deliberately not built" list in Round 8**, most of what was realistic without a real backend:
- **Review-submission form** on every stay page — visitors can post a star rating + review, stored to their own browser and merged live into the review list, clearly labelled as device-local, not shared.
- **Rating-category breakdown** (Cleanliness/Location/Value/Accuracy) per stay, derived deterministically from the overall rating using the same seeding pattern as the existing trust line.
- **Price-history sparkline** — a small inline SVG chart, explicitly labelled as illustrative demo data, not a live feed.
- **Waitlist / "notify me"** form for when a stay's dates don't work.
- **Things-to-do-nearby widget** — curated per-region activity suggestions (12 regions covered), editorial content clearly labelled as such rather than dressed up as a live places feed.
- **Loyalty/rewards program** (new `rewards.html`) — three real tiers computed from actual booking history, not a static mock. This required extending `BookingState` to keep a full `getHistory()` array instead of just the single most recent booking.
- **Real interactive maps** — replaced the single static Google Maps embed on `locations.html` (and the per-stay embed on the stay detail page) with Leaflet + OpenStreetMap tiles, which need no API key. All twelve stays now get real pins with price-tag markers and popups on one pannable/zoomable map; dark mode gets its own tile-inversion filter to match the existing iframe treatment.
- **Offline support** — a real `sw.js` service worker (network-first for pages, stale-while-revalidate for CSS/JS, same-origin only) registered from `main.js`, working off the PWA manifest that was already in place from Round 8.

**Richer homepage and About page**: a "From the journal" section pulling real posts from the existing blog data, an FAQ preview (reusing the exact copy from the full FAQ so nothing contradicts itself), and on About, a "how a stay makes the cut" criteria section plus a real founding timeline.

**Still not built**, on purpose: multi-stay cart, gift-a-stay, referral codes, upsell modals, the "find your stay" quiz, split-cost calculator, live weather, seasonal theming, custom cursor — and the big one, a real backend with payments (Stripe et al.), accounts, and a database. Everything above is genuinely realistic to add without one; that last item isn't.

## Round 8 — the big batch: SEO, accessibility, 7 new pages, discovery features

This was a large ask (~50 feature ideas across three rounds), so here's an honest account of what actually shipped vs. what didn't, plus two real bugs found while building it.

**SEO & technical foundation**
- Open Graph + Twitter card meta tags, `schema.org/LodgingBusiness` structured data per stay, `sitemap.xml`, `robots.txt`, `manifest.json` (installable as a PWA), preconnect hints, responsive `srcset` on card photos.

**Accessibility**
- Real focus-trapping for the mobile menu and the lightbox (Tab can no longer escape into hidden content behind them), shared between both via one `trapFocus()` utility.
- `aria-live="polite"` on both price-breakdown regions, so a screen reader announces the new total the moment dates are picked, not just visually.
- New `accessibility.html` statement page, honestly written, not just decorative.

**7 new pages**: a Journal/blog (3 real posts, tag filtering), a stay Compare tool (pick 2-3, see them side by side), a Manage-booking lookup by confirmation code, a mock Host dashboard (bookings, occupancy chart, revenue), an Accessibility statement, and a human-readable Sitemap.

**Discovery & personalization**: recently-viewed stays and "because you saved X" recommendations on the homepage (both from localStorage, both hide themselves entirely until there's real data to show), a full **Cmd+K command palette** searching stays and pages, and an **advanced filter drawer** on the browse page (price slider, minimum rating, guest count, amenity checklist).

**Booking flow extras**: countdown timer to check-in and a scannable **QR code** on the confirmation page, an **undo** button on the "removed from saved" toast, a savings badge on higher-priced cards, a trust line ("12 people looked at this today") seeded deterministically per stay per day so it doesn't look like it's lying to you, a share button (native share sheet on mobile, clipboard copy on desktop).

**Two real bugs found while building this, not before shipping it**:
1. The new cookie-consent banner was given `z-index: 250`, higher than the date-picker popover's `120` — so once both were on screen, the banner silently ate clicks meant for the calendar, and picking a checkout date stopped working entirely on any page where the banner hadn't been dismissed yet. Audited every z-index on the site and fixed the stacking order properly rather than just bumping one number.
2. The new filter drawer, sitting off-screen via `transform` when closed, was inflating `document.body.scrollWidth` even though it caused zero actual visible or scrollable problem (`body` already clips with `overflow-x: hidden`). Verified with a real `window.scrollTo()` test that nothing was actually scrollable, then added `overflow: hidden` to the drawer's container as a defensive fix anyway.

**Deliberately not built**, to be upfront about scope: multi-stay cart, gift-a-stay, loyalty points, referral codes, upsell modals, review-submission form, the "find your stay" quiz, waitlist notifications, split-cost calculator, weather/things-to-do widgets, price-history sparklines, seasonal theming, custom cursor, and offline/service-worker support. Every one of those is realistic to add, just genuinely more than fits in one pass — happy to keep going on any of them specifically.

## Round 7 — dark mode contrast bugs, 3D motion, print receipt, footer polish

Real bugs found with an automated contrast scanner (walks every leaf text node in dark mode, computes its actual rendered foreground/background luminance ratio, flags anything under a safe threshold) rather than eyeballing pages one at a time:

- **`.card-badge`** ("Guest favourite", "Rare find" pills on photos): had a hardcoded light background paired with a theme-aware text color, so when dark mode flipped that text color to light too, it became light text on a light pill, invisible. Fixed by giving it a permanently-dark ink color, since that pill is always on a light chip regardless of site theme.
- **`.filter-bar`** (the sticky bar with search/sort on the browse page) and **`.tab-nav`** (Overview/Amenities/etc. on the stay page): both had hardcoded light backgrounds that never inverted for dark mode, while their text did, silently. Added proper dark-mode overrides for both.
- **Map embeds**: gave them a themed placeholder background instead of a blank white box while loading, and an inversion filter in dark mode so Google's default light map tiles don't look like a hole punched in the page.
- Ran the scanner across all 10 pages afterward: zero contrast issues remaining.

New:

- **3D tilt on hover** for stay cards, feature cards, and mood tiles — tracks the cursor and tilts the card toward it like a physical object, pure CSS transform, skipped automatically on touch devices and for reduced-motion preference.
- **3D logo spin** on hover, **icon pop/rotate** animations on amenity and fact icons throughout, a **diagonal light-sweep** across card photos on hover.
- **Print receipt** button on the confirmation page, with a dedicated print stylesheet that strips the header, footer, and buttons and formats the booking as an actual clean receipt on paper.
- **Footer rebuilt for both breakpoints**: link hover now has a sliding arrow, columns stack cleanly on mobile instead of just going to two, credit and newsletter sections switch to a proper stacked layout under 700px instead of squeezing.

## Round 6 — the full feature batch: dark mode, saved stays, live search, card animation

New, real functionality:

- **Dark/light theme toggle** in the header, persisted, with a tiny inline script in `<head>` so there's no flash of the wrong theme on load.
- **Saved stays page** (`saved.html`) with an empty state, plus a live count badge in the nav that updates the moment you tap a heart, anywhere on the site.
- **Live search-as-you-type** on the homepage's "Where" field, suggests matching stays as you type and jumps straight there; the stays browse page also now has its own search box and reads a `?q=` from the URL.
- **Animated, formatted card payment fields**: card number auto-spaces in groups of four and detects Visa/Mastercard/Amex/Discover live, expiry auto-inserts the slash, CVC is digits-only, the whole block expands/collapses smoothly depending on which payment method is selected.
- **Count-up numbers** on the homepage stats strip, a **slow parallax drift** on the hero photo as you scroll, and **staggered entrance animation** on every card grid.
- **Skeleton loading shimmer** on card grids before they render (brief and honest, since the data's actually local, not hiding real network time).
- **Richer amenities**: every amenity now gets its own matched icon and category grouping, dedicated pet-friendly banner.
- The stay detail page's **Availability tab is a real calendar** now, not a picture of one, shares state with the booking summary live.

Bug found and fixed while wiring the above up: adding the new theme-toggle button pushed the mobile header over its available width, because the primary CTA button was never actually hidden on small screens (a leftover `.btn-lg` selector that didn't match the site's actual `.btn-sm` button, so the hide rule silently never fired). Also found and fixed two smaller overflow edge cases at 320px width — a footer grid with too little room for two columns, and a contact-page email address long enough to force its flex row wider than the screen. Ran a full 11-page × 5-width regression (320 to 1440px) after every change; everything passes clean now.

## Round 5 — the actual gallery bug, a real Availability calendar, richer amenities

- **Found the real cause of the duplicated "big picture" under the gallery grid:** a CSS ordering mistake. The rule that hides the mobile gallery on desktop (`@media (min-width: 761px)`) was written *before* the base rule that makes the mobile gallery visible in the first place — and in CSS, when two rules have equal specificity, whichever comes later in the file wins, regardless of which one is inside a media query. So the "always visible" rule was quietly overriding the "hide it on desktop" rule on every screen. Reordered them; verified across four widths (1400/900/550/390px) that exactly one gallery view renders, never both.
- **The Availability tab is now a real calendar, not a preview.** Every day cell is clickable, shares the exact same state as the sticky booking summary, so picking dates there updates the price and Reserve button immediately, and it has proper month navigation instead of a fixed two-month snapshot.
- **Amenities got real icons per item** (wifi, fireplace, hot tub, kitchen, parking, and more, individually matched) instead of one generic checkmark repeated for everything, and are grouped into categories (Comfort, Kitchen, Outdoors, Practical) when expanded.
- **Pet-friendly stays now show a dedicated highlighted banner** in the policies section, not just a small chip you could easily miss.
- Font Awesome icons added to policies (check-in/out, smoking, events, age) to match the rest of the site.

## Round 4 — the actual root cause of the date-picker problems

Two real, distinct bugs, both now fixed at the root:

1. **The homepage's "floating calendar" was being clipped by the hero itself.** The hero uses `overflow: hidden` to crop its slow photo crossfade, and the calendar popover was being appended *inside* the hero as a child element — so any part of it extending past the hero's own bottom edge was silently cut off by that same `overflow: hidden`, landing it visually "under" the stats strip that comes right after. Confirmed by hit-testing the exact pixel where the calendar should have been: it was the stats strip painting there, not the calendar.

2. **On the stay page's mobile bottom bar, tapping "dates" opened the calendar anchored at (0,0)** instead of near your thumb. The mobile bar's date button was just forwarding its click to the desktop-only check-in field to reuse its logic — but that field is `display: none` on phones, and a hidden element has a zero-size bounding box, so the calendar had nothing real to measure itself against and fell back to the top-left corner of the screen. Gave the mobile bar its own real, independently-positioned popover instead of borrowing a hidden one.

**The actual fix, not a patch:** the calendar popover now always attaches directly to `<body>` with `position: fixed`, positioned in plain viewport coordinates, and every real trigger (home search, check-in field, check-out field, mobile bottom bar) gets its own independent, correctly-measured popover. This isn't clippable by any ancestor's `overflow: hidden` and can't be trapped behind the sticky header or the mobile booking bar, structurally, everywhere it's used. Verified with an automated hit-test at the popover's own center point across four separate entry points, desktop and mobile.

Also: shrunk the mobile gallery photo (it was taking up more of the screen than it needed to, pushing the booking summary further down than necessary).

## Round 3 — date picker positioning, gallery grid, Font Awesome

- **The real reason dates "wouldn't come up" on the homepage:** the popover was positioning itself purely based on the trigger's location, with no awareness of the viewport. On a tall hero, that put the whole calendar below the fold, invisible without scrolling. Rewrote the positioning logic to measure the calendar's real rendered height, flip it above the trigger when there's no room below, and clamp it fully on-screen either way, with internal scrolling as a last-resort safety net on very short screens. Tested at 320px, 375px, 390px and 1400px wide, it fits every time now.
- **The real reason dates "wouldn't come up" in the booking flow:** a classic CSS Grid bug: several containers (the calendar grid, the check-in/check-out fields, the step's action buttons) never had `min-width: 0`, so the browser refused to shrink them below their natural content width and the whole calendar rendered 20-60px wider than the phone screen, running part of it off the right edge. Fixed the sizing chain end to end; the page no longer scrolls horizontally at any width now, checked automatically.
- Found and fixed the actual root cause of an earlier inconsistent-position bug too: the global `scroll-behavior: smooth` meant `scrollIntoView()` was animating asynchronously, so a same-tick position measurement was racing a scroll still in progress. Forced that one call to be instant.
- Redesigned the stay-detail photo grid: it's now a proper 1-large + 2x2 mosaic (5 photos), replacing a layout that was quietly asking a 2-row grid to hold 3 tiles.
- Currency toggle no longer reloads the page: it re-renders prices in place on whichever page you're on.
- Added Font Awesome throughout the booking flow: step icons, form field icons, add-on icons, payment method icons, review-row icons, and confirmation page icons.

## Round 2 — deeper debugging + redesign

More real bugs found by scripting actual clicks/drags in a headless browser:

- **Hero search widget was dead.** The decorative "Scroll" hint at the bottom of the hero had no `pointer-events: none`, so it sat on top of the search widget and silently absorbed every click aimed at it. This is why the date field, guest counter, and search button all appeared broken.
- **Gallery thumbnails did nothing on mobile.** Clicking a small thumbnail only ever updated the desktop main photo, which is hidden on phones — so on mobile, tapping a thumbnail looked like it did nothing. Fixed to update whichever view (desktop or mobile) is actually visible.
- **No way to "swipe" with a mouse.** Touchscreens scroll a photo strip natively; a mouse has no equivalent, so desktop testing made the carousels feel unresponsive/"rolling". Added real click-and-drag support (`js/main.js: makeSwipeable`) to every photo strip and the lightbox, alongside the existing tap-to-advance and touch-swipe.
- Removed every em dash from visible copy across all 10 pages and the JS-generated strings.
- Swapped the font pairing to a fully serif system: **Playfair Display** (headings) + **Lora** (body), replacing the sans-serif body font.
- Wired in your real contact details: both emails, LinkedIn, Facebook, and the Amani Community Trust / Boardly / First Experts Logistics / Shelemj project links, in the footer and contact page. Removed the placeholder phone number and email that were never real.

Redesign:

- Hero is now a slow 3-photo crossfade with a Ken Burns drift on each photo (a CSS-only stand-in for a video background), and a brighter overlay so more of the photo shows through, matching the reference.
- Header logo sits in a circular badge, plus a working currency pill (USD/EUR/GBP, cycles on click, actually re-prices every page).
- Testimonials rebuilt as a single large quote carousel with prev/next arrows, an avatar row, and auto-advance, on a dark band with a soft gold glow, instead of the old horizontal scroll cards.
- Added a working **Availability** tab on the stay detail page: a two-month read-only calendar preview plus a button that jumps straight into date picking.

## Round 1 — initial bug-fix + redesign pass

Real bugs found by actually running the site in a headless browser and testing every interaction, not just reading the code:

- **Mobile menu was broken.** The header's `backdrop-filter` blur accidentally turned every `position: fixed` element inside it (the mobile menu) into something scoped to the header's own 78px height instead of the full screen. This is a known CSS gotcha — `filter`/`backdrop-filter` on an ancestor creates a new containing block for fixed descendants. Fixed by making the header a solid, opaque colour instead (also fixes the "header looks transparent" complaint on inner pages).
- **Checkout appeared to silently fail.** The calendar was correctly refusing to let you pick a checkout date if the range crossed an already-booked night — but it gave zero feedback, so it looked broken. Now it shows a toast explaining why, and the calendar has a proper "Done" button so the popover doesn't just hang open.
- **Gallery photos didn't open anything.** The buttons existed in the markup but nothing was wired to them. Added a real full-screen lightbox (`js/lightbox.js`) — arrows, swipe, keyboard, thumbnail strip, photo counter.
- **Carousel arrows were invisible on touch devices** (`:hover`-only), so there was no way to flip through a card's photos by tapping. Arrows are now always visible, and tapping the left/right half of any card photo also steps through it.
- **Removed two fabricated social links** (LinkedIn/Instagram) that were placeholder guesses, not real accounts — kept only the GitHub and portfolio links that were actually given.

Design/UX additions:

- Two-field **Check-in / Check-out** date display (matches your reference), sharing one calendar underneath.
- Sticky **in-page tab navigation** (Overview / Amenities / Policies / Reviews / Map) with scroll-spy, like the reference detail page.
- "Ask the host / manager a question" links.
- Richer stay cards — icon-based quick facts, gradient scrim for legibility, badge with icon, hover CTA.
- Fuller footer on every page — newsletter signup, four link columns, and an expanded "Built by" credit block with real links.
- Slim dismissible announcement bar.
- Refined nav hover (pill highlight + underline) and always-opaque header.
- Category filter chips on the homepage featured section.
- Three new pages: `gallery.html` (filterable photo wall), `locations.html` (region-by-region), `404.html`.

## Pages


| File | What it is |
|---|---|
| `index.html` | Home — hero + search widget, stats, features, featured stays, mood tiles, testimonials |
| `stays.html` | Browse/listing — filter chips, sort, live-rendered grid |
| `stay-detail.html` | One stay — gallery + lightbox, sticky tab nav, amenities, reviews, map, sticky booking summary |
| `booking.html` | The 3-step booking flow — Dates → Details → Confirm |
| `confirmation.html` | Success screen — confetti, checkmark, calendar download |
| `gallery.html` | Photo wall across every stay, filterable, opens the lightbox |
| `locations.html` | One row per region with a map |
| `about.html` | Brand story / values |
| `contact.html` | Contact form + FAQ accordion |
| `404.html` | Custom not-found page |

## How it's wired together

- **`js/data.js`** is the only place stay information lives (name, price, photos, amenities, unavailable dates…). Every page reads from this one array — swap it for a `fetch()` to a real API later without touching any other file.
- **`js/booking-state.js`** carries the in-progress booking through `localStorage` as you move from the detail page → booking flow → confirmation page. `BookingState.saveDraft()` / `getDraft()` / `finalize()` / `getLast()`.
- **`js/cards.js`** builds the swipeable stay card used on the homepage, the browse page and "related stays" — one function, `stayCardHTML()`, three places.
- **`js/datepicker.js`** is a from-scratch calendar (`class DatePicker`). It disables any date before today, and any date inside a stay's `unavailable` ranges — those days are rendered grey and `disabled`, so they physically cannot be clicked.
- **`js/booking.js`** drives the multi-step flow: all 3 steps exist in the DOM at once as `<section class="step-panel">`, and the script just toggles which one is visible plus moves the progress bar.
- **`js/confetti.js`** is a ~60-line canvas confetti burst, no library.
- **`css/base.css`** turns on cross-document View Transitions with `@view-transition { navigation: auto; }` — every navigation between these pages animates automatically in Chrome/Edge 126+. Card photos additionally get a matching `view-transition-name` right before navigation so a clicked photo visually grows into the detail page's hero photo.

## Images

Gallery photos are hot-linked from Unsplash (real, freely-licensed photos) so the demo looks like a real product without shipping a heavy `/assets` folder. Cinder Peak Lodge and Lantern Lake Cabin now have their own distinct exterior/hot-tub photos instead of reusing the shared set, so not every stay looks identical. Before shipping this for real: swap in your own photos, ideally a distinct set per stay, in `js/data.js` (see the `PHOTO` object and each stay's `images` array).

One thing worth knowing if you go hunting for more yourself: check the license line on the Unsplash photo page before using one. Regular photos (`images.unsplash.com` URLs) are free under the Unsplash License. Photos marked "Unsplash+" (`plus.unsplash.com` URLs) require a paid subscription, easy to grab by mistake since they show up in the same search results.

## Known simplifications (intentional, for a portfolio demo)

- No backend — bookings are stored in `localStorage`, not a database.
- The map embeds use a plain Google Maps iframe (`?output=embed`), which needs no API key but also can't be styled beyond the CSS filter applied to it.
- Payment step is a UI mock only — no real payment processor is wired in.
