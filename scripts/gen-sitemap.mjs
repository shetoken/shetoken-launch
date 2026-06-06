/**
 * Generates public/sitemap.xml from the live country list.
 * Runs at `prebuild` so the sitemap always reflects the current countries.
 * Falls back to the static routes if the API is unreachable (never fails the build).
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const BASE = "https://www.shetoken.org";
const API = "https://api.shetoken.org/v1/wei/countries?limit=105&sort=wei_score&order=desc";
const today = new Date().toISOString().slice(0, 10);

const STATIC = [
  { loc: "/", priority: "1.0", freq: "daily" },
  { loc: "/dashboard", priority: "0.9", freq: "daily" },
  { loc: "/why-back-she", priority: "0.8", freq: "monthly" },
  { loc: "/index-landscape", priority: "0.7", freq: "monthly" },
  { loc: "/methodology", priority: "0.7", freq: "monthly" },
  { loc: "/whitepaper", priority: "0.7", freq: "monthly" },
  { loc: "/why", priority: "0.6", freq: "monthly" },
  { loc: "/safety", priority: "0.6", freq: "weekly" },
  { loc: "/community", priority: "0.5", freq: "monthly" },
  { loc: "/compare", priority: "0.6", freq: "weekly" },
];

const url = ({ loc, priority, freq }) =>
  `  <url>\n    <loc>${BASE}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

async function main() {
  let countries = [];
  try {
    const res = await fetch(API, { signal: AbortSignal.timeout(15000) });
    const json = await res.json();
    countries = (json.data ?? json ?? []).map((c) => c.iso_code).filter(Boolean);
  } catch (e) {
    console.warn(`[sitemap] country fetch failed (${e}); writing static routes only`);
  }

  const entries = [
    ...STATIC,
    ...countries.map((iso) => ({ loc: `/country/${iso}`, priority: "0.8", freq: "weekly" })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.map(url).join("\n") +
    `\n</urlset>\n`;

  const out = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "sitemap.xml");
  writeFileSync(out, xml, "utf8");
  console.log(`[sitemap] wrote ${entries.length} URLs (${countries.length} countries) → public/sitemap.xml`);
}

main();
