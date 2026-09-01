/* Magnetic pull for the single Wax Seal CTA per page — nothing else
   gets this treatment (design.md §7). Disabled under reduced motion. */
import { gsap, prefersReducedMotion } from "./motion.js";

export function magnetic(el, strength = 0.35) {
  if (!el || prefersReducedMotion()) return;
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power3.out" });
  };
  const reset = () =>
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });

  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", reset);
}
