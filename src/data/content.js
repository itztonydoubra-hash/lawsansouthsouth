/* =============================================================
   Site content. Structured local data (no CMS in v1).
   Real, verifiable facts are used where available; anything not
   yet supplied is flagged with `placeholder: true` and rendered
   with a visible marker, per requirements + design.md §11 note.
   ============================================================= */

export const ZONE = {
  name: "LAWSAN South South Zone",
  words: ["LAWSAN", "South", "South", "Zone"],
  registrarLine: "The register of the South South Zone \u2014 six chapters, one call-over.",
  mission:
    "The South South Zone of the Law Students\u2019 Association of Nigeria brings together six state chapters. This is its standing record: who is running it this term, where each chapter sits, what has been published, and what has been done.",
};

/* Six chapters. State facts (capital, host character) are real;
   named officers and member counts are placeholders until the
   zone supplies them. */
export const CHAPTERS = [
  {
    id: "rivers",
    code: "SS/RIV",
    state: "Rivers",
    capital: "Port Harcourt",
    hostInstitution: { value: "Rivers State University / UNIPORT", placeholder: true },
    president: { value: "To be confirmed", placeholder: true },
    members: { value: null, placeholder: true },
    blurb: "The zonal anchor in Port Harcourt.",
  },
  {
    id: "bayelsa",
    code: "SS/BAY",
    state: "Bayelsa",
    capital: "Yenagoa",
    hostInstitution: { value: "Niger Delta University", placeholder: true },
    president: { value: "To be confirmed", placeholder: true },
    members: { value: null, placeholder: true },
    blurb: "The riverine chapter at Yenagoa.",
  },
  {
    id: "delta",
    code: "SS/DEL",
    state: "Delta",
    capital: "Asaba",
    hostInstitution: { value: "Delta State University, Oleh", placeholder: true },
    president: { value: "To be confirmed", placeholder: true },
    members: { value: null, placeholder: true },
    blurb: "Spanning Asaba and the Delta faculties.",
  },
  {
    id: "akwa-ibom",
    code: "SS/AKW",
    state: "Akwa Ibom",
    capital: "Uyo",
    hostInstitution: { value: "University of Uyo", placeholder: true },
    president: { value: "To be confirmed", placeholder: true },
    members: { value: null, placeholder: true },
    blurb: "Seated at Uyo.",
  },
  {
    id: "cross-river",
    code: "SS/CRS",
    state: "Cross River",
    capital: "Calabar",
    hostInstitution: { value: "University of Calabar", placeholder: true },
    president: { value: "To be confirmed", placeholder: true },
    members: { value: null, placeholder: true },
    blurb: "The Calabar chapter.",
  },
  {
    id: "edo",
    code: "SS/EDO",
    state: "Edo",
    capital: "Benin City",
    hostInstitution: { value: "University of Benin", placeholder: true },
    president: { value: "To be confirmed", placeholder: true },
    members: { value: null, placeholder: true },
    blurb: "Seated at Benin City.",
  },
];

/* Leadership — "The Bench". Names/bios are placeholders pending
   the zone's own register; roles reflect a typical zonal exec. */
export const BENCH = [
  {
    ref: "01/26",
    name: "Zonal Coordinator",
    role: "Zonal Coordinator",
    chapter: "South South Zone",
    placeholder: true,
    bio: "Heads the zonal executive and answers for the six chapters at the national level. Name to be confirmed by the zone.",
  },
  {
    ref: "02/26",
    name: "Deputy Coordinator",
    role: "Deputy Zonal Coordinator",
    chapter: "South South Zone",
    placeholder: true,
    bio: "Deputises for the coordinator and oversees inter-chapter coordination. Name to be confirmed.",
  },
  {
    ref: "03/26",
    name: "Zonal Secretary",
    role: "Secretary-General",
    chapter: "South South Zone",
    placeholder: true,
    bio: "Keeps the register, minutes, and correspondence of the zone. Name to be confirmed.",
  },
  {
    ref: "04/26",
    name: "Zonal Treasurer",
    role: "Treasurer",
    chapter: "South South Zone",
    placeholder: true,
    bio: "Holds the zone\u2019s accounts and reports on them each term. Name to be confirmed.",
  },
  {
    ref: "05/26",
    name: "Public Relations Officer",
    role: "Public Relations Officer",
    chapter: "South South Zone",
    placeholder: true,
    bio: "Speaks for the zone and runs its publications and media. Name to be confirmed.",
  },
  {
    ref: "06/26",
    name: "Director of Socials",
    role: "Director of Socials",
    chapter: "South South Zone",
    placeholder: true,
    bio: "Runs zonal events, the moot calendar, and the recess gallery. Name to be confirmed.",
  },
];

/* Publications — "The Gazette". Placeholder entries, clearly marked. */
export const GAZETTE = [
  {
    issue: "Vol. 1 / 01",
    title: "The Call-Over",
    type: "Journal",
    chapter: "Zone",
    placeholder: true,
    excerpt:
      "The inaugural zonal journal. When the first issue is finalised, its abstract and contributors will be listed here in full.",
  },
  {
    issue: "Vol. 1 / 02",
    title: "On the Riverine Bench",
    type: "Essay",
    chapter: "Rivers",
    placeholder: true,
    excerpt:
      "A student essay on legal practice across the riverine chapters. Placeholder pending submission.",
  },
  {
    issue: "NL / 03",
    title: "Term Newsletter",
    type: "Newsletter",
    chapter: "Zone",
    placeholder: true,
    excerpt:
      "The termly bulletin of the zonal executive. Real editions will replace this entry once published.",
  },
  {
    issue: "Vol. 1 / 04",
    title: "Moot & Mock Report",
    type: "Report",
    chapter: "Delta",
    placeholder: true,
    excerpt:
      "A report on the zone\u2019s moot court season. Placeholder pending the season\u2019s close.",
  },
  {
    issue: "Vol. 1 / 05",
    title: "Calabar Notes",
    type: "Essay",
    chapter: "Cross River",
    placeholder: true,
    excerpt:
      "Short-form legal writing from the Calabar chapter. Placeholder pending submission.",
  },
  {
    issue: "NL / 06",
    title: "Uyo Dispatch",
    type: "Newsletter",
    chapter: "Akwa Ibom",
    placeholder: true,
    excerpt:
      "Chapter dispatch from Uyo. Placeholder pending the next edition.",
  },
];

/* Impact — "The Docket". Chapter count is real (six). The rest are
   placeholders shown as such until the zone supplies figures. */
export const DOCKET = [
  { value: 6, label: "State chapters in the zone.", placeholder: false, suffix: "" },
  { value: null, label: "Registered student members.", placeholder: true },
  { value: null, label: "Publications in the Gazette.", placeholder: true },
  { value: null, label: "Events run this term.", placeholder: true },
];

export const CONTACT = {
  closing: "Written from the chambers of the zonal executive,",
  signoff: "The South South Zone.",
  lines: [
    { label: "Email", value: "hello@lawsan-ss.example", placeholder: true },
    { label: "Zone", value: "South South, Nigeria", placeholder: false },
    { label: "Chapters", value: "Rivers \u00b7 Bayelsa \u00b7 Delta \u00b7 Akwa Ibom \u00b7 Cross River \u00b7 Edo", placeholder: false },
  ],
};

/* Media — "The Recess". Photos are procedurally-generated placeholder
   plates (no stock people), clearly marked, until real event photos land. */
export const RECESS = Array.from({ length: 8 }, (_, i) => ({
  id: `plate-${i + 1}`,
  event: "Event photo pending",
  chapter: CHAPTERS[i % CHAPTERS.length].state,
  date: "\u2014",
  placeholder: true,
}));
