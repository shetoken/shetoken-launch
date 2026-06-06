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
    `<p>The most comprehensive women's empowerment index ever published — the only one that prices period poverty, FGM, dowry violence, ` +
    `caregiver burden and digital harassment. Nine weighted pillars, one auditable score, updated annually from independent institutional data.</p>` +
    `<ul>${pillarLis}</ul>` +
    `<p><a href="/dashboard">See live scores for 105 countries</a> · <a href="/why">Why this matters</a></p>` +
    `</main></div>`;

  return template.replace(/<div id="root"><\/div>/, snapshot);
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
    `The SHE Score is a data-backed 0–100 measure of how good life is for women, built from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data and updated weekly.</p>` +
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

  // Homepage crawlability (Task 1) — independent of the country API, so it always runs.
  try {
    writeFileSync(tmplPath, homepage(template), "utf8");
    console.log("[prerender] wrote homepage snapshot → dist/index.html");
  } catch (e) {
    console.warn(`[prerender] homepage snapshot failed (${e}); leaving SPA index.html untouched`);
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
