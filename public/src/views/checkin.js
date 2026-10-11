// Check-in — the weekly screenshot ritual. Spec: docs/PLAN.md §5.5, adjusted to the
// locked decision in §1.2: the week ENDS Saturday night; screenshots are due Sunday.
import { parseLocal, endOfDay, weekStatus } from "../lib/time.js";
import { esc, fmtRange, n } from "../lib/format.js";
import { parseSteps, weekDates, weekReport, totalReport, smsHref } from "../lib/report.js";
import { downloadCalendar } from "../lib/calendar.js";
import { icon, tallySvg, toast } from "../lib/fx.js";

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

// The Check-in section of the Court (#/check-in is the Court, scrolled here): the dates,
// then one form — seven days in, a text to the Judge out. Every send is filed (/api/checkins).
export function section(ctx) {
  const tl = nodes(ctx).map(x => `
    <li class="tl-node ${x.state}">
      <span class="tl-dot" aria-hidden="true">${x.dot}</span>
      <div><p class="tl-title">${esc(x.title)}</p><p class="tl-meta">${esc(x.meta)}</p></div>
    </li>`).join("");
  const wk = defaultWeek(ctx);
  const me = (() => { try { return localStorage.getItem("stridetober:me"); } catch { return null; } })();
  const who = ctx.walkers.map(w => `<option value="${esc(w.id)}"${w.id === me ? " selected" : ""}>${esc(w.name)}</option>`).join("");
  const weeks = ctx.challenge.weeks.map(w => `<option value="${w.n}"${w.n === wk ? " selected" : ""}>Week ${w.n} · ${esc(fmtRange(w.start, w.end))}</option>`).join("");
  return `
  <div id="checkin">
  ${ctx.phase === "muster" ? "" : `<section class="wrap section" data-reveal>
    <div class="card"><ol class="timeline horizontal" style="--nodes:5">${tl}</ol></div>
  </section>`}
  <section class="wrap section" data-reveal>
    <div class="card card-raised sunday">
      <span class="kicker">Due every Sunday</span>
      <h2 class="h2">Check-in</h2>
      <p class="sub">Enter your steps, tap Check in, and attach your screenshot to the text.</p>
      <div class="sunday-pick">
        <label class="field"><span>Who's walking</span><select id="sunWho"><option value="">Pick your name</option>${who}</select></label>
        <label class="field"><span>Which week</span><select id="sunWeek">${weeks}</select></label>
      </div>
      <div class="seg" role="radiogroup" aria-label="How to enter steps">
        <label><input type="radio" name="sunMode" value="day" checked><span>Day by day</span></label>
        <label><input type="radio" name="sunMode" value="week"><span>Week total</span></label>
      </div>
      <div class="sunday-days" id="sunDays"></div>
      <dl class="sunday-sum">
        <div><dt>Total steps</dt><dd class="num" id="sunTotal">—</dd></div>
        <div><dt>Avg daily</dt><dd class="num" id="sunAvg">—</dd></div>
      </dl>
      <div class="btn-row sunday-actions">
        <a class="btn btn-primary" id="sunSend" href="#/check-in" role="button" aria-disabled="true">Check in</a>
        <button class="btn btn-secondary" type="button" id="sunCopy">Copy message</button>
      </div>
      <p class="caption" id="sunHint">${esc(ctx.copy.SUNDAY.need)}</p>
      <button class="textlink" type="button" id="icsBtn">${icon("calendar")}Add the due dates to my calendar</button>
    </div>
  </section>
  </div>`;
}

function mountSunday(root, ctx) {
  const $ = id => root.querySelector(id);
  const who = $("#sunWho"), weekSel = $("#sunWeek"), grid = $("#sunDays"), send = $("#sunSend"), copy = $("#sunCopy");
  const key = () => `stridetober:sunday:${who.value || "anon"}:${weekSel.value}`;
  const week = () => ctx.challenge.weeks[weekSel.value - 1];
  const read = () => { try { return JSON.parse(localStorage.getItem(key())) || []; } catch { return []; } };
  const save = () => {                                    // slots 0–6 are the days, slot 7 the week total
    const v = read(), inputs = [...grid.querySelectorAll("input")];
    if (mode() === "week") v[7] = inputs[0].value; else inputs.forEach((el, i) => { v[i] = el.value; });
    try { localStorage.setItem(key(), JSON.stringify(v)); } catch { /* private mode */ }
  };

  const mode = () => root.querySelector('[name="sunMode"]:checked').value;
  const build = () => {                                   // one field per day (Sunday first) or one for the week; a half-typed week survives a trip to the Health app
    const saved = read();
    grid.classList.toggle("is-total", mode() === "week");
    grid.innerHTML = mode() === "week"
      ? `<label class="day-field"><span>Week ${week().n} total</span>
          <input type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" placeholder="0" value="${esc(saved[7] || "")}" aria-label="Week total steps"></label>`
      : weekDates(week()).map((d, i) => `
      <label class="day-field"><span>${esc(short(d))}</span>
        <input type="text" inputmode="numeric" autocomplete="off" enterkeyhint="${i < 6 ? "next" : "done"}" placeholder="0" value="${esc(saved[i] || "")}" aria-label="${esc(short(d))} steps"></label>`).join("");
    update();
  };

  const update = () => {
    const days = [...grid.querySelectorAll("input")].map(i => parseSteps(i.value));
    grid.querySelectorAll("input").forEach((el, i) => el.toggleAttribute("aria-invalid", el.value.trim() !== "" && days[i] === null));
    const name = ctx.walkers.find(w => w.id === who.value)?.name || "";
    const r = mode() === "week" ? totalReport({ name, week: week(), total: days[0] }) : weekReport({ name, week: week(), days });
    const ready = !!r && !!who.value;
    $("#sunTotal").textContent = r ? n(r.total) : "—";
    $("#sunAvg").textContent = r ? n(r.avg) : "—";
    send.setAttribute("aria-disabled", String(!ready));
    copy.disabled = !ready;
    send.href = ready ? smsHref(ctx.challenge.judgePhone, r.text) : "#/check-in";
    $("#sunHint").textContent = ready ? ctx.copy.SUNDAY.hint : !who.value ? "Pick your name first." : mode() === "week" ? "Enter your week total." : ctx.copy.SUNDAY.need;
    return r;
  };

  grid.addEventListener("input", () => { save(); update(); });
  who.addEventListener("change", () => { try { localStorage.setItem("stridetober:me", who.value); } catch { /* ignore */ } build(); });
  weekSel.addEventListener("change", build);
  root.querySelectorAll('[name="sunMode"]').forEach(el => el.addEventListener("change", build));
  send.addEventListener("click", e => {
    if (send.getAttribute("aria-disabled") === "true") { e.preventDefault(); toast(esc($("#sunHint").textContent)); return; }
    const vals = [...grid.querySelectorAll("input")].map(i => parseSteps(i.value));
    const body = mode() === "week" ? { total: vals[0] } : { days: vals };
    fetch("/api/checkins", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walker: who.value, week: +weekSel.value, ...body }) }).catch(() => {});
  });
  copy.addEventListener("click", async () => {
    const r = update();
    if (!r) return;
    try { await navigator.clipboard.writeText(r.text); toast(esc(ctx.copy.SUNDAY.copied)); }
    catch { toast("Select the message above and copy it by hand."); }
  });
  build();
}

export function mountSection(root, ctx) {
  mountSunday(root, ctx);
  root.querySelector("#icsBtn").addEventListener("click", () => downloadCalendar(ctx.challenge));
}
