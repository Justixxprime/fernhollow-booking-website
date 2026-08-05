/* ============================================================
   LIGHTBOX.JS
   A full-screen photo viewer: big image, prev/next arrows,
   swipe on touch, arrow-key + Escape support, a thumbnail strip,
   and a "3 / 12" counter. This is what actually opens when a
   guest clicks any photo in the stay-detail gallery — previously
   those buttons existed but had nothing wired to them.
   ============================================================ */

function openLightbox(images, startIndex, altBase) {
  let index = startIndex || 0;

  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close gallery">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <div class="lightbox-count"><span data-lb-current></span> / ${images.length}</div>
    <button class="lightbox-arrow lightbox-prev" aria-label="Previous photo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <div class="lightbox-stage">
      <img data-lb-img src="${images[index]}" alt="${altBase}, photo ${index + 1}">
    </div>
    <button class="lightbox-arrow lightbox-next" aria-label="Next photo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 18l6-6-6-6"/></svg>
    </button>
    <div class="lightbox-thumbs" data-lb-thumbs>
      ${images.map((src, i) => `<img src="${src}" data-lb-thumb="${i}" class="${i === index ? "active" : ""}" alt="thumbnail ${i + 1}">`).join("")}
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("is-open"));

  const img = overlay.querySelector("[data-lb-img]");
  const counter = overlay.querySelector("[data-lb-current]");
  const thumbs = [...overlay.querySelectorAll("[data-lb-thumb]")];

  function show(i) {
    index = (i + images.length) % images.length;
    img.src = images[index];
    img.alt = `${altBase}, photo ${index + 1}`;
    counter.textContent = index + 1;
    thumbs.forEach((t, ti) => t.classList.toggle("active", ti === index));
    const activeThumb = thumbs[index];
    activeThumb?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }

  const previouslyFocused = document.activeElement;
  let releaseTrap = null;

  function close() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    releaseTrap?.();
    previouslyFocused?.focus?.();
    setTimeout(() => overlay.remove(), 250);
  }

  function onKey(e) {
    if (e.key === "ArrowRight") show(index + 1);
    if (e.key === "ArrowLeft") show(index - 1);
  }

  overlay.querySelector(".lightbox-close").addEventListener("click", close);
  overlay.querySelector(".lightbox-prev").addEventListener("click", () => show(index - 1));
  overlay.querySelector(".lightbox-next").addEventListener("click", () => show(index + 1));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  thumbs.forEach((t) => t.addEventListener("click", () => show(Number(t.dataset.lbThumb))));
  document.addEventListener("keydown", onKey);
  if (typeof trapFocus === "function") releaseTrap = trapFocus(overlay, close);
  show(index);

  // touch swipe on the stage
  let touchX = null;
  const stage = overlay.querySelector(".lightbox-stage");
  stage.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  stage.addEventListener(
    "touchend",
    (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    },
    { passive: true }
  );

  // click-and-drag swipe for mouse users (touch already handled above)
  let dragStartX = null;
  stage.style.cursor = "grab";
  stage.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    dragStartX = e.clientX;
    stage.setPointerCapture(e.pointerId);
    stage.style.cursor = "grabbing";
  });
  stage.addEventListener("pointerup", (e) => {
    if (dragStartX === null) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 60) show(index + (dx < 0 ? 1 : -1));
    dragStartX = null;
    stage.style.cursor = "grab";
  });
}
