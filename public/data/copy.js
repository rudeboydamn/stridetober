// Every user-facing joke pool and templated line. Spec: docs/PLAN.md §6.
// Rule: if a string could be a joke, it lives here so agents can add to it
// without touching views. Voice: docs/PLAN.md §6.1.

export const PHASE_LINES = {
  muster:   { kick:"OCTOBER STEPS CHALLENGE", head:"Walk it. Track it. Win it!",
              sub:"Four weeks. Twenty dollars. One champion. The leaves are watching." },
  walking:  { kick:"WEEK {n} OF 4", head:null /* from COURT_WALKING */, sub:"Every step counts. The Judge counts them." },
  counting: { kick:"THE FINAL BELL", head:"The Final Bell has rung.", sub:"The Judge is counting. The ledger is frozen-ish." },
  crowned:  { kick:"ALL RISE", head:"THE OCTOBER STEP CHAMPION", sub:"So ordered. The pot splits three ways by Venmo." },
};

export const COURT_WALKING = [ // hero line, rotates by week number
  "The leaves fall. The walkers rise.",
  "October is short. The step counts should not be.",
  "Somewhere, a couch is being defended.",
  "Week {n}. The Judge expects briskness.",
];

export const COUNTDOWN_LABELS = {
  kickoff: "until the walking begins",
  weekEnd: "until the week is called",
  due: "until screenshots are past due",
  bell: "until the Final Bell",
  counted: "the Judge is counting",
  done: "the walking is done",
};

export const DOSSIER_LINES = { // picked by rank band; {name} interpolated
  lead:    ["{name} leads. The others may appeal to their feet.",
            "First place. The Judge is *fairly* impressed."],
  chase:   ["Within striking distance. The Judge has noticed.",
            "{name} is one good weekend from making this awkward."],
  mid:     ["Mid-pack. Comfortable. Suspiciously comfortable.",
            "The Judge files {name} under 'quietly plotting'."],
  bottom:  ["The couch sends its regards.",
            "There is still time. Technically. The Judge checked the calendar."],
};

export const NO_STEPS_WEEK = "NO SCREENSHOT";   // stamp text, verbatim flyer
export const AS_COUNTED = "as last counted";    // ledger preview caption

export const LEDGER_EMPTY = {                     // before Week 1 is posted
  head: "No steps counted yet.",
  sub: "Everyone is tied at zero — the most flattering the Ledger will ever be.",
};

export const DERIVED_NOTE = {
  head: "Days measured from the chart",
  body: "This week's daily split was read off the submitted chart and scaled to the reported total. The total itself is as sworn. Days marked ~ are estimates, good to roughly ±1,000.",
};

export const TOGETHER_LINES = [ // one rotates per view
  "roughly {mi} miles of October",
  "about {marathons} marathons, if anyone's counting (the Judge is)",
  "enough to out-walk a leaf blower",
  "the length of {n} very long regrets",
  "approximately one small migration",
];

export const VERDICTS = { // Settle It, chosen by margin
  blowout: "The Judge has examined both. One of them has been walking. The other has been meaning to.",
  clear:   "The lead is real but not safe. The Judge recommends fewer stairs claimed, more stairs taken.",
  tight:   "Separated by {gap} steps — a lap around the block. The Judge leans in.",
  deadEven:"A dead heat. The Judge suggests a walk-off.",
};

export const EXCUSES = [ // pardon:true = PARDONED wax seal; otherwise OVERRULED ink slam
  { plea:"My dog ate my pedometer.", ruling:"The dog has been subpoenaed." },
  { plea:"It was raining.", ruling:"Umbrellas exist. So do hallways." },
  { plea:"I walked, I just forgot to track it.", ruling:"Untracked steps are tree-falling-in-the-forest steps." },
  { plea:"Mercury is in retrograde.", ruling:"The Court does not recognize astrology. *Fairly* firm on that." },
  { plea:"My tracker died.", ruling:"Chargers exist. The Judge is told they are inexpensive." },
  { plea:"Sunday is a day of rest.", ruling:"Not in October. October is a month of receipts." },
  { plea:"I was saving my knees.", ruling:"For what, precisely?" },
  { plea:"I did a marathon… on Netflix.", ruling:"The Court weeps. OVERRULED." },
  { plea:"I walked 10,000 steps in my heart.", ruling:"The heart does not appear on the Ledger." },
  { plea:"I take the stairs… emotionally.", ruling:"Emotional stair-climbing is not a recognized category." },
  { plea:"I rallied all weekend.", ruling:"Evidence or it didn't happen." },
  { plea:"The sidewalk was lava.", ruling:"That is fair.", pardon:true },
  { plea:"Chasing my toddler IS cardio.", ruling:"Granted. The Judge is not a monster.", pardon:true },
  { plea:"I was trick-or-treating.", ruling:"Seasonal. Accepted.", pardon:true },
  { plea:"All my steps were inside the house.", ruling:"Steps are steps. The Court is generous.", pardon:true },
  { plea:"I carried the groceries in one trip.", ruling:"Commendable. Still not a walk." },
  { plea:"My watch and I are taking a break.", ruling:"Couples counseling for you and your watch is not the Court's problem." },
  { plea:"It's too spooky out.", ruling:"Spookiness is not a defense. Especially not this week." },
  { plea:"I was pacing during a call.", ruling:"Pacing counts. Show the screenshot next time.", pardon:true },
  { plea:"Big steps run in my family.", ruling:"Then the family may also pay tribute." },
];

export const PODIUM = [ // the pot pays three places (challenge.split); medal is canon — third gets a chestnut
  { place:1, medal:"🥇", title:"THE OCTOBER STEP CHAMPION",    share:"half the pot" },
  { place:2, medal:"🥈", title:"The Runner-Up",                share:"30% of the pot" },
  { place:3, medal:"🌰", title:"Third Place, First Chestnut",  share:"20% of the pot" },
];

export const TOASTS = {
  newLeader:  "A new name at the top of the ledger. The Judge is as surprised as you are.",
  weekPosted: "Week {n} has been counted. The Ledger is updated. Adjust your stride accordingly.",
  copied:     "Copied. Go forth and summon.",
  pardoned:   "A pardon! Rare as a quiet Saturday.",
};

export const DECOY_TOASTS = [
  "NOPE. The group chat is for memes. Screenshots go to Dammy.",
  "The Judge has seen this mistake before. DIRECTLY TO DAMMY.",
  "Absolutely not. Dammy. Directly. Him.",
];

export const BOTTLE = [
  "Small sips. Big steps.",
  "Hydration is a fairly serious matter.",
  "The Judge drinks water. You should too.",
  "Eight glasses a day keeps the cramps away.",
  "Refill me, coward.",
];

export const RAKE_LINES = [ // counter line is always "Leaves raked: {n} · Steps credited: 0 · The Judge checked."
  { at:1,   note:"Rake the pile. It does nothing." },
  { at:25,  note:"The Judge is watching you rake. He is *fairly* impressed." },
  { at:100, note:"One hundred leaves. This is why you're behind." },
  { at:500, note:"Five hundred. The Judge suggests a walk instead." },
];

export const MARGIN_NOTES = [
  "suspiciously fast 👀", "walks like they're being chased", "the early bird avoids the guilt",
  "allegedly 'just errands'", "cardio? in this economy?", "the Judge has questions",
  "stretch first", "professional couch athlete — retired?",
];

export const HONOURS = [ // computed by stats.honours(); label renders on the chip
  { key:"leaf-pile",   label:"Top of the Leaf Pile",      desc:"most steps in a posted week" },
  { key:"longest",     label:"The Longest Walk",          desc:"biggest single day" },
  { key:"metronome",   label:"The Human Metronome",       desc:"smallest daily range in a full posted week" },
  { key:"weekender",   label:"The Weekender",             desc:"largest share of a week's steps on Sat + Sun" },
  { key:"second-wind", label:"The Second Wind",           desc:"biggest week-over-week gain" },
  { key:"photo-finish",label:"The Photo Finish",          desc:"won a week by the smallest margin" },
  { key:"rest-day",    label:"Court-Appointed Rest Day",  desc:"a literal zero day, owned" },
  { key:"quiet",       label:"The Quiet Achiever",        desc:"most total steps without winning a week" },
];

export const JUMP_LINES = [ // footer leaf pile, on a tap (M29)
  "Jumped in the pile. Steps credited: 0. Joy credited: considerable.",
  "The Judge saw that. The Judge has also done that.",
  "Crunch confirmed. The Ledger remains unmoved.",
  "A flawless landing. Regrettably, not cardio.",
  "Leaf pile: 1. Step count: unchanged.",
];

export const SQUIRREL_LINES = [ // the once-a-session squirrel, when tapped (M33)
  "The squirrel has been fined one acorn for jaywalking.",
  "The squirrel paid no tribute. It is walking anyway.",
  "Steps credited to the squirrel: 0. It has filed an appeal.",
  "The Judge notes the squirrel is out-walking at least one of you.",
];

export const MILESTONE_TOASTS = { // fired when an open page crosses the moment (M32)
  kickoff: "Kickoff. The couch is now the opposition.",
  bell: "The clock has struck midnight. Pens down, sneakers off.",
};
