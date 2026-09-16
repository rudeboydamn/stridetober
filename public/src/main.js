// Stridetober — boot, context, router, tick. Spec: docs/PLAN.md §2.2, §5.1, §7.7.
import { CHALLENGE } from "../data/challenge.js";
import { WALKERS } from "../data/walkers.js";
import { WEEKS, ANNOUNCEMENT } from "../data/weeks.js";
import { FALL_FINDS } from "../data/finds.js";
import * as COPY from "../data/copy.js";
import { parseLocal, phaseOf, currentWeek, phaseSignature, daypart, isEve, announcementLive } from "./lib/time.js";
import { standings, honours, paidWalkers } from "./lib/stats.js";
import { esc, rich } from "./lib/format.js";
import { leaves, rake, reduced, reveal } from "./lib/fx.js";
import * as court from "./views/court.js";
import * as ledger from "./views/ledger.js";
import * as checkin from "./views/checkin.js";
import * as decree from "./views/decree.js";
import * as excuses from "./views/excuses.js";
import * as summons from "./views/summons.js";

const root = document.documentElement;
const view = document.getElementById("view");
const params = new URLSearchParams(location.search);

// ?demo=1 swaps in the fictional fixture; ?now= time-travel only works inside demo (PLAN §10.7).
const DEMO = params.get("demo") === "1";
let walkers = WALKERS, allWeeks = WEEKS;
if (DEMO) {
  const demo = await import("../data/demo.js");
  walkers = demo.DEMO_WALKERS;
  allWeeks = demo.DEMO_WEEKS;
}
const offset = DEMO && params.get("now") ? parseLocal(params.get("now")) - Date.now() : 0;
const clock = () => new Date(Date.now() + offset);

// Demo weeks carry future "posted" stamps; only count what has been posted by the (demo) clock.
const weeksAt = now => (DEMO ? allWeeks.filter(w => !w.posted || parseLocal(w.posted) <= now) : allWeeks);

let crownedSeen = false;
try { crownedSeen = localStorage.getItem("stridetober:crowned-seen") === "1"; } catch { /* private mode */ }

function buildContext(now) {
  const weeks = weeksAt(now);
  return {
    now,
    phase: phaseOf(now, CHALLENGE, weeks),
    week: currentWeek(CHALLENGE, now),
    challenge: CHALLENGE,
    walkers,
    paid: paidWalkers(walkers),
    weeks,
    standings: standings(walkers, weeks),
    prevStandings: weeks.length > 1 ? standings(walkers, weeks.slice(0, -1)) : null,
    honours: honours(walkers, weeks),
    announcement: announcementLive(ANNOUNCEMENT, now) ? ANNOUNCEMENT : null,
    copy: COPY,
    finds: FALL_FINDS,
    demo: DEMO,
  };
}

const signature = now =>
  phaseSignature({ now, challenge: CHALLENGE, weeks: weeksAt(now), crownedSeen, announcement: ANNOUNCEMENT });

// ── router ────────────────────────────────────────────────
const ROUTES = [
  { path: "/",         mod: court,    name: "court",   tab: 0, title: "" },
  { path: "/ledger",   mod: ledger,   name: "ledger",  tab: 1, title: "The Ledger" },
  { path: "/check-in", mod: checkin,  name: "checkin", tab: 2, title: "Check-in" },
  { path: "/rules",    mod: decree,   name: "decree",  tab: 3, title: "The Decree" },
  { path: "/excuses",  mod: excuses,  name: "excuses", tab: 3, title: "Court of Excuses" },
  { path: "/invite",   mod: summons,  name: "summons", tab: 3, title: "The Summons" },
];
const OFF_TRAIL = {
  name: "off-trail", tab: -1, title: "Off the trail",
  mod: {
    render: () => `<section class="wrap section"><div class="card off-trail" data-reveal>
      <h1 class="h2">Off the trail.</h1>
      <p class="sub">This path is not on the map. The Judge suggests turning back.</p>
      <a class="btn btn-primary" href="#/">Back to Court</a></div></section>`,
  },
};

const currentRoute = () => {
  const path = location.hash.replace(/^#/, "").replace(/\/+$/, "") || "/";
  return ROUTES.find(r => r.path === path) || OFF_TRAIL;
};

let ctx = null, sig = "", route = null, lastEve = null;

function applyChrome(now) {
  root.dataset.daypart = daypart(now);
  const eve = isEve(now);
  if (eve) root.dataset.eve = ""; else delete root.dataset.eve;
  if (eve !== lastEve) { lastEve = eve; leaves(document.querySelector(".leaves"), { eve }); }

  const chip = document.getElementById("phaseChip");
  chip.textContent = eve && ctx.phase === "walking" ? "Eve 🎃"
    : ctx.phase === "walking" ? `Week ${ctx.week.n}`
    : ctx.phase === "muster" ? "Muster"
    : ctx.phase === "counting" ? "Counting" : "Crowned";
  document.getElementById("demoFlag").hidden = !DEMO;

  document.title = route.title ? `${route.title} — Stridetober` : "Stridetober";
  const tabbar = document.getElementById("tabbar");
  tabbar.dataset.tab = route.tab;
  tabbar.style.setProperty("--tab", Math.max(0, route.tab));
  tabbar.querySelectorAll("a.tab").forEach(a => {
    if (+a.dataset.tab === route.tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  document.querySelectorAll(".head-link").forEach(a => {
    if (a.dataset.route === route.name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  renderAnnouncement();
}

function renderAnnouncement() {
  const slot = document.getElementById("annoSlot");
  const a = ctx.announcement;
  const key = a ? `stridetober:anno-dismissed:${a.until}|${a.title}` : "";
  let dismissed = false;
  try { dismissed = !!key && localStorage.getItem(key) === "1"; } catch { /* ignore */ }
  if (!a || a.mode !== "note" || dismissed) { slot.innerHTML = ""; return; }
  slot.innerHTML = `<aside class="card anno" aria-label="Announcement">
    <span class="kicker">${esc(a.kicker || "From the bench")}</span>
    <h2 class="h3">${rich(a.title || "")}</h2>
    ${a.lead ? `<p class="sub">${rich(a.lead)}</p>` : ""}
    <button class="anno-close" type="button" aria-label="Dismiss announcement">✕</button></aside>`;
  slot.querySelector(".anno-close").addEventListener("click", () => {
    try { localStorage.setItem(key, "1"); } catch { /* ignore */ }
    slot.innerHTML = "";
  });
}

function render({ transition = false, focus = false } = {}) {
  const now = clock();
  ctx = buildContext(now);
  sig = signature(now);
  route = currentRoute();
  const swap = () => {
    view.innerHTML = route.mod.render(ctx);
    applyChrome(now);
    if (route.mod.mount) route.mod.mount(view, ctx); else reveal(view);
  };
  if (transition) {
    try { scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch { scrollTo(0, 0); }
  }
  if (transition && document.startViewTransition && !reduced()) {
    document.startViewTransition(swap);
  } else {
    swap();
    if (transition && !reduced()) {
      view.classList.remove("view-enter");
      void view.offsetWidth;
      view.classList.add("view-enter");
    }
  }
  if (focus) view.focus({ preventScroll: true });
}

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
addEventListener("hashchange", () => { closeSheet(); render({ transition: true, focus: true }); });

setInterval(() => {
  const now = clock();
  if (signature(now) !== sig) { render(); return; }
  root.dataset.daypart = daypart(now);
  route.mod.tick?.(view, { ...ctx, now });
}, 1000);

// ── More sheet ────────────────────────────────────────────
const sheet = document.getElementById("sheet"), scrim = document.getElementById("scrim"), moreTab = document.getElementById("moreTab");
let sheetOpen = false, lastFocus = null;

function setSheet(open) {
  sheetOpen = open;
  sheet.hidden = false;
  scrim.hidden = false;
  void sheet.offsetWidth;                                 // reflow, then toggle (no rAF: backgrounded tabs never fire it)
  sheet.classList.toggle("open", open);
  scrim.classList.toggle("open", open);
  moreTab.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("locked", open);
  if (open) {
    lastFocus = document.activeElement;
    sheet.querySelector("a, button")?.focus();
  } else {
    setTimeout(() => { if (!sheetOpen) { sheet.hidden = true; scrim.hidden = true; } }, 340);
    lastFocus?.focus?.({ preventScroll: true });
  }
}
function closeSheet() { if (sheetOpen) setSheet(false); }

moreTab.addEventListener("click", () => setSheet(!sheetOpen));
scrim.addEventListener("click", closeSheet);
addEventListener("keydown", e => {
  if (!sheetOpen) return;
  if (e.key === "Escape") { closeSheet(); return; }
  if (e.key !== "Tab") return;
  const f = [...sheet.querySelectorAll("a, button")];
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
  else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
});

// Theme: Auto → Dark → Light, remembered per device.
const THEMES = ["auto", "dark", "light"];
const themeVal = document.getElementById("themeVal");
const readTheme = () => root.dataset.theme || "auto";
const showTheme = () => { const t = readTheme(); themeVal.textContent = t[0].toUpperCase() + t.slice(1); };
document.getElementById("themeRow").addEventListener("click", () => {
  const next = THEMES[(THEMES.indexOf(readTheme()) + 1) % THEMES.length];
  if (next === "auto") delete root.dataset.theme; else root.dataset.theme = next;
  try { next === "auto" ? localStorage.removeItem("stridetober:theme") : localStorage.setItem("stridetober:theme", next); } catch { /* ignore */ }
  showTheme();
});
showTheme();

// ── header auto-hide (M16) ────────────────────────────────
{
  const head = document.getElementById("siteHead");
  let lastY = 0, ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.max(0, scrollY);
      if (y > 120 && y > lastY + 5) head.classList.add("is-hidden");
      else if (y < lastY - 5 || y < 120) head.classList.remove("is-hidden");
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
  head.addEventListener("focusin", () => head.classList.remove("is-hidden"));
}

// ── small cheek ───────────────────────────────────────────
{
  let saved = document.title;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { saved = document.title; document.title = "🍂 Come back and walk"; }
    else document.title = saved;
  });
  console.log("%c⚖️ The Fairly Impartial Judge sees you reading the source. Go walk.", "font: 600 14px Georgia, serif; color: #A6420E");
}

rake(document.getElementById("leafPile"), document.getElementById("rakeLine"), COPY.RAKE_LINES);
render();
