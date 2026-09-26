// The Roll fills in as tribute lands. Schema — docs/PLAN.md §7.1:
// { id:"sam", name:"Sam Reyes", short:"Sam", crest:"🦊", color:"spruce",
//   paid:true, paidOn:"2026-09-30", birthday:null }   // "MM-DD", only if Oct 4–Oct 31
// Crests: a unique fall emoji each (PLAN §3.6). Colors: palette keys in roster order (§3.2).
// paid:false → "tribute pending" on the Roll and excluded from ALL standings/honours.
// Nine on the Roll. Surnames for the last three are pending.
export const WALKERS = [
  { id: "rod",    name: "Rod Colon",     short: "Rod",    crest: "🌰", color: "cranberry", paid: true,  birthday: null },
  { id: "rod-sr", name: "Rod Colon Sr.", short: "Rod Sr", crest: "☕", color: "goldenrod", paid: true,  birthday: null },
  { id: "alicia", name: "Alicia Ramos",  short: "Alicia", crest: "🍁", color: "moss",      paid: true,  birthday: null },
  { id: "lizzie", name: "Lizzie Henry",  short: "Lizzie", crest: "🎃", color: "spruce",    paid: true,  birthday: null },
  { id: "evan",   name: "Evan Ramos",    short: "Evan",   crest: "🦊", color: "denim",     paid: false, birthday: null },
  { id: "tedi",   name: "Tedi Revenew",  short: "Tedi",   crest: "🧣", color: "fig",       paid: true,  paidOn: "2026-09-26", birthday: null },
  // Christina and Cristina are two different people. Check the spelling before posting a week.
  // Surnames pending for these three; add them to `name` and leave `short` as is.
  { id: "christina", name: "Christina", short: "Christina", crest: "🍄", color: "cinnamon",  paid: false, birthday: null },
  { id: "cristina",  name: "Cristina",  short: "Cristina",  crest: "🌽", color: "rosehip",   paid: false, birthday: null },
  { id: "jess",      name: "Jess",      short: "Jess",      crest: "🍎", color: "cranberry", paid: false, birthday: null },  // 9th: colour reused, chart line dashed (PLAN §3.2)
];
