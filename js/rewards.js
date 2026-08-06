/* ============================================================
   REWARDS.JS
   Reads real confirmed bookings from BookingState.getHistory()
   (localStorage on this device) and computes points/tier from
   them. Nothing here is faked or hardcoded per visitor.
   ============================================================ */

const TIERS = [
  { name: "Old Growth", emoji: "🌲", min: 5, perk: "10% off every stay automatically, plus a free firewood bundle." },
  { name: "Grove", emoji: "🌿", min: 2, perk: "Free early check-in add-on on every booking." },
  { name: "Sprout", emoji: "🌱", min: 0, perk: "Points on every stay, from your first booking." },
];

function tierFor(stayCount) {
  return TIERS.find((t) => stayCount >= t.min);
}

function initRewardsPage() {
  const history = BookingState.getHistory();
  const points = Math.round(history.reduce((sum, b) => sum + (b.total || 0), 0)) + getReferralBonusPoints();
  const tier = tierFor(history.length);
  const nextTier = TIERS.slice().reverse().find((t) => t.min > history.length);

  const summary = document.querySelector("[data-rewards-summary]");
  if (summary) {
    summary.innerHTML = `
      <div class="rewards-status-card" style="background:var(--pine-800,#16241C);color:var(--text-on-dark);border-radius:var(--radius-lg);padding:32px;display:grid;gap:24px;grid-template-columns:1fr auto;align-items:center;">
        <div>
          <p style="font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.1em;font-size:.75rem;color:var(--brass-light);">Your status</p>
          <h2 style="font-size:2rem;margin-top:6px;">${tier.emoji} ${tier.name}</h2>
          <p style="margin-top:10px;color:var(--text-on-dark-soft);max-width:44ch;">${tier.perk}</p>
          ${history.length === 0
            ? `<p style="margin-top:14px;color:var(--text-on-dark-soft);">You haven't completed a booking on this device yet. <a href="stays.html" style="color:var(--brass-light);font-weight:700;">Browse stays</a> and finish checkout to start earning.</p>`
            : nextTier
              ? `<p style="margin-top:14px;color:var(--text-on-dark-soft);">${nextTier.min - history.length} more stay${nextTier.min - history.length === 1 ? "" : "s"} to reach ${nextTier.emoji} ${nextTier.name}.</p>`
              : `<p style="margin-top:14px;color:var(--text-on-dark-soft);">You've reached the top tier. Thank you for booking with us this many times, genuinely.</p>`
          }
        </div>
        <div class="rewards-points-box" style="text-align:center;background:rgba(255,255,255,.06);border-radius:var(--radius-md);padding:22px 28px;min-width:180px;">
          <div style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--brass-light);">${points.toLocaleString()}</div>
          <div style="font-size:.8rem;color:var(--text-on-dark-soft);margin-top:2px;">points · worth ${money(Math.floor(points / 100) * 1)} off</div>
          <div style="font-size:.72rem;color:var(--text-on-dark-soft);margin-top:10px;">${history.length} completed stay${history.length === 1 ? "" : "s"}</div>
        </div>
      </div>`;
  }

  const historySection = document.querySelector("[data-rewards-history-section]");
  const historyMount = document.querySelector("[data-rewards-history]");
  if (historySection && historyMount && history.length) {
    historySection.hidden = false;
    historyMount.innerHTML = `
      <div class="compare-table-wrap">
        <table class="compare-table">
          <thead><tr><th>Stay</th><th>Booked</th><th>Total</th><th>Points earned</th></tr></thead>
          <tbody>
            ${history.slice().reverse().map((b) => `
              <tr>
                <td>${b.name || b.slug}</td>
                <td>${new Date(b.bookedAt).toLocaleDateString()}</td>
                <td>${money(b.total || 0)}</td>
                <td>${Math.round(b.total || 0).toLocaleString()}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }
}

/* MY_REFERRAL_KEY, REFERRAL_APPLIED_KEY, REFERRAL_BONUS_POINTS,
   getMyReferralCode(), getReferralBonusPoints(), and removeReferralBonus()
   now live in main.js — account.js needs them too, for the "remove
   referral bonus" control on the data-management panel, and main.js is
   the one file every page loads. */

function initReferral() {
  const myCode = getMyReferralCode();
  const codeEl = document.querySelector("[data-referral-code]");
  if (codeEl) codeEl.textContent = myCode;

  document.querySelector("[data-referral-copy]")?.addEventListener("click", (e) => {
    navigator.clipboard?.writeText(myCode);
    const btn = e.currentTarget;
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = original), 1500);
  });

  const form = document.querySelector("[data-referral-form]");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.querySelector("[data-referral-input]");
    const entered = input.value.trim().toUpperCase();
    const resultEl = document.querySelector("[data-referral-result]");
    resultEl.hidden = false;

    if (localStorage.getItem(REFERRAL_APPLIED_KEY)) {
      resultEl.style.color = "#b23a3a";
      resultEl.textContent = "A referral bonus has already been applied on this browser.";
      return;
    }
    if (entered === myCode) {
      resultEl.style.color = "#b23a3a";
      resultEl.textContent = "That's your own code, share it with a friend instead.";
      return;
    }
    if (!/^FH-REF-[A-Z0-9]{5}$/.test(entered)) {
      resultEl.style.color = "#b23a3a";
      resultEl.textContent = "That doesn't look like a valid referral code.";
      return;
    }
    localStorage.setItem(REFERRAL_APPLIED_KEY, entered);
    resultEl.style.color = "var(--pine-700,#3a5a40)";
    resultEl.textContent = `Applied! ${REFERRAL_BONUS_POINTS.toLocaleString()} bonus points added.`;
    initRewardsPage(); // refresh the points total to include the bonus
  });
}

document.addEventListener("DOMContentLoaded", initRewardsPage);
document.addEventListener("DOMContentLoaded", initReferral);
