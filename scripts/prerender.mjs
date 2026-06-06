/**
 * Postbuild prerender for SEO / AI crawlers.
 *
 * The app is a client-rendered SPA, so crawlers that don't run JS (most AI
 * answer engines) see only an empty <div id="root">. This script writes a
 * static dist/country/{iso}.html per country = a copy of index.html with:
 *   • country-specific <title>/description/canonical/OG
 *   • a schema.org/Dataset JSON-LD block
 *   • a real content snapshot injected into #root
 *
 * Because the app mounts with createRoot().render() (not hydrateRoot), React
 * simply clears #root and renders the live app for real users — so the
 * snapshot is crawler-only and causes no hydration mismatch.
 *
 * Vercel serves these files (cleanUrls maps /country/IND -> country/IND.html);
 * all other routes fall through to the SPA via the catch-all rewrite.
 * Never fails the build — on any error it leaves the SPA untouched.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");
const BASE = "https://www.shetoken.org";
const API = "https://api.shetoken.org/v1/wei/countries?limit=105&sort=wei_score&order=desc";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const PILLARS = [
  ["empowerment_score", "Empowerment"], ["bodily_autonomy_score", "Bodily Autonomy"],
  ["safety_justice_score", "Safety & Justice"], ["education_score", "Education"],
  ["economic_score", "Economic"], ["health_score", "Health"],
  ["dignity_welfare_score", "Dignity & Welfare"], ["digital_social_score", "Digital & Social"],
];

/* Homepage pillar copy — mirrors src/pages/Index.tsx so crawlers see the same descriptions. */
const HOME_PILLARS = [
  ["Empowerment", "15%", "Parliamentary seats, ministerial roles, legal rights, freedom of movement"],
  ["Bodily Autonomy", "15%", "Reproductive rights, child marriage, FGM, period poverty"],
  ["Safety & Justice", "14%", "DV laws, femicide, honour-based violence, legal aid, police responsiveness"],
  ["Education", "12%", "Literacy, enrollment, STEM, menstrual barriers to attendance"],
  ["Economic Inclusion", "12%", "Pay gap, formal employment, banking access, property rights"],
  ["Health & Survival", "12%", "Maternal mortality, life expectancy, anaemia, cancer screening"],
  ["Dignity & Welfare", "10%", "Widow rights, caregiver burden, food insecurity, mental health"],
  ["Digital & Social", "10%", "Online harassment, internet & mobile gender gaps"],
  ["Violence Penalty", "-10%", "Rape, acid attacks, dowry violence, femicide — subtracted from score"],
];

/* Inject a crawler-only static snapshot of the homepage into #root.
   React's createRoot().render() clears #root on mount, so real users still get the SPA. */
function homepage(template) {
  const pillarLis = HOME_PILLARS
    .map(([title, weight, desc]) => `<li><strong>${esc(title)} (${esc(weight)}):</strong> ${esc(desc)}</li>`)
    .join("");

  const snapshot =
    `<div id="root"><main style="max-width:820px;margin:40px auto;padding:0 16px;font-family:system-ui,sans-serif;line-height:1.5;color:#1e1b26">` +
    `<nav><a href="/">SHEtoken</a> · <a href="/dashboard">Live Data</a> · <a href="/why">Why $SHE</a> · <a href="/community">Community</a> · <a href="/whitepaper">Whitepaper</a></nav>` +
    `<p>World's first data-backed gender accountability token</p>` +
    `<h1>She was always the currency. We just never measured it. Until now.</h1>` +
    `<p>$SHE is tied to the SHE Score — built from UN, World Bank, WHO, UNESCO and UNODC data across 105 countries. ` +
    `When women's lives improve, the index rises. When the index rises, $SHE rises.</p>` +
    `<h2>Nine pillars. One score.</h2>` +
    `<p>A women's empowerment index that prices conditions many indices omit — period poverty, FGM, dowry violence, ` +
    `caregiver burden and digital harassment. Weighted pillars, one auditable score, published annually from independent institutional data.</p>` +
    `<ul>${pillarLis}</ul>` +
    `<p><a href="/dashboard">See live scores for 105 countries</a> · <a href="/why">Why this matters</a> · <a href="/index-landscape">The Landscape</a> · <a href="/methodology">Methodology</a></p>` +
    `<footer><p>SHE Score — the index (0–100, per country/state). $SHE — the token that tracks it. SHE Foundation — the publisher.</p>` +
    `<p>The SHE Score is an independent project and is not affiliated with, endorsed by, or derived from the UNDP/UN Women Women's Empowerment Index, the SHE Index powered by EY, or any other index referenced on this site.</p></footer>` +
    `</main></div>`;

  return template.replace(/<div id="root"><\/div>/, snapshot);
}

/* Static snapshot for /index-landscape (Task 4) — read from the shared JSON
   so it never drifts from the React page. Crawler-only; React replaces #root. */
function landscapePage(template) {
  let data;
  try { data = JSON.parse(readFileSync(resolve(ROOT, "src/data/landscape.json"), "utf8")); }
  catch (e) { console.warn(`[prerender] landscape json read failed (${e}); skipping`); return null; }

  const url = `${BASE}/index-landscape`;
  const title = "The Index Landscape — SHE Score vs. the World's Gender Indices | SHEtoken";
  const desc = "How the SHE Score relates to the world's leading gender indices — UNDP/UN Women WEI, WEF Global Gender Gap, Georgetown WPS, EIGE, OECD SIGI, IFPRI WEAI, the EY SHE Index, World Bank WBL and UNDP GII. The one difference: the SHE Score is investable.";

  const cards = data.indices.map((idx, i) =>
    `<article><h2>${i + 1}. <a href="${esc(idx.sourceUrl)}">${esc(idx.title)}</a></h2>` +
    `<p><em>${esc(idx.facts)}</em></p>` +
    `<p>${esc(idx.description)}</p>` +
    `<p><strong>How the SHE Score relates:</strong> ${esc(idx.relates)}</p>` +
    `<p>Official source: <a href="${esc(idx.sourceUrl)}">${esc(idx.sourceName)}</a></p></article>`
  ).join("");

  const rows = data.table.map((r) =>
    `<tr><td>${esc(r.index)}</td><td>${esc(r.publisher)}</td><td>${esc(r.coverage)}</td>` +
    `<td>${esc(r.frequency)}</td><td>${esc(r.investable)}</td></tr>`
  ).join("");

  const snapshot =
    `<div id="root"><main style="max-width:820px;margin:40px auto;padding:0 16px;font-family:system-ui,sans-serif;line-height:1.5;color:#1e1b26">` +
    `<nav><a href="/">SHEtoken</a> · <a href="/dashboard">Live Data</a> · <a href="/index-landscape">The Landscape</a> · <a href="/whitepaper">Whitepaper</a></nav>` +
    `<h1>The Index Landscape</h1>` +
    data.intro.map((p) => `<p>${esc(p)}</p>`).join("") +
    `<p><strong>Independence disclaimer:</strong> ${esc(data.disclaimer)}</p>` +
    cards +
    `<h2>At a glance</h2><table border="1" cellpadding="6"><thead><tr><th>Index</th><th>Publisher</th><th>Coverage</th><th>Frequency</th><th>Investable?</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<p>${esc(data.closing)}</p>` +
    `</main></div>`;

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[\s\S]*?(">)/, `$1${esc(desc)}$2`)
    .replace(/(<link rel="canonical" href=")[\s\S]*?(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[\s\S]*?(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[\s\S]*?(">)/, `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:title" content=")[\s\S]*?(">)/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[\s\S]*?(">)/, `$1${esc(desc)}$2`)
    .replace(/(<meta name="twitter:description" content=")[\s\S]*?(">)/, `$1${esc(desc)}$2`)
    .replace(/<div id="root"><\/div>/, snapshot);
}

/* Static snapshot for /methodology (Task 1 & 5) — from the shared JSON. */
function methodologyPage(template) {
  let data;
  try { data = JSON.parse(readFileSync(resolve(ROOT, "src/data/methodology.json"), "utf8")); }
  catch (e) { console.warn(`[prerender] methodology json read failed (${e}); skipping`); return null; }

  const url = `${BASE}/methodology`;
  const title = "Methodology — How the SHE Score Is Built | SHEtoken";
  const desc = "How the SHE Score is built: eight weighted pillars minus a violence penalty, normalised 0–100 from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data. Published annually, quarterly for registered governments. Independent.";

  const pillars = data.pillars.map((p) => `<li><strong>${esc(p.name)} (${esc(p.weight)}):</strong> ${esc(p.desc)}</li>`).join("");
  const sources = data.sources.map((s) => `<li>${esc(s)}</li>`).join("");
  const faq = data.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}${f.link ? ` <a href="${esc(f.link)}">${esc(f.linkText)}</a>` : ""}</p>`).join("");

  const snapshot =
    `<div id="root"><main style="max-width:820px;margin:40px auto;padding:0 16px;font-family:system-ui,sans-serif;line-height:1.5;color:#1e1b26">` +
    `<nav><a href="/">SHEtoken</a> · <a href="/dashboard">Live Data</a> · <a href="/index-landscape">The Landscape</a> · <a href="/methodology">Methodology</a> · <a href="/whitepaper">Whitepaper</a></nav>` +
    `<h1>How the SHE Score is built</h1>` +
    data.intro.map((p) => `<p>${esc(p)}</p>`).join("") +
    `<p><strong>Independence:</strong> ${esc(data.disclaimer)}</p>` +
    `<h2>The formula</h2><pre>${esc(data.formula)}</pre>` +
    `<h2>The eight pillars</h2><ul>${pillars}</ul>` +
    `<h2>Data sources</h2><ul>${sources}</ul>` +
    `<h2>How often it updates</h2><p>${esc(data.cadence)}</p>` +
    `<h2>Frequently asked</h2>${faq}` +
    `</main></div>`;

  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[\s\S]*?(">)/, `$1${esc(desc)}$2`)
    .replace(/(<link rel="canonical" href=")[\s\S]*?(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[\s\S]*?(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[\s\S]*?(">)/, `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:title" content=")[\s\S]*?(">)/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[\s\S]*?(">)/, `$1${esc(desc)}$2`)
    .replace(/(<meta name="twitter:description" content=")[\s\S]*?(">)/, `$1${esc(desc)}$2`)
    .replace(/<div id="root"><\/div>/, snapshot);
}

function pageFor(template, c) {
  const iso = c.iso_code, name = c.country, score = Number(c.wei_score ?? 0).toFixed(1);
  const url = `${BASE}/country/${iso}`;
  const title = `${name} SHE Score 2026 — ${score}/100 | SHEtoken`;
  const desc = `${name}'s SHE Score is ${score}/100 in 2026 (rank #${c.rank} of 105). Explore all 8 pillar scores, the 2015–2024 trend, and the Life Path for 100 girls in ${name}.`;

  const pillarLis = PILLARS
    .map(([k, label]) => `<li>${label}: ${Number(c[k] ?? 0).toFixed(1)}/100</li>`)
    .join("");

  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${name} — SHE Score 2026`,
    description: desc,
    url,
    variableMeasured: "SHE Score, 0–100",
    creator: { "@type": "Organization", name: "SHEtoken" },
    isAccessibleForFree: true,
    distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `https://api.shetoken.org/v1/wei/countries/${iso}` }],
  });

  const snapshot =
    `<div id="root"><main style="max-width:760px;margin:40px auto;padding:0 16px;font-family:system-ui,sans-serif;line-height:1.5;color:#1e1b26">` +
    `<nav><a href="/">SHEtoken</a> › <a href="/dashboard">Dashboard</a> › ${esc(name)}</nav>` +
    `<h1>${esc(name)} — SHE Score ${score}/100</h1>` +
    `<p>${esc(name)} (${esc(c.region)}) ranks #${c.rank} of 105 countries on the SHEtoken SHE Score, in Tier ${c.tier}. ` +
    `The SHE Score is a data-backed 0–100 measure of how good life is for women, built from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data and published annually, quarterly for registered governments.</p>` +
    `<h2>Pillar scores (0–100)</h2><ul>${pillarLis}<li>Violence penalty: ${Number(c.violence_penalty_score ?? 0).toFixed(1)}</li></ul>` +
    `<p><a href="/dashboard">Explore the live dashboard</a> · ` +
    `<a href="https://api.shetoken.org/v1/wei/countries/${iso}">Raw JSON data</a></p>` +
    `</main></div>`;

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[\s\S]*?(">)/, `$1${esc(desc)}$2`)
    .replace(/(<link rel="canonical" href=")[\s\S]*?(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[\s\S]*?(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[\s\S]*?(">)/, `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:title" content=")[\s\S]*?(">)/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[\s\S]*?(">)/, `$1${esc(desc)}$2`)
    .replace(/(<meta name="twitter:description" content=")[\s\S]*?(">)/, `$1${esc(desc)}$2`)
    .replace(/<\/head>/, `  <script type="application/ld+json">${jsonld}</script>\n</head>`)
    .replace(/<div id="root"><\/div>/, snapshot);

  return html;
}

async function main() {
  const tmplPath = resolve(DIST, "index.html");
  if (!existsSync(tmplPath)) { console.warn("[prerender] no dist/index.html — skipping"); return; }
  // Capture the raw template (empty #root) BEFORE we overwrite index.html — the
  // per-country pages reuse this in-memory copy as their template.
  const template = readFileSync(tmplPath, "utf8");

  // Static pages (Task 1 & 4) — independent of the country API, so they always run.
  try {
    writeFileSync(tmplPath, homepage(template), "utf8");
    console.log("[prerender] wrote homepage snapshot → dist/index.html");
  } catch (e) {
    console.warn(`[prerender] homepage snapshot failed (${e}); leaving SPA index.html untouched`);
  }
  try {
    const lp = landscapePage(template);
    if (lp) { writeFileSync(resolve(DIST, "index-landscape.html"), lp, "utf8"); console.log("[prerender] wrote → dist/index-landscape.html"); }
  } catch (e) {
    console.warn(`[prerender] landscape snapshot failed (${e})`);
  }
  try {
    const mp = methodologyPage(template);
    if (mp) { writeFileSync(resolve(DIST, "methodology.html"), mp, "utf8"); console.log("[prerender] wrote → dist/methodology.html"); }
  } catch (e) {
    console.warn(`[prerender] methodology snapshot failed (${e})`);
  }

  let countries = [];
  try {
    const res = await fetch(API, { signal: AbortSignal.timeout(20000) });
    const json = await res.json();
    countries = json.data ?? [];
  } catch (e) {
    console.warn(`[prerender] country fetch failed (${e}); skipping per-country prerender`);
    return;
  }
  if (!countries.length) { console.warn("[prerender] no countries returned — skipping"); return; }

  const outDir = resolve(DIST, "country");
  mkdirSync(outDir, { recursive: true });
  let n = 0;
  for (const c of countries) {
    if (!c.iso_code) continue;
    writeFileSync(resolve(outDir, `${c.iso_code}.html`), pageFor(template, c), "utf8");
    n++;
  }
  console.log(`[prerender] wrote ${n} static country pages → dist/country/*.html`);
}

main();
