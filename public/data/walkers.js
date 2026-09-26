// The Roll fills in as tribute lands. Schema — docs/PLAN.md §7.1:
// { id:"sam", name:"Sam Reyes", short:"Sam", crest:"🦊", color:"spruce",
//   paid:true, paidOn:"2026-09-30", birthday:null }   // "MM-DD", only if Oct 4–Oct 31
// Crests: a unique fall emoji each (PLAN §3.6). Colors: palette keys in roster order (§3.2).
// paid:false → "tribute pending" on the Roll and excluded from ALL standings/honours.
// Eight are expected; two are still unnamed — add them here as they swear in.
export const WALKERS = [
  { id: "rod",    name: "Rod Colon",     short: "Rod",    crest: "🌰", color: "cranberry", paid: true,  birthday: null },
  { id: "rod-sr", name: "Rod Colon Sr.", short: "Rod Sr", crest: "☕", color: "goldenrod", paid: true,  birthday: null },
  { id: "alicia", name: "Alicia Ramos",  short: "Alicia", crest: "🍁", color: "moss",      paid: true,  birthday: null },
  { id: "lizzie", name: "Lizzie Henry",  short: "Lizzie", crest: "🎃", color: "spruce",    paid: true,  birthday: null },
  { id: "evan",   name: "Evan Ramos",    short: "Evan",   crest: "🦊", color: "denim",     paid: false, birthday: null },
  { id: "tedi",   name: "Tedi Revenew",  short: "Tedi",   crest: "🧣", color: "fig",       paid: false, birthday: null },
];
