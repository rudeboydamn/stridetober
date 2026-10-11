// The Decree — the rules, read aloud. Spec: docs/PLAN.md §5.6. Flyer phrases are verbatim (§6.2).
import { esc, fmtRange } from "../lib/format.js";
import { parseLocal } from "../lib/time.js";
import { seal } from "../lib/fx.js";

const day = s => parseLocal(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

const article = (i, title, body) => `
  <section class="wrap section" data-reveal>
    <article class="card decree-card">
      ${seal(ROMAN[i], { size: "seal-56" })}
      <div class="decree-body">
        <h2 class="h2">${title}</h2>
        ${body}
      </div>
    </article>
  </section>`;

// The Decree — now the second half of the Ledger page (#/rules is the Ledger, scrolled here).
export function section(ctx) {
  const c = ctx.challenge;
  const season = `
    <p class="decree-lead">OCTOBER 4TH – 31ST</p>
    <table class="season">
      <thead><tr><th scope="col">Week</th><th scope="col">Walk</th><th scope="col">Screenshots due</th></tr></thead>
      <tbody>${c.weeks.map(w => `<tr><td class="num">${w.n}</td><td>${fmtRange(w.start, w.end)}</td><td>${day(w.due)}</td></tr>`).join("")}</tbody>
    </table>
    <p>Weeks run Sunday to Saturday. Kickoff is October 4.</p>
    <p class="decree-quote">The challenge officially ends when the clock strikes 12:00 AM on November 1st!</p>
    <p class="ruling">That is midnight at the end of Halloween. The last steps that count are Saturday, October 31st — week 4's screenshots are due the next day.</p>`;

  const evidence = `
    <p>Check in every Sunday with your week and a screenshot.</p>
    <p><a class="textlink" href="#/check-in">How to check in →</a></p>
    <span class="stamp stamp-lg">No screenshot = No steps!</span>`;

  const reckoning = `
    <p>The person with the MOST TOTAL STEPS at the end of the challenge will be crowned… <strong class="champion-line">THE OCTOBER STEP CHAMPION!</strong></p>
    <p>The champion is named on Sunday, November 1st.</p>
    <p>The pot pays three places: <b>50%</b> to the Champion, <b>30%</b> to second, <b>20%</b> to third — a chestnut's share, but a share. Funds go out by Venmo on November 1st.</p>`;

  const fine = `
    <p class="decree-quote">No participation trophies. No sympathy points. And there will definitely be NO rounding up because you were "basically" at 10,000.</p>
    <p>Your tracker is trusted. Questions may still be asked.</p>`;


  return `
  <div id="decree">
  <header class="wrap section" data-reveal>
    <div class="section-head">
      <span class="ribbon">So ordered</span>
      <h2 class="h2">The Decree</h2>
      <p class="sub">The rules of Stridetober.</p>
    </div>
  </header>
  ${article(0, "The Season", season)}
  ${article(1, "The Evidence", evidence)}
  ${article(2, "The Reckoning", reckoning)}
  ${article(3, "The Fine Print", fine)}
  </div>`;
}

export function mountSection() {}
