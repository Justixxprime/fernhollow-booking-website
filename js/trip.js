/* ============================================================
   TRIP.JS
   Renders the multi-stay itinerary from TripPlanner (main.js).
   Each stop gets its own real date-picker popover (the same one
   used on the stay detail page), and "Continue to book" hands off
   to the existing single-stay booking flow via BookingState —
   there's no shared multi-item checkout since that would need a
   real backend to hold a combined payment.
   ============================================================ */

function initTripPage() {
  renderTrip();
  renderExperienceCart();
  document.querySelector("[data-print-trip]")?.addEventListener("click", () => window.print());
}

function renderTrip() {
  const stops = TripPlanner.get();
  const listMount = document.querySelector("[data-trip-list]");
  const emptyState = document.querySelector("[data-trip-empty]");
  const summaryEl = document.querySelector("[data-trip-summary]");
  const template = document.getElementById("trip-stop-template");

  if (!stops.length) {
    // Only show the "your trip is empty" illustration if there's truly
    // nothing at all — a trip made up of just experiences (no stays yet)
    // is still a real trip in progress, not an empty one.
    emptyState.hidden = ExperienceCart.get().length > 0;
    listMount.innerHTML = "";
    renderTripSummary();
    return;
  }
  emptyState.hidden = true;

  listMount.innerHTML = "";
  let grandTotal = 0;
  let totalNights = 0;
  let stopsWithDates = 0;

  stops.forEach((stop) => {
    const stay = getStay(stop.slug);
    if (!stay) return; // stay was removed from the catalog since being added

    const node = template.content.cloneNode(true);
    const card = node.querySelector(".trip-stop");
    const stopLinks = node.querySelectorAll("[data-stop-link]");
    stopLinks.forEach((a) => (a.href = `stay-detail.html?stay=${stay.slug}`));
    node.querySelector("[data-stop-image]").src = stay.images[0];
    node.querySelector("[data-stop-image]").alt = stay.name;
    node.querySelector("[data-stop-name]").textContent = stay.name;
    node.querySelector("[data-stop-location]").textContent = stay.location;

    const checkinBtn = node.querySelector("[data-stop-checkin]");
    const checkoutBtn = node.querySelector("[data-stop-checkout]");
    const priceEl = node.querySelector("[data-stop-price]");
    const nightsEl = node.querySelector("[data-stop-nights]");
    const bookLink = node.querySelector("[data-stop-book]");
    const removeBtn = node.querySelector("[data-stop-remove]");

    function paintStop() {
      checkinBtn.textContent = stop.checkin ? formatDate(stop.checkin) : "Add date";
      checkoutBtn.textContent = stop.checkout ? formatDate(stop.checkout) : "Add date";
      const nights = nightsBetween(stop.checkin, stop.checkout);
      if (nights) {
        const subtotal = nights * stay.price;
        const fee = Math.round(subtotal * SERVICE_FEE_RATE);
        const tax = Math.round(subtotal * TAX_RATE);
        priceEl.textContent = money(subtotal + fee + tax);
        nightsEl.textContent = `${nights} night${nights > 1 ? "s" : ""}`;
        bookLink.classList.remove("is-disabled");
      } else {
        priceEl.textContent = money(stay.price) + "/night";
        nightsEl.textContent = "Add dates for a total";
      }
      bookLink.href = "#";
    }
    paintStop();

    attachDatePickerPopover(checkinBtn, document.body, {
      unavailable: stay.unavailable,
      minDate: new Date(),
      initialStart: stop.checkin,
      initialEnd: stop.checkout,
      onBlockedCross: () => {},
      onChange: ({ start, end }) => {
        stop.checkin = start;
        stop.checkout = end;
        TripPlanner.update(stay.slug, start, end);
        paintStop();
        renderTripSummary();
      },
      onDone: () => {},
    });
    attachDatePickerPopover(checkoutBtn, document.body, {
      unavailable: stay.unavailable,
      minDate: new Date(),
      initialStart: stop.checkin,
      initialEnd: stop.checkout,
      onBlockedCross: () => {},
      onChange: ({ start, end }) => {
        stop.checkin = start;
        stop.checkout = end;
        TripPlanner.update(stay.slug, start, end);
        paintStop();
        renderTripSummary();
      },
      onDone: () => {},
    });

    bookLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (!stop.checkin || !stop.checkout) {
        showToast("Add check-in and check-out dates for this stop first");
        return;
      }
      BookingState.saveDraft({
        slug: stay.slug,
        checkin: stop.checkin,
        checkout: stop.checkout,
        guests: Math.min(2, stay.guests),
      });
      location.href = `booking.html?stay=${stay.slug}`;
    });

    removeBtn.addEventListener("click", () => {
      TripPlanner.remove(stay.slug);
      showToast(`Removed ${stay.name} from your trip`);
      renderTrip();
    });

    listMount.appendChild(card);

    const nights = nightsBetween(stop.checkin, stop.checkout);
    if (nights) {
      const subtotal = nights * stay.price;
      const fee = Math.round(subtotal * SERVICE_FEE_RATE);
      const tax = Math.round(subtotal * TAX_RATE);
      grandTotal += subtotal + fee + tax;
      totalNights += nights;
      stopsWithDates++;
    }
  });

  renderTripSummary();

  function renderTripSummary() {
    const currentStops = TripPlanner.get();
    const expTotal = ExperienceCart.total();
    let total = 0, nights = 0, withDates = 0;
    currentStops.forEach((s) => {
      const stay = getStay(s.slug);
      if (!stay) return;
      const n = nightsBetween(s.checkin, s.checkout);
      if (n) {
        const subtotal = n * stay.price;
        total += subtotal + Math.round(subtotal * SERVICE_FEE_RATE) + Math.round(subtotal * TAX_RATE);
        nights += n;
        withDates++;
      }
    });
    const grandTotal = total + expTotal;

    if (!withDates && !expTotal) {
      summaryEl.hidden = true;
      return;
    }
    summaryEl.hidden = false;
    const labelParts = [];
    if (currentStops.length) labelParts.push(`${currentStops.length} stop${currentStops.length > 1 ? "s" : ""}, ${nights} night${nights === 1 ? "" : "s"}`);
    if (expTotal) labelParts.push(`${ExperienceCart.get().reduce((n, i) => n + i.qty, 0)} experience${ExperienceCart.get().length > 1 ? "s" : ""}`);
    document.querySelector("[data-trip-summary-label]").textContent = labelParts.join(" + ") || "Your trip so far";
    document.querySelector("[data-trip-summary-total]").textContent = money(grandTotal);

    const expNoteEl = document.querySelector("[data-trip-summary-experiences-note]");
    if (expTotal) {
      expNoteEl.hidden = false;
      expNoteEl.textContent = `Includes ${money(expTotal)} in experiences`;
    } else {
      expNoteEl.hidden = true;
    }

    document.querySelector("[data-trip-summary-note]").textContent =
      withDates < currentStops.length
        ? `${currentStops.length - withDates} stop${currentStops.length - withDates > 1 ? "s" : ""} still need dates to be included in this total.`
        : "Combined total across every stop and experience, before booking any of them individually.";
  }
}

/* ---------- experience cart (from experiences.html) ----------
   Renders, and lets you edit right here: quantity steppers, a
   per-item remove, and a "clear all" — a real cart, not a one-way
   list. Every mutation re-renders both this and the trip summary
   above so the totals never drift out of sync with what's on screen. */
function renderExperienceCart() {
  const section = document.querySelector("[data-experiences-section]");
  const listMount = document.querySelector("[data-experience-cart-list]");
  const totalEl = document.querySelector("[data-experience-cart-total]");
  const template = document.getElementById("experience-item-template");
  const clearBtn = document.querySelector("[data-experience-cart-clear]");
  if (!section || !listMount || !template) return;

  const items = ExperienceCart.get();
  if (!items.length) {
    section.hidden = true;
    listMount.innerHTML = "";
    return;
  }
  section.hidden = false;
  listMount.innerHTML = "";

  items.forEach((item) => {
    const node = template.content.cloneNode(true);
    node.querySelector("[data-exp-name]").textContent = item.name;
    node.querySelector("[data-exp-unit-price]").textContent = `${money(item.price)} / ${item.unit}`;
    node.querySelector("[data-exp-qty]").textContent = item.qty;
    node.querySelector("[data-exp-line-total]").textContent = money(item.price * item.qty);

    node.querySelector("[data-exp-minus]").addEventListener("click", () => {
      if (item.qty <= 1) {
        ExperienceCart.remove(item.id);
        showToast(item.name + " removed from your trip");
      } else {
        ExperienceCart.setQty(item.id, item.qty - 1);
      }
      renderExperienceCart();
      renderTrip();
    });
    node.querySelector("[data-exp-plus]").addEventListener("click", () => {
      ExperienceCart.setQty(item.id, item.qty + 1);
      renderExperienceCart();
      renderTrip();
    });
    node.querySelector("[data-exp-remove]").addEventListener("click", () => {
      ExperienceCart.remove(item.id);
      showToast(item.name + " removed from your trip");
      renderExperienceCart();
      renderTrip();
    });

    listMount.appendChild(node);
  });

  totalEl.textContent = money(ExperienceCart.total());

  clearBtn.onclick = () => {
    if (!confirm("Remove every experience from this trip?")) return;
    ExperienceCart.clear();
    showToast("Experiences cleared");
    renderExperienceCart();
    renderTrip();
  };
}

document.addEventListener("DOMContentLoaded", initTripPage);
