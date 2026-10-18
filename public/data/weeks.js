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
  { week: 2, posted: "2026-10-18T15:01",
    steps: { tedi: 106193, brittany: 106119, "rod-jr": 96988, lizzie: 96578, alicia: 87747, christina: 87155, cristina: 46882, ashlea: 54885, jess: 41901,
             "rod-sr": 55258 },
    days: {
      tedi: [9956, 19125, 23034, 13832, 10498, 16599, 13149],
      brittany: [9124, 18738, 20625, 26850, 4044, 12104, 14634],
      "rod-jr": [15405, 15924, 12642, 13292, 13228, 8161, 18336],
      lizzie: [9707, 16366, 16801, 16277, 11337, 14674, 11416],
      alicia: null,
      christina: [25131, 8491, 11672, 12181, 13528, 7267, 8885],
      ashlea: [4389, 10076, 8018, 10413, 5192, 7352, 9445],
      "rod-sr": [2244, 11665, 9743, 11884, 4631, 9118, 5973],
      jess: [988, 9886, 6487, 8899, 4499, 5897, 5245],
      cristina: [9367, 8677, 6173, 6014, 6677, 4965, 5009],
    },
    derived: [],
    judgeNote: "Tedi takes week two by 74 steps over Brittany, who climbs to fourth. Jess slips past Rod Sr by 89. The top three hold, for now." }
];

// Who has handed in the week's screenshot — names only, never numbers. Shown on the Court
// until that week is posted. Add ids as screenshots land; drop the week once WEEKS has it.
export const DOCKET = { week: 2, in: ["tedi", "brittany", "rod-jr", "lizzie", "alicia", "christina", "cristina", "ashlea", "rod-sr", "jess"] };

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
