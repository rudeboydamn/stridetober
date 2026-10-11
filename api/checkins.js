// Check-ins — every week a Strider sends from the Check-in form is filed here.
import { WALKERS } from "../public/data/walkers.js";
import { sql } from "./_lib/neon.js";

const IDS = new Set(WALKERS.filter(w => w.paid).map(w => w.id));
const whole = v => Number.isInteger(v) && v >= 0 && v <= 150_000;

let ready;
const setup = () => ready ??= sql(`CREATE TABLE IF NOT EXISTS checkins (
  id bigserial PRIMARY KEY, walker text NOT NULL, week int NOT NULL, days int[],
  total int NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { walker, week, days = null } = req.body || {};
  const byDay = Array.isArray(days) && days.length === 7 && days.every(whole);
  const total = byDay ? days.reduce((a, b) => a + b, 0) : req.body?.total;
  if (!IDS.has(walker) || ![1, 2, 3, 4].includes(week) || (days !== null && !byDay) || !Number.isInteger(total) || total < 0 || total > 1_000_000) {
    return res.status(400).json({ error: "bad check-in" });
  }
  try {
    await setup();
    await sql("INSERT INTO checkins (walker, week, days, total) VALUES ($1, $2, $3, $4)",
      [walker, week, byDay ? days : null, total]);
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "not filed" });
  }
}
