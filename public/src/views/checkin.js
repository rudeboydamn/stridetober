// Check-in — the weekly screenshot ritual. Spec: docs/PLAN.md §5.5, adjusted to the
// locked decision in §1.2: the week ENDS Saturday night; screenshots are due Sunday.
import { parseLocal, endOfDay, weekStatus } from "../lib/time.js";
import { esc, fmtRange, pick, n } from "../lib/format.js";
import { parseSteps, weekDates, weekReport, smsHref } from "../lib/report.js";
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

// The week worth reporting: the latest one that has ended, else the first.
const defaultWeek = ({ now, challenge }) =>
  [...challenge.weeks].reverse().find(w => now > endOfDay(w.end))?.n ?? 1;

const short = d => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

function sunday(ctx) {
  const wk = defaultWeek(ctx);
  const me = (() => { try { return localStorage.getItem("stridetober:me"); } catch { return null; } })();
  const who = ctx.walkers.map(w => `<option value="${esc(w.id)}"${w.id === me ? " selected" : ""}>${esc(w.name)}</option>`).join("");
  const weeks = ctx.challenge.weeks.map(w => `<option value="${w.n}"${w.n === wk ? " selected" : ""}>Week ${w.n} · ${esc(fmtRange(w.start, w.end))}</option>`).join("");
  return `
  <section class="wrap section" data-reveal>
    <div class="card card-raised sunday">
      <span class="kicker">Optional · every Sunday night</span>
      <h2 class="h2">Text the Judge your week</h2>
      <p class="sub"><b>You don't have to type any of this.</b> Send the screenshot and the Judge will figure it out. But if you'd like to save him the squinting, type your seven daily totals and he gets them ready-made. If a text and a screenshot ever disagree, the screenshot wins.</p>
      <p class="privacy">${icon("lock")}<span>Private. What you type stays on this phone until you tap send, and then it goes to the Judge alone — not the group chat, not this site, not anyone else.</span></p>
      <div class="sunday-pick">
        <label class="field"><span>Who's walking</span><select id="sunWho"><option value="">Pick your name</option>${who}</select></label>
        <label class="field"><span>Which week</span><select id="sunWeek">${weeks}</select></label>
      </div>
      <div class="sunday-days" id="sunDays"></div>
      <dl class="sunday-sum">
        <div><dt>Total steps</dt><dd class="num" id="sunTotal">—</dd></div>
        <div><dt>Avg daily</dt><dd class="num" id="sunAvg">—</dd></div>
      </dl>
      <pre class="sunday-preview" id="sunPreview" aria-live="polite"></pre>
      <div class="btn-row sunday-actions">
        <a class="btn btn-primary" id="sunSend" href="#/check-in" role="button" aria-disabled="true">Text it to the Judge</a>
        <button class="btn btn-secondary" type="button" id="sunCopy">Copy message</button>
      </div>
      <p class="caption" id="sunHint">${esc(ctx.copy.SUNDAY.need)}</p>
    </div>
  </section>`;
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
      <p>“Every Saturday night, before you go to sleep, send a picture/screenshot of your step count <strong>DIRECTLY TO THE JUDGE — NOT THE GROUP CHAT!</strong>”</p>
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
        <li>Send it straight to the Judge. That's all — he reads it and does the arithmetic. No numbers to type.</li>
      </ol>
      <h3 class="h3">What the Judge needs to see</h3>
      <ul class="needs">
        <li>The full week, Sunday through Saturday.</li>
        <li>Per-day numbers visible — the Judge reads the bars, not the headline.</li>
        <li>Sent after the week ends. A Saturday-evening screenshot is a partial week. The Judge has seen this trick before.</li>
      </ul>
      <div class="btn-row submit-actions">
        <button class="btn btn-primary" type="button" id="icsBtn">${icon("calendar")}Remind me every Sunday night</button>
        <button class="btn btn-secondary" type="button" id="decoy"><span>Post it in the group chat</span></button>
      </div>
      <span class="stamp stamp-lg submit-stamp">No screenshot = No steps!</span>
    </div>
  </section>

  ${sunday(ctx)}`;
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
      `SUMMARY:Stridetober — send the Judge your week`,
      `DESCRIPTION:Week ${w.n}: ${fmtRange(w.start, w.end)}. Screenshot all seven days and send it to the Judge. Details: https://stridetober.vercel.app/#/check-in DIRECTLY TO THE JUDGE — NOT THE GROUP CHAT!`,
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Sunday night: send the Judge your week", "TRIGGER:PT20H", "END:VALARM",   // 8 PM Sunday, local
      "END:VEVENT",
    ];
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Stridetober//Check-ins//EN", "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH", "X-WR-CALNAME:Stridetober", ...events, "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
}

function mountSunday(root, ctx) {
  const $ = id => root.querySelector(id);
  const who = $("#sunWho"), weekSel = $("#sunWeek"), grid = $("#sunDays"), send = $("#sunSend"), copy = $("#sunCopy");
  const key = () => `stridetober:sunday:${who.value || "anon"}:${weekSel.value}`;
  const week = () => ctx.challenge.weeks[weekSel.value - 1];
  const read = () => { try { return JSON.parse(localStorage.getItem(key())) || []; } catch { return []; } };
  const save = () => { try { localStorage.setItem(key(), JSON.stringify([...grid.querySelectorAll("input")].map(i => i.value))); } catch { /* private mode */ } };

  const build = () => {                                   // one field per day, Sunday first; a half-typed week survives a trip to the Health app
    const saved = read();
    grid.innerHTML = weekDates(week()).map((d, i) => `
      <label class="day-field"><span>${esc(short(d))}</span>
        <input type="text" inputmode="numeric" autocomplete="off" enterkeyhint="${i < 6 ? "next" : "done"}" placeholder="0" value="${esc(saved[i] || "")}" aria-label="${esc(short(d))} steps"></label>`).join("");
    update();
  };

  const update = () => {
    const days = [...grid.querySelectorAll("input")].map(i => parseSteps(i.value));
    grid.querySelectorAll("input").forEach((el, i) => el.toggleAttribute("aria-invalid", el.value.trim() !== "" && days[i] === null));
    const r = weekReport({ name: ctx.walkers.find(w => w.id === who.value)?.name || "", week: week(), days });
    const ready = !!r && !!who.value;
    $("#sunTotal").textContent = r ? n(r.total) : "—";
    $("#sunAvg").textContent = r ? n(r.avg) : "—";
    $("#sunPreview").textContent = r ? r.text : "";
    $("#sunPreview").hidden = !r;
    send.setAttribute("aria-disabled", String(!ready));
    copy.disabled = !ready;
    send.href = ready ? smsHref(ctx.challenge.judgePhone, r.text) : "#/check-in";
    $("#sunHint").textContent = ready ? ctx.copy.SUNDAY.hint : who.value ? ctx.copy.SUNDAY.need : "Pick your name first.";
    return r;
  };

  grid.addEventListener("input", () => { save(); update(); });
  who.addEventListener("change", () => { try { localStorage.setItem("stridetober:me", who.value); } catch { /* ignore */ } build(); });
  weekSel.addEventListener("change", build);
  send.addEventListener("click", e => { if (send.getAttribute("aria-disabled") === "true") { e.preventDefault(); toast(esc(ctx.copy.SUNDAY.need)); } });
  copy.addEventListener("click", async () => {
    const r = update();
    if (!r) return;
    try { await navigator.clipboard.writeText(r.text); toast(esc(ctx.copy.SUNDAY.copied)); }
    catch { toast("Select the message above and copy it by hand."); }
  });
  build();
}

export function mount(root, ctx) {
  reveal(root);
  mountSunday(root, ctx);
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
