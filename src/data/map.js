/* =============================================================
   Stylised outline of the six South South states.
   These are hand-built SVG paths on a 1000x760 viewBox — a
   deliberate low-poly reading of the zone's real arrangement
   (Edo/Delta to the west, Bayelsa/Rivers on the coast, Akwa Ibom
   and Cross River to the east). Not a raster image, per §9.
   Each path also carries a centroid used to pin its marker.
   ============================================================= */

export const MAP_VIEWBOX = "0 0 1000 760";

export const MAP_STATES = [
  {
    id: "edo",
    state: "Edo",
    // north-west block
    path: "M120,70 L300,60 L340,150 L320,260 L250,300 L150,280 L110,180 Z",
    marker: [225, 175],
  },
  {
    id: "delta",
    state: "Delta",
    // west, reaching to the coast
    path: "M150,290 L320,270 L360,340 L400,470 L300,540 L180,500 L120,400 L140,320 Z",
    marker: [265, 400],
  },
  {
    id: "bayelsa",
    state: "Bayelsa",
    // central coast
    path: "M410,480 L520,470 L560,560 L500,650 L400,640 L360,560 Z",
    marker: [460, 560],
  },
  {
    id: "rivers",
    state: "Rivers",
    // coast, east of Bayelsa
    path: "M540,455 L690,470 L720,560 L660,650 L560,660 L520,565 Z",
    marker: [615, 555],
  },
  {
    id: "akwa-ibom",
    state: "Akwa Ibom",
    // south-east coast
    path: "M700,455 L820,470 L850,560 L790,650 L700,645 L680,560 Z",
    marker: [765, 555],
  },
  {
    id: "cross-river",
    state: "Cross River",
    // far east, reaching north
    path: "M770,150 L890,140 L920,300 L880,460 L800,455 L740,360 L760,240 Z",
    marker: [835, 300],
  },
];
