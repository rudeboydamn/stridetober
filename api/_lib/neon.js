// Neon's HTTP SQL endpoint, called with fetch so the repo stays zero-dependency.
export async function sql(query, params = []) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const host = new URL(url).hostname.replace(/^[^.]+\./, "api.");
  const res = await fetch(`https://${host}/sql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Neon-Connection-String": url },
    body: JSON.stringify({ query, params }),
  });
  if (!res.ok) throw new Error(`neon ${res.status}: ${await res.text()}`);
  return (await res.json()).rows;
}
