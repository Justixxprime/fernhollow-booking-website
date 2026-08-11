const BLOG_POSTS = [
  {
    slug: "catskills-fall-foliage-guide",
    title: "A quiet guide to Catskills fall foliage",
    excerpt: "The back roads locals actually drive, and the two-week window most visitors miss entirely.",
    date: "October 3, 2025",
    readMins: 6,
    image: "https://images.pexels.com/photos/14614869/pexels-photo-14614869.jpeg?auto=format&fit=crop&w=1400&h=900&q=80",
    tags: ["Catskills", "Fall"],
    body: [
      "Peak color in the Catskills is shorter and earlier than most people plan for, usually the first two weeks of October at the elevations around Birch Hollow, and it moves fast once it starts.",
      "Skip the main overlooks on Route 23A on a weekend, they back up for miles. The gravel roads above Woodstock give you the same ridge views without the traffic, and most of them are drivable in an ordinary car if it hasn't rained hard recently.",
      "Bring a thermos. Mornings up here drop close to freezing even while the days stay mild, and the best light for photos is the first hour after sunrise, which is also the coldest part of the day by a wide margin."
    ],
  },
  {
    slug: "hosting-a-quiet-week",
    title: "What actually makes a week feel like it slowed down",
    excerpt: "Six years of hosting taught us it's rarely the amenities. It's almost always the absence of a schedule.",
    date: "August 14, 2025",
    readMins: 5,
    image: "https://images.pexels.com/photos/15558300/pexels-photo-15558300.jpeg?auto=format&fit=crop&w=1400&h=900&q=80",
    tags: ["Hosting", "Reflections"],
    body: [
      "The guests who leave the best reviews almost never mention the hot tub or the view. They mention not knowing what day it was by Wednesday.",
      "That's harder to engineer than it sounds. It mostly comes down to what we deliberately leave out: no printed itinerary in the welcome binder, no suggested daily activities, weak cell signal we don't apologize for.",
      "If you're planning your own quiet week, our one piece of advice is to under-plan on purpose. Pick one thing per day, at most, and let the rest of it be unscheduled."
    ],
  },
  {
    slug: "packing-for-a-cabin-in-any-season",
    title: "What to actually pack for a cabin, in any season",
    excerpt: "A shorter list than you'd think, and two things almost everyone forgets.",
    date: "May 2, 2025",
    readMins: 4,
    image: "https://images.unsplash.com/photo-1760095435041-3957a2fa220e?q=80&w=435&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?auto=format&fit=crop&w=1400&h=900&q=80",
    tags: ["Packing", "Practical"],
    body: [
      "Layers matter more than any single heavy item. A cabin at elevation can swing 25 degrees between a sunny afternoon and a clear night, and one warm layer beats one heavy coat every time.",
      "The two things people forget: a headlamp (phone flashlights are miserable for a dark path to a fire pit) and a physical book or deck of cards, since the whole point of spotty signal is that you'll actually use them.",
      "Beyond that, check your specific stay's amenity list before you pack, most of our cabins have a stocked kitchen, so a cooler full of groceries you already own at home is usually unnecessary weight."
    ],
  },
];

function getBlogPost(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
