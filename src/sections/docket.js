import { DOCKET } from "../data/content.js";
import { countUp, onEnterOnce } from "../lib/motion.js";

export function renderDocket() {
  const rows = DOCKET.map((d, i) => {
    const known = !d.placeholder && d.value != null;
    const display = known
      ? `<span data-count="${d.value}" data-suffix="${d.suffix || ""}">0</span>`
      : `\u2014 <span class="mono-note">figure pending</span>`;
    return `
      <div class="docket-row">
        <div class="docket-row__num">${display}</div>
        <div class="docket-row__label">${d.label}${
          d.placeholder ? ' <span class="placeholder-note">placeholder</span>' : ""
        }</div>
      </div>`;
  }).join("");

  return `
    <section class="view docket" aria-labelledby="docket-title">
      <p class="view__eyebrow mono">What has been done</p>
      <h1 class="view__title" id="docket-title">The Docket</h1>
      <p class="view__lede">The tally of the zone. Only the chapter count is fixed at six;
        the remaining figures are shown as pending until the zone supplies them.</p>
      <div class="docket__list">${rows}</div>
    </section>`;
}

export function initDocket(root) {
  root.querySelectorAll("[data-count]").forEach((el) => {
    const to = parseInt(el.getAttribute("data-count"), 10);
    const suffix = el.getAttribute("data-suffix") || "";
    // Count up once when scrolled into view; never re-trigger.
    onEnterOnce(el, () => countUp(el, to, { duration: 0.9, suffix }));
  });
}
