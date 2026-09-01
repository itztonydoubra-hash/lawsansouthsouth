import { CONTACT } from "../data/content.js";
import { prefersReducedMotion } from "../lib/motion.js";

export function renderContact() {
  const lines = CONTACT.lines
    .map(
      (l) => `
      <div class="contact__line">
        <dt class="mono">${l.label}</dt>
        <dd>${l.value}${
          l.placeholder ? ' <span class="placeholder-note">placeholder</span>' : ""
        }</dd>
      </div>`
    )
    .join("");

  return `
    <section class="view" aria-labelledby="contact-title">
      <p class="view__eyebrow mono">Address the zone</p>
      <h1 class="view__title" id="contact-title">Contact</h1>
      <div class="contact">
        <div class="contact__letter">
          <p>${CONTACT.closing}</p>
          <p class="contact__signoff">${CONTACT.signoff}</p>
          <dl class="contact__lines">${lines}</dl>
        </div>
        <form class="contact__form" novalidate data-contact-form>
          <div class="field">
            <label for="c-name">Your name</label>
            <input id="c-name" name="name" type="text" autocomplete="name" required />
          </div>
          <div class="field">
            <label for="c-email">Email</label>
            <input id="c-email" name="email" type="email" autocomplete="email" required />
          </div>
          <div class="field">
            <label for="c-message">Message</label>
            <textarea id="c-message" name="message" required></textarea>
          </div>
          <button class="contact__submit" type="submit" data-seal-submit>
            <span class="fill" aria-hidden="true"></span>
            <span class="label">Press &amp; hold to send</span>
          </button>
          <p class="contact__confirm mono" role="status" aria-live="polite" data-confirm></p>
        </form>
      </div>
    </section>`;
}

export function initContact(root) {
  const form = root.querySelector("[data-contact-form]");
  const btn = root.querySelector("[data-seal-submit]");
  const fill = btn.querySelector(".fill");
  const label = btn.querySelector(".label");
  const confirm = root.querySelector("[data-confirm]");
  const reduced = prefersReducedMotion();
  const HOLD = reduced ? 120 : 900;

  let timer = null;
  let sealed = false;

  const valid = () => form.checkValidity();

  const start = () => {
    if (!valid()) {
      form.reportValidity();
      return;
    }
    fill.style.transition = `transform ${HOLD}ms linear`;
    requestAnimationFrame(() => (fill.style.transform = "scaleX(1)"));
    timer = window.setTimeout(complete, HOLD);
  };
  const cancel = () => {
    if (sealed) return;
    if (timer) clearTimeout(timer);
    fill.style.transition = "transform 220ms ease-out";
    fill.style.transform = "scaleX(0)";
  };
  const complete = () => {
    sealed = true;
    label.textContent = "Sealed";
    // In the interface's own voice — never a browser alert.
    confirm.textContent =
      "\u2713 Your message has been sealed and entered into the register. The zone will reply by email.";
    confirm.classList.add("is-in");
    form.querySelectorAll("input, textarea").forEach((f) => (f.value = ""));
    window.setTimeout(() => {
      sealed = false;
      label.textContent = "Press & hold to send";
      fill.style.transition = "transform 400ms ease-out";
      fill.style.transform = "scaleX(0)";
    }, 3200);
  };

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    start();
  });
  btn.addEventListener("pointerup", cancel);
  btn.addEventListener("pointerleave", cancel);
  btn.addEventListener("pointercancel", cancel);
  // Keyboard: activating the button submits directly (accessible path).
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!sealed && valid()) complete();
  });
}
