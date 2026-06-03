// Vercel Serverless Function — fetches RSS/Atom feeds saved in the admin Library
// and drops new entries into she_feed_items. Triggered by Vercel Cron (see vercel.json)
// or manually with ?secret=CRON_SECRET. Runs server-side so it isn't blocked by CORS.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const decode = (s = "") =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .trim();
const stripTags = (s = "") => decode(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
};

function parseFeed(xml) {
  const blocks = [];
  const rss = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  const atom = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const b of [...rss, ...atom]) {
    const title = stripTags(tag(b, "title"));
    // RSS <link>text</link> ; Atom <link href="..."/>
    let link = decode(tag(b, "link"));
    if (!link || link.includes("<")) {
      const href = b.match(/<link[^>]*href="([^"]+)"/i);
      link = href ? decode(href[1]) : "";
    }
    const guid = decode(tag(b, "guid") || tag(b, "id") || link || title);
    const pub = decode(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated"));
    const summary = stripTags(tag(b, "description") || tag(b, "summary") || tag(b, "content")).slice(0, 400);
    let published_at = null;
    if (pub) { const d = new Date(pub); if (!isNaN(d.getTime())) published_at = d.toISOString(); }
    if (title || link) blocks.push({ guid, title, link, summary, published_at });
  }
  return blocks.slice(0, 25);
}

export default async function handler(req, res) {
  // auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; allow ?secret= for manual runs
  const auth = req.headers.authorization || "";
  const provided = auth.replace(/^Bearer\s+/i, "") || req.query?.secret || "";
  if (CRON_SECRET && provided !== CRON_SECRET) return res.status(401).json({ error: "unauthorized" });
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: "missing SUPABASE env" });

  const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: sources, error } = await supa
    .from("she_library_items")
    .select("id, feed_url, status")
    .eq("kind", "link")
    .not("feed_url", "is", null)
    .neq("status", "archived")
    .limit(500);
  if (error) return res.status(500).json({ error: error.message });

  let fetched = 0, inserted = 0, failed = 0;
  for (const src of sources || []) {
    try {
      const r = await fetch(src.feed_url, { headers: { "User-Agent": "SHEtoken-FeedBot/1.0" } });
      if (!r.ok) { failed++; continue; }
      const xml = await r.text();
      const entries = parseFeed(xml);
      fetched += entries.length;
      if (entries.length) {
        const rows = entries.map((e) => ({ source_id: src.id, guid: e.guid, title: e.title, link: e.link, summary: e.summary, published_at: e.published_at }));
        const { error: upErr, count } = await supa
          .from("she_feed_items")
          .upsert(rows, { onConflict: "source_id,guid", ignoreDuplicates: true, count: "exact" });
        if (!upErr && count) inserted += count;
      }
      await supa.from("she_library_items").update({ last_checked: new Date().toISOString() }).eq("id", src.id);
    } catch (e) { failed++; }
  }

  return res.status(200).json({ ok: true, sources: sources?.length ?? 0, fetched, inserted, failed });
}
