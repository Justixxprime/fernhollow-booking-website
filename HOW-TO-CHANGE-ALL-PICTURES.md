# How To Change Every Picture On Fernhollow — The Ultra Baby-Step Guide

Hi! This is written so you can do this **completely on your own**, one tiny step at a time, with zero guessing. Read it slowly. Nothing here requires you to know how to code — you're only ever going to be **swapping a web address** (a "link") for another web address. That's it. That's the whole trick, repeated about 100 times.

By the end of this, every single photo on your site — all 18 cabins, the homepage, the About page, the blog, everything — will be photos **you personally picked**, and nothing will be skipped.

---

## Part 0 — The one idea you need to understand first

Open the file `js/data.js` in VS Code. Don't touch anything yet, just look.

You'll see lines that look like this:

```js
images: [img(PHOTO.lake, 1600, 1200), img(PHOTO.living, 1200, 1200), ...]
```

Here's the whole secret: **every photo on this site is just a link to an image sitting on the internet somewhere** (mostly on a free photo site called Unsplash). The website doesn't store the pictures itself — it just points at them. So "changing a picture" always means the exact same tiny action:

> **Delete the old link. Paste in a new link. Save the file.**

That's it. You will do that same one action, over and over, for every photo on the site. Once it clicks, the rest of this guide is just "here's every spot, one at a time."

### The two kinds of links you'll see

**Type A — a short code** (this is Unsplash's shortcut format):
```js
img("1697462247934-47afc5541494", 1600, 1200)
```
That weird string of numbers is just the ID of one specific Unsplash photo. The `1600, 1200` at the end is the size in pixels (width, height) — you can leave those two numbers exactly as they are, always.

**Type B — a full web address:**
```js
img(PHOTO.lake, 1600, 1200)
```
`PHOTO.lake` is a shortcut that means "reuse the generic lake photo everyone else is also using." These are the ones you most want to replace, because right now several different cabins are quietly sharing the exact same handful of photos. We'll fix that.

**The good news:** you are never restricted to Unsplash. Anywhere you see `img(...)`, you can paste **any image address from anywhere on the internet**, and the site will just use it. Example:
```js
img("https://images.pexels.com/photos/1234567/pexels-photo-1234567.jpeg", 1600, 1200)
```
As long as it starts with `http`, the site knows to use it exactly as-is. This is the trick that lets you use Pexels or Pixabay too, not just Unsplash.

---

## Part 1 — Where to actually get high-quality, free, real pictures

You want the site to look "exotic, beautiful, modern" — the good news is the exact same three websites the internet's best-looking sites already use are completely free, no attribution required, no watermarks:

| Site | Best for | Link |
|---|---|---|
| **Unsplash** | The best overall quality, huge selection, what this site already uses | https://unsplash.com |
| **Pexels** | Great second option, sometimes has photos Unsplash doesn't | https://www.pexels.com |
| **Pixabay** | Good backup, slightly more casual/less polished | https://pixabay.com |

All three are 100% free for commercial use, no credit required, no sign-up needed to download.

### Baby steps: how to find and grab one photo (do this exact sequence every time)

1. Go to **unsplash.com**
2. In the search bar at the top, type a keyword (I'll give you exact keywords for every photo below)
3. Look through the results. Click on any photo that looks right for your site (dreamy, natural light, uncluttered, high-resolution, nobody's face prominently in frame — cabins and rooms look more "aspirational" without random people in them)
4. You're now on that photo's own page. **Do not right-click "save image"** — that gives you a small, low-quality file
5. Instead, look at your browser's address bar at the top. It will look like:
   ```
   https://unsplash.com/photos/a-wooden-cabin-in-the-woods-AbCdEfGhIjK
   ```
6. The last part after the final dash — `AbCdEfGhIjK` in this example — is close to what you need, but not quite the format the site uses. **The easiest, safest method** is instead:
7. Click the **Download** button (or the little down-arrow icon) on the photo
8. Right after you click download, right-click on the big photo image itself and choose **"Copy image address"** (Chrome) or **"Copy Image Link"** (Safari/Firefox)
9. You now have a full web address on your clipboard that looks like:
   ```
   https://images.unsplash.com/photo-1234567890123-abcdef123456?...(a bunch of extra text)
   ```
10. That's your picture! You can paste this **entire thing** directly into the site's code (Type B, the full-address method) — this is honestly the easiest and most foolproof way to do this whole project, so if in doubt, always use this method.

> **Tip:** Pexels and Pixabay work the same way — right-click the big photo on its own page → "Copy Image Link"/"Copy Image Address" → paste it into the code.

---

## Part 2 — The 3 rules that stop you from breaking anything

1. **Only ever change what's *inside* the quotation marks.** Never delete a `"` or a `,` or a `)` — those are punctuation the code needs. If a line looked like `img("OLD-LINK-HERE", 1600, 1200)` before, it must still have exactly that same shape after — only the text between the quote marks changes.
2. **Always keep the two numbers at the end** (like `1600, 1200`) exactly as they were. Those control the size the photo displays at — they have nothing to do with which photo it is.
3. **Save the file after every change** (`Ctrl+S` on Windows, `Cmd+S` on Mac), then check it in your browser before moving to the next one. Little and often beats changing 20 things and then not knowing which one broke.

### How to actually make one swap, start to finish (example)

Say you want to replace this:
```js
img(PHOTO.lake, 1200, 1200)
```
with a new lake photo you found. In VS Code:

1. Click right before the `P` in `PHOTO.lake`
2. Click-and-drag to highlight exactly `PHOTO.lake` (don't grab the comma or parentheses)
3. Type a quotation mark `"`, then paste your new link, then type another quotation mark `"`
4. It should now read:
   ```js
   img("https://images.unsplash.com/photo-xxxxxxxxxxxxx-xxxxxxxxxxxx?auto=format&fit=crop&w=1200&h=1200&q=80", 1200, 1200)
   ```
5. Save. Done — that one photo is now yours.

---

## Part 3 — The 7 "shared" photos (fix these first, biggest visual impact)

These 7 photos are reused across *many* different cabins right now, which is the single biggest reason the site can look a bit repetitive. Fixing just these 7 will noticeably upgrade the whole site, fast.

They live near the very top of `js/data.js`, in a block that looks like this:

```js
const PHOTO = {
  exterior: "1473213430984-9b37e45cd8b1",
  bedroom:  "1759101292737-24e1c5ed52d9",
  living:   "1777895868494-4e01af8487b6",
  bath:     "1776482128011-c707121f081a",
  lake:     "1759434192754-1ae85603cf8a",
  lodge:    "1641504681054-c5e845e183fd",
  hottub:   "1647481259677-6c7fd7c0b00c",
};
```

Each line is one photo. Replace the short code in quotes with either a new short code, or (easier) a full pasted link. Here's exactly what to search for on Unsplash for each one:

| Line | What it's used for | Search keywords to try |
|---|---|---|
| `exterior` | Generic cabin exterior shot | `cabin exterior forest`, `log cabin dusk trees` |
| `bedroom` | Generic cozy bedroom | `cozy cabin bedroom`, `rustic bedroom linen morning light` |
| `living` | Generic living room | `cabin living room fireplace`, `wood interior fireplace cozy` |
| `bath` | Generic bathroom | `modern cabin bathroom tub`, `freestanding bathtub forest window` |
| `lake` | Generic lake/water view | `misty lake dawn mountains`, `calm lake reflection sunrise` |
| `lodge` | Generic large lodge exterior | `timber lodge mountains snow`, `large log lodge exterior` |
| `hottub` | Generic outdoor hot tub | `outdoor hot tub cabin`, `cedar hot tub deck forest view` |

⭐ **Since this is the single most-reused photo on the whole site (`exterior`, plus a few others), spend a little extra time here** — a genuinely stunning "exterior" and "living" photo will make the whole site instantly feel more premium, since dozens of cabin cards use them as a fallback.

---

## Part 4 — Every single stay, 1 through 18, don't skip any

Each cabin has **exactly 5 photos**, always in the same order: **[1] the main/cover photo → [2] living room → [3] bedroom → [4] bathroom or a special extra shot → [5] a lake/view or hot tub shot**. In the code, each cabin's photos are one single line starting with `images: [`.

**How to find each one fast:** open `js/data.js`, press `Ctrl+F` (Windows) or `Cmd+F` (Mac), and search for the cabin's exact name (e.g. search `Birch Hollow`). The `images:` line is a few lines below the name every time.

For every cabin below, use the **"vibe keywords"** as your starting search on Unsplash, then just add the room word (bedroom / living room / bathroom / lake / hot tub) to find that cabin's other photos. This is a pattern you can reuse forever, even for cabins you add later.

> 🔥 = this cabin's photos are **currently all shared/generic** (nobody has customized it) — these give you the biggest before/after glow-up, prioritize these first if you're short on time.

### 1. Birch Hollow A-Frame — Catskills, New York — *fireside, treetop*
Vibe keywords: `A-frame cabin birch forest dusk`
- Photo 1 (cover): already a real unique photo — replace with your own A-frame/Catskills shot if you want, optional
- Photo 2: living room → `A-frame living room fireplace`
- Photo 3: bedroom → `cozy loft bedroom cabin`
- Photo 4: bathroom → `cabin bathroom forest window`
- Photo 5: lake/view → `misty forest lake dawn New York`

### 2. Lantern Lake Cabin — Adirondacks, New York — *lakefront, hot-tub*
Vibe keywords: `lake cabin sunset Adirondacks`
- Photo 1 (cover): already unique, optional to swap
- Photo 2: hot tub → `outdoor hot tub lake view`
- Photo 3: living room → `lake cabin living room`
- Photo 4: bedroom → `lakeside cabin bedroom`
- Photo 5: bathroom → `rustic cabin bathroom`

### 3. Mosswood Retreat — Blue Ridge, North Carolina — *treetop, pet-friendly* 🔥
Vibe keywords: `cabin tall trees misty Blue Ridge forest`
- Photo 1 (cover): already unique
- Photo 2: exterior → `mossy forest cabin exterior`
- Photo 3: bedroom → `treehouse style bedroom cabin`
- Photo 4: lake/view → `misty mountain forest view`
- Photo 5: bathroom → `natural light cabin bathroom`

### 4. Cinder Peak Lodge — Cascade Range, Washington — *fireside, hot-tub*
Vibe keywords: `A-frame cabin Cascade mountains forest`
- Photo 1 (cover): already unique
- Photo 2: living room → `mountain cabin living room fire`
- Photo 3: lake/view → `Pacific Northwest lake mountains`
- Photo 4: bedroom → `mountain lodge bedroom`
- Photo 5: hot tub → `hot tub mountain view deck`

### 5. Quiet Pines Cottage — Great Smoky Mountains, Tennessee — *pet-friendly, lakefront* 🔥
Vibe keywords: `pine cottage Smoky Mountains forest`
- Photo 1: lake/view → `Smoky Mountains lake mist`
- Photo 2: bedroom → `pine cottage bedroom cozy`
- Photo 3: living room → `cottage living room rustic`
- Photo 4 (already unique): moody overlook shot, optional to swap
- Photo 5: bathroom → `cottage bathroom natural light`

### 6. Sierra Hollow Chalet — Sierra Nevada, California — *treetop, fireside*
Vibe keywords: `wooden chalet grassy hill Sierra Nevada`
- Photo 1 (cover): already unique
- Photo 2: bathroom → `chalet bathroom modern`
- Photo 3: living room → `mountain chalet living room`
- Photo 4: lake/view → `Sierra Nevada alpine lake`
- Photo 5: bedroom → `chalet bedroom cozy wood`

### 7. Maplewood Farmhouse — Green Mountains, Vermont — *fireside, treetop*
Vibe keywords: `white farmhouse wraparound porch Vermont`
- Photos 1, 2, 3 (cover, living, bedroom): already unique real photos, optional to swap
- Photo 4: bathroom → `farmhouse bathroom vintage modern`
- Photo 5: exterior/lodge → `Vermont farmhouse autumn trees`

### 8. Shoal Creek Cabin — Willamette Valley, Oregon — *lakefront, treetop*
Vibe keywords: `small cabin Oregon forest creek`
- Photo 1 (cover): already unique
- Photo 2: living room → `Oregon cabin living room`
- Photo 3: bedroom → `forest cabin bedroom green`
- Photo 4: lake/view → `Willamette Valley creek forest`
- Photo 5: bathroom → `small cabin bathroom`

### 9. Silverpine Lodge — San Juan Mountains, Colorado — *fireside, hot-tub* 🔥🔥 (needs the most work — every single photo here is currently generic)
Vibe keywords: `timber lodge San Juan Mountains Colorado snow`
- Photo 1: lodge/exterior → `large timber lodge mountains snow`
- Photo 2: hot tub → `hot tub snowy mountain view`
- Photo 3: living room → `lodge living room stone fireplace`
- Photo 4: bedroom → `mountain lodge bedroom rustic`
- Photo 5: bathroom → `lodge bathroom stone modern`

### 10. Loon Point Cottage — Moosehead Lake, Maine — *lakefront, fireside*
Vibe keywords: `cottage lake dawn Maine loon`
- Photo 1: lake/view → `Maine lake dawn mist`
- Photo 2: living room → `lake cottage living room`
- Photo 3: bedroom → `cottage bedroom lake view`
- Photo 4: exterior → `Maine lake cottage exterior`
- Photo 5: bathroom → `cottage bathroom cozy`

### 11. Bitterroot Homestead — Bitterroot Valley, Montana — *treetop, fireside*
Vibe keywords: `homestead cabin Montana valley trees`
- Photo 1: lodge/exterior → `Montana ranch homestead cabin`
- Photo 2: exterior → `Bitterroot Valley cabin trees`
- Photo 3: living room → `homestead living room wood`
- Photo 4: bedroom → `ranch style bedroom cozy`
- Photo 5: bathroom → `homestead bathroom rustic`

### 12. Cranberry Bog Cabin — Northwoods, Wisconsin — *lakefront, hot-tub*
Vibe keywords: `cabin lake Wisconsin northwoods autumn`
- Photo 1: lake/view → `Northwoods lake autumn mist`
- Photo 2: hot tub → `hot tub lake forest Wisconsin`
- Photo 3: bedroom → `northwoods cabin bedroom`
- Photo 4: living room → `lake cabin living room wood`
- Photo 5: exterior → `Wisconsin lake cabin exterior`

### 13. Cypress Spring Ranch — Hill Country, Texas — *lakefront, fireside*
Vibe keywords: `ranch house Texas hill country lake cypress`
- Photo 1: exterior → `Texas ranch house hill country`
- Photo 2: living room → `ranch living room fireplace`
- Photo 3: bedroom → `ranch bedroom Texas rustic`
- Photo 4: lake/view → `cypress trees lake Texas`
- Photo 5: bathroom → `ranch house bathroom modern`

### 14. Cliffside Cypress Cottage — Central Coast, California — *treetop, hot-tub*
Vibe keywords: `cliffside cottage California coast cypress ocean`
- Photo 1: exterior → `coastal cottage California cliffs`
- Photo 2: hot tub → `hot tub ocean view deck`
- Photo 3: living room → `coastal cottage living room`
- Photo 4: bedroom → `coastal bedroom ocean view`
- Photo 5: bathroom → `coastal cottage bathroom`

### 15. Copper Harbor Cabin — Upper Peninsula, Michigan — *lakefront, treetop*
Vibe keywords: `cabin Lake Superior Michigan forest`
- Photo 1: lake/view → `Lake Superior shoreline mist`
- Photo 2: living room → `Michigan cabin living room`
- Photo 3: bedroom → `Upper Peninsula cabin bedroom`
- Photo 4: exterior → `Copper Harbor cabin forest exterior`
- Photo 5: bathroom → `lake cabin bathroom`

### 16. Shenandoah Ridge Cabin — Shenandoah Valley, Virginia — *fireside, treetop*
Vibe keywords: `ridge cabin Shenandoah Valley Virginia mountains`
- Photo 1: lodge/exterior → `Shenandoah Valley cabin ridge`
- Photo 2: exterior → `Virginia mountain cabin trees`
- Photo 3: living room → `ridge cabin living room fireplace`
- Photo 4: bedroom → `mountain cabin bedroom cozy`
- Photo 5: bathroom → `ridge cabin bathroom`

### 17. Presidential Range Cabin — White Mountains, New Hampshire — *fireside, treetop*
Vibe keywords: `lodge cabin White Mountains New Hampshire forest`
- Photo 1: lodge/exterior → `White Mountains lodge exterior`
- Photo 2: living room → `New Hampshire cabin living room`
- Photo 3: bedroom → `mountain lodge bedroom`
- Photo 4: exterior → `Presidential Range forest cabin`
- Photo 5: bathroom → `lodge cabin bathroom`

### 18. Sawtooth Basin Cabin — Sawtooth Mountains, Idaho — *lakefront, treetop*
Vibe keywords: `cabin Sawtooth Mountains Idaho alpine lake`
- Photo 1: lake/view → `Sawtooth Mountains alpine lake`
- Photo 2: exterior → `Idaho mountain cabin exterior`
- Photo 3: living room → `alpine cabin living room`
- Photo 4: bedroom → `mountain cabin bedroom Idaho`
- Photo 5: bathroom → `alpine cabin bathroom`

✅ **That's all 18 cabins, 90 photos total, covered — nothing skipped.**

---

## Part 5 — Everything that ISN'T a cabin photo (don't forget these!)

These live in different files, so they're easy to miss if you only edit `js/data.js`. Here's every remaining one:

### A. Homepage hero slideshow (3 photos)
**File:** `index.html` — search (`Ctrl+F`) for `class="slide"`. You'll see 3 lines, each with one big photo link inside `<img src="...">`. Same trick: replace the link between the quotes.
- Suggested keywords: `A-frame cabin dusk trees`, `misty lake mountains dawn`, `cabin living room fireplace warm`

### B. About page story photo (1 photo)
**File:** `about.html` — search for `<img src="https://images.unsplash`. There's one photo here, the big image next to the "our story" text.
- Suggested keywords: `cozy cabin living room fireplace warm light`

### C. Blog post cover photos (3 photos)
**File:** `js/blog-data.js` — this whole file is short (just 3 blog posts). Each one has a line starting with `image:`.
- Post 1 "Catskills fall foliage guide" → `fall foliage Catskills mountains`
- Post 2 "What makes a week feel slow" → `cozy cabin reading relaxing`
- Post 3 "Packing for a cabin" → `cabin packing suitcase cozy interior`

### D. The universal "social share" preview photo (1 photo, but appears in ~20 places)
When you share a link to this site on iMessage, Facebook, or Twitter/X, whatever photo is set as `og:image` is what shows up as the preview. Right now, every single page uses the same one photo (the A-frame at dusk) for this.

**This is optional and lower priority** — most visitors never see this directly. If you do want to change it: search every `.html` file for `og:image` and `twitter:image` (there will be around 20 matches, one pair per page) and swap the link in all of them to the same new photo, so it stays consistent.

### E. The little logo icon (not a photo — skip this one)
The tiny tree icon next to "Fernhollow" in the header/footer is drawn directly in code (not a photo file), so there's nothing to "swap" here the same way. If you ever want a totally different logo shape, that's a bigger design task, not part of this photo-swapping guide.

---

## Part 6 — Testing your changes (do this as you go, not just at the end)

1. Open a terminal in your project folder
2. Run:
   ```
   python3 -m http.server 5500
   ```
   (or use your usual local server / Live Server extension in VS Code, whatever you've been using)
3. Open your browser to `http://127.0.0.1:5500`
4. Click into the cabin you just edited and check the photo actually shows up and looks right
5. If a photo shows up broken (a little broken-image icon instead of the picture), the most common cause is a stray quotation mark or missing comma — go back and check that line matches the shape shown in Part 2 exactly

---

## Part 7 — Your progress tracker

Copy this into a notes app (or just print this page) and tick things off as you go:

**Shared photos (Part 3):**
- [ ] exterior
- [ ] bedroom
- [ ] living
- [ ] bath
- [ ] lake
- [ ] lodge
- [ ] hottub

**Cabins (5 photos each, Part 4):**
- [ ] 1. Birch Hollow A-Frame
- [ ] 2. Lantern Lake Cabin
- [ ] 3. Mosswood Retreat
- [ ] 4. Cinder Peak Lodge
- [ ] 5. Quiet Pines Cottage
- [ ] 6. Sierra Hollow Chalet
- [ ] 7. Maplewood Farmhouse
- [ ] 8. Shoal Creek Cabin
- [ ] 9. Silverpine Lodge
- [ ] 10. Loon Point Cottage
- [ ] 11. Bitterroot Homestead
- [ ] 12. Cranberry Bog Cabin
- [ ] 13. Cypress Spring Ranch
- [ ] 14. Cliffside Cypress Cottage
- [ ] 15. Copper Harbor Cabin
- [ ] 16. Shenandoah Ridge Cabin
- [ ] 17. Presidential Range Cabin
- [ ] 18. Sawtooth Basin Cabin

**Everything else (Part 5):**
- [ ] Homepage slideshow (3 photos)
- [ ] About page story photo
- [ ] Blog post covers (3 photos)
- [ ] Social share preview image (optional)

---

## Part 8 — Once you're happy with everything: push it to GitHub

Same 3 commands you've used before, from your project folder's terminal:

```
git add .
git commit -m "Replace all site photos"
git push
```

---

## Quick troubleshooting cheat-sheet

| Problem | Why it happened | Fix |
|---|---|---|
| Broken image icon instead of a photo | A quotation mark or comma got deleted by accident | Compare that line to a working line nearby — the shape should match exactly |
| Photo looks stretched or squished | Rare, usually not caused by you — the size numbers (`1600, 1200` etc.) control the shape it crops to | Leave those two numbers alone; pick a photo that's naturally close to that same rough shape (landscape/wide, not a tall portrait) |
| Whole page looks blank/broken after saving | A `{` or `}` or `[` or `]` got deleted somewhere | Undo with `Ctrl+Z` and try that one edit again more carefully |
| Can't find a line mentioned in this guide | File may have scrolled past it | Use `Ctrl+F` / `Cmd+F` to search for the exact text shown in this guide (cabin name, or `PHOTO`, or `og:image`) |

You've got this — one link at a time. 🌲
