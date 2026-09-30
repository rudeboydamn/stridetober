// The Summons — a recruitment card built to be shared. Spec: docs/PLAN.md §5.10.
import { esc } from "../lib/format.js";
import { icon, seal, reveal, share } from "../lib/fx.js";

export function render(ctx) {
  const c = ctx.challenge;
  return `
  <header class="wrap page-head" data-reveal>
    <span class="ribbon">You are hereby invited</span>
    <h1 class="page-title">The Summons</h1>
  </header>
  <section class="wrap section" data-reveal>
    <article class="summons">
      ${seal("S", { size: "seal-96", cls: "summons-seal" })}
      <p class="kicker">October Steps Challenge</p>
      <p class="summons-mark">Stride<em>tober</em></p>
      <p class="summons-dates">OCTOBER 4TH – 31ST</p>
      <p class="summons-tag">Walk it. Track it. Win it!</p>
      <ul class="summons-terms">
        <li><b>Four weeks</b> — Sunday to Saturday, every step counts</li>
        <li><b>Weekly screenshot</b> to the Judge, due each Sunday</li>
        <li><b>Top three split the pot</b> — 50% / 30% / 20%</li>
      </ul>
      <p class="summons-count">${ctx.walkers.length ? `${ctx.walkers.length} on the Roll` : "The Roll is open"}</p>
      ${ctx.phase !== "muster" ? `<p class="summons-late">The season has begun — latecomers are welcome, but the walking will not wait for them.</p>` : ""}
      <p class="summons-hand left">More Steps, Less Stress!</p>
      <p class="summons-hand right">Same goal… healthier us!</p>
    </article>
    <div class="btn-row summons-actions">
      <button class="btn btn-primary" type="button" id="shareBtn">${icon("share")}Share the Summons</button>
      <a class="btn btn-secondary" href="#/rules">Read the Decree</a>
    </div>
  </section>`;
}

export function mount(root, ctx) {
  reveal(root);
  root.querySelector("#shareBtn").addEventListener("click", () => share({
    title: "Stridetober",
    text: "The October Steps Challenge, Oct 4 – Oct 31. Most total steps is crowned THE OCTOBER STEP CHAMPION — top three split the pot!",
    url: `${location.origin}/`,
  }, ctx.copy.TOASTS.copied));
}
