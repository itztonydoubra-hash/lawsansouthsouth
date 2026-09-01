import { GAZETTE } from "../data/content.js";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../lib/motion.js";

const TYPES = ["All", "Journal", "Essay", "Newsletter", "Report"];

function cardHTML(g) {
  return `
    <article class="gazette-card" data-type="${g.type}" data-chapter="${g.chapter}">
      <p class="gazette-card__issue">${g.issue}${
        g.placeholder ? ' \u00b7 <span class="placeholder-note">placeholder</span>' : ""
      }</p>
      <h2 class="gazette-card__title">${g.title}</h2>
      <p class="gazette-card__excerpt">${g.excerpt}</p>
      <p class="gazette-card__type mono">${g.type} \u2014 ${g.chapter}</p>
    </article>`;
}

export function renderGazette() {
  const filters = TYPES.map(
    (t, i) =>
      `<button class="chapters__chip" data-filter="${t}" aria-pressed="${
        i === 0 ? "true" : "false"
      }">${t}</button>`
  ).join("");
  const cards = GAZETTE.map(cardHTML).join("");
  return `
    <section class="view gazette" aria-labelledby="gazette-title">
      <p class="view__eyebrow mono">What has been published</p>
      <h1 class="view__title" id="gazette-title">The Gazette</h1>
      <p class="view__lede">The zone\u2019s journals, essays, newsletters and reports.
        Entries marked placeholder are awaiting real editions.</p>
      <div class="gazette__filters" role="group" aria-label="Filter publications by type">${filters}</div>
      <div class="gazette__masonry" data-masonry>${cards}</div>
    </section>`;
}

export function initGazette(root) {
  const chips = root.querySelectorAll("[data-filter]");
  const cards = root.querySelectorAll(".gazette-card");
  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      const t = chip.getAttribute("data-filter");
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      cards.forEach((card) => {
        const show = t === "All" || card.getAttribute("data-type") === t;
        card.style.display = show ? "" : "none";
      });
    })
  );

  // Very slight parallax drift between columns on scroll — atmospheric only.
  if (prefersReducedMotion()) return;
  cards.forEach((card, i) => {
    const col = i % 2; // approximate two-column masonry
    gsap.to(card, {
      y: col === 0 ? -18 : 14,
      ease: "none",
      scrollTrigger: {
        trigger: card,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  });
  ScrollTrigger.refresh();
}
