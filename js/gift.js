/* ============================================================
   GIFT.JS
   Generates a demo gift code, stored client-side, and lets a
   visitor check/redeem one they've received. No real payment or
   server involved — this mirrors the honesty of the rest of the
   booking flow, which is also a fully working demo.
   Storage helpers (getGiftCodes, saveGiftCode, deductGiftBalance)
   now live in main.js, shared with booking.js's checkout flow.
   ============================================================ */

/* ---------- emailing the gift code via Web3Forms ----------
   Web3Forms (web3forms.com) is a real, free form-to-email service —
   no backend needed, and its "access key" is meant to be public/
   client-side (it's an alias to an email inbox, not a secret).
   To make this actually deliver mail: sign up free at web3forms.com,
   verify your email, and paste the access key you're given below.
   Until that's done, this fails gracefully into the toast message
   below rather than pretending to have sent something it didn't. */
const WEB3FORMS_ACCESS_KEY = "YOUR_ACCESS_KEY_HERE";

async function emailGiftCode({ code, amount, to, toEmail, from, message }) {
  if (WEB3FORMS_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
    showToast("Email sending isn't configured yet on this demo, code was still generated above.");
    return;
  }
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `${from} sent you a Fernhollow gift card`,
        from_name: "Fernhollow Gifts",
        email: toEmail,
        to,
        message: `Hi ${to},\n\n${from} sent you a Fernhollow gift card worth ${money(amount)}.\n\nYour code: ${code}\n\n${message ? `A note from ${from}: "${message}"\n\n` : ""}Redeem it at checkout on any stay in the collection.`,
      }),
    });
    const data = await res.json();
    showToast(data.success ? `Emailed to ${toEmail}` : "Couldn't send the email, the code above still works fine.");
  } catch {
    showToast("Couldn't send the email, the code above still works fine.");
  }
}

function initGiftPage() {
  let selectedAmount = null;
  const amountBtns = document.querySelectorAll("[data-gift-amount]");
  const customField = document.querySelector("[data-gift-custom-field]");
  const customInput = document.getElementById("gift-custom-amount");

  amountBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      amountBtns.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      amountBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const val = btn.dataset.giftAmount;
      if (val === "custom") {
        customField.hidden = false;
        customInput.focus();
        selectedAmount = null;
      } else {
        customField.hidden = true;
        selectedAmount = Number(val);
      }
    });
  });

  document.querySelector("[data-gift-form]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.querySelector("[data-gift-error]");
    const amount = selectedAmount || Number(customInput.value);
    const to = document.getElementById("gift-to").value.trim();
    const toEmail = document.getElementById("gift-to-email").value.trim();
    const from = document.getElementById("gift-from").value.trim();
    const message = document.getElementById("gift-message").value.trim();

    // Both the amount chips and the required name fields are checked
    // together and reported with one clear message. Previously the form
    // relied on the browser's own silent validation for the name fields,
    // which fires before our code ever runs — so picking a preset amount
    // and hitting submit without having filled in a name looked like the
    // preset amount button just didn't do anything, since nothing visible
    // happened at all. Typing a custom amount worked because doing so
    // naturally led people to fill in the rest of the form too.
    const problems = [];
    if (!amount || amount < 25) problems.push("pick an amount (or enter a custom one of at least $25)");
    if (!to) problems.push("add the recipient's name");
    if (!from) problems.push("add your name");
    if (problems.length) {
      errorEl.textContent = "Please " + problems.join(", and ") + " to continue.";
      errorEl.hidden = false;
      errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    errorEl.hidden = true;

    const code = "FH-GIFT-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    saveGiftCode(code, { amount, balance: amount, to, from, message, issuedAt: new Date().toISOString() });

    document.querySelector("[data-gift-code]").textContent = code;
    document.querySelector("[data-gift-summary]").textContent =
      `${money(amount)} for ${to}, from ${from}. Redeemable against any stay in the collection.`;
    document.querySelector("[data-gift-result]").hidden = false;
    document.querySelector("[data-gift-result]").scrollIntoView({ behavior: "smooth", block: "center" });

    if (toEmail) await emailGiftCode({ code, amount, to, toEmail, from, message });
  });

  document.querySelector("[data-gift-copy]")?.addEventListener("click", () => {
    const code = document.querySelector("[data-gift-code]").textContent;
    navigator.clipboard?.writeText(code);
    const btn = document.querySelector("[data-gift-copy]");
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = original), 1500);
  });

  document.querySelector("[data-redeem-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.querySelector("[data-redeem-input]");
    const code = input.value.trim().toUpperCase();
    const record = getGiftCodes()[code];
    const resultEl = document.querySelector("[data-redeem-result]");
    resultEl.hidden = false;
    if (record) {
      resultEl.style.color = "var(--pine-700,#3a5a40)";
      resultEl.textContent = `Valid, worth ${money(record.amount)}, for ${record.to}.`;
    } else {
      resultEl.style.color = "#b23a3a";
      resultEl.textContent = "That code isn't in this browser's records. Codes are only saved on the device that generated them.";
    }
  });
}

document.addEventListener("DOMContentLoaded", initGiftPage);
