/* ============================================================
   SAVED.JS
   ============================================================ */

function initSavedPage() {
  const grid = document.querySelector("[data-saved-grid]");
  const countEl = document.querySelector("[data-saved-count]");
  const emptyState = document.querySelector("[data-empty-state]");

  function render() {
    const slugs = SavedStays.get();
    const list = STAYS.filter((s) => slugs.includes(s.slug));
    countEl.textContent = `${list.length} saved stay${list.length !== 1 ? "s" : ""}`;
    if (!list.length) {
      grid.innerHTML = "";
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";
    renderStayCards(list, grid);
  }

  render();
  window.__onSaveToggle = () => render();
}

document.addEventListener("DOMContentLoaded", initSavedPage);
