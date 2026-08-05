/* ============================================================
   BOOKING-STATE.JS
   A tiny wrapper around localStorage that carries the in-progress
   booking from the detail page, through the 3-step booking flow,
   to the confirmation page. Nothing here talks to a server —
   swap these functions for real API calls when this is wired up
   to a backend.
   ============================================================ */

const BookingState = {
  draftKey: "fernhollow_draft_booking",
  lastKey: "fernhollow_last_booking",
  historyKey: "fernhollow_booking_history",

  saveDraft(partial) {
    const current = this.getDraft() || {};
    const next = { ...current, ...partial };
    localStorage.setItem(this.draftKey, JSON.stringify(next));
    return next;
  },
  getDraft() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.draftKey));
      if (!raw) return null;
      if (raw.checkin) raw.checkin = new Date(raw.checkin);
      if (raw.checkout) raw.checkout = new Date(raw.checkout);
      return raw;
    } catch {
      return null;
    }
  },
  clearDraft() {
    localStorage.removeItem(this.draftKey);
  },
  finalize(booking) {
    const code = "FH-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 5).toUpperCase();
    const record = { ...booking, code, bookedAt: new Date().toISOString() };
    localStorage.setItem(this.lastKey, JSON.stringify(record));
    const history = this.getHistory();
    history.push(record);
    localStorage.setItem(this.historyKey, JSON.stringify(history));
    this.clearDraft();
    return record;
  },
  getLast() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.lastKey));
      if (!raw) return null;
      if (raw.checkin) raw.checkin = new Date(raw.checkin);
      if (raw.checkout) raw.checkout = new Date(raw.checkout);
      return raw;
    } catch {
      return null;
    }
  },
  /* Every booking ever finalized on this device, oldest first. This is
     what a real "past trips" / loyalty page should read from instead of
     just the single most recent booking. */
  getHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.historyKey));
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },
  /* Wipes booking history and the "last booking" record — used by the
     account page's data-reset controls. Doesn't touch an in-progress
     draft, since that's a different, still-active thing the guest
     might be in the middle of. */
  clearHistory() {
    localStorage.removeItem(this.historyKey);
    localStorage.removeItem(this.lastKey);
  },
};

const ADDONS = [
  { key: "breakfast", label: "Pantry breakfast basket", detail: "Local eggs, bread and preserves, left in the fridge before you arrive.", price: 22, icon: "fa-mug-hot" },
  { key: "earlyCheckin", label: "Early check-in (11 AM)", detail: "Subject to availability, confirmed the day before your stay.", price: 35, icon: "fa-clock" },
  { key: "firewood", label: "Extra firewood bundle", detail: "Two extra bundles, stacked on the porch.", price: 18, icon: "fa-fire" },
  { key: "spa", label: "In-cabin massage (60 min)", detail: "A local therapist comes to you, book a time in the next step.", price: 95, icon: "fa-spa" },
];

const SERVICE_FEE_RATE = 0.09;
const TAX_RATE = 0.06;
