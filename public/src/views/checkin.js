// Check-in — the weekly screenshot ritual. Spec: docs/PLAN.md §5.5, adjusted to the
// locked decision in §1.2: the week ENDS Saturday night; screenshots are due Sunday.
import { parseLocal, endOfDay, weekStatus } from "../lib/time.js";
import { esc, fmtRange, pick } from "../lib/format.js";
import { icon, tallySvg, toast, reveal } from "../lib/fx.js";

const day = s => parseLocal(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const sameDay = (now, s) => now >= parseLocal(s) && now <= endOfDay(s);

function nodes(ctx) {
  const { now, challenge, weeks } = ctx;
  const kickState = sameDay(now, challenge.kickoff) ? "today" : now >= parseLocal(challenge.kickoff) ? "done" : "upcoming";
  const list = [{
    state: kickState, dot: kickState === "done" ? icon("check") : icon("sneaker", "icon", "0 0 64 32"),
    title: "Kickoff", meta: `${day(challenge.kickoff)} · the walking begins`,
  }];
  for (const w of challenge.weeks) {
    const status = weekStatus(w, now, weeks);
    const state = status === "posted" ? "done"
      : sameDay(now, w.due) ? "today"
      : status === "counting" ? "counting" : "upcoming";
    const dot = state === "done" ? icon("check")
      : state === "today" ? icon("candle")
      : state === "counting" ? tallySvg()
      : w.n === challenge.weeks.length ? "🎃" : String(w.n);
    list.push({
      state, dot,
      title: w.n === challenge.weeks.length ? "Final screenshots" : `Week ${w.n} screenshots`,
      meta: `${day(w.due)} · covers ${fmtRange(w.start, w.end)}${state === "today" ? " · due today" : state === "counting" ? " · the Judge is counting" : ""}`,
    });
  }
  return list;
}

export function render(ctx) {
  const tl = nodes(ctx).map(x => `
    <li class="tl-node ${x.state}">
      <span class="tl-dot" aria-hidden="true">${x.dot}</span>
      <div><p class="tl-title">${esc(x.title)}</p><p class="tl-meta">${esc(x.meta)}</p></div>
    </li>`).join("");
  return `
  <header class="wrap page-head" data-reveal>
    <span class="ribbon">Due every Sunday</span>
    <h1 class="page-title">Check-in</h1>
    <blockquote class="flyer-quote">
      <p>“Every Saturday night, before you go to sleep, send a picture/screenshot of your step count <strong>DIRECTLY TO DAMMY — NOT THE GROUP CHAT!</strong>”</p>
      <footer class="caption">— the flyer</footer>
    </blockquote>
    <p class="ruling">The Judge clarifies: Saturday night is when the week <em>ends</em>. Screenshots are due Sunday, once all seven days are in the books.</p>
  </header>

  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">Check-in dates</h2></header>
    <div class="card"><ol class="timeline horizontal" style="--nodes:5">${tl}</ol></div>
  </section>

  <section class="wrap section" data-reveal>
    <div class="card card-raised submit">
      <h2 class="h2">How to submit</h2>
      <ol class="submit-steps">
        <li>Open your step tracker.</li>
        <li>Screenshot the week — Sunday → Saturday, all seven days showing.</li>
        <li>Send it straight to Dammy on Sunday — iMessage, WhatsApp, wherever you already bother him.</li>
      </ol>
      <h3 class="h3">What the Judge needs to see</h3>
      <ul class="needs">
        <li>The full week, Sunday through Saturday.</li>
        <li>Per-day numbers visible — the Judge reads the bars, not the headline.</li>
        <li>Sent after the week ends. A Saturday-evening screenshot is a partial week. The Judge has seen this trick before.</li>
      </ul>
      <div class="btn-row submit-actions">
        <button class="btn btn-primary" type="button" id="icsBtn">${icon("calendar")}Add the check-ins to my calendar</button>
        <button class="btn btn-secondary" type="button" id="decoy"><span>Post it in the group chat</span></button>
      </div>
      <span class="stamp stamp-lg submit-stamp">No screenshot = No steps!</span>
    </div>
  </section>`;
}

const fold = line => line.length <= 72 ? line : line.match(/.{1,72}/g).join("\r\n ");

function ics(challenge, now) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const compact = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const events = challenge.weeks.flatMap(w => {
    const start = parseLocal(w.due), end = parseLocal(w.due);
    end.setDate(end.getDate() + 1);
    return [
      "BEGIN:VEVENT",
      `UID:stridetober-week-${w.n}@stridetober.vercel.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(start)}`,
      `DTEND;VALUE=DATE:${compact(end)}`,
      `SUMMARY:Stridetober check-in — screenshot to Dammy`,
      `DESCRIPTION:Week ${w.n}: ${fmtRange(w.start, w.end)}. Screenshot all seven days. DIRECTLY TO DAMMY — NOT THE GROUP CHAT!`,
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Stridetober screenshots are due today", "TRIGGER:PT10H", "END:VALARM",
      "END:VEVENT",
    ];
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Stridetober//Check-ins//EN", "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH", "X-WR-CALNAME:Stridetober", ...events, "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
}

export function mount(root, ctx) {
  reveal(root);
  root.querySelector("#icsBtn").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([ics(ctx.challenge, new Date())], { type: "text/calendar;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "stridetober-checkins.ics" });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });

  const decoy = root.querySelector("#decoy"), label = decoy.querySelector("span");
  let k = 0, reset = 0;
  decoy.addEventListener("click", () => {
    decoy.classList.remove("nope");
    void decoy.offsetWidth;
    decoy.classList.add("nope");
    label.textContent = "NOPE.";
    clearTimeout(reset);
    reset = setTimeout(() => { label.textContent = "Post it in the group chat"; }, 1500);
    toast(esc(pick(ctx.copy.DECOY_TOASTS, k++)));
  });
}
