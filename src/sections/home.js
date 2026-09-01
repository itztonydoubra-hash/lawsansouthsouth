import { ZONE } from "../data/content.js";
import { MAP_STATES, MAP_VIEWBOX } from "../data/map.js";
import { gsap, prefersReducedMotion } from "../lib/motion.js";
import { magnetic } from "../lib/magnetic.js";

export function renderHome() {
  const words = ZONE.words
    .map((w) => `<span class="word">${w}</span>`)
    .join(" ");

  const paths = MAP_STATES.map(
    (s) =>
      `<path class="home-state__border" data-state="${s.id}" d="${s.path}" />`
  ).join("");

  const markers = MAP_STATES.map(
    (s) =>
      `<circle class="home-marker" data-state="${s.id}" cx="${s.marker[0]}" cy="${s.marker[1]}" r="10" />`
  ).join("");

  return `
    <section class="view home" aria-labelledby="home-title">
      <p class="view__eyebrow mono">The call-over</p>
      <div class="home__map" role="img" aria-label="Map of the six South South states: Rivers, Bayelsa, Delta, Akwa Ibom, Cross River and Edo.">
        <svg viewBox="${MAP_VIEWBOX}" aria-hidden="true">
          <g class="home-borders">${paths}</g>
          <g class="home-markers">${markers}</g>
        </svg>
      </div>
      <h1 class="home__zonename" id="home-title">${words}</h1>
      <p class="home__mission">${ZONE.mission}</p>
      <div class="home__cta-wrap">
        <a class="wax-cta" href="#/chapters" data-magnetic>
          <span class="wax-cta__seal" aria-hidden="true"></span>
          See the chapters
        </a>
      </div>
    </section>
  `;
}

export function initHome(root) {
  const borders = root.querySelectorAll(".home-state__border");
  const markers = root.querySelectorAll(".home-marker");
  const wordEls = root.querySelectorAll(".home__zonename .word");
  const cta = root.querySelector("[data-magnetic]");

  if (prefersReducedMotion()) {
    // Everything simply visible; no trace.
    borders.forEach((b) => (b.style.strokeDashoffset = "0"));
    markers.forEach((m) => m.classList.add("is-pinned"));
    wordEls.forEach((w) => w.classList.add("is-in"));
    return;
  }

  // Border trace: draw each path in on Brass, pin marker as it completes.
  const tl = gsap.timeline();
  borders.forEach((path, i) => {
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    tl.to(
      path,
      { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" },
      i * 0.22
    );
    const state = path.getAttribute("data-state");
    const marker = root.querySelector(`.home-marker[data-state="${state}"]`);
    tl.add(() => marker && marker.classList.add("is-pinned"), i * 0.22 + 0.55);
  });

  // Zone name word-by-word, landing as the map finishes.
  tl.to(
    wordEls,
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power2.out" },
    "-=0.4"
  );

  if (cta) magnetic(cta);
}
