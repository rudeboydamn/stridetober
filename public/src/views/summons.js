// The Summons — a recruitment card built to be shared. Spec: docs/PLAN.md §5.10.
import { esc, n } from "../lib/format.js";
import { icon, seal, toast, reveal } from "../lib/fx.js";

export function render(ctx) {
  const c = ctx.challenge;
  const sworn = ctx.paid.length;
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
      <p class="summons-dates">OCTOBER 4TH – NOVEMBER 1ST</p>
      <p class="summons-tag">Walk it. Track it. Win it!</p>
      <ul class="summons-terms">
        <li><b>$20 buy-in</b> — Venmo @${esc(c.venmoHandle)} before Oct 4</li>
        <li><b>Weekly screenshots</b> to Dammy, due each Sunday</li>
        <li><b>Most total steps</b> takes the pot</li>
      </ul>
      <p class="summons-count">${sworn ? `${sworn} sworn · $${n(sworn * c.buyIn)} in the pot` : "The Roll is open"}</p>
      ${ctx.phase !== "muster" ? `<p class="summons-late">The season has begun — latecomers may still pay tribute, but the walking will not wait for them.</p>` : ""}
      <p class="summons-hand left">More Steps, Less Stress!</p>
      <p class="summons-hand right">Same goal… healthier us!</p>
    </article>
    <div class="btn-row summons-actions">
      <button class="btn btn-primary" type="button" id="shareBtn">${icon("share")}Share the Summons</button>
      <a class="btn btn-secondary" href="${esc(c.venmoUrl)}" target="_blank" rel="noopener">Pay the Tribute 🪙</a>
    </div>
  </section>`;
}

export function mount(root, ctx) {
  reveal(root);
  const url = `${location.origin}/`;
  const copy = () => navigator.clipboard?.writeText(url)
    .then(() => toast(esc(ctx.copy.TOASTS.copied)))
    .catch(() => toast(`Copy this link: <b>${esc(url)}</b>`))
    ?? toast(`Copy this link: <b>${esc(url)}</b>`);
  root.querySelector("#shareBtn").addEventListener("click", async () => {
    if (!navigator.share) { copy(); return; }
    try {
      await navigator.share({
        title: "Stridetober",
        text: "The October Steps Challenge. $20 to Dammy before Oct 4. Most total steps is crowned THE OCTOBER STEP CHAMPION!",
        url,
      });
    } catch (e) {
      if (e.name !== "AbortError") copy();
    }
  });
}
