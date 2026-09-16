// The Decree — the rules, read aloud. Spec: docs/PLAN.md §5.6. Flyer phrases are verbatim (§6.2).
import { esc, fmtRange } from "../lib/format.js";
import { parseLocal } from "../lib/time.js";
import { seal, reveal } from "../lib/fx.js";

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

export function render(ctx) {
  const c = ctx.challenge;
  const season = `
    <p class="decree-lead">OCTOBER 4TH – NOVEMBER 1ST</p>
    <table class="season">
      <thead><tr><th scope="col">Week</th><th scope="col">Walk</th><th scope="col">Screenshots due</th></tr></thead>
      <tbody>${c.weeks.map(w => `<tr><td class="num">${w.n}</td><td>${fmtRange(w.start, w.end)}</td><td>${day(w.due)}</td></tr>`).join("")}</tbody>
    </table>
    <p>Weeks run Sunday to Saturday. Kickoff is October 4.</p>
    <p class="decree-quote">The challenge officially ends when the clock strikes 12:00 AM on November 1st!</p>`;

  const tribute = `
    <p>$20 to Dammy by Venmo before October 4th.</p>
    <div class="btn-row"><a class="btn btn-primary" href="${esc(c.venmoUrl)}" target="_blank" rel="noopener">Pay the Tribute 🪙</a></div>
    <span class="stamp stamp-lg">NO $20 = NO COMPETING!</span>`;

  const evidence = `
    <p>Send your screenshot DIRECTLY TO DAMMY — NOT THE GROUP CHAT!</p>
    <p><a class="textlink" href="#/check-in">How to check in →</a></p>
    <span class="stamp stamp-lg">No screenshot = No steps!</span>`;

  const reckoning = `
    <p>The person with the MOST TOTAL STEPS at the end of the challenge will be crowned… <strong class="champion-line">THE OCTOBER STEP CHAMPION!</strong></p>
    <p>Dammy will send the funds through Venmo to the person with the most steps on November 1st.</p>`;

  const fine = `
    <p class="decree-quote">No participation trophies. No sympathy points. And there will definitely be NO rounding up because you were "basically" at 10,000.</p>
    <p>The Judge trusts your tracker. He also, on occasion, asks questions.</p>`;

  const moving = `
    <p class="decree-lead">Lace up those sneakers and GET MOVING!!!</p>
    <ul class="moving">
      <li>Walk around the block.</li>
      <li>Walk around the house.</li>
      <li>Walk while you're on the phone.</li>
      <li>Walk when you're angry.</li>
      <li>Walk to avoid your responsibilities.</li>
    </ul>
    <p class="hand-line">Just get those steps!</p>`;

  return `
  <header class="wrap page-head" data-reveal>
    <span class="ribbon">So ordered</span>
    <h1 class="page-title">The Decree</h1>
    <p class="sub">The rules of Stridetober, read aloud by the <em>Fairly</em> Impartial Judge.</p>
  </header>
  ${article(0, "The Season", season)}
  ${article(1, "The Tribute", tribute)}
  ${article(2, "The Evidence", evidence)}
  ${article(3, "The Reckoning", reckoning)}
  ${article(4, "The Fine Print", fine)}
  ${article(5, "The Encouragement", moving)}
  <p class="wrap flourish">The Judge's word is <em>fairly</em> final.</p>
  <p class="wrap flourish small">Fall into Healthy Habits</p>`;
}

export function mount(root) {
  reveal(root);
}
