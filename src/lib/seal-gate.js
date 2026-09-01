/* The Seal — signature one-time entry ritual (design.md §3).
   Dark water, drifting gold ink, "press and hold to seal in".
   As the visitor holds, ink gathers and a wax seal rises; at full
   hold it stamps, cracks, and the ink clears in a ring to reveal
   the homepage already underneath. Once per visitor.

   Clarity Rule note: this is the ONLY place the site asks for an
   interaction before showing content, and it earns it as a
   threshold, not a content page. It is fully skippable by keyboard
   and honours prefers-reduced-motion. */
import { prefersReducedMotion } from "./motion.js";
import { getWater } from "./water/index.js";

const SEAL_KEY = "lawsan-ss.sealed";
const HOLD_MS = 1500;

export function hasBeenSealed() {
  try {
    return localStorage.getItem(SEAL_KEY) === "1";
  } catch {
    return false;
  }
}

function markSealed() {
  try {
    localStorage.setItem(SEAL_KEY, "1");
  } catch {
    /* private mode — ritual simply replays, harmless */
  }
}

/**
 * Mount the gate. Resolves when the visitor is "in" (ritual done,
 * skipped, or not needed). The homepage should already be rendered
 * underneath so the reveal shows real content.
 * @returns {Promise<void>}
 */
export function runSealGate() {
  const gate = document.getElementById("seal-gate");
  if (!gate) return Promise.resolve();

  if (hasBeenSealed()) {
    gate.setAttribute("aria-hidden", "true");
    return Promise.resolve();
  }

  const reduced = prefersReducedMotion();

  gate.setAttribute("aria-hidden", "false");
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-label", "Enter the register");
  gate.classList.add("seal-gate--active");
  // No painted ink here any more: the gate is a veil over the real
  // water world, and the ritual drives that simulation directly.
  gate.innerHTML = `
    <div class="seal-gate__center">
      <div class="seal-stamp" aria-hidden="true">
        <div class="seal-stamp__ring"></div>
        <div class="seal-stamp__mark">SS</div>
      </div>
      <button class="seal-gate__hold" type="button" aria-describedby="seal-hint">
        <span class="seal-gate__hold-fill"></span>
        <span class="seal-gate__hold-label">Press &amp; hold to seal in</span>
      </button>
      <p id="seal-hint" class="seal-gate__hint">
        First visit only. <button type="button" class="seal-gate__skip">Skip</button>
      </p>
    </div>
  `;

  const holdBtn = gate.querySelector(".seal-gate__hold");
  const fill = gate.querySelector(".seal-gate__hold-fill");
  const stamp = gate.querySelector(".seal-stamp");
  const skipBtn = gate.querySelector(".seal-gate__skip");

  /* Centre of the seal, in client coords — the point the ink gathers to. */
  const sealCentre = () => {
    const r = stamp.getBoundingClientRect();
    return r.width
      ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  };

  return new Promise((resolve) => {
    let done = false;
    let holdTimer = null;
    let gatherTimer = null;

    /* While held, drag real ink inward from a ring so it visibly
       collects at the seal rather than fading in on a CSS curve. */
    const startGathering = () => {
      const water = getWater();
      if (!water?.live) return;
      let step = 0;
      gatherTimer = window.setInterval(() => {
        const { x: cx, y: cy } = sealCentre();
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.34;
        for (let i = 0; i < 3; i++) {
          const a = (step * 0.7 + i * ((Math.PI * 2) / 3)) % (Math.PI * 2);
          const sx = cx + Math.cos(a) * radius;
          const sy = cy + Math.sin(a) * radius;
          // velocity points back at the centre
          water.splatClient(sx, sy, -Math.cos(a) * 1400, Math.sin(a) * 1400, 0.9);
        }
        step++;
      }, 55);
    };
    const stopGathering = () => {
      if (gatherTimer) clearInterval(gatherTimer);
      gatherTimer = null;
    };

    const finish = () => {
      if (done) return;
      done = true;
      markSealed();
      stopGathering();

      // The stamp lands in the real water and drives the ink outward.
      const water = getWater();
      if (water?.live) {
        const { x, y } = sealCentre();
        water.pulse(x, y, 1);
        window.setTimeout(() => water.pulse(x, y, 0.6), 120);
      }

      // stamp down + crack + clear ring
      gate.classList.add("seal-gate--stamping");
      const clearDelay = reduced ? 220 : 1050;
      window.setTimeout(() => {
        gate.classList.add("seal-gate--cleared");
        window.setTimeout(() => {
          gate.setAttribute("aria-hidden", "true");
          gate.classList.remove(
            "seal-gate--active",
            "seal-gate--stamping",
            "seal-gate--cleared"
          );
          gate.innerHTML = "";
          resolve();
        }, reduced ? 120 : 520);
      }, clearDelay);
    };

    const startHold = () => {
      if (done) return;
      gate.classList.add("is-holding");
      if (!reduced) startGathering();
      if (fill) {
        fill.style.transition = `transform ${HOLD_MS}ms linear`;
        requestAnimationFrame(() => (fill.style.transform = "scaleX(1)"));
      }
      holdTimer = window.setTimeout(finish, reduced ? 150 : HOLD_MS);
    };

    const cancelHold = () => {
      if (done) return;
      gate.classList.remove("is-holding");
      stopGathering();
      if (holdTimer) clearTimeout(holdTimer);
      if (fill) {
        fill.style.transition = "transform 260ms ease-out";
        fill.style.transform = "scaleX(0)";
      }
    };

    // Pointer (mouse + touch unified)
    holdBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startHold();
    });
    holdBtn.addEventListener("pointerup", cancelHold);
    holdBtn.addEventListener("pointerleave", cancelHold);
    holdBtn.addEventListener("pointercancel", cancelHold);

    // Keyboard: hold Space/Enter, or Escape to skip. Accessible path.
    holdBtn.addEventListener("keydown", (e) => {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) {
        e.preventDefault();
        startHold();
      }
    });
    holdBtn.addEventListener("keyup", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        cancelHold();
      }
    });

    skipBtn.addEventListener("click", finish);
    gate.addEventListener("keydown", (e) => {
      if (e.key === "Escape") finish();
    });

    // focus the hold button so keyboard users can act immediately
    window.setTimeout(() => holdBtn.focus(), 60);
  });
}
