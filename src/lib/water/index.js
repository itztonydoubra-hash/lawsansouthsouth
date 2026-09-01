/* =============================================================
   The one water world.

   A single canvas created once and parented to <body>, so it is
   never touched when the router swaps the contents of #app. Every
   tab draws on top of the same running simulation — that continuity
   is the whole point. Sections drive it through the returned API
   rather than each spinning up an effect of their own.

   Falls back to a still, painted water surface when WebGL2 is
   unavailable or the visitor asks for reduced motion. Nothing on the
   site depends on the simulation to be legible.
   ============================================================= */

import { createFluid } from "./fluid.js";

const INK = [0.55, 0.42, 0.11]; // brass, in dye space
const MAX_DPR = 1.5;

let instance = null;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Quality ladder, walked downwards if we cannot hold frame rate. */
const TIERS = [
  { simResolution: 128, dyeResolution: 512 },
  { simResolution: 96, dyeResolution: 384 },
  { simResolution: 64, dyeResolution: 256 },
];

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.className = "water-canvas";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    zIndex: "0",
    pointerEvents: "none",
  });
  return canvas;
}

/* Painted still water for the fallback path — same palette, no sim. */
function paintStatic(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#0F1A16");
  g.addColorStop(0.5, "#13241d");
  g.addColorStop(1, "#0d1712");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // a few soft brass pools so it still reads as ink in water
  const pools = [
    [0.22, 0.3, 0.42],
    [0.74, 0.62, 0.34],
    [0.48, 0.84, 0.28],
  ];
  pools.forEach(([px, py, pr]) => {
    const r = Math.min(w, h) * pr;
    const rg = ctx.createRadialGradient(px * w, py * h, 0, px * w, py * h, r);
    rg.addColorStop(0, "rgba(201,162,39,0.13)");
    rg.addColorStop(1, "rgba(201,162,39,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
  });
}

export function mountWater() {
  if (instance) return instance;

  const canvas = makeCanvas();
  document.body.insertBefore(canvas, document.body.firstChild);

  const dpr = () => Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const sizeBuffer = () => {
    canvas.width = Math.floor(window.innerWidth * dpr());
    canvas.height = Math.floor(window.innerHeight * dpr());
  };
  sizeBuffer();

  // --- fallback path -------------------------------------------------
  const goStatic = () => {
    paintStatic(canvas);
    const onResize = () => {
      sizeBuffer();
      paintStatic(canvas);
    };
    window.addEventListener("resize", onResize);
    instance = {
      live: false,
      splatClient() {},
      pulse() {},
      setIntensity() {},
      destroy() {
        window.removeEventListener("resize", onResize);
        canvas.remove();
        instance = null;
      },
    };
    return instance;
  };

  if (reducedMotion()) return goStatic();

  // Small screens start one tier down.
  let tier = window.innerWidth < 820 ? 1 : 0;
  const fluid = createFluid(canvas, TIERS[tier]);
  if (!fluid.supported) return goStatic();

  // --- live simulation ----------------------------------------------
  let intensity = 1;
  let running = true;
  let last = performance.now();

  const toGL = (clientX, clientY) => ({
    x: clientX / window.innerWidth,
    y: 1 - clientY / window.innerHeight,
  });

  const splatClient = (clientX, clientY, dx = 0, dy = 0, strength = 1) => {
    const { x, y } = toGL(clientX, clientY);
    fluid.splat(
      x,
      y,
      dx,
      dy,
      [INK[0] * strength, INK[1] * strength, INK[2] * strength]
    );
  };

  /* Radial impulse — the seal stamp and tab transitions push the
     water outward from a point rather than dragging it. */
  const pulse = (clientX, clientY, strength = 1) => {
    const { x, y } = toGL(clientX, clientY);
    const arms = 10;
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI * 2;
      fluid.splat(
        x,
        y,
        Math.cos(a) * 900 * strength,
        Math.sin(a) * 900 * strength,
        [INK[0] * 0.5 * strength, INK[1] * 0.5 * strength, INK[2] * 0.5 * strength],
        2.4
      );
    }
  };

  // --- pointer forces (window-level, canvas never blocks input) -----
  let px = null;
  let py = null;
  const onPointerMove = (e) => {
    if (px !== null) {
      const dx = (e.clientX - px) * 7.5;
      const dy = -(e.clientY - py) * 7.5;
      if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
        splatClient(e.clientX, e.clientY, dx, dy, 0.85);
      }
    }
    px = e.clientX;
    py = e.clientY;
  };
  const onPointerLeave = () => {
    px = null;
    py = null;
  };
  const onPointerDown = (e) => pulse(e.clientX, e.clientY, 0.45);

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });

  // --- ambient drift, so the water lives without a cursor ------------
  const drifters = [
    { fx: 0.00021, fy: 0.00017, ax: 0.34, ay: 0.28, ox: 0.3, oy: 0.42 },
    { fx: -0.00014, fy: 0.00023, ax: 0.28, ay: 0.32, ox: 0.72, oy: 0.6 },
  ];
  let ambientAccum = 0;

  const ambient = (now, dt) => {
    ambientAccum += dt;
    if (ambientAccum < 0.055) return;
    ambientAccum = 0;
    drifters.forEach((d) => {
      const x = d.ox + Math.sin(now * d.fx) * d.ax;
      const y = d.oy + Math.cos(now * d.fy) * d.ay;
      const vx = Math.cos(now * d.fx * 1.7) * 165;
      const vy = Math.sin(now * d.fy * 1.3) * 165;
      fluid.splat(x, y, vx, vy, [INK[0] * 0.17, INK[1] * 0.17, INK[2] * 0.17], 3.2);
    });
  };

  // --- resize --------------------------------------------------------
  let resizeTimer;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeBuffer();
      fluid.resize(canvas.width, canvas.height);
    }, 140);
  };
  window.addEventListener("resize", onResize);

  // --- pause when the tab is hidden ---------------------------------
  const onVisibility = () => {
    running = document.visibilityState === "visible";
    if (running) {
      last = performance.now();
      requestAnimationFrame(frame);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  // --- context loss --------------------------------------------------
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    running = false;
  });

  // --- frame-rate guard ---------------------------------------------
  let samples = 0;
  let accum = 0;
  const guard = (dt) => {
    if (tier >= TIERS.length - 1) return;
    samples++;
    accum += dt;
    if (samples < 90) return;
    const fps = samples / accum;
    samples = 0;
    accum = 0;
    if (fps < 40) {
      tier++;
      fluid.setQuality(TIERS[tier]);
    }
  };

  let raf;
  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    guard(dt);
    ambient(now, dt);
    fluid.step(dt);
    fluid.render(intensity);

    raf = requestAnimationFrame(frame);
  }

  // Seed ink so the very first frame is already water, not a void.
  for (let i = 0; i < 9; i++) {
    fluid.splat(
      Math.random(),
      Math.random(),
      (Math.random() - 0.5) * 1100,
      (Math.random() - 0.5) * 1100,
      [INK[0] * 0.75, INK[1] * 0.75, INK[2] * 0.75],
      2.8
    );
  }

  raf = requestAnimationFrame(frame);

  instance = {
    live: true,
    splatClient,
    pulse,
    setIntensity(v) {
      intensity = Math.max(0, Math.min(1, v));
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      fluid.dispose();
      canvas.remove();
      instance = null;
    },
  };
  return instance;
}

export const getWater = () => instance;
