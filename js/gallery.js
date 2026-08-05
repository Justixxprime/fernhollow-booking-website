/* ============================================================
   GALLERY.JS
   ============================================================ */

function initGalleryPage() {
  const filterMount = document.querySelector("[data-gallery-filters]");
  const wall = document.querySelector("[data-photo-wall]");

  filterMount.innerHTML =
    `<button class="chip" data-gallery-filter="all" aria-pressed="true">All stays</button>` +
    STAYS.map((s) => `<button class="chip" data-gallery-filter="${s.slug}" aria-pressed="false">${s.name}</button>`).join("");

  function render(filter) {
    const chosen = !filter || filter === "all" ? STAYS : STAYS.filter((s) => s.slug === filter);
    const photos = [];
    chosen.forEach((stay) => stay.images.forEach((src) => photos.push({ src, stay })));

    wall.innerHTML = photos
      .map(
        (p, i) => `
      <button type="button" data-photo-index="${i}">
        <img src="${p.src}" alt="${p.stay.name}" loading="lazy">
        <span class="cap">${p.stay.name}</span>
      </button>`
      )
      .join("");

    wall.querySelectorAll("[data-photo-index]").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const stay = photos[i].stay;
        const localIndex = stay.images.indexOf(photos[i].src);
        openLightbox(stay.images, localIndex, stay.name);
      });
    });
  }

  filterMount.querySelectorAll("[data-gallery-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      filterMount.querySelectorAll("[data-gallery-filter]").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      render(chip.dataset.galleryFilter);
    });
  });

  render("all");
}

document.addEventListener("DOMContentLoaded", initGalleryPage);
