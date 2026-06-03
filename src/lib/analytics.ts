import { supabase } from "@/integrations/supabase/client";
import { coarseGeo } from "@/lib/downloads";

/**
 * Lightweight, privacy-light usage analytics: one row per page view in
 * `public.she_events` (session id, optional user id, path, coarse geo).
 * Best-effort — never blocks navigation, never throws. Geo is resolved once
 * per browser session and cached to avoid hammering the IP service.
 *
 * Table:
 *   id uuid pk default gen_random_uuid(), session_id text, user_id uuid,
 *   path text, country text, city text, region text,
 *   created_at timestamptz default now()
 */
function sessionId(): string {
  try {
    let s = sessionStorage.getItem("she_sid");
    if (!s) {
      s = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
      sessionStorage.setItem("she_sid", s);
    }
    return s;
  } catch { return "anon"; }
}

let _geo: { country?: string; city?: string; region?: string } | null = null;
async function geoOnce() {
  if (_geo) return _geo;
  try {
    const cached = sessionStorage.getItem("she_geo");
    if (cached) { _geo = JSON.parse(cached); return _geo!; }
  } catch { /* ignore */ }
  _geo = await coarseGeo();
  try { sessionStorage.setItem("she_geo", JSON.stringify(_geo)); } catch { /* ignore */ }
  return _geo!;
}

let _lastPath = "";
export async function trackPageview(path: string, userId?: string | null) {
  if (path === _lastPath) return; // de-dupe repeated fires for the same route
  _lastPath = path;
  try {
    const geo = await geoOnce();
    await supabase.from("she_events").insert({
      session_id: sessionId(),
      user_id: userId ?? null,
      path,
      country: geo.country ?? null,
      city: geo.city ?? null,
      region: geo.region ?? null,
    });
  } catch { /* analytics is best-effort */ }
}
