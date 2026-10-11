// Court of Excuses — typed pleas, kept in Neon. GET lists the latest; POST files one.
// Talks to Neon's HTTP SQL endpoint with fetch, so the repo stays zero-dependency.
import { WALKERS } from "../public/data/walkers.js";

const IDS = new Set(WALKERS.filter(w => w.paid).map(w => w.id));
const MAX = 280;

async function sql(query, params = []) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const res = await fetch(`https://${new URL(url).hostname}/sql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Neon-Connection-String": url },
    body: JSON.stringify({ query, params }),
  });
  if (!res.ok) throw new Error(`neon ${res.status}: ${await res.text()}`);
  return (await res.json()).rows;
}

let ready;
const setup = () => ready ??= sql(`CREATE TABLE IF NOT EXISTS excuses (
  id bigserial PRIMARY KEY, walker text NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`);

export default async function handler(req, res) {
  try {
    await setup();
    if (req.method === "POST") {
      const { walker, body } = req.body || {};
      const text = String(body ?? "").trim().replace(/\s+/g, " ");
      if (!IDS.has(walker) || !text || text.length > MAX) return res.status(400).json({ error: "bad plea" });
      const [row] = await sql("INSERT INTO excuses (walker, body) VALUES ($1, $2) RETURNING walker, body, created_at AS at", [walker, text]);
      return res.status(201).json(row);
    }
    if (req.method !== "GET") return res.status(405).end();
    const rows = await sql("SELECT walker, body, created_at AS at FROM excuses ORDER BY id DESC LIMIT 50");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "the Court is in recess" });
  }
}
