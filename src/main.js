import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/seal.css";
import "./styles/shell.css";
import "./styles/sections.css";

import { runSealGate } from "./lib/seal-gate.js";
import { stampTransition } from "./lib/stamp.js";
import { prefersReducedMotion, ScrollTrigger } from "./lib/motion.js";

import { renderHome, initHome } from "./sections/home.js";
import { renderBench, initBench } from "./sections/bench.js";
import { renderChapters, initChapters } from "./sections/chapters.js";
import { renderGazette, initGazette } from "./sections/gazette.js";
import { renderDocket, initDocket } from "./sections/docket.js";
import { renderContact, initContact } from "./sections/contact.js";
import { renderRecess, initRecess } from "./sections/recess.js";

const ROUTES = [
  { id: "home", label: "Home", index: "00", render: renderHome, init: initHome },
  { id: "bench", label: "The Bench", index: "01", render: renderBench, init: initBench },
  { id: "chapters", label: "Chapters", index: "02", render: renderChapters, init: initChapters },
  { id: "gazette", label: "The Gazette", index: "03", render: renderGazette, init: initGazette },
  { id: "docket", label: "The Docket", index: "04", render: renderDocket, init: initDocket },
  { id: "contact", label: "Contact", index: "05", render: renderContact, init: initContact },
  { id: "recess", label: "The Recess", index: "06", render: renderRecess, init: initRecess },
];

const app = document.getElementById("app");
let current = null;

function railHTML() {
  const links = ROUTES.map(
    (r) => `
      <a class="rail__link" href="#/${r.id}" data-route="${r.id}">
        <span class="rail__index mono">${r.index}</span>
        <span class="rail__name">${r.label}</span>
      </a>`
  ).join("");
  const tabs = ROUTES.map(
    (r) =>
      `<a class="tabbar__link" href="#/${r.id}" data-route="${r.id}">${r.label.replace(
        /^The /,
        ""
      )}</a>`
  ).join("");

  return `
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="shell">
      <nav class="rail" aria-label="Zone sections">
        <a class="rail__brand" href="#/home">
          <span class="rail__brand-mark">LAWSAN</span>
          <span class="rail__brand-sub mono">South South Zone</span>
        </a>
        <div class="rail__nav">${links}</div>
        <p class="rail__foot mono">Six chapters,<br />one register.</p>
      </nav>
      <main class="content" id="main" tabindex="-1" data-outlet></main>
    </div>
    <nav class="tabbar" aria-label="Zone sections">${tabs}</nav>
  `;
}

function routeFromHash() {
  const id = (location.hash.replace(/^#\//, "") || "home").trim();
  return ROUTES.find((r) => r.id === id) ? id : "home";
}

function setActive(id) {
  document.querySelectorAll("[data-route]").forEach((el) => {
    if (el.getAttribute("data-route") === id) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
}

function renderRoute(id, { animate = true } = {}) {
  const route = ROUTES.find((r) => r.id === id);
  if (!route || id === current) return;

  const outlet = document.querySelector("[data-outlet]");

  const swap = () => {
    outlet.innerHTML = route.render();
    outlet.scrollTop = 0;
    window.scrollTo(0, 0);
    route.init?.(outlet);
    setActive(id);
    current = id;
    ScrollTrigger.refresh();
    // Move focus to main for keyboard users on tab change (not on first paint).
    if (animate) outlet.focus({ preventScroll: true });
  };

  if (animate) stampTransition(swap);
  else swap();
}

async function boot() {
  app.innerHTML = railHTML();

  // Intercept nav clicks to route without a hard reload.
  document.body.addEventListener("click", (e) => {
    const link = e.target.closest("[data-route]");
    if (!link) return;
    e.preventDefault();
    const id = link.getAttribute("data-route");
    if (id !== current) {
      history.pushState(null, "", `#/${id}`);
      renderRoute(id);
    }
  });
  window.addEventListener("popstate", () => renderRoute(routeFromHash()));
  window.addEventListener("hashchange", () => renderRoute(routeFromHash()));

  // Render the homepage (or current route) underneath BEFORE the seal
  // clears, so the reveal shows real content.
  renderRoute(routeFromHash(), { animate: false });

  // Smooth-scroll with deliberate inertia (Lenis), unless reduced motion.
  if (!prefersReducedMotion()) {
    try {
      const { default: Lenis } = await import("lenis");
      const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
      const raf = (t) => {
        lenis.raf(t);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
      lenis.on("scroll", ScrollTrigger.update);
    } catch {
      /* Lenis optional */
    }
  }

  // Play the one-time seal ritual over the top.
  runSealGate();
}

boot();
