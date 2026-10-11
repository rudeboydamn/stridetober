// Check-ins — every week a Strider sends from the Check-in form is filed here.
import { WALKERS } from "../public/data/walkers.js";
import { sql } from "./_lib/neon.js";

const IDS = new Set(WALKERS.filter(w => w.paid).map(w => w.id));
const whole = v => Number.isInteger(v) && v >= 0 && v <= 150_000;

let ready;
const setup = () => ready ??= sql(`CREATE TABLE IF NOT EXISTS checkins (
  id bigserial PRIMARY KEY, walker text NOT NULL, week int NOT NULL, days int[] NOT NULL,
  total int NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { walker, week, days } = req.body || {};
  if (!IDS.has(walker) || ![1, 2, 3, 4].includes(week) || !Array.isArray(days) || days.length !== 7 || !days.every(whole)) {
    return res.status(400).json({ error: "bad check-in" });
  }
  try {
    await setup();
    await sql("INSERT INTO checkins (walker, week, days, total) VALUES ($1, $2, $3, $4)",
      [walker, week, days, days.reduce((a, b) => a + b, 0)]);
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "not filed" });
  }
}
