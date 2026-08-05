/* ============================================================
   BLOG.JS
   ============================================================ */

function initBlogPage() {
  const grid = document.querySelector("[data-blog-grid]");
  if (!grid) return;
  grid.innerHTML = BLOG_POSTS.map(
    (p) => `
    <a class="blog-card" href="blog-post.html?post=${p.slug}" data-reveal>
      <img src="${p.image}" alt="${p.title}" loading="lazy">
      <div class="blog-card-body">
        <div class="blog-card-tags">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
        <div class="blog-card-meta">
          <span><i class="fa-regular fa-calendar"></i> ${p.date}</span>
          <span><i class="fa-regular fa-clock"></i> ${p.readMins} min read</span>
        </div>
      </div>
    </a>`
  ).join("");
  document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
}

document.addEventListener("DOMContentLoaded", initBlogPage);
