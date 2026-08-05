/* ============================================================
   DATEPICKER.JS
   A small, dependency-free date-range calendar, one month at a
   time with prev/next navigation.

   The key behaviour the brief asked for: dates that are already
   booked are rendered greyed-out and are simply not clickable —
   there is no way to select one, so there is nothing to "error"
   about later in the flow. We do this by pre-computing blocked
   ranges from each stay's `unavailable` list and checking them
   while drawing every single day cell.

   Usage:
     const dp = new DatePicker(hostElement, {
       unavailable: stay.unavailable,       // [{start:Date,end:Date}]
       minDate: new Date(),
       initialStart, initialEnd,
       onChange: ({start, end}) => { ... }
     });
   ============================================================ */

class DatePicker {
  constructor(host, opts = {}) {
    this.host = host;
    this.unavailable = opts.unavailable || [];
    this.minDate = opts.minDate || new Date();
    this.minDate.setHours(0, 0, 0, 0);
    this.onChange = opts.onChange || (() => {});
    this.onBlockedCross = opts.onBlockedCross || (() => {});
    this.onDone = opts.onDone || null;
    this.start = opts.initialStart || null;
    this.end = opts.initialEnd || null;
    this.viewDate = new Date(this.start || this.minDate);
    this.viewDate.setDate(1);
    this._render();
  }

  isBlocked(date) {
    if (date < this.minDate) return true;
    return this.unavailable.some((r) => date >= r.start && date < r.end);
  }

  _sameDay(a, b) {
    return a && b && a.toDateString() === b.toDateString();
  }

  _monthGrid(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }

  _monthLabel(monthDate) {
    return monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  _dayClasses(date) {
    const cls = ["dp-day"];
    if (this.isBlocked(date)) cls.push("is-disabled");
    if (this._sameDay(date, new Date())) cls.push("is-today");
    if (this.start && !this.end && this._sameDay(date, this.start)) cls.push("is-selected", "is-range-start");
    if (this.start && this.end) {
      if (this._sameDay(date, this.start)) cls.push("is-selected", "is-in-range", "is-range-start");
      else if (this._sameDay(date, this.end)) cls.push("is-selected", "is-in-range", "is-range-end");
      else if (date > this.start && date < this.end) cls.push("is-in-range");
    }
    return cls.join(" ");
  }

  _render() {
    const cells = this._monthGrid(this.viewDate);
    const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

    this.host.innerHTML = `
      <div class="dp-inout">
        <div class="dp-inout-field ${!this.end ? "is-active" : ""}">
          <label>Check-in</label>
          <span>${this.start ? formatDate(this.start) : "Add date"}</span>
        </div>
        <div class="dp-inout-field ${this.start && !this.end ? "is-next" : ""}">
          <label>Check-out</label>
          <span>${this.end ? formatDate(this.end) : this.start ? "Add date" : "Add date"}</span>
        </div>
      </div>
      <div class="dp-month">
        <div class="dp-month-head">
          <button type="button" class="dp-nav" data-dp-prev aria-label="Previous month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h4>${this._monthLabel(this.viewDate)}</h4>
          <button type="button" class="dp-nav" data-dp-next aria-label="Next month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <div class="dp-weekdays">${weekdays.map((w) => `<span>${w}</span>`).join("")}</div>
        <div class="dp-grid">
          ${cells
            .map((d) => {
              if (!d) return `<span class="dp-day is-blank"></span>`;
              const blocked = this.isBlocked(d);
              return `<button type="button" class="${this._dayClasses(d)}" ${blocked ? "disabled" : ""} data-date="${d.toISOString()}" aria-label="${d.toDateString()}${blocked ? ", unavailable" : ""}">${d.getDate()}</button>`;
            })
            .join("")}
        </div>
      </div>
      <div class="dp-legend">
        <span><i class="i-selected"></i> Selected</span>
        <span><i class="i-disabled"></i> Unavailable</span>
      </div>
      <div class="dp-foot">
        <button type="button" class="dp-clear" data-dp-clear>Clear dates</button>
        ${this.onDone ? `<button type="button" class="btn btn-primary btn-sm" data-dp-done ${this.start && this.end ? "" : "disabled"}>Done</button>` : `<span class="hint" data-dp-summary style="font-size:.85rem;font-weight:700;"></span>`}
      </div>
    `;
    this._updateSummary();
    this._bind();
  }

  _updateSummary() {
    const el = this.host.querySelector("[data-dp-summary]");
    if (!el) return;
    if (this.start && this.end) el.textContent = `${formatDate(this.start)} – ${formatDate(this.end)} · ${nightsBetween(this.start, this.end)} nights`;
    else if (this.start) el.textContent = `${formatDate(this.start)}, pick checkout`;
    else el.textContent = "Select your dates";
  }

  _bind() {
    this.host.querySelectorAll("[data-date]:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => {
        const date = new Date(btn.dataset.date);
        if (!this.start || (this.start && this.end)) {
          this.start = date;
          this.end = null;
        } else if (date < this.start) {
          this.start = date;
          this.end = null;
        } else if (this._sameDay(date, this.start)) {
          this.start = null;
          this.end = null;
        } else {
          // reject a range that would cross a blocked date
          const crossesBlocked = this.unavailable.some((r) => r.start > this.start && r.start < date);
          if (crossesBlocked) {
            this.onBlockedCross();
            this.start = date;
            this.end = null;
          } else {
            this.end = date;
          }
        }
        this._render();
        this.onChange({ start: this.start, end: this.end });
      });
    });
    this.host.querySelector("[data-dp-prev]").addEventListener("click", () => {
      this.viewDate.setMonth(this.viewDate.getMonth() - 1);
      this._render();
    });
    this.host.querySelector("[data-dp-next]").addEventListener("click", () => {
      this.viewDate.setMonth(this.viewDate.getMonth() + 1);
      this._render();
    });
    this.host.querySelector("[data-dp-clear]").addEventListener("click", () => {
      this.start = null;
      this.end = null;
      this._render();
      this.onChange({ start: null, end: null });
    });
    this.host.querySelector("[data-dp-done]")?.addEventListener("click", () => {
      if (this.start && this.end) this.onDone();
    });
  }
}

/* Attaches a DatePicker inside a floating popover under a trigger
   button, closing on outside click / Escape. Used by the search
   widget and the sticky summary card. */
function attachDatePickerPopover(trigger, popoverParent, options) {
  let popover = null;

  const close = () => {
    popover?.remove();
    popover = null;
    document.removeEventListener("click", onOutside, true);
  };
  const onOutside = (e) => {
    if (popover && !popover.contains(e.target) && e.target !== trigger) close();
  };

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (popover) return close();

    trigger.scrollIntoView({ block: "center", behavior: "instant" });

    // The popover always attaches straight to <body> with position:fixed,
    // positioned in plain viewport coordinates. Earlier versions appended
    // it inside whichever card/bar the trigger lived in, which meant it
    // could get silently clipped by that ancestor's overflow:hidden (the
    // hero uses that for its slow photo crossfade), or painted underneath
    // a sibling fixed element like the sticky header or the mobile sticky
    // booking bar, which both sit at a higher stacking level. Attaching to
    // <body> sidesteps all of that, permanently, everywhere it's used.
    popover = document.createElement("div");
    popover.className = "datepicker-popover";
    popover.style.visibility = "hidden"; // measure before showing, avoids a visible jump
    document.body.appendChild(popover);

    new DatePicker(popover, {
      ...options,
      onChange: (range) => options.onChange?.(range),
      onBlockedCross: () => {
        showToast("That range includes an unavailable night, restarting from your new check-in date");
        options.onBlockedCross?.();
      },
      onDone: () => {
        options.onDone?.();
        close();
      },
    });

    // Now that the calendar is actually built, measure its real height and
    // position it precisely: prefer opening below the trigger, flip above
    // it if there isn't room, and clamp it fully on-screen either way.
    const triggerRect = trigger.getBoundingClientRect();
    const popoverHeight = popover.offsetHeight;
    const popoverWidth = popover.offsetWidth;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const openUpward = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

    let top = openUpward ? triggerRect.top - popoverHeight - 8 : triggerRect.bottom + 8;
    top = Math.max(8, Math.min(top, window.innerHeight - popoverHeight - 8));
    let left = triggerRect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));

    popover.style.top = top + "px";
    popover.style.left = left + "px";
    popover.style.visibility = "";

    setTimeout(() => document.addEventListener("click", onOutside, true), 0);
    document.addEventListener("keydown", function esc(ev) {
      if (ev.key === "Escape") {
        close();
        document.removeEventListener("keydown", esc);
      }
    });
  });

  return { close };
}
