/* ============================================================
   COMPARE.JS
   ============================================================ */

const COMPARE_AMENITIES = ["Wifi", "Free parking", "Hot tub", "Fire pit", "Dog friendly", "Kitchen"];

function amenityPresent(stay, keyword) {
  return stay.amenities.some((a) => a.toLowerCase().includes(keyword.toLowerCase()));
}

function initComparePage() {
  const params = new URLSearchParams(location.search);
  const picks = ["a", "b", "c"].map((k) => params.get(k) || "");
  const selects = document.querySelectorAll("[data-compare-select]");

  selects.forEach((sel, i) => {
    sel.innerHTML =
      `<option value="">Choose a stay to compare</option>` +
      STAYS.map((s) => `<option value="${s.slug}" ${s.slug === picks[i] ? "selected" : ""}>${s.name}</option>`).join("");
    sel.addEventListener("change", render);
  });

  document.querySelector("[data-compare-picker-clear]")?.addEventListener("click", () => {
    selects.forEach((sel) => (sel.value = ""));
    render();
  });

  function render() {
    // Keep the URL in sync with whatever's actually picked, so a refresh
    // (or sharing the link) reflects the current selection rather than
    // whatever was in the URL when the page first loaded — otherwise
    // clearing a dropdown and reloading would silently bring the old
    // pick right back.
    const url = new URL(location.href);
    ["a", "b", "c"].forEach((key, i) => {
      const val = selects[i]?.value;
      if (val) url.searchParams.set(key, val);
      else url.searchParams.delete(key);
    });
    history.replaceState(null, "", url);

    const chosen = [...selects].map((s) => getStay(s.value)).filter(Boolean);
    const wrap = document.querySelector("[data-compare-table]");
    if (chosen.length < 2) {
      wrap.innerHTML = `<div class="empty-state"><i class="fa-solid fa-scale-balanced" style="font-size:44px;color:var(--brass-dark);margin-bottom:16px;display:block;"></i><h3>Pick at least two stays</h3><p>Choose from the dropdowns above to compare them side by side.</p></div>`;
      return;
    }
    const rows = [
      ["Photo", (s) => `<img src="${s.images[0]}" alt="${s.name}">`],
      ["Name", (s) => `<b>${s.name}</b>`],
      ["Location", (s) => s.location],
      ["Price / night", (s) => money(s.price)],
      ["Rating", (s) => `★ ${s.rating} (${s.reviews})`],
      ["Guests", (s) => s.guests],
      ["Bedrooms", (s) => s.bedrooms],
      ["Baths", (s) => s.baths],
      ...COMPARE_AMENITIES.map((a) => [a, (s) => (amenityPresent(s, a) ? `<i class="fa-solid fa-check yes"></i>` : `<i class="fa-solid fa-xmark no"></i>`)]),
      ["", (s) => `<a href="stay-detail.html?stay=${s.slug}" class="btn btn-primary btn-sm">View stay</a>`],
    ];
    wrap.innerHTML = `
      <div class="compare-table-wrap">
        <table class="compare-table">
          ${rows
            .map(
              (row) => `
            <tr>
              <th>${row[0]}</th>
              ${chosen.map((s) => `<td>${row[1](s)}</td>`).join("")}
            </tr>`
            )
            .join("")}
        </table>
      </div>`;
  }

  render();
  // Without this, a currency click on this page would fall back to a
  // full page reload (main.js's default when a page hasn't registered
  // anything smarter) just to update a few price cells.
  window.__refreshPrices = render;
}

document.addEventListener("DOMContentLoaded", initComparePage);
