// Stridetober — challenge configuration. Spec: docs/PLAN.md §7.1.
// Dates are LOCAL wall-clock strings — always parse via lib/time.js parseLocal().
export const CHALLENGE = {
  title: "Stridetober",
  tagline: "Walk it. Track it. Win it!",
  buyIn: 20,
  venmoHandle: "Dammyhenry",
  venmoUrl: "https://venmo.com/u/Dammyhenry",  // /u/ path returns 200; the bare path 302s
  kickoff: "2026-10-04T00:00",      // local wall-clock — parse via parseLocal()
  finalBell: "2026-11-01T00:00",    // "the clock strikes 12:00 AM"
  judge: { name: "Dammy Henry", title: "The Fairly Impartial Judge" },
  champion: null,                   // set to a walker id when week 4 posts
  split: [0.5, 0.3, 0.2],           // the pot pays three places: 1st / 2nd / 3rd
  payouts: { 1: false, 2: false, 3: false }, // flip each when its Venmo lands
  weeks: [                          // Sun 00:00 → Sat 23:59; screenshots due Sunday
    { n:1, start:"2026-10-04", end:"2026-10-10", due:"2026-10-11" },
    { n:2, start:"2026-10-11", end:"2026-10-17", due:"2026-10-18" },
    { n:3, start:"2026-10-18", end:"2026-10-24", due:"2026-10-25" },
    { n:4, start:"2026-10-25", end:"2026-10-31", due:"2026-11-01" }, // last day is Halloween
  ],
}
