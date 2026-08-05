/* ============================================================
   MANAGE-BOOKING.JS
   Looks up a booking by confirmation code. Since there's no real
   backend, this can only ever find the booking actually made in this
   browser (stored by booking-state.js) — entering any other code
   correctly returns "not found" rather than faking a match.
   ============================================================ */

function initManageBooking() {
  const form = document.querySelector("[data-lookup-form]");
  const input = document.querySelector("[data-lookup-input]");
  const result = document.querySelector("[data-lookup-result]");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = input.value.trim().toUpperCase();
    const booking = BookingState.getLast();

    if (!code) return;
    if (!booking || booking.code !== code) {
      result.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-magnifying-glass" style="font-size:40px;color:var(--brass-dark);margin-bottom:14px;display:block;"></i>
          <h3>No booking found for "${code}"</h3>
          <p>This demo only looks up a booking actually made in this browser. Book a stay, then look up the code from your confirmation page.</p>
        </div>`;
      return;
    }

    const stay = getStay(booking.slug);
    result.innerHTML = `
      <div class="lookup-result">
        <div style="display:flex;gap:16px;align-items:center;border:1px solid var(--parchment-line);border-radius:var(--radius-lg);padding:20px;background:var(--parchment-soft);">
          <img src="${booking.photo}" alt="" style="width:80px;height:80px;border-radius:12px;object-fit:cover;">
          <div>
            <b style="font-family:var(--font-display);font-size:1.2rem;">${booking.name}</b>
            <p style="color:var(--text-on-light-soft);margin-top:4px;">${booking.location}</p>
          </div>
        </div>
        <div class="price-breakdown" style="margin-top:20px;">
          <div class="row"><span><i class="fa-solid fa-calendar-days review-icon"></i>Dates</span><span>${formatDate(booking.checkin)} to ${formatDate(booking.checkout)}</span></div>
          <div class="row"><span><i class="fa-solid fa-user-group review-icon"></i>Guests</span><span>${booking.guests}</span></div>
          <div class="row"><span><i class="fa-solid fa-envelope review-icon"></i>Email</span><span>${booking.details?.email || "Not set"}</span></div>
          <div class="row total"><span>Total paid</span><span>${money(booking.total)}</span></div>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap;">
          <a href="stay-detail.html?stay=${stay?.slug || ""}" class="btn btn-ghost-light">View stay</a>
          <button class="btn btn-ghost-light" data-cancel-booking style="color:var(--rust);border-color:var(--rust);"><i class="fa-solid fa-ban"></i> Cancel booking</button>
        </div>
      </div>`;

    document.querySelector("[data-cancel-booking]")?.addEventListener("click", async () => {
      const ok = await confirmDialog({
        title: "Cancel this booking?",
        message: "This can't be undone in the demo.",
        confirmLabel: "Cancel booking",
        danger: true,
      });
      if (!ok) return;
      localStorage.removeItem(BookingState.lastKey);
      showToast("Booking cancelled");
      result.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-check" style="font-size:40px;color:var(--moss);margin-bottom:14px;display:block;"></i><h3>Booking cancelled</h3><p>You'll be refunded in full within 5 business days on a real booking. This one's just gone.</p></div>`;
    });
  });
}

document.addEventListener("DOMContentLoaded", initManageBooking);
