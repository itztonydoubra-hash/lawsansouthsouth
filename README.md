# LAWSAN South South Zone

The standing register of the South South Zone of the Law Students' Association of
Nigeria: six chapters (Rivers, Bayelsa, Delta, Akwa Ibom, Cross River, Edo), the
leadership sitting this term, what has been published, and what has been done.

Built on the "Call-Over" concept: six chapters answering to one register.

## Running it

```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
```

No framework, no build-time content step. Content is structured local data in
`src/data/` (a CMS is a fair v2 ask, it is out of scope for v1).

## Structure

```
src/
  main.js              app shell, docket rail, hash routing
  data/
    content.js         zone copy, bench, gazette, docket, contact, recess
    map.js             SVG paths + marker centroids for the six states
  lib/
    seal-gate.js       one-time press-and-hold entry ritual
    stamp.js           tab transitions (View Transitions API + fallback)
    chapters-3d.js     the single Three.js scene
    magnetic.js        magnetic pull, Wax Seal CTA only
    motion.js          GSAP/ScrollTrigger setup, reduced-motion helpers
  sections/            one module per tab, each exporting render() + init()
  styles/
    tokens.css         the locked palette, type scale, layout primitives
    base.css           reset, grain, ambient water band
    seal.css           entry ritual + transition stamp
    shell.css          rail and bottom tab bar
    sections.css       per-section styles
```

Each section module exports `render()` (returns HTML) and `init(root)` (wires
behaviour after mount). Adding a tab means adding one module and one entry to
`ROUTES` in `main.js`.

## The rule that governs the build

If it is information, it is visible by default. Motion may enhance information,
motion never gates it. No interaction is required to reveal a name, a number, a
chapter, or a photo.

Spectacle is confined to three places: the one-time entry ritual, the ambient
atmosphere at the viewport edges, and the transitions between tabs. If a future
addition makes a visitor hover, drag, or hold to reveal content, it is wrong
regardless of how it looks in isolation.

The entry ritual is the single exception and earns it as a threshold rather than
a content page. It runs once per visitor (`localStorage`), is skippable by button
or `Escape`, and the homepage is already rendered underneath before it clears.

## Motion

| Effect | Where | Notes |
|---|---|---|
| Map border trace + marker pinning | Home | Draws in on Brass, markers pin as each border completes |
| Word-by-word zone name | Home | Lands as the map finishes |
| Magnetic pull | Home CTA only | Nothing else gets this treatment |
| Reference tick-up | The Bench | Once, on enter |
| Cursor-driven tilt | Chapters | The only 3D on the site; brass ring cursor |
| Column parallax drift | The Gazette | Atmospheric only, text readable on load |
| Count-up | The Docket | Once per section, never re-triggers |
| Seal press | Contact submit | Confirms in the interface's own voice |
| Develop-once + hover tilt | The Recess | First load only, never on re-scroll |

`prefers-reduced-motion` is honoured everywhere: the map trace, 3D tilt, scroll
scrubbing, parallax, develop moment, and magnetic pull are all disabled and
replaced with plain visible content or opacity cross-fades. Under reduced motion
the Chapters tab renders a static SVG of all six states with every marker pinned,
so no information is lost.

Three.js loads as its own chunk, only when the Chapters tab is opened. Nothing
else on the site pulls in a 3D dependency.

## Placeholders

Where the zone has not yet supplied real content, the site shows a visible
`placeholder` marker rather than inventing a figure. This is deliberate and is
what currently applies to exec names and bios, chapter presidents and member
counts, publication entries, three of the four Docket figures (the chapter count
of six is real), the contact email, and all gallery plates.

To replace them, edit the relevant entry in `src/data/content.js` and drop the
`placeholder: true` flag (or, for Docket rows, set a real `value`).

## Accessibility

- Every interactive element has a visible Brass focus ring.
- Skip link to `#main`; focus moves to the content area on tab change.
- The Bench uses `aria-expanded` / `aria-controls` accordions, not modals.
- Chapter picker uses `aria-pressed`; the SVG fallback states are keyboard
  operable.
- Lightbox traps nothing but handles `Escape` and arrow keys, and restores focus
  to the plate that opened it.
- Contact confirmation is an `aria-live` status, never a browser alert.
- Parchment on Deep Ink is roughly 13:1. River Teal on Deep Ink is around 4.5:1,
  so it is used for links at body size or larger and kept underlined rather than
  carrying meaning by colour alone.

## Reviewing it

1. Stop motion and screenshot the homepage. It should still look intentional.
2. Throttle CPU 4x and the network, reload, and check the trace and scroll.
3. Toggle `prefers-reduced-motion` and reload.
4. Tab the whole site on keyboard only. Everything reachable, focus always visible.
5. Time yourself finding a specific chapter's president. More than a few seconds
   means the clarity rule was broken somewhere.
