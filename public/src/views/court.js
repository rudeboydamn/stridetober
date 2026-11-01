// The Court — home, per phase. Spec: docs/PLAN.md §5.2.
import { nextMilestone, countdownParts, parseLocal, daysTo } from "../lib/time.js";
import { n, esc, rich, fill, pick, fmtRange } from "../lib/format.js";
import { totals, together, purse } from "../lib/stats.js";
import { SPRITE, icon, seal, crest, note, countdownHTML, tickCountdown, tallySvg, reveal, burst, reduced, squirrel } from "../lib/fx.js";
import { downloadCalendar } from "../lib/calendar.js";
import { DOCKET } from "../../data/weeks.js";
import { totalsChart } from "../lib/charts.js";
import { section as checkinSection, mountSection as mountCheckin } from "./checkin.js";

const longDay = s => parseLocal(s).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

// ── hero ──────────────────────────────────────────────────
function hero(ctx) {
  const L = ctx.copy.PHASE_LINES[ctx.phase];
  const wk = ctx.week?.n ?? ctx.weeks.length;
  const head = ctx.phase === "walking" ? pick(ctx.copy.COURT_WALKING, wk - 1) : L.head;
  const muster = ctx.phase === "muster";
  return `
  <section class="hero" data-reveal>
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <span class="ribbon">${esc(fill(L.kick, { n: wk }))}</span>
        <h1 class="hero-title">${rich(head, { n: wk })}</h1>
        <p class="hero-sub">${rich(L.sub)}</p>
        ${muster ? `<p class="hero-lede">It's time to find out who has the most active feet… and who has been training professionally for the Couch Olympics.</p>
        ${note(pick(ctx.copy.MUSTER_DAYS.filter(r => r.max >= daysTo(ctx.now, parseLocal(ctx.challenge.kickoff))), 0).line, "hero-note flip")}` : ""}
        <div class="btn-row hero-cta">
          ${muster
            ? `<a class="btn btn-primary" href="#/rules">Read the Decree</a>
               <a class="btn btn-secondary" href="#/check-in">Check-in</a>`
            : `<a class="btn btn-primary" href="#/ledger">See the Ledger</a>
               <a class="btn btn-secondary" href="#/check-in">Check-in</a>`}
        </div>
      </div>
      <div class="hero-art">
        <span class="hero-sky" aria-hidden="true">
          <span class="sky-orb"><svg class="sky-moon" viewBox="0 0 24 24"><use href="${SPRITE}#moon"/></svg></span>
          <i class="sky-star"></i><i class="sky-star"></i><i class="sky-star"></i>
        </span>
        <svg class="hero-sneaker" viewBox="0 0 64 32" aria-hidden="true"><use href="${SPRITE}#sneaker"/></svg>
        <button class="bottle" type="button" aria-label="The water bottle has advice">
          <svg viewBox="0 0 36 72" aria-hidden="true"><use href="${SPRITE}#bottle"/></svg>
          <span class="bottle-label" aria-hidden="true">Small steps make big changes</span>
        </button>
        <p class="bubble-slot" role="status"></p>
      </div>
    </div>
  </section>`;
}

// ── countdown ─────────────────────────────────────────────
const CAPTIONS = {
  kickoff: (m, ctx) => `${longDay(ctx.challenge.kickoff)} · 12:00 AM, your time`,
  weekEnd: (m, ctx) => `Week ${m.week} is called ${longDay(ctx.challenge.weeks[m.week - 1].end)} at midnight`,
  due:     m => `Week ${m.week} check-ins are due tonight, 11:59 PM`,
  reveal:  () => "Noon Eastern · 11 AM Central · 10 AM Mountain · 9 AM Pacific",
  bell:    () => "Midnight at the end of Halloween · 12:00 AM, November 1st",
};

const srSentence = (p, label) => `${+p.d} days, ${+p.h} hours and ${+p.m} minutes ${label}.`;
const witching = p => p.totalMs > 0 && p.totalMs < 3_600_000;

function countdownCard(ctx) {
  const m = nextMilestone(ctx);
  const label = ctx.copy.COUNTDOWN_LABELS[m.key];
  if (!m.target) {
    return `
    <section class="wrap section" data-reveal>
      <div class="card countdown-card">
        <span class="kicker">${esc(label)}</span>
        <div class="counting-row">${tallySvg(m.key === "counted")}
          <p class="h3">${m.key === "counted" ? "Pens down. Sneakers off." : "The walking is done."}</p></div>
      </div>
    </section>`;
  }
  const p = countdownParts(ctx.now, m.target);
  return `
  <section class="wrap section" data-reveal>
    <div class="card countdown-card" id="countdown" data-key="${m.key}"${witching(p) ? " data-witching" : ""}>
      <span class="kicker">${esc(label)}</span>
      ${countdownHTML(p)}
      <p class="cd-caption">${esc(CAPTIONS[m.key](m, ctx))}</p>
      ${m.key === "due" ? `<p class="counting-row small">${tallySvg()}<span>Check-ins are coming in</span></p>` : ""}
      <p class="sr-only cd-sr">${srSentence(p, label)}</p>
    </div>
  </section>`;
}

// ── muster sections ───────────────────────────────────────
export function roll(ctx) {
  const list = [...ctx.walkers].sort((a, b) => Number(b.paid === true) - Number(a.paid === true));
  const body = list.length
    ? `<ul class="roll">${list.map((w, i) => `
        <li class="card roll-card thuds" style="--i:${i}; --c:var(--walker-${w.color})">
          <a class="roll-link" href="#/walker/${w.id}">
            ${crest(w)}
            <span class="roll-name">${esc(w.name)}</span>
            <span class="caption">${esc(ctx.copy.LORE?.[w.id]?.epithet || (w.paid ? "locked in" : "at the trailhead"))}</span>
          </a>
        </li>`).join("")}</ul>`
    : `<div class="card roll-empty">
        ${seal("", { size: "seal-96", cls: "hollow" })}
        <p class="h3">The Roll awaits its first walker.</p>
        ${note("the early bird avoids the guilt")}
      </div>`;
  return `
  <section class="wrap section" data-reveal>
    <header class="section-head">
      <h2 class="h2">The Roll</h2>
      <p class="sub">${list.length ? `${list.length} walkers. One champion. Tap a Strider to read their Chronicle.` : "Walkers appear here as they sign up."}</p>
    </header>
    ${body}
  </section>`;
}

// What the walkers are walking toward: the podium and what sits on it.
function stakes(ctx) {
  const { shares } = purse(ctx.walkers, ctx.challenge);
  const S = ctx.copy.STAKES;
  return `
  <section class="wrap section" data-reveal>
    <header class="section-head">
      <h2 class="h2">${esc(S.head)}</h2>
      <p class="sub">${esc(fill(S.sub, { n: ctx.walkers.length }))}</p>
    </header>
    <ol class="stakes">${ctx.copy.PODIUM.map((p, i) => `
      <li class="card stake stake-${p.place}" style="--i:${i}">
        <span class="stake-medal" aria-hidden="true">${p.medal}</span>
        <div>
          <p class="stake-title">${esc(p.title)}</p>
          <p class="stake-share">${esc(p.share)}</p>
        </div>
        <b class="num stake-amount">$${n(shares[i]?.amount ?? 0)}</b>
      </li>`).join("")}</ol>
    <p class="caption stake-fine">${esc(S.fine)}</p>
  </section>`;
}

// The six dates that matter, each with a teaser.
function trail(ctx) {
  const T = ctx.copy.TRAIL, c = ctx.challenge;
  const day = s => parseLocal(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const last = c.weeks.length - 1;
  const stops = [
    { date: c.kickoff, tag: T.kickoff.tag, line: T.kickoff.line, mark: icon("sneaker", "trail-mark", "0 0 64 32"), cls: "is-kick" },
    ...c.weeks.slice(0, last).map(w => ({ date: w.end, tag: `Week ${w.n} is called`, line: T.week[w.n - 1], mark: icon("leaf-maple", "trail-mark") })),
    { date: c.weeks[last].end, tag: T.eve.tag, line: T.eve.line, mark: icon("jack", "trail-mark"), cls: "is-eve" },
    { date: c.weeks[last].due, tag: T.crowning.tag, line: T.crowning.line, mark: `<span class="trail-emoji">🏆</span>`, cls: "is-finale" },
  ];
  return `
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">${esc(T.head)}</h2><p class="sub">${esc(T.sub)}</p></header>
    <ol class="trail">${stops.map((x, i) => `
      <li class="trail-stop ${x.cls || ""}" style="--i:${i}">
        <span class="trail-dot" aria-hidden="true">${x.mark}</span>
        <div class="trail-body">
          <p class="trail-date">${esc(day(x.date))}</p>
          <h3 class="h3">${esc(x.tag)}</h3>
          <p>${esc(x.line)}</p>
        </div>
      </li>`).join("")}</ol>
  </section>`;
}

function calendarCard(ctx) {
  const K = ctx.copy.CALENDAR_CARD;
  return `
  <section class="wrap section" data-reveal>
    <div class="card card-raised calendar-card">
      <span class="kicker">Mark the day</span>
      <h2 class="h2">${esc(K.head)}</h2>
      <p class="sub">${esc(K.sub)}</p>
      <div class="btn-row"><button class="btn btn-primary" type="button" id="calBtn">${icon("calendar")}${esc(K.btn)}</button></div>
    </div>
  </section>`;
}

const CHECK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>`;

function kit() {
  return `
  <section class="section" data-reveal>
    <div class="card kit">
      <span class="kicker">What you need</span>
      <h2 class="h2">The Sworn Kit</h2>
      <ul class="checks">
        <li class="check-row" style="--i:0">${CHECK}A step tracker</li>
        <li class="check-row" style="--i:1">${CHECK}Two functioning feet</li>
        <li class="check-row kit-stamp"><span class="stamp stamp-lg">NO EXCUSES</span></li>
      </ul>
    </div>
  </section>`;
}

function how() {
  const steps = [
    ["Walk", "Oct 4 – Oct 31. Every step counts."],
    ["Report", "Check in every Sunday with your week and a screenshot."],
    ["Win", "Top three split the pot — 50/30/20. Crowned November 1."],
  ];
  return `
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">How it works</h2></header>
    <ol class="how">${steps.map(([h, p], i) => `
      <li class="card how-card">
        <span class="how-n" aria-hidden="true">${i + 1}</span>
        <h3 class="h3">${h}</h3>
        <p>${p}</p>
      </li>`).join("")}
    </ol>
    <a class="textlink" href="#/rules">Read the full Decree →</a>
  </section>`;
}

function job() {
  const items = [
    ["🏆", "Who's in the lead"],
    ["🛋️", "Who has been permanently attached to the couch"],
    ["🏃", "Who's walking like they're being chased"],
    ["🧸", "Who is using this challenge to escape their children"],
    ["😲", "And who suddenly became an Olympic-level walker overnight!"],
  ];
  return `
  <section class="section" data-reveal>
    <div class="card job">
      <span class="kicker">THE JUDGE'S JOB:</span>
      <p class="job-lede">Our official Count Holder, the Judge, will keep track of everyone's numbers and let us know:</p>
      <ul class="job-list">${items.map(([e, t]) => `<li><span aria-hidden="true">${e}</span>${t}</li>`).join("")}</ul>
    </div>
  </section>`;
}

const flourish = `<p class="wrap flourish">Fall into Healthy Habits</p>`;

// ── crowned: the coronation (M24) and the paying podium ───
function coronation(ctx) {
  const champ = ctx.standings[0];
  if (!champ) return "";
  const { pot, shares } = purse(ctx.walkers, ctx.challenge);
  const step = i => {
    const r = ctx.standings[i], p = ctx.copy.PODIUM[i];
    if (!r) return "";
    const sent = ctx.challenge.payouts?.[p.place];
    return `<li class="pod pod-${p.place}" style="--c:var(--walker-${r.walker.color})">
      <div class="pod-who">
        ${i === 0 ? `<span class="pod-crown" aria-hidden="true">👑</span>` : ""}
        ${crest(r.walker, "crest-56")}
        <a class="pod-name" href="#/walker/${r.walker.id}">${esc(r.walker.short)}</a>
        <b class="num pod-total">${n(r.total)}</b>
      </div>
      <div class="pod-block">
        <span class="pod-medal" aria-hidden="true">${p.medal}</span>
        <span class="pod-place">${p.place}</span>
        <span class="pod-pay">$${n(shares[i].amount)}${sent ? " ✓" : ""}</span>
      </div>
    </li>`;
  };
  const margin = champ.total - (ctx.standings[1]?.total ?? 0);
  return `
  <section class="ceremony${ctx.crownedSeen ? " is-seen" : ""}" id="ceremony">
    <span class="spot spot-l" aria-hidden="true"></span><span class="spot spot-r" aria-hidden="true"></span>
    <span class="bulbs" aria-hidden="true"></span>
    <div class="ceremony-inner">
      <span class="cer-kick">All rise</span>
      <h1 class="cer-title">The October Step Champion</h1>
      <p class="cer-name">${esc(champ.walker.name)}</p>
      <ol class="stage">${step(1)}${step(0)}${step(2)}</ol>
      <p class="cer-line"><b class="num">${n(champ.total)}</b> steps over four weeks. Won by <b class="num">${n(margin)}</b>.</p>
      <button class="encore" id="encore" type="button">🔔 Ring the bell again</button>
    </div>
    <span class="curtain curtain-l" aria-hidden="true"></span><span class="curtain curtain-r" aria-hidden="true"></span>
  </section>
  ${hall(ctx)}
  ${field(ctx, pot, shares)}`;
}

// The plaques: the month's records, read from the posted weeks.
function hall(ctx) {
  const name = id => ctx.walkers.find(w => w.id === id);
  const weeks = ctx.weeks.flatMap(w => Object.entries(w.steps).map(([id, v]) => ({ id, v, week: w.week })));
  const days = ctx.weeks.flatMap(w => Object.entries(w.days || {}).flatMap(([id, d]) => (d || []).map(v => ({ id, v, week: w.week }))));
  const top = list => list.reduce((b, c) => (c.v > b.v ? c : b));
  const bw = top(weeks), bd = top(days);
  const plaque = (kick, x) => `<li class="plaque"><span class="kicker">${kick}</span>${crest(name(x.id))}
    <b class="num plaque-n">${n(x.v)}</b><span class="caption">${esc(name(x.id).short)} · week ${x.week}</span></li>`;
  const winners = ctx.weeks.map(w => {
    const [id] = Object.entries(w.steps).sort((a, b) => b[1] - a[1])[0];
    return `<li class="winner">${crest(name(id))}<span><b>Week ${w.week}</b>${esc(name(id).short)}</span></li>`;
  }).join("");
  return `
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">The Hall of Records</h2></header>
    <ul class="plaques">${plaque("Biggest week", bw)}${plaque("Biggest day", bd)}</ul>
    <ol class="winners">${winners}</ol>
  </section>`;
}

// Everyone else walked too: every Strider below the podium gets the Court's salute.
function field(ctx, pot, shares) {
  const rows = ctx.standings.slice(3).map(r => `
    <li class="salute" style="--c:var(--walker-${r.walker.color})">
      <span class="salute-rank">${r.rank}</span>${crest(r.walker)}
      <div class="salute-text"><a class="preview-name" href="#/walker/${r.walker.id}">${esc(r.walker.short)}</a>
      <p class="caption">${esc(ctx.copy.SALUTES[r.walker.id] || "")}</p></div>
      <b class="num">${n(r.total)}</b>
    </li>`).join("");
  const allSent = shares.every(s => ctx.challenge.payouts?.[s.place]);
  return `
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">The Whole Field</h2><p class="sub">Ten walked. Every one of them counts.</p></header>
    <ol class="salutes">${rows}</ol>
    <p class="sub payout-line">${allSent ? "The pot has been sent. The matter is settled."
      : `The $${n(pot)} pot goes out by Venmo: $${n(shares[0]?.amount ?? 0)} to the Champion, $${n(shares[1]?.amount ?? 0)} to second, $${n(shares[2]?.amount ?? 0)} to third.`}</p>
  </section>`;
}

// A short brass fanfare. Only ever after a tap: browsers refuse audio without one.
function fanfare() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ac = new AC();
  [[392, 0, .16], [392, .18, .16], [392, .36, .16], [523, .54, .36], [392, .92, .16], [523, 1.1, .16], [659, 1.28, .9]].forEach(([f, at, len]) => {
    [f, f * 1.5].forEach((hz, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
      o.type = "sawtooth"; o.frequency.value = hz;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(i ? .04 : .09, t + .03);
      g.gain.exponentialRampToValueAtTime(.001, t + len);
      o.connect(g).connect(ac.destination);
      o.start(t); o.stop(t + len + .05);
    });
  });
}

// The reveal: third, second, then the crown, then everything falls.
function ceremony(root, delay = 4300) {
  const de = document.documentElement.clientWidth;
  setTimeout(() => {
    burst({ x: de * .5, y: 220, power: 1.3 });
    setTimeout(() => burst({ x: de * .15, y: 320 }), 350);
    setTimeout(() => burst({ x: de * .85, y: 320 }), 700);
  }, reduced() ? 0 : delay);
}

// ── walking / counting / crowned sections ─────────────────
// The roll call for a week's screenshots: names only, so nobody sees a number early.
function docket(ctx) {
  if (!DOCKET || ctx.weeks.some(w => w.week === DOCKET.week)) return "";
  const got = new Set(DOCKET.in);
  const row = w => `<li class="docket-row${got.has(w.id) ? " is-in" : ""}"><span aria-hidden="true">${w.crest}</span>${esc(w.short.replace(/ [A-Z]\.$/, ""))}<b>${got.has(w.id) ? "✓" : "⏳"}</b></li>`;
  const paid = ctx.walkers.filter(w => w.paid);
  const waiting = paid.filter(w => !got.has(w.id));
  return `
  <section class="wrap section" data-reveal>
    <div class="card roll-call">
      <span class="kicker">Week ${DOCKET.week} · Screenshots</span>
      <p class="h3">${waiting.length ? `${got.size} of ${paid.length} in. Waiting on ${waiting.length}.` : "All in."}</p>
      <ul class="roll-call-list">${paid.filter(w => got.has(w.id)).map(row).join("")}${waiting.map(row).join("")}</ul>
      <p class="sub">${waiting.length ? "No numbers until every Strider is in." : "Everyone is in. The numbers land when the clock hits zero."}</p>
    </div>
  </section>`;
}

function ledgerPreview(ctx) {
  const E = ctx.copy.LEDGER_EMPTY;
  if (!ctx.weeks.length) {
    return `
    <section class="wrap section" data-reveal>
      <div class="card preview">
        <span class="kicker">The Ledger</span>
        <p class="h3">${rich(E.head)}</p>
        <p class="sub">${rich(E.sub)}</p>
      </div>
    </section>`;
  }
  const behind = ctx.week && ctx.week.n - 1 > ctx.weeks.length;
  const tag = ctx.phase === "counting" ? `through week ${ctx.weeks.length} · week ${ctx.weeks.length + 1} still rolling in` : behind ? ctx.copy.AS_COUNTED : `after week ${ctx.weeks.length}`;
  const S = ctx.standings;
  const rows = S.map((r, i) => `
    <li class="preview-row${i < 3 ? " is-podium" : ""}" style="--c:var(--walker-${r.walker.color})">
      <span class="preview-rank" aria-label="Rank ${r.rank}">${["🥇", "🥈", "🥉"][i] || r.rank}</span>
      ${crest(r.walker)}
      <a class="preview-name" href="#/walker/${r.walker.id}">${esc(r.walker.short)}</a>
      <b class="num preview-total" data-count="${r.total}">${n(r.total)}</b>
      <span class="chase">${i ? `${n(S[i - 1].total - r.total)} to pass ${esc(S[i - 1].walker.short)}` : `leads by ${n(r.total - (S[1]?.total ?? 0))}`}</span>
    </li>`).join("");
  return `
  <section class="wrap section" data-reveal>
    <div class="card preview">
      <header class="preview-head"><span class="kicker">The Chase</span><span class="caption">${esc(tag)}</span></header>
      <ol class="preview-list">${rows}</ol>
      <a class="textlink" href="#/ledger">Charts and honours →</a>
    </div>
  </section>`;
}

// The latest posted week on its own: who walked the most that week.
function weekChart(ctx) {
  const wk = ctx.weeks.at(-1);
  if (!wk) return "";
  const rows = ctx.walkers.filter(w => w.paid && wk.steps[w.id] != null)
    .map(w => ({ walker: w, total: wk.steps[w.id] })).sort((a, b) => b.total - a.total);
  const range = ctx.challenge.weeks[wk.week - 1];
  return `
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">Week ${wk.week}</h2><p class="sub">${esc(fmtRange(range.start, range.end))} · steps that week alone</p></header>
    <div class="card">${totalsChart(rows, document.documentElement.clientWidth)}</div>
  </section>`;
}

function togetherTile(ctx) {
  if (!ctx.weeks.length) return "";
  const t = together(totals(ctx.weeks));
  const line = fill(pick(ctx.copy.TOGETHER_LINES, ctx.weeks.length + 2), {
    mi: n(t.miles), marathons: t.marathons.toFixed(1), n: n(Math.max(1, Math.round(t.miles / 25))),
  });
  return `
  <section class="wrap section" data-reveal>
    <div class="card together">
      <span class="kicker">Together, the walkers have walked</span>
      <p class="together-total"><b class="num" data-count="${t.steps}">${n(t.steps)}</b> steps</p>
      <ul class="together-chips">
        <li class="chip">≈ ${n(t.miles)} miles</li>
        <li class="chip">${t.marathons.toFixed(1)} marathons</li>
      </ul>
      <p class="sub">${rich(line)}</p>
    </div>
  </section>`;
}

// ── view contract ─────────────────────────────────────────
export function render(ctx) {
  if (ctx.phase === "muster") {
    return hero(ctx) + countdownCard(ctx) + stakes(ctx) + roll(ctx) + trail(ctx) + calendarCard(ctx) + checkinSection(ctx)
      + `<div class="wrap section duo">${job()}${kit()}</div>` + how() + flourish;
  }
  if (ctx.phase === "crowned") return coronation(ctx) + weekChart(ctx) + togetherTile(ctx);
  return (ctx.phase === "counting" ? countdownCard(ctx) + hero(ctx) : hero(ctx) + countdownCard(ctx)) + docket(ctx) + ledgerPreview(ctx) + weekChart(ctx) + togetherTile(ctx) + checkinSection(ctx);
}

let squirrelTimer = 0;

export function mount(root, ctx, params = {}) {
  reveal(root);
  if (root.querySelector("#checkin")) mountCheckin(root, ctx);
  clearTimeout(squirrelTimer);
  squirrelTimer = setTimeout(() => {
    if ((location.hash.replace(/^#/, "") || "/") === "/") squirrel(ctx.copy.SQUIRREL_LINES);
  }, 18_000);
  // Coronation burst fires once per device; later views just bob (M24).
  if (ctx.phase === "crowned" && !ctx.crownedSeen) {
    try { localStorage.setItem("stridetober:crowned-seen", "1"); } catch { /* private mode */ }
    ceremony(root);
  }
  root.querySelector("#encore")?.addEventListener("click", () => {
    const stage = root.querySelector("#ceremony");
    stage.classList.add("is-seen"); void stage.offsetWidth; stage.classList.remove("is-seen");
    stage.scrollIntoView({ block: "start", behavior: "instant" });
    fanfare();
    ceremony(root);
  });
  root.querySelector("#calBtn")?.addEventListener("click", () => downloadCalendar(ctx.challenge));
  // #/check-in is the Court, scrolled to its Check-in section.
  if (params.focus) root.querySelector("#" + params.focus)?.scrollIntoView({ block: "start", behavior: "instant" });
  const bottle = root.querySelector(".bottle");
  const slot = root.querySelector(".bubble-slot");
  const lines = ctx.copy.BOTTLE;
  let i = Math.floor(Math.random() * lines.length), hide = 0;
  bottle?.addEventListener("click", () => {
    bottle.classList.add("tilt");
    setTimeout(() => bottle.classList.remove("tilt"), 300);
    slot.innerHTML = `<span class="bubble">${rich(lines[i++ % lines.length])}</span>`;
    clearTimeout(hide);
    hide = setTimeout(() => { slot.innerHTML = ""; }, 3000);
  });
}

export function tick(root, ctx) {
  const card = root.querySelector("#countdown");
  if (!card) return;
  const m = nextMilestone(ctx);
  if (!m.target || m.key !== card.dataset.key) return;
  const p = countdownParts(ctx.now, m.target);
  if (!tickCountdown(card, p)) card.querySelector(".countdown").outerHTML = countdownHTML(p);
  card.toggleAttribute("data-witching", witching(p));
  if (p.s === "00") card.querySelector(".cd-sr").textContent = srSentence(p, ctx.copy.COUNTDOWN_LABELS[m.key]);
}

