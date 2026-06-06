// Vercel Serverless Function — private validation analytics (Phase 3 Task 6).
// Protected by VALIDATION_TOKEN (env var). Pass it as ?token=... or
// Authorization: Bearer <token>.
//   GET /api/validation                 -> JSON summary vs. thresholds
//   GET /api/validation?csv=signups     -> CSV of she_signups
//   GET /api/validation?csv=petition    -> CSV of she_petition (no email column)
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN = process.env.VALIDATION_TOKEN;

const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows, cols) =>
  [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n");

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: "missing SUPABASE env" });
  if (!TOKEN) return res.status(500).json({ error: "VALIDATION_TOKEN not set" });
  const provided = (req.headers.authorization || "").replace(/^Bearer\s+/i, "") || req.query?.token || "";
  if (provided !== TOKEN) return res.status(401).json({ error: "unauthorized" });

  const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const csv = req.query?.csv;

  if (csv === "signups") {
    const { data } = await supa.from("she_signups").select("created_at,list,source_page,email,org_name,region,program_type,consent,confirmed").order("created_at", { ascending: false }).limit(50000);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=signups.csv");
    return res.status(200).send(toCsv(data ?? [], ["created_at", "list", "source_page", "email", "org_name", "region", "program_type", "consent", "confirmed"]));
  }
  if (csv === "petition") {
    const { data } = await supa.from("she_petition").select("created_at,display_name,country,reason,reason_approved").order("created_at", { ascending: false }).limit(50000);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=petition.csv");
    return res.status(200).send(toCsv(data ?? [], ["created_at", "display_name", "country", "reason", "reason_approved"]));
  }

  // JSON summary
  const [{ data: signups }, { count: petitionCount }, { data: sim }] = await Promise.all([
    supa.from("she_signups").select("list,source_page,created_at").limit(50000),
    supa.from("she_petition").select("*", { count: "exact", head: true }),
    supa.from("she_sim_events").select("event").limit(100000),
  ]);

  const rows = signups ?? [];
  const byList = {}, bySource = {}, byDay = {};
  for (const r of rows) {
    byList[r.list] = (byList[r.list] || 0) + 1;
    bySource[r.source_page || "—"] = (bySource[r.source_page || "—"] || 0) + 1;
    const day = String(r.created_at).slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }
  const total = rows.length;
  const simRows = sim ?? [];
  const sliderMoved = simRows.filter((e) => e.event === "slider_moved").length;
  const crisisFired = simRows.filter((e) => e.event === "crisis_fired").length;

  return res.status(200).json({
    generated_at: new Date().toISOString(),
    totals: {
      signups_total: total,
      funders: byList.funders || 0,
      funders_pct: total ? Math.round(((byList.funders || 0) / total) * 100) : 0,
      token_interest: byList.token_interest || 0,
      registrants: byList.registrants || 0,
      petition: petitionCount ?? 0,
    },
    by_list: byList,
    by_source: bySource,
    by_day: byDay,
    simulator: { sessions_moved_slider: sliderMoved, sessions_fired_crisis: crisisFired },
    csv: { signups: "/api/validation?csv=signups&token=…", petition: "/api/validation?csv=petition&token=…" },
  });
}
