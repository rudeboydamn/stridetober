// The weekly edit — appended each Sunday (Oct 11, 18, 25, Nov 1). Runbook: docs/PLAN.md §9.2.
// { week:1, posted:"2026-10-11T19:20",
//   steps: { sam: 84210, jules: null },                     // null = NO SCREENSHOT (counts 0)
//   days:  { sam: [9,120, 12,004, …], jules: null },        // 7 numbers SUNDAY-first, or null
//   derived: [],                                           // ids whose daily split was chart-read
//   judgeNote: "…" }
// steps is authoritative as submitted. days null = pending — never guess.
export const WEEKS = [
  { week: 1, posted: "2026-10-11T13:52",
    steps: { tedi: 119502, lizzie: 111512, alicia: 98744, "rod-jr": 71507, brittany: 66773, cristina: 44054, ashlea: 62730, jess: 56718,
             christina: 79922, "rod-sr": 43272 },
    days: {
      tedi: [12675, 18878, 10337, 14700, 18462, 21876, 22574],
      lizzie: [7367, 16343, 16823, 16748, 16982, 16722, 20527],
      alicia: [9549, 16110, 15371, 14182, 15946, 11353, 16233],
      "rod-jr": [12527, 13367, 8356, 4616, 9088, 7910, 15643],
      brittany: [11113, 5057, 6704, 6463, 10653, 13459, 13324],
      cristina: [4382, 6381, 6385, 6611, 7564, 7263, 5468],
      ashlea: [4027, 11031, 8833, 8559, 11437, 6349, 12494],
      jess: [0, 13797, 13483, 10020, 10019, 6029, 3370],
      christina: [13113, 10492, 15256, 9332, 12284, 5269, 14176],
      "rod-sr": [4178, 10147, 3558, 5290, 6808, 6876, 6415],
    },
    derived: ["alicia"],
    judgeNote: "All ten Striders have reported, and the Court is *fairly* impressed. Tedi opens with 119,502 and leads Lizzie's 111,512 by 7,990. Alicia's 98,744 holds third. Christina's 79,922 leads the chase behind them. The Judge notes that three weeks remain, and a podium is only a suggestion until Nov 1." },
];

// Who has handed in the week's screenshot — names only, never numbers. Shown on the Court
// until that week is posted. Add ids as screenshots land; drop the week once WEEKS has it.
export const DOCKET = { week: 1, in: ["tedi", "lizzie", "alicia", "rod-jr", "brittany", "cristina", "ashlea", "jess", "rod-sr", "christina"] };

// Alicia's birthday falls on kickoff day. Live all day Sunday Oct 4, then it retires itself.
export const ANNOUNCEMENT = {
  from: "2026-10-04T00:00", until: "2026-10-05T00:00", mode: "note", who: "alicia",
  kicker: "Hear ye, hear ye",
  title: "🎂 The Maple turns a year more golden today!",
  lead: "Born on the very first day of Stridetober, which the Judge finds *fairly* suspicious. Happy birthday, Alicia! Birthday steps still count exactly once. The Judge is generous, not careless.",
  cta: "Read her Chronicle",
};
// or { from?:"2026-10-19T00:00", until:"2026-10-20T00:00", mode:"note"|"getwell", who:"sam",   // from = optional start
//      kicker:"…", title:"…", lead:"…", points:[[emoji,text],…], note:"…", cta:"…" }
// mode:"getwell" replaces the Court's ledger preview; mode:"note" is a dismissible banner.
