/* ============================================================
   ACCOUNT.JS
   Renders account.html's two states (guest forms vs. logged-in
   hub) and wires the sign in / sign up / sign out / delete actions.
   The Account object itself (storage, isLoggedIn, etc.) lives in
   main.js since paintAccountNav() there needs it on every page,
   not just this one.
   ============================================================ */

/* When the login gate on booking.html (or the stay page's Reserve
   button) sends someone here with ?return=, hop straight back to
   whatever they were actually trying to do the moment sign-in succeeds,
   instead of stranding them on the account page. */
function returnAfterAuth() {
  const returnTo = new URLSearchParams(location.search).get("return");
  // Only ever follow this back to another page on this same site — a
  // relative filename with no protocol or scheme-relative "//" prefix.
  // Anything else (an absolute URL to somewhere else) is ignored rather
  // than followed, so this can't be turned into an open redirect.
  if (returnTo && !/^\/\/|:\/\//.test(returnTo)) {
    const safePath = decodeURIComponent(returnTo).replace(/^\/+/, "");
    setTimeout(() => { location.href = safePath; }, 700);
  }
}

function initAccountPage() {
  renderAccountState();

  // Tabs between the sign-in and create-account forms
  const signinForm = document.querySelector("[data-signin-form]");
  const signupForm = document.querySelector("[data-signup-form]");
  document.querySelectorAll("[data-tab-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const showSignup = btn.dataset.tabBtn === "signup";
      signinForm.hidden = showSignup;
      signupForm.hidden = !showSignup;
      document.querySelectorAll("[data-tab-btn]").forEach((b) => {
        b.className = b === btn ? "btn btn-primary btn-sm" : "btn btn-ghost-light btn-sm";
        b.style.flex = "1";
      });
    });
  });

  signinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const errorEl = document.querySelector("[data-signin-error]");
    const email = document.getElementById("signin-email").value.trim();
    const password = document.getElementById("signin-password").value;

    if (!Account.get()) {
      errorEl.textContent = "No account found on this device yet. Try Create Account instead.";
      errorEl.hidden = false;
      return;
    }
    if (!Account.logIn(email, password)) {
      errorEl.textContent = "That email or password doesn't match this device's account.";
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;
    renderAccountState();
    showToast(`Welcome back, ${Account.get().name.split(" ")[0]}`);
    returnAfterAuth();
  });

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const errorEl = document.querySelector("[data-signup-error]");
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    if (Account.get()) {
      errorEl.textContent = "This device already has an account. Sign in instead, or delete it first from the account page.";
      errorEl.hidden = false;
      return;
    }
    if (!name || !email || password.length < 4) {
      errorEl.textContent = "Please fill in every field (password needs at least 4 characters).";
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;
    Account.signUp(name, email, password);
    renderAccountState();
    showToast(`Account created, welcome ${name.split(" ")[0]}`);
    returnAfterAuth();
  });

  document.querySelector("[data-account-signout]")?.addEventListener("click", () => {
    Account.logOut();
    renderAccountState();
    showToast("Signed out");
  });

  document.querySelector("[data-account-forget]")?.addEventListener("click", async () => {
    const ok = await confirmDialog({
      title: "Delete this account?",
      message: "This removes it from this device and can't be undone.",
      confirmLabel: "Delete account",
      danger: true,
    });
    if (!ok) return;
    Account.forget();
    renderAccountState();
    showToast("Account deleted");
  });

  renderDataCounts();

  document.querySelector("[data-reset-history]")?.addEventListener("click", async () => {
    const count = BookingState.getHistory().length;
    if (!count) { showToast("No booking history to clear"); return; }
    const ok = await confirmDialog({
      title: `Clear ${count} booking${count > 1 ? "s" : ""}?`,
      message: "This clears your booking history on this device and can't be undone.",
      confirmLabel: "Clear history",
      danger: true,
    });
    if (!ok) return;
    BookingState.clearHistory();
    renderDataCounts();
    showToast("Booking history cleared");
  });

  document.querySelector("[data-reset-gift-balances]")?.addEventListener("click", async () => {
    const codes = Object.keys(getGiftCodes());
    if (!codes.length) { showToast("No gift codes on this device"); return; }
    const ok = await confirmDialog({
      title: "Reset gift card balances?",
      message: "Every gift code on this device goes back to its full original balance.",
      confirmLabel: "Reset balances",
    });
    if (!ok) return;
    resetGiftBalances();
    renderDataCounts();
    showToast("Gift card balances reset");
  });

  // Delete buttons are on cards rendered dynamically inside
  // [data-gift-code-list], so this is one delegated listener rather than
  // rebinding a new one every time the list redraws.
  document.querySelector("[data-gift-code-list]")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-delete-gift-code]");
    if (!btn) return;
    const code = btn.dataset.deleteGiftCode;
    const ok = await confirmDialog({
      title: `Delete ${code}?`,
      message: "This removes the code from this device entirely, not just its balance. This can't be undone.",
      confirmLabel: "Delete code",
      danger: true,
    });
    if (!ok) return;
    deleteGiftCode(code);
    renderDataCounts();
    showToast(`${code} deleted`);
  });

  document.querySelector("[data-remove-referral]")?.addEventListener("click", async () => {
    const ok = await confirmDialog({
      title: "Remove referral bonus?",
      message: `This takes back the ${REFERRAL_BONUS_POINTS.toLocaleString()} bonus points from the applied referral code.`,
      confirmLabel: "Remove bonus",
      danger: true,
    });
    if (!ok) return;
    removeReferralBonus();
    renderDataCounts();
    showToast("Referral bonus removed");
  });
}

function renderDataCounts() {
  const historyCount = BookingState.getHistory().length;
  const historyEl = document.querySelector("[data-history-count]");
  if (historyEl) {
    historyEl.textContent = historyCount
      ? `${historyCount} booking${historyCount > 1 ? "s" : ""} on record`
      : "Nothing to clear yet";
  }

  const codes = getGiftCodes();
  const codeEntries = Object.entries(codes);
  const totalRemaining = codeEntries.reduce((sum, [, c]) => sum + (c.balance ?? c.amount), 0);
  const giftEl = document.querySelector("[data-gift-balance-count]");
  if (giftEl) {
    giftEl.textContent = codeEntries.length
      ? `${codeEntries.length} code${codeEntries.length > 1 ? "s" : ""}, ${money(totalRemaining)} remaining total`
      : "No gift codes on this device";
  }

  const listEl = document.querySelector("[data-gift-code-list]");
  if (listEl) {
    listEl.innerHTML = codeEntries
      .slice()
      .reverse()
      .map(([code, record]) => {
        const balance = record.balance ?? record.amount;
        const spent = balance < record.amount;
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--parchment-soft);border:1px solid var(--parchment-line);border-radius:var(--radius-sm,8px);padding:10px 12px;">
            <div style="min-width:0;">
              <div style="font-family:var(--font-mono);font-size:.82rem;font-weight:700;">${code}</div>
              <div style="font-size:.76rem;color:var(--text-on-light-soft);">
                ${money(balance)} left${spent ? ` of ${money(record.amount)}` : ""} · for ${record.to || "someone"}
              </div>
            </div>
            <button type="button" class="btn btn-ghost-light btn-sm" data-delete-gift-code="${code}" aria-label="Delete ${code}" style="flex:none;color:#b23a3a;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>`;
      })
      .join("");
  }

  const referralApplied = typeof getReferralBonusPoints === "function" && getReferralBonusPoints() > 0;
  const referralEl = document.querySelector("[data-referral-status]");
  const referralBtn = document.querySelector("[data-remove-referral]");
  if (referralEl) {
    referralEl.textContent = referralApplied
      ? `Applied, +${REFERRAL_BONUS_POINTS.toLocaleString()} bonus points on this device`
      : "No referral bonus applied on this device";
  }
  if (referralBtn) referralBtn.hidden = !referralApplied;
}

function renderAccountState() {
  const acc = Account.get();
  const loggedIn = Account.isLoggedIn();
  document.querySelector("[data-account-guest]").hidden = loggedIn;
  document.querySelector("[data-account-hub]").hidden = !loggedIn;

  const heading = document.querySelector("[data-account-heading]");
  if (loggedIn && acc) {
    heading.textContent = `Welcome back, ${acc.name.split(" ")[0]}.`;
    document.querySelector("[data-account-avatar]").textContent = acc.name[0].toUpperCase();
    document.querySelector("[data-account-name]").textContent = acc.name;
    document.querySelector("[data-account-email]").textContent = acc.email;
    document.querySelector("[data-account-since]").textContent = `Member since ${new Date(acc.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  } else if (acc) {
    heading.textContent = "Welcome back, sign in to continue.";
  } else {
    heading.textContent = "Sign in or create an account.";
  }
}

document.addEventListener("DOMContentLoaded", initAccountPage);
