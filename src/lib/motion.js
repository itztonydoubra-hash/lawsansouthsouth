/* Motion helpers, all reduced-motion aware. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const supportsViewTransitions = () =>
  typeof document !== "undefined" && "startViewTransition" in document;

export { gsap, ScrollTrigger };

/* Count a number up once. Respects reduced motion (sets final value). */
export function countUp(el, to, { duration = 1.1, suffix = "" } = {}) {
  if (prefersReducedMotion()) {
    el.textContent = `${to}${suffix}`;
    return;
  }
  const obj = { v: 0 };
  gsap.to(obj, {
    v: to,
    duration,
    ease: "power2.out",
    onUpdate() {
      el.textContent = `${Math.round(obj.v)}${suffix}`;
    },
  });
}

/* Fire a callback once when el scrolls into view; never re-triggers. */
export function onEnterOnce(el, cb, start = "top 82%") {
  ScrollTrigger.create({
    trigger: el,
    start,
    once: true,
    onEnter: cb,
  });
}
