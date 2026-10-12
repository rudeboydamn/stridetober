// Court of Excuses — typed pleas, kept in Neon. GET lists the latest; POST files one;
// PATCH edits and DELETE removes one, but only as the Strider who filed it.
// POST { action: "like" | "comment" | "uncomment" } reacts to one: likes toggle, comments delete by their author.
import { WALKERS } from "../public/data/walkers.js";
import { sql } from "./_lib/neon.js";

const IDS = new Set([...WALKERS.filter(w => w.paid).map(w => w.id), "judge"]);   // the Judge may plead too; the form never offers him
const MAX = 280;
const clean = body => String(body ?? "").trim().replace(/\s+/g, " ");
const num = r => r && { ...r, id: Number(r.id) };   // Neon's HTTP API returns numbers as text
const COLS = "id, walker, body, created_at AS at, edited_at AS edited";

let ready;
const setup = () => ready ??= sql(`CREATE TABLE IF NOT EXISTS excuses (
  id bigserial PRIMARY KEY, walker text NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`)
  .then(() => sql("ALTER TABLE excuses ADD COLUMN IF NOT EXISTS edited_at timestamptz"))
  .then(() => sql(`CREATE TABLE IF NOT EXISTS excuse_likes (
    excuse_id bigint NOT NULL REFERENCES excuses(id) ON DELETE CASCADE, walker text NOT NULL, PRIMARY KEY (excuse_id, walker))`))
  .then(() => sql(`CREATE TABLE IF NOT EXISTS excuse_comments (
    id bigserial PRIMARY KEY, excuse_id bigint NOT NULL REFERENCES excuses(id) ON DELETE CASCADE,
    walker text NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`));

// One excuse, with who liked it and what was said under it.
async function withReactions(rows) {
  if (!rows.length) return [];
  const ids = rows.map(r => Number(r.id));
  const likes = await sql("SELECT excuse_id, walker FROM excuse_likes WHERE excuse_id = ANY($1)", [ids]);
  const comments = await sql("SELECT id, excuse_id, walker, body, created_at AS at FROM excuse_comments WHERE excuse_id = ANY($1) ORDER BY id", [ids]);
  return rows.map(r => ({ ...num(r),
    likes: likes.filter(l => +l.excuse_id === +r.id).map(l => l.walker),
    comments: comments.filter(c => +c.excuse_id === +r.id).map(c => ({ id: +c.id, walker: c.walker, body: c.body, at: c.at })) }));
}

async function react(req, res) {
  const { action, walker } = req.body, id = Number(req.body.id);
  if (!IDS.has(walker) || !Number.isInteger(id)) return res.status(400).json({ error: "bad request" });
  if (action === "like") {
    const off = await sql("DELETE FROM excuse_likes WHERE excuse_id = $1 AND walker = $2 RETURNING walker", [id, walker]);
    if (!off.length) await sql("INSERT INTO excuse_likes (excuse_id, walker) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, walker]);
  } else if (action === "comment") {
    const text = clean(req.body.body);
    if (!text || text.length > MAX) return res.status(400).json({ error: "bad comment" });
    await sql("INSERT INTO excuse_comments (excuse_id, walker, body) VALUES ($1, $2, $3)", [id, walker, text]);
  } else if (action === "uncomment") {
    await sql("DELETE FROM excuse_comments WHERE id = $1 AND walker = $2", [Number(req.body.commentId), walker]);
  } else return res.status(400).json({ error: "bad action" });
  const [row] = await withReactions(await sql(`SELECT ${COLS} FROM excuses WHERE id = $1`, [id]));
  return row ? res.status(200).json(row) : res.status(404).json({ error: "gone" });
}

export default async function handler(req, res) {
  try {
    await setup();
    if (req.method === "POST" && req.body?.action) return await react(req, res);
    if (req.method === "POST") {
      const { walker, body } = req.body || {};
      const text = clean(body);
      if (!IDS.has(walker) || !text || text.length > MAX) return res.status(400).json({ error: "bad plea" });
      const [row] = await sql(`INSERT INTO excuses (walker, body) VALUES ($1, $2) RETURNING ${COLS}`, [walker, text]);
      return res.status(201).json({ ...num(row), likes: [], comments: [] });
    }
    if (req.method === "PATCH" || req.method === "DELETE") {
      const { walker, body } = req.body || {}, id = Number(req.body?.id);
      if (!IDS.has(walker) || !Number.isInteger(id)) return res.status(400).json({ error: "bad request" });
      if (req.method === "DELETE") {
        const gone = await sql("DELETE FROM excuses WHERE id = $1 AND walker = $2 RETURNING id", [id, walker]);
        return gone.length ? res.status(204).end() : res.status(404).json({ error: "not yours" });
      }
      const text = clean(body);
      if (!text || text.length > MAX) return res.status(400).json({ error: "bad plea" });
      const [row] = await sql(`UPDATE excuses SET body = $3, edited_at = now() WHERE id = $1 AND walker = $2 RETURNING ${COLS}`, [id, walker, text]);
      return row ? res.status(200).json((await withReactions([row]))[0]) : res.status(404).json({ error: "not yours" });
    }
    if (req.method !== "GET") return res.status(405).end();
    const rows = await sql(`SELECT ${COLS} FROM excuses ORDER BY id DESC LIMIT 50`);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(await withReactions(rows));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "the Court is in recess" });
  }
}
