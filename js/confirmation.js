/* ============================================================
   CONFIRMATION.JS
   ============================================================ */

function initConfirmation() {
  const booking = BookingState.getLast();
  if (!booking) {
    location.href = "stays.html";
    return;
  }
  const stay = getStay(booking.slug);

  const firstName = (booking.details.name || "").trim().split(" ")[0];
  document.querySelector("[data-confirm-first-name]").textContent = firstName ? `, ${firstName}` : "";
  document.querySelector("[data-confirm-code]").textContent = booking.code;
  document.querySelector("[data-confirm-name]").textContent = booking.name;
  document.querySelector("[data-confirm-loc]").textContent = booking.location;
  document.querySelector("[data-confirm-photo]").src = booking.photo;
  document.querySelector("[data-confirm-dates]").textContent = `${formatDate(booking.checkin)} – ${formatDate(booking.checkout)} · ${booking.nights} nights`;
  document.querySelector("[data-confirm-guests]").textContent = `${booking.guests} guest${booking.guests > 1 ? "s" : ""}`;
  document.querySelector("[data-confirm-total]").textContent = money(booking.total);
  if (booking.giftCode && booking.giftDiscount) {
    document.querySelector("[data-confirm-gift-row]").hidden = false;
    document.querySelector("[data-confirm-gift-label]").textContent = `Gift card (${booking.giftCode})`;
    document.querySelector("[data-confirm-gift-amount]").textContent = `−${money(booking.giftDiscount)}`;
  }
  document.querySelector("[data-confirm-email]").textContent = booking.details.email || "Not set";

  const addonMount = document.querySelector("[data-confirm-addons]");
  if (booking.addons?.length) {
    addonMount.innerHTML = booking.addons.map((k) => `<li>${ADDONS.find((a) => a.key === k)?.label || k}</li>`).join("");
  } else {
    addonMount.innerHTML = `<li style="color:var(--text-on-light-soft)">No add-ons selected</li>`;
  }

  document.querySelector("[data-add-calendar]").addEventListener("click", () => downloadICS(booking));
  document.querySelector("[data-print-receipt]")?.addEventListener("click", () => window.print());

  initCountdown(booking.checkin);
  initQRCode(booking);

  fireConfetti();
}

function initCountdown(checkin) {
  const row = document.querySelector("[data-countdown-row]");
  if (!row || !checkin) return;
  const target = new Date(checkin).getTime();

  function tick() {
    const diff = target - Date.now();
    // only hide once check-in day itself has fully passed, not the instant
    // midnight ticks over, so a same-day check-in still shows something
    if (diff <= -86400000) {
      row.hidden = true;
      return;
    }
    row.hidden = false;
    if (diff <= 0) {
      row.querySelector(".countdown-label").textContent = "check-in is today";
      document.querySelector("[data-countdown-days]").textContent = "0";
      document.querySelector("[data-countdown-hours]").textContent = "0";
      document.querySelector("[data-countdown-mins]").textContent = "0";
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    document.querySelector("[data-countdown-days]").textContent = days;
    document.querySelector("[data-countdown-hours]").textContent = hours;
    document.querySelector("[data-countdown-mins]").textContent = mins;
  }
  tick();
  setInterval(tick, 60000);
}

function initQRCode(booking) {
  const img = document.querySelector("[data-confirm-qr]");
  if (!img) return;
  const payload = encodeURIComponent(`Fernhollow booking ${booking.code}: ${booking.name}, ${formatDate(booking.checkin)} to ${formatDate(booking.checkout)}`);
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${payload}`;
}

function downloadICS(booking) {
  const pad = (n) => String(n).padStart(2, "0");
  const toICSDate = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fernhollow//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${booking.code}@fernhollow`,
    `DTSTAMP:${toICSDate(new Date())}T000000Z`,
    `DTSTART;VALUE=DATE:${toICSDate(booking.checkin)}`,
    `DTEND;VALUE=DATE:${toICSDate(booking.checkout)}`,
    `SUMMARY:Stay at ${booking.name}`,
    `LOCATION:${booking.location}`,
    `DESCRIPTION:Confirmation code ${booking.code}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${booking.slug}-stay.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.addEventListener("DOMContentLoaded", initConfirmation);
