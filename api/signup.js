// Vercel Serverless Function — email-capture endpoint for the segmented
// "Back the SHE Score" CTA (Phase 3 Task 3). Validates, best-effort
// rate-limits by IP, and inserts into she_signups via the service role.
// No payment, no token entitlement — just a tagged email + source page.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const LISTS = new Set(["funders", "token_interest", "registrants", "petition"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort in-memory rate limit (per warm instance): 8 requests / IP / minute.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 8;
}
const clip = (s, n) => (typeof s === "string" ? s.trim().slice(0, n) : null);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: "missing SUPABASE env" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ error: "too many requests, please try again shortly" });

  let body = req.body;
  try { if (typeof body === "string") body = JSON.parse(body); } catch { return res.status(400).json({ error: "invalid body" }); }
  body = body || {};

  const list = clip(body.list, 40);
  const email = clip(body.email, 200)?.toLowerCase();
  if (!list || !LISTS.has(list)) return res.status(400).json({ error: "invalid list" });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: "invalid email" });

  const row = {
    list,
    email,
    source_page: clip(body.source_page, 60),
    org_name: clip(body.org_name, 160),
    region: clip(body.region, 120),
    program_type: clip(body.program_type, 80),
    consent: body.consent === true,
    confirmed: false, // no email service yet — flagged for later double opt-in
  };
  // Registrants must supply org details
  if (list === "registrants" && (!row.org_name || !row.region)) {
    return res.status(400).json({ error: "organization name and country/state are required" });
  }

  const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { error } = await supa.from("she_signups").insert(row);
  if (error) { console.warn("signup insert failed", error); return res.status(500).json({ error: "could not save" }); }

  return res.status(200).json({ ok: true });
}
