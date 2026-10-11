// Court of Excuses — typed pleas, kept in Neon. GET lists the latest; POST files one;
// PATCH edits and DELETE removes one, but only as the Strider who filed it.
import { WALKERS } from "../public/data/walkers.js";
import { sql } from "./_lib/neon.js";

const IDS = new Set(WALKERS.filter(w => w.paid).map(w => w.id));
const MAX = 280;
const clean = body => String(body ?? "").trim().replace(/\s+/g, " ");
const COLS = "id, walker, body, created_at AS at, edited_at AS edited";

let ready;
const setup = () => ready ??= sql(`CREATE TABLE IF NOT EXISTS excuses (
  id bigserial PRIMARY KEY, walker text NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`)
  .then(() => sql("ALTER TABLE excuses ADD COLUMN IF NOT EXISTS edited_at timestamptz"));

export default async function handler(req, res) {
  try {
    await setup();
    if (req.method === "POST") {
      const { walker, body } = req.body || {};
      const text = clean(body);
      if (!IDS.has(walker) || !text || text.length > MAX) return res.status(400).json({ error: "bad plea" });
      const [row] = await sql(`INSERT INTO excuses (walker, body) VALUES ($1, $2) RETURNING ${COLS}`, [walker, text]);
      return res.status(201).json(row);
    }
    if (req.method === "PATCH" || req.method === "DELETE") {
      const { id, walker, body } = req.body || {};
      if (!IDS.has(walker) || !Number.isInteger(id)) return res.status(400).json({ error: "bad request" });
      if (req.method === "DELETE") {
        const gone = await sql("DELETE FROM excuses WHERE id = $1 AND walker = $2 RETURNING id", [id, walker]);
        return gone.length ? res.status(204).end() : res.status(404).json({ error: "not yours" });
      }
      const text = clean(body);
      if (!text || text.length > MAX) return res.status(400).json({ error: "bad plea" });
      const [row] = await sql(`UPDATE excuses SET body = $3, edited_at = now() WHERE id = $1 AND walker = $2 RETURNING ${COLS}`, [id, walker, text]);
      return row ? res.status(200).json(row) : res.status(404).json({ error: "not yours" });
    }
    if (req.method !== "GET") return res.status(405).end();
    const rows = await sql(`SELECT ${COLS} FROM excuses ORDER BY id DESC LIMIT 50`);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "the Court is in recess" });
  }
}
