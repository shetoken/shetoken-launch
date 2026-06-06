// Vercel Serverless Function — anonymous simulator engagement counter
// (Phase 3 Task 6). Records ONLY an event type + timestamp; no user, no IP,
// no per-user tracking. The client fires each event at most once per session.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EVENTS = new Set(["slider_moved", "crisis_fired"]);

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: "missing SUPABASE env" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ error: "rate limited" });

  let body = req.body;
  try { if (typeof body === "string") body = JSON.parse(body); } catch { return res.status(400).json({ error: "invalid body" }); }
  const event = body?.event;
  if (!EVENTS.has(event)) return res.status(400).json({ error: "invalid event" });

  const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  // Store no identifying data at all — just the event and time.
  await supa.from("she_sim_events").insert({ event });
  return res.status(200).json({ ok: true });
}
