/* ============================================================
   DATA.JS
   Every page reads stay information from this one file.
   In a real backend-driven site this would instead be an API
   response — keeping it as one plain JS array makes the whole
   demo runnable from a static file host (GitHub Pages) with
   zero build step.
   ============================================================ */

/* Build an Unsplash CDN url at a given size from a bare photo id.
   Reusing a small set of real photos at different crops/sizes
   keeps the demo lightweight while still looking like a real
   photo library rather than grey placeholder boxes. */
function img(id, w, h) {
  // If this already looks like a full web address (starts with "http"),
  // just use it exactly as given — this is what makes it possible to
  // paste in your own photo's address from anywhere, not just Unsplash.
  if (id.startsWith("http")) return id;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

/* Builds a srcset string so phones don't download desktop-sized photos.
   Reuses the same base photo id at a few widths, matching aspect ratio. */
function imgSrcset(id, baseW, baseH) {
  const ratio = baseH / baseW;
  return [0.5, 1, 1.5]
    .map((mult) => {
      const w = Math.round(baseW * mult);
      const h = Math.round(w * ratio);
      return `${img(id, w, h)} ${w}w`;
    })
    .join(", ");
}

const PHOTO = {
  exterior: "1473213430984-9b37e45cd8b1", // A-frame cabin, dusk, string lights
  bedroom:  "1759101292737-24e1c5ed52d9", // neutral cabin bedroom
  living:   "1777895868494-4e01af8487b6", // cabin living room, fireplace
  bath:     "1776482128011-c707121f081a", // freestanding tub, forest window
  lake:     "1759434192754-1ae85603cf8a", // misty lake at dawn
  lodge:    "1641504681054-c5e845e183fd", // large timber lodge, snowy mountains
  hottub:   "1647481259677-6c7fd7c0b00c", // cedar hot tub inside a cabin, mountain view
};

/* Curated per-region activity suggestions for the "Nearby" widget on
   each stay page. Keyed by the region name (the part of `location`
   before the comma), since several stays can share a region. This is
   editorial content, not a live places/events feed. */
const THINGS_TO_DO = {
  "Catskills": [
    { icon: "fa-person-hiking", title: "Kaaterskill Falls", text: "One of the tallest waterfalls in New York, a moderate hike from the trailhead parking." },
    { icon: "fa-store", title: "Woodstock", text: "Galleries, bookshops, and diners in a genuinely walkable little town about 25 minutes away." },
    { icon: "fa-water", title: "Ashokan Reservoir", text: "A flat, paved path along the water, good for an easy morning walk or a bike ride." },
  ],
  "Adirondacks": [
    { icon: "fa-person-hiking", title: "Cascade Mountain", text: "One of the more approachable High Peaks, a popular first 46er summit." },
    { icon: "fa-canoe", title: "Saranac Lake chain", text: "Canoe or kayak routes strung between lakes, with put-ins a short drive from most cabins." },
    { icon: "fa-mug-hot", title: "Lake Placid", text: "Olympic history, lakeside cafes, and gear shops if you forgot something." },
  ],
  "Blue Ridge": [
    { icon: "fa-road", title: "Blue Ridge Parkway", text: "Scenic overlooks strung along the ridge, especially good near sunset." },
    { icon: "fa-person-hiking", title: "Craggy Gardens", text: "A short, dramatic hike above the treeline with wide views on a clear day." },
    { icon: "fa-guitar", title: "Asheville", text: "Live music, breweries, and a genuinely good food scene, about 40 minutes out." },
  ],
  "Cascade Range": [
    { icon: "fa-mountain", title: "Mount Rainier viewpoints", text: "Several pullouts on the drive in offer a clear look at Rainier on a good day." },
    { icon: "fa-person-hiking", title: "Old-growth trail loops", text: "Short, well-marked loops through genuinely old forest, good for any fitness level." },
    { icon: "fa-fish", title: "Local fly-fishing spots", text: "The host can point you to a couple of quieter stretches of river nearby." },
  ],
  "Great Smoky Mountains": [
    { icon: "fa-paw", title: "Cades Cove", text: "A loop road through open meadows where elk and black bear sightings are common at dawn/dusk." },
    { icon: "fa-person-hiking", title: "Clingmans Dome", text: "The highest point in the park, with a short paved trail to the observation tower." },
    { icon: "fa-water", title: "Little River tubing", text: "A popular, easy way to spend a hot afternoon when the water's up." },
  ],
  "Sierra Nevada": [
    { icon: "fa-tree", title: "Giant sequoia groves", text: "A short drive to see trees that were already old when Rome fell." },
    { icon: "fa-person-hiking", title: "Alpine lake trailheads", text: "Several trailheads within reach for a half-day out-and-back to a genuine alpine lake." },
    { icon: "fa-star", title: "Stargazing", text: "Minimal light pollution up here; a red-light headlamp is worth packing." },
  ],
  "Green Mountains": [
    { icon: "fa-store", title: "Local sugarhouses", text: "Several working maple operations nearby offer tours in season, syrup year-round." },
    { icon: "fa-person-hiking", title: "Long Trail access points", text: "Sections of Vermont's oldest long-distance trail are a short drive away." },
    { icon: "fa-cheese", title: "Farm stands", text: "Cheese, cider, and produce stands along most of the back roads out here." },
  ],
  "Willamette Valley": [
    { icon: "fa-wine-glass", title: "Vineyard tasting rooms", text: "The valley is Pinot country; several small, unpretentious tasting rooms are a short drive." },
    { icon: "fa-person-hiking", title: "Waterfall corridor", text: "A run of short-hike waterfalls, easy to string together into one afternoon." },
    { icon: "fa-seedling", title: "Farmers' markets", text: "Weekend markets in the nearby towns are a good excuse for a slow morning." },
  ],
  "San Juan Mountains": [
    { icon: "fa-person-skiing", title: "Backcountry ski access", text: "Direct access to some well-known backcountry zones for guests with the right experience." },
    { icon: "fa-hot-tub-person", title: "Natural hot springs", text: "A couple of developed hot springs pools are within a scenic drive." },
    { icon: "fa-train", title: "Durango & Silverton Railroad", text: "A historic narrow-gauge train through the mountains, worth the half-day if it's your first visit." },
  ],
  "Moosehead Lake": [
    { icon: "fa-canoe", title: "Lake paddling", text: "Maine's largest lake, with quiet coves that stay calm even on breezier days." },
    { icon: "fa-paw", title: "Moose-watching tours", text: "Local guides run early-morning trips with good odds in season." },
    { icon: "fa-mountain", title: "Mount Kineo", text: "A short boat-in hike to a cliff-top view over the whole lake." },
  ],
  "Bitterroot Valley": [
    { icon: "fa-water", title: "Bitterroot River fishing", text: "Well-regarded trout water, wading access points scattered along the valley." },
    { icon: "fa-person-hiking", title: "Trailheads into the range", text: "Several trailheads climb straight out of the valley into the Bitterroot-Selway wilderness." },
    { icon: "fa-hot-tub-person", title: "Lolo Hot Springs", text: "A developed hot springs pool about 40 minutes away, good after a long hike." },
  ],
  "Northwoods": [
    { icon: "fa-fish", title: "Walleye and bass fishing", text: "Classic Northwoods lake fishing, rental boats available in the nearest town." },
    { icon: "fa-person-hiking", title: "County forest trails", text: "Miles of quiet, mostly-flat trails through second-growth forest, good for an easy afternoon." },
    { icon: "fa-fire", title: "Supper clubs", text: "The regional institution: old-school supper clubs with fish fries, worth the drive on a Friday." },
  ],
  "Hill Country": [
    { icon: "fa-water", title: "Spring-fed swimming holes", text: "Several clear, cold swimming spots dot the region, a welcome break in summer heat." },
    { icon: "fa-wine-glass", title: "Wine trail", text: "A cluster of small wineries and tasting rooms strung along the back roads." },
    { icon: "fa-star", title: "Stargazing", text: "One of the darker skies in the state; a red-light headlamp is worth packing." },
  ],
  "Central Coast": [
    { icon: "fa-water", title: "Coastal bluff trails", text: "Easy, dramatic walking trails right along the cliffs, whales visible in season." },
    { icon: "fa-person-hiking", title: "Redwood groves", text: "A short drive inland to walk among genuinely enormous trees." },
    { icon: "fa-fish", title: "Fresh seafood shacks", text: "Small, no-frills seafood spots along the highway, worth seeking out over the tourist restaurants." },
  ],
  "Upper Peninsula": [
    { icon: "fa-gem", title: "Agate hunting", text: "Rockhounds comb the Superior shoreline after storms; a bucket and patience is all you need." },
    { icon: "fa-water", title: "Lake Superior overlooks", text: "Several pullouts along the shore road offer wide views of the lake." },
    { icon: "fa-person-hiking", title: "Waterfall trails", text: "The UP has more named waterfalls than anywhere else in the Midwest, many an easy walk in." },
  ],
  "Shenandoah Valley": [
    { icon: "fa-road", title: "Skyline Drive", text: "The scenic road running the length of Shenandoah National Park, dense with overlooks." },
    { icon: "fa-person-hiking", title: "Old Rag Mountain", text: "A well-known, genuinely challenging scramble with a rewarding summit view." },
    { icon: "fa-wine-glass", title: "Valley wineries", text: "A cluster of small vineyards make use of the same ridge-and-valley terrain." },
  ],
  "White Mountains": [
    { icon: "fa-person-hiking", title: "The Presidential Traverse", text: "A serious, well-known ridge hike for experienced hikers; the cabin's mudroom exists because of trips like this." },
    { icon: "fa-train", title: "Mount Washington", text: "A cog railway or auto road option for reaching the summit without the full hike." },
    { icon: "fa-mug-hot", title: "North Conway", text: "Outfitters, breweries, and diners in a genuinely useful little mountain town." },
  ],
  "Sawtooth Mountains": [
    { icon: "fa-water", title: "Alpine lake swimming", text: "Cold, clear, glacially-fed lakes throughout the basin, bracing but worth it." },
    { icon: "fa-person-hiking", title: "Sawtooth Wilderness trailheads", text: "Direct access into one of the more dramatic, less-crowded ranges in the Rockies." },
    { icon: "fa-star", title: "Stargazing", text: "Central Idaho has some of the darkest official skies in the country; look up after dinner." },
  ],
};

/* Turns a day-offset range into real Date objects, always relative
   to "today" so the demo's calendar never looks stale no matter
   when someone opens the site. */
function blockedRange(startOffset, endOffset) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + startOffset);
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + endOffset);
  return { start, end };
}

const STAYS = [
  {
    slug: "birch-hollow-aframe",
    name: "Birch Hollow A-Frame",
    location: "Catskills, New York",
    moods: ["fireside", "treetop"],
    price: 293,
    rating: 4.9,
    reviews: 128,
    guests: 4,
    bedrooms: 2,
    beds: 3,
    baths: 2,
    badge: "Guest favourite",
    blurb: "A blackened-timber A-frame with a wall of glass facing the birch line, ten minutes from the trailhead.",
    description: [
      "Birch Hollow sits at the end of a gravel lane, wrapped by second-growth birch and hemlock. The cabin was rebuilt in 2021 around its original 1970s frame: steep roofline, a wall of glass facing the trees, and a wood-burning stove that does most of the talking on cold nights.",
      "Mornings start on the deck with the kettle going and the birds arguing over the feeder. Evenings end the same way they always do here: string lights on, stove loaded, board games out."
    ],
    theSpace: "Open-plan living and kitchen beneath the A-frame's full-height glass. The loft holds the primary bed; a second bedroom sits at ground level for guests who'd rather skip the ladder stairs.",
    guestAccess: "The whole cabin and private deck are yours. A locked owner's shed by the driveway is off-limits, everything else is fair game.",
    host: { name: "Marguerite", since: 2019, responseTime: "within an hour" },
    images: [img("1697462247934-47afc5541494", 1600, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.bath, 1200, 1200), img(PHOTO.lake, 1200, 1200)], // exterior: real photo, A-frame at dusk
    sleeping: [
      { label: "Loft bedroom", detail: "1 queen bed" },
      { label: "Ground bedroom", detail: "2 twin beds" },
      { label: "Living area", detail: "1 sofa bed" },
    ],
    amenities: ["Wood-burning stove","Wifi","Full kitchen","Free parking","Washer & dryer","Heating","Private deck","Board game shelf","First aid kit","Outdoor shower","Fire pit","Espresso machine","Hammock","Trail maps","Hot water","Smoke alarm","Hangers","Iron"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 4, pets: true, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(3, 6), blockedRange(17, 19), blockedRange(34, 40)],
    coords: "42.1,-74.3",
    reviewsList: [
      { name: "Priya", date: "May 2026", text: "The stove alone is worth the drive. We didn't want to leave, and the trailhead really is a ten minute walk." },
      { name: "Tomas", date: "March 2026", text: "Exactly as photographed, which almost never happens. Marguerite left a hand-drawn map of the best sunrise spot." },
      { name: "Elena", date: "January 2026", text: "Went for a quiet solo week and got exactly that. Cell service is spotty on purpose, I think, and I loved it." },
    ],
  },
  {
    slug: "lantern-lake-cabin",
    name: "Lantern Lake Cabin",
    location: "Adirondacks, New York",
    moods: ["lakefront", "hot-tub"],
    price: 268,
    rating: 4.8,
    reviews: 96,
    guests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    badge: "Rare find",
    blurb: "Private dock, a cedar hot tub facing the water, and a screened porch built for long dinners.",
    description: [
      "Lantern Lake Cabin backs onto forty feet of private shoreline with its own dock and a canoe that comes with the keys. The cedar hot tub sits at the end of the dock so you can watch the lake go from gold to black without leaving the water.",
      "Inside, the cabin keeps things simple: a big farmhouse table, mismatched lamps, and enough board games to outlast a week of rain."
    ],
    theSpace: "Three bedrooms across two floors, a screened porch that seats eight, and a kitchen stocked for real cooking, not just cereal.",
    guestAccess: "Full run of the cabin, dock, hot tub and the canoe. A neighbouring cabin (not part of this listing) shares the gravel access road.",
    host: { name: "Owen", since: 2017, responseTime: "within a few hours" },
    images: [img("1659384236751-77f25959e775", 1600, 1200), img(PHOTO.hottub, 1200, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.bath, 1200, 1200)], // exterior: real photo, cabin on lake at sunset
    sleeping: [
      { label: "Primary bedroom", detail: "1 king bed" },
      { label: "Second bedroom", detail: "2 twin beds" },
      { label: "Loft", detail: "1 queen bed" },
    ],
    amenities: ["Private dock","Cedar hot tub","Canoe included","Wifi","Full kitchen","Free parking","Washer & dryer","Screened porch","Fire pit","Heating","Board game shelf","First aid kit","Outdoor shower","Life jackets","Hot water","BBQ grill","Hangers","Iron"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 6, pets: false, smoking: false, events: false, minAge: 25 },
    unavailable: [blockedRange(1, 4), blockedRange(20, 27), blockedRange(45, 47)],
    coords: "44.0,-74.0",
    reviewsList: [
      { name: "Han", date: "June 2026", text: "The hot tub on the dock at 6am with coffee is a top-five life experience at this point." },
      { name: "Freya", date: "April 2026", text: "Owen dropped off firewood without us asking. Small touches like that made the trip." },
      { name: "Marcus", date: "February 2026", text: "Brought the whole family, plenty of room, and the canoe made the kids' week." },
    ],
  },
  {
    slug: "mosswood-retreat",
    name: "Mosswood Retreat",
    location: "Blue Ridge, North Carolina",
    moods: ["treetop", "pet-friendly"],
    price: 245,
    rating: 4.7,
    reviews: 74,
    guests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    badge: null,
    blurb: "A one-bedroom treehouse-style cabin on stilts, wrapped in rhododendron, dogs very much welcome.",
    description: [
      "Mosswood is small on purpose: one bedroom, a wraparound deck, and just enough kitchen to make breakfast. It sits eight feet off the ground on timber stilts, so the rhododendron canopy comes right up to the windows.",
      "This is the listing for people who want to do nothing for three days straight, ideally with a dog asleep on the porch."
    ],
    theSpace: "A single open room with a queen bed, a daybed by the window, and a compact kitchenette. The wraparound deck effectively doubles the living space in good weather.",
    guestAccess: "The cabin, deck, and a short private trail down to the creek. Two other cabins share the entrance road but keep well apart.",
    host: { name: "Dara & Sam", since: 2020, responseTime: "within an hour" },
    images: [img("1693298020278-a3f59c8cee94", 1600, 1200), img(PHOTO.exterior, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.lake, 1200, 1200), img(PHOTO.bath, 1200, 1200)], // living/exterior: real unique photo, cabin in tall trees
    sleeping: [
      { label: "Bedroom", detail: "1 queen bed" },
      { label: "Window nook", detail: "1 daybed" },
    ],
    amenities: ["Dog friendly","Wraparound deck","Wifi","Kitchenette","Free parking","Heating","Fire pit","First aid kit","Creek access","Hammock","Trail maps","Hot water","Hangers","Iron","Books & board games"],
    rules: { checkIn: "3:00 PM", checkOut: "11:00 AM", maxGuests: 3, pets: true, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(6, 9), blockedRange(24, 26)],
    coords: "35.6,-82.2",
    reviewsList: [
      { name: "Julissa", date: "May 2026", text: "Our dog has never been happier. So have we, honestly." },
      { name: "Ben", date: "March 2026", text: "Small and simple, exactly as advertised, and the creek trail is a five minute stroll." },
    ],
  },
  {
    slug: "cinder-peak-lodge",
    name: "Cinder Peak Lodge",
    location: "Cascade Range, Washington",
    moods: ["fireside", "hot-tub"],
    price: 340,
    rating: 4.95,
    reviews: 152,
    guests: 8,
    bedrooms: 4,
    beds: 5,
    baths: 3,
    badge: "Guest favourite",
    blurb: "A timber-frame lodge for a full group: double-height stone fireplace, sauna, and a ridge-line hot tub.",
    description: [
      "Cinder Peak is the largest stay on Fernhollow, built for groups who actually want to spend time together, and a double-height fireplace anchors the main room, and the kitchen island seats six on its own.",
      "Outside, a cedar hot tub looks straight down the ridge line, and a small sauna off the mudroom means nobody has to fight over the shower after a hike."
    ],
    theSpace: "Four bedrooms across three floors, an open great room with a 22-foot stone chimney, a chef's kitchen, and a lower-level bunk room that's a hit with kids.",
    guestAccess: "Entire lodge, hot tub, sauna, and the equipment shed for snowshoes and trekking poles in season.",
    host: { name: "The Okafor family", since: 2015, responseTime: "within an hour" },
    images: [img("1542213598-8fbf6282334b", 1600, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.lake, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.hottub, 1200, 1200)], // exterior: real photo, A-frame in Washington state forest
    sleeping: [
      { label: "Primary suite", detail: "1 king bed" },
      { label: "Bedroom 2", detail: "1 queen bed" },
      { label: "Bedroom 3", detail: "1 queen bed" },
      { label: "Bunk room", detail: "4 twin bunks" },
    ],
    amenities: ["Ridge-line hot tub","Sauna","Double-height fireplace","Wifi","Chef's kitchen","Free parking for 4 cars","Washer & dryer","Heating","Board game shelf","First aid kit","Outdoor shower","Fire pit","Espresso machine","Snowshoe shed","Hot water","BBQ grill","Hangers","Iron"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 8, pets: false, smoking: false, events: false, minAge: 25 },
    unavailable: [blockedRange(0, 3), blockedRange(10, 16), blockedRange(50, 55)],
    coords: "47.7,-121.4",
    reviewsList: [
      { name: "Grace", date: "June 2026", text: "Booked for a 30th birthday with ten of us. The great room fit everyone with room to spare." },
      { name: "Idris", date: "April 2026", text: "The sauna after a snow hike is the best decision this family has ever made together." },
      { name: "Noor", date: "January 2026", text: "Worth every cent for a group. Cannot recommend the bunk room enough for kids." },
    ],
  },
  {
    slug: "quiet-pines-cottage",
    name: "Quiet Pines Cottage",
    location: "Great Smoky Mountains, Tennessee",
    moods: ["pet-friendly", "lakefront"],
    price: 219,
    rating: 4.6,
    reviews: 61,
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    badge: null,
    blurb: "A modest lakeside cottage with a tin roof, a rowboat, and a porch swing that's older than the cottage itself.",
    description: [
      "Quiet Pines is the least fussy stay on Fernhollow, and that's the point. A tin-roofed cottage, a rowboat tied to a short dock, and a porch swing worn smooth by three decades of guests.",
      "It's a five-minute walk to the general store for ice cream, and the lake is calm enough for a slow, easy paddle most mornings."
    ],
    theSpace: "Two small bedrooms, one bathroom, and a porch that's really the main event. The kitchen is basic but complete.",
    guestAccess: "Cottage, dock, and rowboat. The lake itself is shared with a handful of other cottages further along the shore.",
    host: { name: "Wanda", since: 2012, responseTime: "within a day" },
    images: [img(PHOTO.lake, 1600, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.living, 1200, 1200), img("1635347038160-631adf81a895", 1200, 1200), img(PHOTO.bath, 1200, 1200)], // view slot: real unique photo, moody forest cabin overlook
    sleeping: [
      { label: "Bedroom 1", detail: "1 queen bed" },
      { label: "Bedroom 2", detail: "2 twin beds" },
    ],
    amenities: ["Dog friendly","Rowboat included","Private dock","Wifi","Kitchen","Free parking","Heating","Porch swing","First aid kit","Board game shelf","Hot water","Hangers"],
    rules: { checkIn: "3:00 PM", checkOut: "11:00 AM", maxGuests: 4, pets: true, smoking: false, events: false, minAge: 18 },
    unavailable: [blockedRange(8, 12), blockedRange(29, 30)],
    coords: "35.6,-83.5",
    reviewsList: [
      { name: "Callum", date: "May 2026", text: "Unfussy and exactly what we needed. The porch swing is doing a lot of emotional labour for this listing, deservedly." },
      { name: "Ade", date: "February 2026", text: "Great value, sweet little cottage, dog had the best weekend of her life." },
    ],
  },
  {
    slug: "sierra-hollow-chalet",
    name: "Sierra Hollow Chalet",
    location: "Sierra Nevada, California",
    moods: ["treetop", "fireside"],
    price: 312,
    rating: 4.85,
    reviews: 110,
    guests: 5,
    bedrooms: 2,
    beds: 3,
    baths: 2,
    badge: "New this season",
    blurb: "A steep-roofed chalet with a wood stove, granite outcrop views, and a stargazing deck built off the loft.",
    description: [
      "Sierra Hollow was finished in late 2025, built to the same steep-roof chalet form as the old ranger cabins nearby, but with better insulation and a stargazing deck cantilevered off the loft.",
      "The granite outcrop across the meadow turns copper at sunset most evenings, plan dinner on the deck if the weather cooperates."
    ],
    theSpace: "Two bedrooms, a loft stargazing deck, and a living room built around a cast-iron wood stove. Floor-to-ceiling glass frames the granite outcrop from the kitchen table.",
    guestAccess: "Chalet, deck, and the meadow trail down to the outcrop viewpoint, about a fifteen-minute walk.",
    host: { name: "Renata", since: 2025, responseTime: "within an hour" },
    images: [img("1737112227544-0b5b3ef51719", 1600, 1200), img(PHOTO.bath, 1200, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.lake, 1200, 1200), img(PHOTO.bedroom, 1200, 1200)], // exterior: real photo, wooden chalet on grassy hill
    sleeping: [
      { label: "Primary bedroom", detail: "1 king bed" },
      { label: "Second bedroom", detail: "1 queen bed" },
      { label: "Loft deck", detail: "1 daybed" },
    ],
    amenities: ["Wood stove","Stargazing deck","Wifi","Full kitchen","Free parking","Heating","Fire pit","First aid kit","Outdoor shower","Espresso machine","Trail maps","Hot water","Hangers","Iron","Smoke alarm"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 5, pets: false, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(5, 7), blockedRange(22, 28)],
    coords: "38.0,-119.6",
    reviewsList: [
      { name: "Iris", date: "June 2026", text: "So new it still smells like cedar. The stargazing deck is the reason to book this one." },
      { name: "Wes", date: "May 2026", text: "Granite outcrop at sunset from the kitchen table, would book again just for that view." },
    ],
  },
  {
    slug: "maplewood-farmhouse",
    name: "Maplewood Farmhouse",
    location: "Green Mountains, Vermont",
    moods: ["fireside", "treetop"],
    price: 241,
    rating: 4.8,
    reviews: 84,
    guests: 8,
    bedrooms: 4,
    beds: 5,
    baths: 3,
    badge: "Great for groups",
    blurb: "A restored 1860s farmhouse at the edge of a working maple stand, with a wraparound porch built for slow mornings.",
    description: [
      "Maplewood keeps its original wide-plank floors and a soapstone woodstove that still does the real work in January. The surrounding sugarbush is tapped every spring by the family next door, and guests are welcome to watch the boil if the timing lines up.",
      "It sleeps eight comfortably across four bedrooms, which makes it the one people book for reunions, ski weekends, and the occasional very ambitious game of charades."
    ],
    theSpace: "Two floors: a big farmhouse kitchen and living room downstairs, four bedrooms upstairs, plus a wraparound porch with rocking chairs facing the ridge.",
    guestAccess: "The full farmhouse and porch. The maple sugarhouse itself belongs to the neighboring farm and is a look-but-don't-touch situation outside of tapping season tours.",
    host: { name: "Colette", since: 2018, responseTime: "within a few hours" },
    images: [img("1664830920041-c36609d92c63", 1600, 1200), img("1757023177496-131ded651c01", 1200, 1200), img("1721738859725-cfa4993ad559", 1200, 1200), img(PHOTO.bath, 1200, 1200), img(PHOTO.lodge, 1200, 1200)], // exterior+living+bedroom: real unique photos, white farmhouse with wraparound porch
    sleeping: [
      { label: "Primary bedroom", detail: "1 king bed" },
      { label: "Second bedroom", detail: "1 queen bed" },
      { label: "Third bedroom", detail: "2 twin beds" },
      { label: "Fourth bedroom", detail: "1 queen bed" },
    ],
    amenities: ["Wood-burning stove","Wifi","Full kitchen","Free parking","Washer & dryer","Heating","Wraparound porch","Board game shelf","First aid kit","Fire pit","Espresso machine","Trail maps","Hot water","Smoke alarm","Hangers","Iron","Crib available","Extra linens"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 8, pets: true, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(2, 5), blockedRange(20, 24), blockedRange(41, 45)],
    coords: "44.1,-72.8",
    reviewsList: [
      { name: "Naomi", date: "April 2026", text: "Booked it for a family reunion, ten of us total counting the toddlers, and it never felt cramped." },
      { name: "Derek", date: "February 2026", text: "The stove keeps the whole downstairs warm even at minus ten. Porch is unbeatable in the fall though." },
    ],
  },
  {
    slug: "shoal-creek-cabin",
    name: "Shoal Creek Cabin",
    location: "Willamette Valley, Oregon",
    moods: ["lakefront", "treetop"],
    price: 219,
    rating: 4.7,
    reviews: 71,
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    badge: "Rare find",
    blurb: "A one-story cedar cabin tucked into ferns, with a creek loud enough to hear from the pillow.",
    description: [
      "Shoal Creek sits low to the ground under a canopy of Douglas fir, close enough to the water that you fall asleep to it. The cabin itself is small and simple by design: two bedrooms, one good stove, a kitchen stocked for actual cooking.",
      "It rains here, often, and the cabin was built for that: a covered porch runs the full front of the building so you can sit outside anyway."
    ],
    theSpace: "One level, open living/kitchen area, two bedrooms off a short hallway, a covered porch facing the creek.",
    guestAccess: "The cabin, porch, and the short trail down to the creek's swimming hole are all yours during your stay.",
    host: { name: "Jonah", since: 2020, responseTime: "within an hour" },
    images: [img("1716847214624-1e8787d98b6c", 1600, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.lake, 1200, 1200), img(PHOTO.bath, 1200, 1200)], // exterior: real photo, small cabin in Oregon forest
    sleeping: [
      { label: "Primary bedroom", detail: "1 queen bed" },
      { label: "Second bedroom", detail: "2 twin beds" },
    ],
    amenities: ["Wood-burning stove","Wifi","Full kitchen","Free parking","Heating","Covered porch","First aid kit","Rain jackets provided","Trail maps","Hot water","Smoke alarm","Hangers"],
    rules: { checkIn: "3:00 PM", checkOut: "11:00 AM", maxGuests: 4, pets: false, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(8, 10), blockedRange(29, 33)],
    coords: "44.3,-123.1",
    reviewsList: [
      { name: "Ana", date: "May 2026", text: "Fell asleep to the creek every single night, exactly as advertised. Small cabin, big feeling." },
      { name: "Mateo", date: "March 2026", text: "It poured the whole weekend and it was still one of our best trips, the porch made it work." },
    ],
  },
  {
    slug: "silverpine-lodge",
    name: "Silverpine Lodge",
    location: "San Juan Mountains, Colorado",
    moods: ["fireside", "hot-tub"],
    price: 349,
    rating: 4.9,
    reviews: 112,
    guests: 10,
    bedrooms: 5,
    beds: 6,
    baths: 4,
    badge: "Guest favourite",
    blurb: "A big timber-frame lodge at 8,600 feet with a wraparound hot tub deck facing the peaks.",
    description: [
      "Silverpine was built for exactly this: a large group, a wall of windows facing 13,000-foot peaks, and a hot tub deck that stays warm no matter what the thermometer says. The great room has a two-story stone fireplace that's genuinely the center of the house.",
      "Ski season books out fastest, understandably, but the lodge is just as good in July when the wildflowers hit the alpine meadows below the ridge."
    ],
    theSpace: "A two-story great room, five bedrooms across both floors, a bunk room that's a hit with kids, and a wraparound deck with the hot tub and a second fire pit.",
    guestAccess: "The full lodge, both decks, the hot tub, and a locked ski/gear room with pass-code entry for your group only.",
    host: { name: "Priya", since: 2016, responseTime: "within an hour" },
    images: [img(PHOTO.lodge, 1600, 1200), img(PHOTO.hottub, 1200, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.bath, 1200, 1200)], // TODO: still needs its own unique photos
    sleeping: [
      { label: "Primary suite", detail: "1 king bed" },
      { label: "Second bedroom", detail: "1 queen bed" },
      { label: "Third bedroom", detail: "1 queen bed" },
      { label: "Fourth bedroom", detail: "2 twin beds" },
      { label: "Bunk room", detail: "4 twin bunks" },
    ],
    amenities: ["Wood-burning fireplace","Wifi","Full kitchen","Free parking","Washer & dryer","Heating","Hot tub","Ski/gear room","Board game shelf","First aid kit","Fire pit","Espresso machine","Trail maps","Hot water","Smoke alarm","Hangers","Iron","Extra linens","Crib available"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 10, pets: true, smoking: false, events: false, minAge: 25 },
    unavailable: [blockedRange(6, 9), blockedRange(25, 32), blockedRange(50, 56)],
    coords: "37.9,-107.7",
    reviewsList: [
      { name: "Grant", date: "January 2026", text: "Ten of us, five bedrooms, zero fighting over the hot tub schedule. Views from the great room are unreal." },
      { name: "Bethany", date: "July 2026", text: "Came for wildflower season on a recommendation and it delivered. Quieter than ski season, just as beautiful." },
    ],
  },
  {
    slug: "loon-point-cottage",
    name: "Loon Point Cottage",
    location: "Moosehead Lake, Maine",
    moods: ["lakefront", "fireside"],
    price: 205,
    rating: 4.8,
    reviews: 63,
    guests: 5,
    bedrooms: 2,
    beds: 3,
    baths: 2,
    badge: "Rare find",
    blurb: "A shingled cottage on its own point of land, with loon calls most evenings and a canoe already at the dock.",
    description: [
      "Loon Point sits at the end of a dirt road on its own small peninsula, which means water on three sides and no neighbors close enough to hear. The dock is steps from the porch, the canoe comes with the keys, and the loons really do call most evenings right around dusk.",
      "It's a simple cottage inside, on purpose, screen porch and all, the kind of place that's better for having fewer things to fuss with."
    ],
    theSpace: "One main floor with a screened porch facing the water, two bedrooms, plus a small loft with a daybed that sleeps one more.",
    guestAccess: "The cottage, dock, canoe, and the whole point of land are private to your stay.",
    host: { name: "Warren", since: 2015, responseTime: "within a few hours" },
    images: [img(PHOTO.lake, 1600, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.exterior, 1200, 1200), img(PHOTO.bath, 1200, 1200)],
    sleeping: [
      { label: "Primary bedroom", detail: "1 queen bed" },
      { label: "Second bedroom", detail: "2 twin beds" },
      { label: "Loft", detail: "1 daybed" },
    ],
    amenities: ["Wood-burning stove","Wifi","Full kitchen","Free parking","Heating","Screened porch","Canoe included","First aid kit","Fire pit","Trail maps","Hot water","Smoke alarm","Hangers"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 5, pets: true, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(4, 6), blockedRange(19, 23)],
    coords: "45.6,-69.7",
    reviewsList: [
      { name: "Holly", date: "August 2026", text: "Heard loons the first night and thought it was a recording, it was not. Perfectly quiet, perfectly simple." },
      { name: "Ravi", date: "June 2026", text: "Best sunset paddle of any trip we've taken. The point of land really does feel private." },
    ],
  },
  {
    slug: "bitterroot-homestead",
    name: "Bitterroot Homestead",
    location: "Bitterroot Valley, Montana",
    moods: ["treetop", "fireside"],
    price: 234,
    rating: 4.9,
    reviews: 58,
    guests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    badge: "New this season",
    blurb: "A converted homestead cabin on 40 acres with the Bitterroot range filling every west-facing window.",
    description: [
      "This one started as a 1930s homestead and was rebuilt board by board, keeping the original footprint and most of the timber. Forty private acres surround it, mostly open pasture rolling toward the mountains, so the view never really goes away no matter which window you're at.",
      "Elk move through the lower field most mornings in fall. There's no cell service on purpose; a landline in the kitchen connects to the host if you need anything."
    ],
    theSpace: "Three bedrooms across a single story, a mudroom for boots and gear, and a covered porch facing due west at the range.",
    guestAccess: "The homestead cabin and all 40 acres are yours to walk. A working barn a quarter mile off is active ranch property and off-limits.",
    host: { name: "Hank", since: 2023, responseTime: "within a few hours" },
    images: [img(PHOTO.lodge, 1600, 1200), img(PHOTO.exterior, 1200, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.bath, 1200, 1200)],
    sleeping: [
      { label: "Primary bedroom", detail: "1 king bed" },
      { label: "Second bedroom", detail: "1 queen bed" },
      { label: "Third bedroom", detail: "2 twin beds" },
    ],
    amenities: ["Wood-burning stove","Wifi","Full kitchen","Free parking","Washer & dryer","Heating","Covered porch","Mudroom","First aid kit","Fire pit","Trail maps","Hot water","Smoke alarm","Hangers","Extra linens"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 6, pets: true, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(11, 14), blockedRange(37, 41)],
    coords: "46.2,-114.1",
    reviewsList: [
      { name: "Casey", date: "October 2026", text: "Watched elk cross the lower field with coffee in hand two mornings running. No service was a feature, not a bug." },
      { name: "Lindsey", date: "September 2026", text: "Brand new to the platform and it shows, everything felt freshly done. The porch view alone is worth the drive." },
    ],
  },
  {
    slug: "cranberry-bog-cabin",
    name: "Cranberry Bog Cabin",
    location: "Northwoods, Wisconsin",
    moods: ["lakefront", "hot-tub"],
    price: 188,
    rating: 4.6,
    reviews: 47,
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    badge: "Budget favourite",
    blurb: "A no-frills lake cabin with a wood-fired sauna and a dock that's usually got a fishing rod leaning on it.",
    description: [
      "Cranberry Bog is the simplest listing in the collection and priced like it: a solid two-bedroom cabin, a private dock, and a genuine wood-fired sauna that the previous owner built by hand. It's a fishing and quiet-lake-time kind of place, not a design-magazine one.",
      "The lake is small and mostly undeveloped, loons again, and largemouth bass if you brought a rod. Firewood for the sauna is included and restocked between stays."
    ],
    theSpace: "One main floor, two bedrooms, a small dock, and a separate wood-fired sauna building a short walk from the cabin.",
    guestAccess: "The cabin, dock, rowboat, and sauna are all included. Firewood is stocked; you just need to light it.",
    host: { name: "Dale", since: 2019, responseTime: "within a day" },
    images: [img(PHOTO.lake, 1600, 1200), img(PHOTO.hottub, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.exterior, 1200, 1200)],
    sleeping: [
      { label: "Primary bedroom", detail: "1 queen bed" },
      { label: "Second bedroom", detail: "2 twin beds" },
    ],
    amenities: ["Wood-fired sauna","Wifi","Full kitchen","Free parking","Heating","Private dock","Rowboat included","First aid kit","Fire pit","Hot water","Smoke alarm","Hangers"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 4, pets: true, smoking: false, events: false, minAge: 18 },
    unavailable: [blockedRange(1, 3), blockedRange(15, 18)],
    coords: "45.8,-89.6",
    reviewsList: [
      { name: "Frank", date: "July 2026", text: "Caught more bass off that dock in three days than I have all year. Sauna is the real deal, not a gimmick." },
      { name: "Sue", date: "May 2026", text: "Basic and exactly what we wanted, no fuss. Great value next to everything else we looked at." },
    ],
  },
  {
    slug: "cypress-spring-ranch",
    name: "Cypress Spring Ranch",
    location: "Hill Country, Texas",
    moods: ["lakefront", "fireside"],
    price: 212,
    rating: 4.7,
    reviews: 69,
    guests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    badge: "Great for groups",
    blurb: "A limestone-and-cedar ranch house on a spring-fed creek, with a firepit ring built for long, warm evenings.",
    description: [
      "Cypress Spring sits on twelve private acres along a clear, spring-fed creek that stays swimmable most of the year, unusual for Hill Country in high summer. The ranch house itself is low and wide, built from local limestone, with a deep covered porch that catches the evening breeze.",
      "This is a stargazing property, genuinely: minimal light pollution, a fire ring set up away from the house, and a host who's happy to point out what's overhead if you ask."
    ],
    theSpace: "One story, three bedrooms, an open kitchen and living area that spills onto the covered porch, plus a fire ring and a set of Adirondack chairs down by the creek.",
    guestAccess: "The full ranch house, the creek frontage, and the fire ring are private to your stay. Grazing land beyond the fence line belongs to the working ranch next door.",
    host: { name: "Del", since: 2017, responseTime: "within a few hours" },
    images: [img(PHOTO.exterior, 1600, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.lake, 1200, 1200), img(PHOTO.bath, 1200, 1200)],
    sleeping: [
      { label: "Primary bedroom", detail: "1 king bed" },
      { label: "Second bedroom", detail: "1 queen bed" },
      { label: "Third bedroom", detail: "2 twin beds" },
    ],
    amenities: ["Wood-burning fireplace","Wifi","Full kitchen","Free parking","Washer & dryer","Heating","Covered porch","Fire pit","Creek access","First aid kit","Trail maps","Hot water","Smoke alarm","Hangers","Extra linens"],
    rules: { checkIn: "4:00 PM", checkOut: "11:00 AM", maxGuests: 6, pets: true, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(3, 6), blockedRange(22, 26)],
    coords: "30.3,-98.9",
    reviewsList: [
      { name: "Marisol", date: "June 2026", text: "The creek was the surprise of the trip, cold and clear even in July. Stars at night were unreal." },
      { name: "Tyler", date: "April 2026", text: "Booked for a bachelor weekend, the porch and fire ring made it easy, nobody wanted to leave." },
    ],
  },
  {
    slug: "cliffside-cypress-cottage",
    name: "Cliffside Cypress Cottage",
    location: "Central Coast, California",
    moods: ["treetop", "hot-tub"],
    price: 297,
    rating: 4.9,
    reviews: 91,
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    badge: "Guest favourite",
    blurb: "A weathered redwood cottage on a coastal bluff, with a hot tub angled straight at the ocean.",
    description: [
      "This one sits close enough to the bluff edge to hear the waves from bed, tucked into a stand of wind-bent cypress that's been growing sideways for a century. The hot tub is the whole point: built into a deck that faces due west, it's been the setting for more than a few proposals.",
      "Fog is part of the deal here, especially mornings, and most guests end up loving it once they stop expecting wall-to-wall sun."
    ],
    theSpace: "A single-story cottage with two bedrooms, an open living area facing the water, and a bluff-edge deck with the hot tub.",
    guestAccess: "The full cottage and deck are private. A public coastal trail runs along the bluff below and is open to other walkers, though it's rarely busy.",
    host: { name: "Renata", since: 2019, responseTime: "within an hour" },
    images: [img(PHOTO.exterior, 1600, 1200), img(PHOTO.hottub, 1200, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.bath, 1200, 1200)],
    sleeping: [
      { label: "Primary bedroom", detail: "1 king bed" },
      { label: "Second bedroom", detail: "1 queen bed" },
    ],
    amenities: ["Wifi","Full kitchen","Free parking","Heating","Hot tub","Ocean-view deck","First aid kit","Binoculars provided","Hot water","Smoke alarm","Hangers","Extra linens"],
    rules: { checkIn: "4:00 PM", checkOut: "11:00 AM", maxGuests: 4, pets: false, smoking: false, events: false, minAge: 25 },
    unavailable: [blockedRange(9, 12), blockedRange(30, 35)],
    coords: "35.9,-121.4",
    reviewsList: [
      { name: "Owen", date: "May 2026", text: "Proposed in that hot tub, would not have picked anywhere else after seeing the photos. Delivered in person too." },
      { name: "Priyanka", date: "March 2026", text: "Fog rolled in the first morning and it was somehow better than sun would've been. Unreal spot." },
    ],
  },
  {
    slug: "copper-harbor-cabin",
    name: "Copper Harbor Cabin",
    location: "Upper Peninsula, Michigan",
    moods: ["lakefront", "treetop"],
    price: 174,
    rating: 4.6,
    reviews: 52,
    guests: 5,
    bedrooms: 2,
    beds: 3,
    baths: 1,
    badge: "Budget favourite",
    blurb: "A basic, sturdy cabin on Lake Superior's shore, close enough to the water to hear it change moods.",
    description: [
      "Copper Harbor is about as far as you can get and still be in Michigan, which is most of the appeal. The cabin is simple and well-built, set just above a rocky Superior shoreline that can be flat calm one hour and genuinely dramatic the next.",
      "Agates turn up on the beach after storms if you're willing to look. Cell service is spotty on purpose out here; the host leaves a paper map of the peninsula on the kitchen table."
    ],
    theSpace: "One main floor with two bedrooms, a wood stove, and a screened porch angled at the lake.",
    guestAccess: "The cabin, porch, and a short private path down to the rocky shoreline are yours during your stay.",
    host: { name: "Marv", since: 2014, responseTime: "within a day" },
    images: [img(PHOTO.lake, 1600, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.exterior, 1200, 1200), img(PHOTO.bath, 1200, 1200)],
    sleeping: [
      { label: "Primary bedroom", detail: "1 queen bed" },
      { label: "Second bedroom", detail: "2 twin beds" },
    ],
    amenities: ["Wood-burning stove","Wifi","Full kitchen","Free parking","Heating","Screened porch","First aid kit","Trail maps","Hot water","Smoke alarm","Hangers"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 5, pets: true, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(5, 8), blockedRange(27, 30)],
    coords: "47.5,-87.9",
    reviewsList: [
      { name: "Ingrid", date: "August 2026", text: "Found four agates the first morning after a storm, felt like treasure hunting. So quiet out there." },
      { name: "Boone", date: "June 2026", text: "Superior in a mood the whole weekend, big waves one day, glass the next. Cabin kept us warm and dry either way." },
    ],
  },
  {
    slug: "shenandoah-ridge-cabin",
    name: "Shenandoah Ridge Cabin",
    location: "Shenandoah Valley, Virginia",
    moods: ["fireside", "treetop"],
    price: 198,
    rating: 4.8,
    reviews: 76,
    guests: 6,
    bedrooms: 3,
    beds: 3,
    baths: 2,
    badge: "Rare find",
    blurb: "A log cabin on a ridgeline with a long valley view, close enough to Skyline Drive for an easy day trip.",
    description: [
      "This one sits right on a ridge with the whole valley laid out below, farmland on one side and Blue Ridge peaks on the other. It's a genuine log cabin, hand-notched corners and all, restored with modern plumbing and heat but nothing else changed.",
      "Skyline Drive is a short drive away for overlooks and hiking, but honestly the porch view here rivals most of them."
    ],
    theSpace: "Three bedrooms across two floors, a great room with a stone fireplace, and a full-width porch facing the valley.",
    guestAccess: "The full cabin and porch. A hay field beyond the fence is part of a neighboring farm and off-limits.",
    host: { name: "Constance", since: 2016, responseTime: "within a few hours" },
    images: [img(PHOTO.lodge, 1600, 1200), img(PHOTO.exterior, 1200, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.bath, 1200, 1200)],
    sleeping: [
      { label: "Primary bedroom", detail: "1 king bed" },
      { label: "Second bedroom", detail: "1 queen bed" },
      { label: "Third bedroom", detail: "2 twin beds" },
    ],
    amenities: ["Wood-burning fireplace","Wifi","Full kitchen","Free parking","Washer & dryer","Heating","Valley-view porch","First aid kit","Fire pit","Trail maps","Hot water","Smoke alarm","Hangers","Extra linens"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 6, pets: true, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(7, 10), blockedRange(24, 28)],
    coords: "38.6,-78.4",
    reviewsList: [
      { name: "Harold", date: "October 2026", text: "Fall colors from that porch were better than anything we saw on Skyline Drive itself, and far less crowded." },
      { name: "Petra", date: "July 2026", text: "Genuine log cabin, not a themed one, you can tell the difference immediately. Loved it." },
    ],
  },
  {
    slug: "presidential-range-cabin",
    name: "Presidential Range Cabin",
    location: "White Mountains, New Hampshire",
    moods: ["fireside", "treetop"],
    price: 226,
    rating: 4.8,
    reviews: 65,
    guests: 7,
    bedrooms: 3,
    beds: 5,
    baths: 2,
    badge: "New this season",
    blurb: "A timber cabin at the base of the Presidential Range, with a mudroom built for genuinely serious hikers.",
    description: [
      "Built at the trailhead end of a dead-end road, this cabin exists mainly to send people up into the Presidentials and take them back in, warm and dry, at the end of the day. The mudroom is oversized on purpose: boot dryers, hooks for six sets of gear, a bench for the inevitable re-lacing.",
      "It's a no-nonsense place inside, comfortable but not fussy, which tends to suit the crowd that books it."
    ],
    theSpace: "Three bedrooms, a bunk nook that sleeps two more, a great room with a wood stove, and that oversized mudroom at the entry.",
    guestAccess: "The full cabin, mudroom, and a small gear shed with trailhead maps are included.",
    host: { name: "Abernathy", since: 2024, responseTime: "within a few hours" },
    images: [img(PHOTO.lodge, 1600, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.exterior, 1200, 1200), img(PHOTO.bath, 1200, 1200)],
    sleeping: [
      { label: "Primary bedroom", detail: "1 queen bed" },
      { label: "Second bedroom", detail: "1 queen bed" },
      { label: "Third bedroom", detail: "1 queen bed" },
      { label: "Bunk nook", detail: "2 twin bunks" },
    ],
    amenities: ["Wood-burning stove","Wifi","Full kitchen","Free parking","Washer & dryer","Heating","Mudroom with boot dryers","First aid kit","Trail maps","Gear shed","Hot water","Smoke alarm","Hangers","Extra linens"],
    rules: { checkIn: "3:00 PM", checkOut: "10:00 AM", maxGuests: 7, pets: true, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(2, 4), blockedRange(18, 22), blockedRange(44, 48)],
    coords: "44.3,-71.3",
    reviewsList: [
      { name: "Quinn", date: "September 2026", text: "That mudroom is genius, six wet hikers and it still didn't feel chaotic getting everyone sorted." },
      { name: "Beatrix", date: "August 2026", text: "New listing, everything felt fresh, and being right at the trailhead saved us a ton of driving time." },
    ],
  },
  {
    slug: "sawtooth-basin-cabin",
    name: "Sawtooth Basin Cabin",
    location: "Sawtooth Mountains, Idaho",
    moods: ["lakefront", "treetop"],
    price: 243,
    rating: 4.9,
    reviews: 48,
    guests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    badge: "Rare find",
    blurb: "A high-basin cabin below genuinely jagged peaks, on a lake so clear you can count rocks thirty feet down.",
    description: [
      "The Sawtooths don't get the crowds of the bigger-name ranges, and this cabin sits deep enough in the basin that it rarely feels like anyone else is around. The lake out front is glacially clear, cold even in August, and good for a short, bracing swim before coffee.",
      "It's a genuine drive to get here, the last stretch on gravel, which is exactly why it's stayed this quiet."
    ],
    theSpace: "Three bedrooms, an open living area with big windows facing the peaks, and a dock with a small rowboat.",
    guestAccess: "The cabin, dock, and rowboat are private to your stay. The surrounding basin is public wilderness, open to hikers passing through.",
    host: { name: "Osric", since: 2020, responseTime: "within a day" },
    images: [img(PHOTO.lake, 1600, 1200), img(PHOTO.exterior, 1200, 1200), img(PHOTO.living, 1200, 1200), img(PHOTO.bedroom, 1200, 1200), img(PHOTO.bath, 1200, 1200)],
    sleeping: [
      { label: "Primary bedroom", detail: "1 king bed" },
      { label: "Second bedroom", detail: "1 queen bed" },
      { label: "Third bedroom", detail: "2 twin beds" },
    ],
    amenities: ["Wood-burning stove","Wifi","Full kitchen","Free parking","Heating","Private dock","Rowboat included","First aid kit","Trail maps","Hot water","Smoke alarm","Hangers","Extra linens"],
    rules: { checkIn: "4:00 PM", checkOut: "10:00 AM", maxGuests: 6, pets: true, smoking: false, events: false, minAge: 21 },
    unavailable: [blockedRange(13, 16), blockedRange(34, 39)],
    coords: "44.1,-114.9",
    reviewsList: [
      { name: "Fenn", date: "August 2026", text: "The gravel road is worth every minute, we saw two other people the entire weekend. Water clarity has to be seen to be believed." },
      { name: "Idris", date: "July 2026", text: "Genuinely one of the best views we've had from a porch, and we've stayed at a lot of these kinds of places." },
    ],
  },
];

const MOODS = [
  { key: "fireside", label: "Fireside", image: img(PHOTO.living, 700, 900) },
  { key: "lakefront", label: "Lakefront", image: img(PHOTO.lake, 700, 900) },
  { key: "treetop", label: "Treetop", image: img(PHOTO.exterior, 700, 900) },
  { key: "hot-tub", label: "Hot tub", image: img(PHOTO.bath, 700, 900) },
];

function getStay(slug) {
  return STAYS.find((s) => s.slug === slug);
}

const CURRENCIES = {
  USD: { symbol: "$", rate: 1, flag: "🇺🇸" },
  EUR: { symbol: "€", rate: 0.92, flag: "🇪🇺" },
  GBP: { symbol: "£", rate: 0.79, flag: "🇬🇧" },
};

function getCurrency() {
  return localStorage.getItem("fernhollow_currency") || "USD";
}

function money(n) {
  const code = getCurrency();
  const c = CURRENCIES[code] || CURRENCIES.USD;
  const converted = Math.round(n * c.rate);
  return c.symbol + converted.toLocaleString("en-US");
}
