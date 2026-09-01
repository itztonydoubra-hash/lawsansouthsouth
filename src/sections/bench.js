import { BENCH } from "../data/content.js";
import { gsap, prefersReducedMotion, onEnterOnce } from "../lib/motion.js";

function initials(name, role) {
  const src = name && name !== role ? name : role;
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function renderBench() {
  const rows = BENCH.map((p, i) => {
    const [numPart] = p.ref.split("/");
    return `
      <div class="bench-row">
        <button class="bench-row__head" aria-expanded="false" aria-controls="bio-${i}" id="benchhead-${i}">
          <span class="bench-row__photo" aria-hidden="true">${initials(p.name, p.role)}</span>
          <span>
            <span class="bench-row__name">${p.name}${
              p.placeholder ? ' <span class="placeholder-note">placeholder</span>' : ""
            }</span>
            <span class="bench-row__meta">${p.role} \u00b7 ${p.chapter}</span>
          </span>
          <span class="bench-row__ref mono" data-ref-target data-ref="${numPart}">00/26</span>
        </button>
        <div class="bench-row__bio" id="bio-${i}" role="region" aria-labelledby="benchhead-${i}">
          <div class="bench-row__bio-inner">${p.bio}</div>
        </div>
      </div>`;
  }).join("");

  return `
    <section class="view bench" aria-labelledby="bench-title">
      <p class="view__eyebrow mono">The register</p>
      <h1 class="view__title" id="bench-title">The Bench</h1>
      <p class="view__lede">The zonal executive sitting this term. Names marked as
        placeholder are awaiting confirmation from the zone.</p>
      <div class="bench__list">${rows}</div>
    </section>
  `;
}

export function initBench(root) {
  // Accordion — expand in place, no modal, no navigation.
  root.querySelectorAll(".bench-row__head").forEach((head) => {
    const bio = document.getElementById(head.getAttribute("aria-controls"));
    head.addEventListener("click", () => {
      const open = head.getAttribute("aria-expanded") === "true";
      // close siblings for a clean single-open accordion
      root.querySelectorAll(".bench-row__head[aria-expanded='true']").forEach((h) => {
        if (h !== head) {
          h.setAttribute("aria-expanded", "false");
          const b = document.getElementById(h.getAttribute("aria-controls"));
          if (b) b.style.height = "0px";
        }
      });
      head.setAttribute("aria-expanded", String(!open));
      if (open) {
        bio.style.height = "0px";
      } else {
        bio.style.height = bio.scrollHeight + "px";
      }
    });
  });

  // Reference numbers tick up and settle once as the section loads.
  const refs = root.querySelectorAll("[data-ref-target]");
  const run = () =>
    refs.forEach((el) => {
      const target = parseInt(el.getAttribute("data-ref"), 10);
      if (prefersReducedMotion()) {
        el.textContent = `${String(target).padStart(2, "0")}/26`;
        return;
      }
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 0.9,
        ease: "power2.out",
        onUpdate() {
          el.textContent = `${String(Math.round(obj.v)).padStart(2, "0")}/26`;
        },
      });
    });
  onEnterOnce(root.querySelector(".bench__list"), run, "top 92%");
}
