/* Seal-stamp tab transition.
   Uses the View Transitions API where supported so switching tabs
   feels like one continuous surface; otherwise a quick corner
   stamp + CSS cross-fade. Content is always fully visible when the
   new tab arrives — motion never gates it. */
import { supportsViewTransitions, prefersReducedMotion } from "./motion.js";
import { getWater } from "./water/index.js";

const stampEl = () => document.getElementById("stamp-transition");

function playCornerStamp() {
  const el = stampEl();
  if (!el) return;
  el.classList.remove("is-playing");
  // force reflow so the animation restarts
  void el.offsetWidth;
  el.classList.add("is-playing");

  // The stamp displaces the actual water rather than animating beside
  // it — the flourish and the world are the same thing.
  const water = getWater();
  if (water?.live) {
    const r = el.getBoundingClientRect();
    water.pulse(r.left + r.width / 2, r.top + r.height / 2, 0.85);
  }

  window.setTimeout(() => el.classList.remove("is-playing"), 620);
}

/**
 * Run `swap` (which replaces the content) inside a transition.
 * @param {() => void | Promise<void>} swap
 */
export async function stampTransition(swap) {
  if (prefersReducedMotion()) {
    // Simple opacity cross-fade path (handled by CSS on the view).
    await swap();
    return;
  }

  if (supportsViewTransitions()) {
    // The corner stamp reads as the flourish; VT handles the crossfade.
    playCornerStamp();
    const vt = document.startViewTransition(() => swap());
    try {
      await vt.finished;
    } catch {
      /* transition interrupted — content already swapped */
    }
    return;
  }

  // Fallback: corner stamp + manual cross-fade on #app.
  const app = document.getElementById("app");
  playCornerStamp();
  app?.classList.add("view-fading");
  await new Promise((r) => setTimeout(r, 150));
  await swap();
  requestAnimationFrame(() => app?.classList.remove("view-fading"));
}
