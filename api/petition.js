// Vercel Serverless Function — petition sign + signature wall (Phase 3 Task 4).
// GET  -> { count, recent: [{ display_name, country }] }  (safe columns only)
// POST -> validates, rate-limits, stores a signature (first name + last initial
//         only — full surname is never stored), and adds the email to the
//         she_signups 'petition' list. Reasons are stored unapproved (moderated).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 8;
}
const clip = (s, n) => (typeof s === "string" ? s.trim().slice(0, n) : "");
// "Jane Smith" -> "Jane S."  (full surname is discarded, never stored)
function toDisplayName(name) {
  const parts = clip(name, 80).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0];
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return `${first}${lastInitial}`;
}

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: "missing SUPABASE env" });
  const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  if (req.method === "GET") {
    const { count } = await supa.from("she_petition").select("*", { count: "exact", head: true });
    const { data } = await supa.from("she_petition").select("display_name, country").order("created_at", { ascending: false }).limit(30);
    return res.status(200).json({ count: count ?? 0, recent: data ?? [] });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ error: "too many requests, please try again shortly" });

  let body = req.body;
  try { if (typeof body === "string") body = JSON.parse(body); } catch { return res.status(400).json({ error: "invalid body" }); }
  body = body || {};

  const display_name = toDisplayName(body.name);
  const email = clip(body.email, 200).toLowerCase();
  const country = clip(body.country, 80);
  const reason = clip(body.reason, 500) || null;
  if (!display_name) return res.status(400).json({ error: "please enter your name" });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "invalid email" });
  if (!country) return res.status(400).json({ error: "please enter your country" });

  const { error } = await supa.from("she_petition").insert({
    display_name, email, country, reason, reason_approved: false, consent: body.consent === true,
  });
  if (error) { console.warn("petition insert failed", error); return res.status(500).json({ error: "could not save" }); }

  // Also add the email to the unified 'petition' list (best-effort).
  await supa.from("she_signups").insert({
    list: "petition", email, source_page: "petition", region: country, consent: body.consent === true, confirmed: false,
  }).then(() => {}, () => {});

  const { count } = await supa.from("she_petition").select("*", { count: "exact", head: true });
  const { data } = await supa.from("she_petition").select("display_name, country").order("created_at", { ascending: false }).limit(30);
  return res.status(200).json({ ok: true, count: count ?? 0, recent: data ?? [] });
}
