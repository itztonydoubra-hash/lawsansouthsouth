import { RECESS } from "../data/content.js";
import { prefersReducedMotion, onEnterOnce, gsap } from "../lib/motion.js";

/* Deterministic placeholder plate — an abstract institutional gradient,
   NOT stock photography of people. Clearly a placeholder. */
function plateImage(seed) {
  const hues = [
    ["#1c332a", "#0f1a16"],
    ["#24443a", "#12241d"],
    ["#2a4c3e", "#16281f"],
    ["#1a3b33", "#0d1712"],
  ];
  const [a, b] = hues[seed % hues.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
    </linearGradient></defs>
    <rect width='400' height='300' fill='url(%23g)'/>
    <rect x='16' y='16' width='368' height='268' fill='none' stroke='%23c9a227' stroke-opacity='0.35'/>
    <text x='200' y='158' fill='%23ede3c8' fill-opacity='0.5' font-family='monospace' font-size='16' text-anchor='middle'>PLATE ${String(
      seed + 1
    ).padStart(2, "0")}</text>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function renderRecess() {
  const plates = RECESS.map(
    (p, i) => `
      <button class="recess-plate developing" data-plate="${i}" aria-label="Open exhibit: ${p.event}, ${p.chapter}">
        <span class="recess-plate__img" style="background-image:${plateImage(i)}"></span>
        <span class="recess-plate__cap">${p.chapter} \u00b7 ${p.event}</span>
      </button>`
  ).join("");

  return `
    <section class="view recess" aria-labelledby="recess-title">
      <p class="view__eyebrow mono">The recess</p>
      <h1 class="view__title" id="recess-title">The Recess</h1>
      <p class="view__lede">Event photography from across the zone. These are marked
        placeholder plates until real event photos are supplied.</p>
      <div class="recess__grid" data-recess-grid>${plates}</div>
    </section>

    <div class="lightbox" data-lightbox role="dialog" aria-modal="true" aria-label="Exhibit viewer">
      <div class="lightbox__frame">
        <button class="lightbox__close" data-lb-close aria-label="Close exhibit">\u00d7</button>
        <button class="lightbox__nav lightbox__nav--prev" data-lb-prev aria-label="Previous exhibit">\u2039</button>
        <div class="lightbox__img" data-lb-img></div>
        <button class="lightbox__nav lightbox__nav--next" data-lb-next aria-label="Next exhibit">\u203a</button>
      </div>
      <p class="lightbox__cap mono" data-lb-cap></p>
    </div>`;
}

export function initRecess(root) {
  const grid = root.querySelector("[data-recess-grid]");
  const plates = [...root.querySelectorAll(".recess-plate")];
  const reduced = prefersReducedMotion();

  // Develop-once: grain-to-sharp resolve, staggered like a contact sheet.
  const develop = () => {
    if (reduced) {
      plates.forEach((p) => p.classList.remove("developing"));
      return;
    }
    plates.forEach((p, i) =>
      window.setTimeout(() => p.classList.remove("developing"), 120 + i * 90)
    );
  };
  onEnterOnce(grid, develop, "top 92%");

  // Hover tilt toward cursor (physical print). Skip under reduced motion.
  if (!reduced) {
    plates.forEach((p) => {
      p.addEventListener("pointermove", (e) => {
        const r = p.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        gsap.to(p, { rotateX: rx, rotateY: ry, duration: 0.3, transformPerspective: 600 });
      });
      p.addEventListener("pointerleave", () =>
        gsap.to(p, { rotateX: 0, rotateY: 0, duration: 0.4 })
      );
    });
  }

  // Lightbox — court exhibit frame, arrow/swipe navigation.
  const lb = root.querySelector("[data-lightbox]");
  const lbImg = lb.querySelector("[data-lb-img]");
  const lbCap = lb.querySelector("[data-lb-cap]");
  let idx = 0;
  let lastFocus = null;

  const paint = () => {
    const p = RECESS[idx];
    lbImg.style.backgroundImage = plateImage(idx);
    lbCap.textContent = `${p.event} \u00b7 ${p.chapter} \u00b7 ${p.date}`;
  };
  const open = (i) => {
    idx = i;
    lastFocus = document.activeElement;
    paint();
    lb.classList.add("is-open");
    lb.querySelector("[data-lb-close]").focus();
  };
  const close = () => {
    lb.classList.remove("is-open");
    if (lastFocus) lastFocus.focus();
  };
  const step = (d) => {
    idx = (idx + d + RECESS.length) % RECESS.length;
    paint();
  };

  plates.forEach((p) =>
    p.addEventListener("click", () => open(parseInt(p.getAttribute("data-plate"), 10)))
  );
  lb.querySelector("[data-lb-close]").addEventListener("click", close);
  lb.querySelector("[data-lb-prev]").addEventListener("click", () => step(-1));
  lb.querySelector("[data-lb-next]").addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // horizontal swipe
  let sx = 0;
  lb.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  });
}
