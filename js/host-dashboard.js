/* ============================================================
   HOST-DASHBOARD.JS
   A mock host-facing view, baseline demo data plus whatever real
   bookings have actually been completed on this device. There's no
   backend and no other guests behind the scenes, so this is the honest
   version of "real": your own confirmed bookings are read straight out
   of BookingState and layered on top of a fabricated baseline, live.
   ============================================================ */

const DASH_MONTHS = [
  { label: "Feb", value: 62 }, { label: "Mar", value: 71 }, { label: "Apr", value: 68 },
  { label: "May", value: 80 }, { label: "Jun", value: 92 }, { label: "Jul", value: 97 },
];
const DASH_BASE_REVENUE = 18420;
const DASH_BASE_CHECKINS = 5;

function initHostDashboard() {
  const realBookings = BookingState.getHistory();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  /* ---- occupancy chart: nudge the current month up for real activity ---- */
  const months = DASH_MONTHS.map((m, i) => {
    if (i !== DASH_MONTHS.length - 1) return m;
    const bump = Math.min(realBookings.length * 2, 8);
    return { ...m, value: Math.min(100, m.value + bump) };
  });
  const barChart = document.querySelector("[data-dash-chart]");
  const max = Math.max(...months.map((m) => m.value));
  barChart.innerHTML = months.map(
    (m) => `
    <div class="bar-col">
      <div class="bar" style="height:${(m.value / max) * 140}px;" title="${m.value}% occupancy"></div>
      <span class="bar-label">${m.label}</span>
    </div>`
  ).join("");

  /* ---- stats: baseline + real bookings made on this device ---- */
  const realRevenue = realBookings.reduce((sum, b) => sum + (b.total || 0), 0);
  const revenueEl = document.querySelector("[data-dash-revenue]");
  if (revenueEl) revenueEl.textContent = money(DASH_BASE_REVENUE + realRevenue);
  const trendEl = document.querySelector("[data-dash-revenue-trend]");
  if (trendEl && realBookings.length) {
    trendEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> +12% vs last month, incl. ${money(realRevenue)} from ${realBookings.length} booking${realBookings.length > 1 ? "s" : ""} on this device`;
  }
  const realUpcoming = realBookings.filter((b) => new Date(b.checkin) >= today).length;
  const checkinsEl = document.querySelector("[data-dash-checkins]");
  if (checkinsEl) checkinsEl.textContent = String(DASH_BASE_CHECKINS + realUpcoming);
  const occEl = document.querySelector("[data-dash-occupancy]");
  if (occEl) occEl.textContent = `${months[months.length - 1].value}%`;

  /* ---- bookings list: your real ones first, demo filler underneath ---- */
  const bookingsMount = document.querySelector("[data-dash-bookings]");
  const realRows = realBookings
    .slice()
    .reverse()
    .map((b) => {
      const stay = getStay(b.slug);
      const checkin = new Date(b.checkin);
      const isToday = checkin.getTime() === today.getTime();
      const status = checkin < today ? "Completed" : isToday ? "Checking in today" : "Upcoming";
      return {
        photo: stay?.images?.[0] || b.photo || "",
        name: stay?.name || b.name || "A Fernhollow stay",
        guest: b.details?.name || "You",
        nights: b.nights || 1,
        status,
        real: true,
      };
    });

  const demoGuests = ["Priya M.", "Han K.", "Grace O.", "Iris D.", "Callum R."];
  const bookedSlugs = new Set(realBookings.map((b) => b.slug));
  const demoRows = STAYS.filter((s) => !bookedSlugs.has(s.slug))
    .slice(0, Math.max(0, 5 - realRows.length))
    .map((s, i) => ({
      photo: s.images[0],
      name: s.name,
      guest: demoGuests[i % demoGuests.length],
      nights: [3, 5, 2, 4, 3][i % 5],
      status: i === 0 && !realRows.length ? "Checking in today" : i < 3 ? "Upcoming" : "Confirmed",
      real: false,
    }));

  bookingsMount.innerHTML = [...realRows, ...demoRows]
    .map(
      (b) => `
    <div class="dash-booking-row${b.real ? " is-real" : ""}">
      <img src="${b.photo}" alt="">
      <div>
        <b>${b.name}</b>
        <p style="font-size:.82rem;color:var(--text-on-light-soft);">${b.guest}, ${b.nights} night${b.nights > 1 ? "s" : ""}${b.real ? ' <span style="color:var(--brass-dark);font-weight:700;">· booked on this device</span>' : ""}</p>
      </div>
      <span class="badge">${b.status}</span>
    </div>`
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", initHostDashboard);
