import { supabase } from "@/integrations/supabase/client";

/**
 * Best-effort coarse geolocation (country / city / region) from the visitor's IP.
 * Tries a couple of free, CORS-enabled, key-less services. Never throws.
 */
export async function coarseGeo(): Promise<{ country?: string; city?: string; region?: string }> {
  // ipwho.is — free, CORS, no key
  try {
    const r = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(4000) });
    const j = await r.json();
    if (j && j.success !== false && j.country) {
      return { country: j.country, city: j.city, region: j.region };
    }
  } catch { /* try next */ }
  // ipapi.co fallback
  try {
    const r = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
    const j = await r.json();
    if (j && j.country_name) {
      return { country: j.country_name, city: j.city, region: j.region };
    }
  } catch { /* give up */ }
  return {};
}

/**
 * Record a PDF download (who, what, and roughly where) in Supabase.
 * Fire-and-forget — never blocks the download and never throws.
 *
 * Requires a `public.she_downloads` table:
 *   id uuid pk default gen_random_uuid(),
 *   doc_type text, doc_ref text, user_id uuid, user_email text,
 *   country text, city text, region text, created_at timestamptz default now()
 */
export async function trackDownload(opts: {
  docType: "country_report" | "whitepaper";
  docRef: string;
  userId?: string | null;
  userEmail?: string | null;
}) {
  try {
    const geo = await coarseGeo();
    const { error } = await supabase.from("she_downloads").insert({
      doc_type: opts.docType,
      doc_ref: opts.docRef,
      user_id: opts.userId ?? null,
      user_email: opts.userEmail ?? null,
      country: geo.country ?? null,
      city: geo.city ?? null,
      region: geo.region ?? null,
    });
    if (error) console.warn("download tracking not saved:", error.message);
  } catch (e) {
    console.warn("download tracking failed:", e);
  }
}
