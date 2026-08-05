/* ============================================================
   BLOG-POST.JS
   ============================================================ */

function initBlogPost() {
  const params = new URLSearchParams(location.search);
  const post = getBlogPost(params.get("post")) || BLOG_POSTS[0];
  document.title = `${post.title}: Fernhollow`;

  document.querySelector("[data-post-title]").textContent = post.title;
  document.querySelector("[data-post-date]").textContent = post.date;
  document.querySelector("[data-post-read]").textContent = `${post.readMins} min read`;
  document.querySelector("[data-post-tags]").innerHTML = post.tags.map((t) => `<span>${t}</span>`).join("");
  document.querySelector("[data-post-image]").src = post.image;
  document.querySelector("[data-post-image]").alt = post.title;
  document.querySelector("[data-post-body]").innerHTML = post.body.map((p) => `<p>${p}</p>`).join("");

  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);
  document.querySelector("[data-post-more]").innerHTML = others
    .map(
      (p) => `
    <a class="blog-card" href="blog-post.html?post=${p.slug}">
      <img src="${p.image}" alt="${p.title}" loading="lazy">
      <div class="blog-card-body">
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
      </div>
    </a>`
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", initBlogPost);
