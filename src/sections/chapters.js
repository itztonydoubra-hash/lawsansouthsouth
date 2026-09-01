import { CHAPTERS } from "../data/content.js";
import { MAP_STATES, MAP_VIEWBOX } from "../data/map.js";
import { prefersReducedMotion } from "../lib/motion.js";

function cardHTML(ch) {
  const members = ch.members.value ?? "\u2014";
  const mark = (f) =>
    f.placeholder ? ' <span class="placeholder-note">placeholder</span>' : "";
  return `
    <div class="chapter-card" id="chapter-card">
      <p class="chapter-card__code mono">${ch.code}</p>
      <h2 class="chapter-card__state">${ch.state}</h2>
      <p style="color:var(--parchment-70);margin:0">${ch.blurb}</p>
      <dl>
        <dt>Capital</dt><dd>${ch.capital}</dd>
        <dt>Host</dt><dd>${ch.hostInstitution.value}${mark(ch.hostInstitution)}</dd>
        <dt>President</dt><dd>${ch.president.value}${mark(ch.president)}</dd>
        <dt>Members</dt><dd>${members}${mark(ch.members)}</dd>
      </dl>
    </div>`;
}

export function renderChapters() {
  const chips = CHAPTERS.map(
    (c, i) =>
      `<button class="chapters__chip" data-chip="${c.id}" aria-pressed="${
        i === 0 ? "true" : "false"
      }">${c.state}</button>`
  ).join("");

  return `
    <section class="view" aria-labelledby="chapters-title">
      <p class="view__eyebrow mono">Six chapters, one register</p>
      <h1 class="view__title" id="chapters-title">Chapters</h1>
      <p class="view__lede">All six state chapters, always on the board. Choose one to
        bring its details forward \u2014 nothing here is hidden.</p>
      <div class="chapters">
        <div>
          <div class="chapters__stage" data-stage>
            <div class="chapters__fallback" hidden data-fallback></div>
          </div>
          <p class="chapters__hint mono">Move across the model to tilt it; tap a state to bring its card forward.</p>
        </div>
        <div>
          <div class="chapters__picker" role="group" aria-label="Select a chapter">${chips}</div>
          <div data-card-slot>${cardHTML(CHAPTERS[0])}</div>
        </div>
      </div>
    </section>
  `;
}

function fallbackSVG() {
  const paths = MAP_STATES.map(
    (s) =>
      `<path class="home-state" data-state="${s.id}" d="${s.path}" tabindex="0" role="button" aria-label="${s.state} chapter" />`
  ).join("");
  const markers = MAP_STATES.map(
    (s) =>
      `<circle class="home-marker is-pinned" cx="${s.marker[0]}" cy="${s.marker[1]}" r="9" style="opacity:1" />`
  ).join("");
  return `<svg viewBox="${MAP_VIEWBOX}" style="width:100%;height:100%">
      <g>${paths}</g><g>${markers}</g></svg>`;
}

export async function initChapters(root) {
  const stage = root.querySelector("[data-stage]");
  const cardSlot = root.querySelector("[data-card-slot]");
  const chips = root.querySelectorAll("[data-chip]");
  const reduced = prefersReducedMotion();

  const selectState = (id) => {
    const ch = CHAPTERS.find((c) => c.id === id);
    if (!ch) return;
    cardSlot.innerHTML = cardHTML(ch);
    chips.forEach((c) =>
      c.setAttribute("aria-pressed", String(c.getAttribute("data-chip") === id))
    );
  };

  chips.forEach((chip) =>
    chip.addEventListener("click", () => selectState(chip.getAttribute("data-chip")))
  );

  // Reduced motion OR no WebGL → static SVG fallback, still fully interactive.
  const canWebGL = (() => {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      return false;
    }
  })();

  if (reduced || !canWebGL) {
    stage.style.cursor = "default";
    stage.innerHTML = fallbackSVG();
    stage.querySelectorAll("[data-state]").forEach((p) => {
      const act = () => selectState(p.getAttribute("data-state"));
      p.addEventListener("click", act);
      p.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          act();
        }
      });
    });
    return;
  }

  // Three.js low-poly extruded map, cursor-driven tilt only.
  const THREE = await import("three");
  const { buildMapScene } = await import("../lib/chapters-3d.js");
  buildMapScene(THREE, stage, MAP_STATES, selectState);
}
