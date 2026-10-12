// Court of Excuses — the cheek centerpiece. Spec: docs/PLAN.md §5.8.
import { esc, rich, n } from "../lib/format.js";
import { icon, seal, note, toast, reduced, crest } from "../lib/fx.js";

const KEY = "stridetober:pleas";
const readCount = () => { try { return +localStorage.getItem(KEY) || 0; } catch { return 0; } };
const saveCount = v => { try { localStorage.setItem(KEY, String(v)); } catch { /* private mode */ } };

const ME = "stridetober:me";
const me = () => { try { return localStorage.getItem(ME) || ""; } catch { return ""; } };

// Typed pleas, kept by /api/excuses (Neon). Everyone sees the docket.
function filing(ctx) {
  const opts = ctx.walkers.filter(w => w.paid)
    .map(w => `<option value="${w.id}"${w.id === me() ? " selected" : ""}>${w.crest} ${esc(w.short)}</option>`).join("");
  return `
  <section class="wrap section" data-reveal>
    <form class="card filing" id="filing">
      <span class="kicker">File your own excuse</span>
      <label class="field"><span>Who is pleading</span>
        <select name="walker" required><option value="">Choose yourself…</option>${opts}</select></label>
      <label class="field"><span>The excuse</span>
        <textarea name="body" maxlength="280" rows="3" required placeholder="It was raining. Inside."></textarea></label>
      <button class="btn btn-primary" type="submit">Enter it into the record</button>
    </form>
  </section>
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">The Record</h2><p class="sub">Every excuse, on file forever.</p></header>
    <ol class="record" id="record"><li class="caption">Fetching the record…</li></ol>
  </section>`;
}

const JUDGE = { id: "judge", short: "The Judge", crest: "⚖️", color: "goldenrod" };
const day = t => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Everyone sees every excuse. Whoever is picked in "Who is pleading" can edit or delete their own.
const who_ = (ctx, id) => id === "judge" ? JUDGE : ctx.walkers.find(v => v.id === id);

const entry = (ctx, x, me, open) => {
  const w = who_(ctx, x.walker);
  if (!w) return "";
  const likes = x.likes || [], comments = x.comments || [], liked = likes.includes(me);
  const thread = open ? `<div class="record-thread">
      ${comments.map(c => { const cw = who_(ctx, c.walker); return cw ? `<p class="record-comment"><b>${cw.crest} ${esc(cw.short)}</b> ${esc(c.body)}${c.walker === me ? ` <button class="textlink" type="button" data-act="uncomment" data-cid="${c.id}">Delete</button>` : ""}</p>` : ""; }).join("")}
      ${me ? `<form class="record-reply" data-act="reply"><input name="body" maxlength="280" required placeholder="Add a comment" aria-label="Add a comment"><button class="btn btn-secondary" type="submit">Post</button></form>`
           : `<p class="caption">Pick your name above to comment.</p>`}
    </div>` : "";
  return `<li class="card record-row" data-id="${x.id}">${crest(w)}<div class="record-body">
    <p class="record-plea">“${esc(x.body)}”</p>
    <p class="caption">${esc(w.short)} · ${day(x.at)}${x.edited ? " · edited" : ""}</p>
    <p class="record-actions">
      <button class="react${liked ? " is-on" : ""}" type="button" data-act="like" aria-pressed="${liked}" title="${esc(likes.map(l => who_(ctx, l)?.short).filter(Boolean).join(", "))}">${liked ? "♥" : "♡"} ${likes.length || ""}</button>
      <button class="react" type="button" data-act="thread" aria-expanded="${open}">💬 ${comments.length || ""}</button>
      <button class="react" type="button" data-act="share">↗ Share</button>
      ${x.walker === me ? `<button class="textlink" type="button" data-act="edit">Edit</button><button class="textlink" type="button" data-act="delete">Delete</button>` : ""}
    </p>
    ${thread}
  </div></li>`;
};

function mountFiling(root, ctx) {
  const list = root.querySelector("#record"), form = root.querySelector("#filing");
  if (!list) return;
  let rows = null;
  const opened = new Set();
  const swap = row => { rows = rows.map(r => r.id === row.id ? row : r); draw(); };
  const who = () => form.walker.value;
  const draw = () => {
    if (!rows) return;
    list.innerHTML = rows.map(x => entry(ctx, x, who(), opened.has(x.id))).join("") || `<li class="caption">No excuses on file. Suspicious.</li>`;
  };
  const call = (method, body) => fetch("/api/excuses", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    .then(r => r.ok ? (r.status === 204 ? null : r.json()) : Promise.reject());
  const recess = () => toast("The Court is in recess. Try again later.");

  fetch("/api/excuses").then(r => r.ok ? r.json() : Promise.reject())
    .then(r => { rows = r; draw(); })
    .catch(() => { list.innerHTML = `<li class="caption">The Court is in recess. Try again later.</li>`; });

  form.walker.addEventListener("change", () => { try { localStorage.setItem(ME, who()); } catch { /* private mode */ } draw(); });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const row = await call("POST", { walker: who(), body: form.body.value });
      try { localStorage.setItem(ME, who()); } catch { /* private mode */ }
      rows = [row, ...(rows || [])];
      draw();
      form.body.value = "";
      toast("Entered into the record.");
    } catch { recess(); }
    btn.disabled = false;
  });

  list.addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target, id = +f.closest("[data-id]").dataset.id;
    try { swap(await call("POST", { action: "comment", id, walker: who(), body: f.body.value })); } catch { recess(); }
  });

  list.addEventListener("click", async e => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const li = btn.closest("[data-id]"), id = +li.dataset.id, x = rows.find(r => r.id === id);
    const act = btn.dataset.act;
    if (act === "like") {
      if (!who()) { toast("Pick your name above to like."); form.walker.focus(); return; }
      try { swap(await call("POST", { action: "like", id, walker: who() })); } catch { recess(); }
    } else if (act === "thread") {
      opened.has(id) ? opened.delete(id) : opened.add(id); draw();
    } else if (act === "uncomment") {
      try { swap(await call("POST", { action: "uncomment", id, walker: who(), commentId: +btn.dataset.cid })); } catch { recess(); }
    } else if (act === "share") {
      const w = who_(ctx, x.walker), text = `${w.short}'s excuse, on the record at Stridetober: “${x.body}”`;
      const url = `${location.origin}/#/excuses`;
      try { if (navigator.share) await navigator.share({ title: "Court of Excuses", text, url }); else { await navigator.clipboard.writeText(`${text} ${url}`); toast("Copied. Spread the word."); } }
      catch { /* share sheet closed */ }
    } else if (act === "delete") {
      if (!confirm("Delete this excuse for good?")) return;
      try { await call("DELETE", { id, walker: who() }); rows = rows.filter(r => r.id !== id); draw(); toast("Struck from the record."); }
      catch { recess(); }
    } else if (act === "edit") {
      li.querySelector(".record-body").innerHTML = `
        <label class="field"><span>Edit your excuse</span><textarea maxlength="280" rows="3">${esc(x.body)}</textarea></label>
        <p class="record-actions"><button class="textlink" type="button" data-act="save">Save</button><button class="textlink" type="button" data-act="cancel">Cancel</button></p>`;
      li.querySelector("textarea").focus();
    } else if (act === "cancel") draw();
    else if (act === "save") {
      try {
        const row = await call("PATCH", { id, walker: who(), body: li.querySelector("textarea").value });
        rows = rows.map(r => r.id === id ? row : r); draw(); toast("Amended.");
      } catch { recess(); }
    }
  });
}

export function render(ctx) {
  const heard = readCount();
  return `
  <section class="wrap section" data-reveal>
    <div class="card card-raised bench">
      <div class="bench-top">
        <span class="bench-gavel" id="gavel">${icon("gavel")}</span>
        <p class="h3">Got an excuse? Let's hear it.</p>
      </div>
      <button class="btn btn-primary" type="button" id="plead">Plead your case</button>
      <div class="verdict" id="verdict" aria-live="polite"></div>
      <p class="caption pleas">Pleas heard: <b class="num" id="pleaCount">${n(heard)}</b></p>
      <div class="pleas-note" id="pleasNote">${heard >= 10 ? note("the Court has heard everything. Everything.") : ""}</div>
    </div>
  </section>${filing(ctx)}`;
}

export function mount(root, ctx) {
  mountFiling(root, ctx);
  const pool = ctx.copy.EXCUSES;
  const verdict = root.querySelector("#verdict"), gavel = root.querySelector("#gavel");
  const countEl = root.querySelector("#pleaCount"), noteSlot = root.querySelector("#pleasNote");
  let last = -1, timers = [];

  root.querySelector("#plead").addEventListener("click", () => {
    timers.forEach(clearTimeout);
    let i;
    do { i = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && i === last);
    last = i;
    const { plea, ruling, pardon } = pool[i];
    const quick = reduced();

    verdict.innerHTML = `<p class="plea">“${esc(plea)}”</p>`;
    const strike = () => {
      gavel.classList.remove("gavel-strike");
      void gavel.offsetWidth;
      gavel.classList.add("gavel-strike");
    };
    const rule = () => {
      verdict.insertAdjacentHTML("beforeend", `
        <div class="ruling-row">
          ${pardon ? seal("Pardoned", { size: "seal-96", cls: "stamping", label: "Pardoned" })
                   : `<span class="stamp stamp-lg slams">Overruled</span>`}
          <p class="ruling-text">${rich(ruling)}</p>
        </div>`);
      if (pardon) toast(esc(ctx.copy.TOASTS.pardoned));
    };
    if (quick) { strike(); rule(); }
    else timers = [setTimeout(strike, 450), setTimeout(rule, 700)];

    const heard = readCount() + 1;
    saveCount(heard);
    countEl.textContent = n(heard);
    if (heard === 10) { noteSlot.innerHTML = note("the Court has heard everything. Everything."); reveal(noteSlot.parentElement.parentElement); }
  });
}
