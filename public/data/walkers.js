// The Roll lists every walker. Schema — docs/PLAN.md §7.1:
// { id:"sam", name:"Sam Reyes", short:"Sam", crest:"🦊", color:"spruce",
//   paid:true, paidOn:"2026-09-30", birthday:null }   // "MM-DD", only if Oct 4–Oct 31
// Crests: a unique fall emoji each (PLAN §3.6). Colors: palette keys in roster order (§3.2).
// paid:false → not on the Ledger yet: excluded from ALL standings/honours. The site no longer
// mentions buy-ins; this flag is the only trace of them, so flip it when the Judge says so.
// Ten Striders. Ashlea (9th) and Brittany (10th) joined late, so they reuse the first two palette colours (PLAN §3.2).
// tz: only for walkers outside the Judge's own clock. The site already runs on each viewer's device
// time, so this is a note for the weekly job — their Saturday ends at their midnight, not yours.
export const WALKERS = [
  // The Colon-Ramos family: Rod Sr. is the father of Rod Jr. and Alicia (Alicia Ramos).
  { id: "rod-jr", name: "Rod Colon Jr.", short: "Rod Jr", crest: "🌰", color: "cranberry", paid: true,  birthday: null },
  { id: "rod-sr", name: "Rod Colon Sr.", short: "Rod Sr", crest: "☕", color: "goldenrod", paid: true,  birthday: null },
  { id: "alicia", name: "Alicia Ramos",  short: "Alicia", crest: "🍁", color: "moss",      paid: true,  birthday: "10-04" },
  { id: "lizzie", name: "Lizzie Henry",  short: "Lizzie", crest: "🎃", color: "spruce",    paid: true,  birthday: null },
  { id: "tedi",   name: "Tedi Revenew",  short: "Tedi",   crest: "🧣", color: "fig",       paid: true,  paidOn: "2026-09-26", birthday: null, tz: "America/Phoenix" },
  // Christina and Cristina are two different people. Check the spelling before posting a week.
  // Christina B. and Cristina C. carry initials so the Ledger never shows two walkers a letter apart.
  { id: "christina", name: "Christina Ballard", short: "Christina B.", crest: "🍄", color: "cinnamon",  paid: true,  paidOn: "2026-09-26", birthday: null },
  { id: "cristina",  name: "Cristina Colon", short: "Cristina C.", crest: "🌽", color: "rosehip", paid: true, paidOn: "2026-09-30", birthday: null },
  { id: "jess",      name: "Jessica Jones", short: "Jess",   crest: "🍎", color: "denim",     paid: true,  paidOn: "2026-09-29", birthday: null },
  // Ashlea joined last minute (Oct 3) as the ninth walker.
  { id: "ashlea",    name: "Ashlea Coulter", short: "Ashlea", crest: "🥧", color: "cranberry", paid: true,  paidOn: "2026-10-03", birthday: null },
  // Brittany joined Oct 8, the fifth day of week 1.
  { id: "brittany",  name: "Brittany Bialoszynski", short: "Brittany", crest: "🐿️", color: "goldenrod", paid: true,  paidOn: "2026-10-08", birthday: null, tz: "America/Phoenix" },
];
