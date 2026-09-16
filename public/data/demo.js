// Fictional fixture — loaded ONLY with ?demo=1 (docs/PLAN.md §7.1).
// Tree-named walkers so demo screenshots are never mistaken for real standings.
// hollis is unpaid: he shows "tribute pending" on the Roll and never appears in WEEKS.
export const DEMO_WALKERS = [
  { id:"ash",    name:"Ash Alder",    short:"Ash",    crest:"🦉", color:"spruce",    paid:true,  paidOn:"2026-09-29", birthday:null },
  { id:"rowan",  name:"Rowan Birch",  short:"Rowan",  crest:"🍁", color:"cranberry", paid:true,  paidOn:"2026-09-30", birthday:null },
  { id:"hazel",  name:"Hazel Thorne", short:"Hazel",  crest:"🦊", color:"goldenrod", paid:true,  paidOn:"2026-10-01", birthday:null },
  { id:"linden", name:"Linden Marsh", short:"Linden", crest:"🐿️", color:"denim",     paid:true,  paidOn:"2026-10-02", birthday:null },
  { id:"maple",  name:"Maple Grove",  short:"Maple",  crest:"🍄", color:"fig",       paid:true,  paidOn:"2026-10-03", birthday:null },
  { id:"hollis", name:"Hollis Yew",   short:"Hollis", crest:"🦔", color:"moss",      paid:false, paidOn:null,        birthday:null },
];

export const DEMO_WEEKS = [
  { week:1, posted:"2026-10-11T19:20",
    steps:{ ash:84210, rowan:77234, hazel:90112, linden:54830, maple:null },
    days:{ ash:[9020,12110,10840,13310,9870,14200,14860],
           rowan:[11020,9800,12440,10210,8900,13120,11744],
           hazel:[12890,13110,12400,13720,12060,14910,11022],
           linden:[7810,8210,7640,8130,7990,7410,7640],
           maple:null },
    derived:[],
    judgeNote:"Hazel came out swinging. Everyone else came out walking. Maple sent no screenshot — the stamp has been applied." },
  { week:2, posted:"2026-10-18T20:02",
    steps:{ ash:88440, rowan:81102, hazel:79260, linden:61004, maple:42880 },
    days:{ ash:[12100,11890,13120,12460,11010,14260,13600],
           rowan:[11300,12044,11020,12390,10400,12510,11438],
           hazel:[11400,11320,11090,11680,11240,11800,10730],
           linden:[8410,9010,8300,9210,8604,9730,7740],
           maple:[5120,6340,5980,6110,5870,6720,6740] },
    derived:["hazel"],
    judgeNote:"Ash edged Hazel by a margin the Judge describes as 'a vigorous lunch break'. Maple's tribute finally landed; the trail noticed." },
];
