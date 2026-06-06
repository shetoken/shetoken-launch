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
  ["Empowerment", "25% · LIVE", "Parliamentary seats, ministerial roles, legal rights, freedom of movement"],
  ["Education & Literacy", "20% · LIVE", "Literacy, enrollment, STEM participation, completion rates"],
  ["Economic Inclusion", "20% · LIVE", "Pay gap, formal employment, banking access, property rights"],
  ["Health & Survival", "15% · LIVE", "Maternal mortality, life expectancy, anaemia, cancer screening"],
  ["Safety (Crime Penalty)", "-20% · LIVE", "Rape, femicide, dowry violence — subtracted from the composite score"],
  ["Bodily Autonomy", "weight TBD · v3 IN VALIDATION", "Reproductive rights, child marriage, FGM, period poverty"],
  ["Dignity & Welfare", "weight TBD · v3 IN VALIDATION", "Widow rights, caregiver burden, food insecurity, mental health"],
  ["Digital & Social", "weight TBD · v3 IN VALIDATION", "Online harassment, internet & mobile gender gaps"],
  ["Safety & Justice (expanded)", "weight TBD · v3 IN VALIDATION", "Police responsiveness, legal aid, honour-based violence"],
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
    `When the index rises, token supply mechanics respond — minting to the Impact Fund on progress, burning on regression.</p>` +
    `<h2>Nine pillars. One vision. Five compute the score today.</h2>` +
    `<p>A women's empowerment index built for accountability — measuring dimensions most indices treat as footnotes, ` +
    `with a direct penalty for violence against women.</p>` +
    `<ul>${pillarLis}</ul>` +
    `<p>The SHE Score (v2) is computed from the five LIVE pillars using the published formula. The four v3 pillars ` +
    `(Bodily Autonomy, Dignity & Welfare, Digital & Social, and the expanded Safety & Justice indicators) are part of the ` +
    `full framework but do not yet affect published scores or $SHE supply mechanics.</p>` +
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
  const desc = "How the SHE Score (v2) is built: five LIVE weighted pillars (the published formula) plus four v3 pillars in validation. Normalised 0–100 from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data. Published annually, quarterly for registered governments. Independent.";

  const live = data.livePillars.map((p) => `<li><strong>${esc(p.name)} (${esc(p.weight)}, LIVE):</strong> ${esc(p.desc)}</li>`).join("");
  const v3 = data.v3Pillars.map((p) => `<li><strong>${esc(p.name)} (weight TBD on activation):</strong> indicators — ${esc(p.indicators)}; candidate source — ${esc(p.source)}; blocking gap — ${esc(p.gap)}</li>`).join("");
  const sources = data.sources.map((s) => `<li>${esc(s)}</li>`).join("");
  const faq = data.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}${f.link ? ` <a href="${esc(f.link)}">${esc(f.linkText)}</a>` : ""}</p>`).join("");

  const snapshot =
    `<div id="root"><main style="max-width:820px;margin:40px auto;padding:0 16px;font-family:system-ui,sans-serif;line-height:1.5;color:#1e1b26">` +
    `<nav><a href="/">SHEtoken</a> · <a href="/dashboard">Dashboard</a> · <a href="/index-landscape">The Landscape</a> · <a href="/methodology">Methodology</a> · <a href="/whitepaper">Whitepaper</a></nav>` +
    `<h1>How the SHE Score is built</h1>` +
    data.intro.map((p) => `<p>${esc(p)}</p>`).join("") +
    `<p><strong>Independence:</strong> ${esc(data.disclaimer)}</p>` +
    `<h2>The formula (v2 — five LIVE pillars)</h2><pre>${esc(data.formula)}</pre>` +
    `<h2>The five LIVE pillars</h2><ul>${live}</ul>` +
    `<p>${esc(data.activationDisclaimer)}</p>` +
    `<h2>v3 Expansion Pillars (in validation)</h2><ul>${v3}</ul>` +
    `<h2>Data sources</h2><ul>${sources}</ul>` +
    `<h2>How often it updates</h2><p>${esc(data.cadence)}</p>` +
    `<h2>Future research</h2><p>${esc(data.futureResearch)}</p>` +
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

/* Static snapshot for a simple route — sets unique title/desc/canonical and
   injects a real content body so crawlers never see homepage content with a
   mismatched canonical (Phase 2.1 Task 3). */
function simplePage(template, { path, title, desc, bodyHtml }) {
  const url = `${BASE}${path}`;
  const snapshot =
    `<div id="root"><main style="max-width:820px;margin:40px auto;padding:0 16px;font-family:system-ui,sans-serif;line-height:1.5;color:#1e1b26">` +
    `<nav><a href="/">SHEtoken</a> · <a href="/dashboard">Dashboard</a> · <a href="/index-landscape">The Landscape</a> · <a href="/methodology">Methodology</a> · <a href="/whitepaper">Whitepaper</a> · <a href="/community">Community</a></nav>` +
    bodyHtml +
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

function simulatorPage(template) {
  return simplePage(template, {
    path: "/simulator",
    title: "SHE Score Simulator — How It Will Work | SHEtoken",
    desc: "An interactive, illustrative simulation of how the SHE Score (v2) will drive $SHE token-supply mechanics. Simulation only — no real token exists; nothing here is an offer to sell or a solicitation to buy any asset.",
    bodyHtml:
      `<p><strong>SIMULATION — illustrative data only. No real token exists. Nothing on this page is an offer to sell or a solicitation to buy any asset.</strong></p>` +
      `<h1>How It Will Work</h1>` +
      `<p>Pre-launch — Phase 3 of 7. An interactive client-side simulation of the SHE Score (v2) and its documented token-supply mechanics.</p>` +
      `<p>Move the five LIVE pillar sliders (Empowerment, Education & Literacy, Economic Inclusion, Health & Survival, and Safety / Crime Penalty). The score recomputes from the published formula: (E×0.25)+(Ed×0.20)+(Ec×0.20)+(H×0.15)−(C×0.20). Baseline is the West Bengal worked example — 52, 67, 52, 71, 42 → 39.1.</p>` +
      `<p>Supply mechanics (illustrative): from a starting supply of 1,000,000,000 SHE, 10,000,000 SHE units are minted to the Impact Fund per point of score increase, or burned from the Reserve per point of decrease. If the Crime Penalty rises more than 15% above baseline, a DAO emergency vote opens for 72 hours (options A–D). Token quantities are shown in SHE units only and do not represent any price or monetary value. Informational only — not financial or legal advice.</p>`,
  });
}

function whyBackShePage(template) {
  return simplePage(template, {
    path: "/why-back-she",
    title: "Why Back SHE — Funders, ESG Investors & Token Participants | SHEtoken",
    desc: "Why capital should back the SHE Score: independent, continuous, comparable measurement of women's outcomes across 105 countries, with a financial instrument attached. Three audiences — funders, impact/ESG investors, and token participants (mechanics only).",
    bodyHtml:
      `<h1>Back the measurement that moves capital toward women.</h1>` +
      `<p>The SHE Score is independent, continuous, comparable measurement of women's outcomes — across 105 countries and sub-nationally.</p>` +
      `<h2>Funders & Philanthropy</h2>` +
      `<p>One grant funds the instrument that makes every program measurable. The SHE Score is the measurement layer all programs can be held to; because it is wired to a financial instrument, philanthropic capital recruits market capital behind the same outcomes.</p>` +
      `<h2>Impact & ESG Investors</h2>` +
      `<p>The metric gender-lens investing has been missing: a quantified, third-party-sourced, continuously tracked measure built from UN Women, World Bank, WHO and UNODC data. SHE Score Impact Bonds let capital take a position on a specific government's programs succeeding, with verified data deciding the outcome.</p>` +
      `<h2>Token Participants (mechanics only)</h2>` +
      `<p>When the published SHE Score rises by one point, 10,000,000 SHE units are minted to the Impact Fund; when it falls by one point, 10,000,000 units are burned from the reserve. Holders can lock SHE for a fixed term and accrue rewards from a defined pool; holders hold governance rights over Impact Fund allocations, methodology ratification and emergency protocols. Impact Bonds settle on the verified change in a jurisdiction's SHE Score.</p>` +
      `<p><strong>Risk disclosure:</strong> volatility; data lag; regulatory; early stage; oracle risk. Informational only — not financial or legal advice. The protocol is pre-launch and no token has been issued.</p>` +
      `<p>Right now, the only people financially exposed to women's progress are women. Everyone else participates morally. $SHE exists to change which side capital is on.</p>`,
  });
}

function whitepaperPage(template) {
  return simplePage(template, {
    path: "/whitepaper",
    title: "SHEtoken Whitepaper — The SHE Score & $SHE Token | SHEtoken",
    desc: "The SHEtoken whitepaper: how the SHE Score (v2) — five LIVE weighted pillars — governs $SHE token-supply mechanics, with the tier system, risk disclosures and roadmap. Independent; informational only, not financial advice.",
    bodyHtml:
      `<h1>SHEtoken Whitepaper</h1>` +
      `<p>$SHE is a data-backed token whose supply is governed by the SHE Score — an independent 0–100 measure of women's outcomes across 105 countries, built from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data.</p>` +
      `<h2>The SHE Score (v2) formula</h2>` +
      `<pre>SHE Score (v2) = (Empowerment × 0.25) + (Education & Literacy × 0.20) + (Economic Inclusion × 0.20) + (Health & Survival × 0.15) − (Safety / Crime Penalty × 0.20)</pre>` +
      `<p>Four further pillars (Bodily Autonomy, Dignity & Welfare, Digital & Social, expanded Safety & Justice) are part of the full framework but are in validation and do not yet affect published scores or $SHE supply mechanics.</p>` +
      `<h2>Supply mechanics</h2>` +
      `<p>When the score rises, $SHE is minted to the Impact Fund; when it falls, tokens are burned from reserve — 10,000,000 units per point of score change. This describes what the system does, not a price outcome.</p>` +
      `<p>Informational only — not financial, investment, or legal advice. <a href="/whitepaper">Download the full whitepaper PDF</a> from the whitepaper page.</p>`,
  });
}

function dashboardPage(template) {
  return simplePage(template, {
    path: "/dashboard",
    title: "SHE Score Dashboard — Live Scores for 105 Countries | SHEtoken",
    desc: "Explore the live SHE Score for 105 countries and Indian states: the five LIVE pillars, tier rankings, and comparison indexes — built from UN Women, World Bank, WHO and UNODC data.",
    bodyHtml:
      `<h1>SHE Score Dashboard</h1>` +
      `<p>Live SHE Score for 105 countries and Indian states. The published score (v2) is computed from five LIVE pillars: Empowerment (25%), Education & Literacy (20%), Economic Inclusion (20%), Health & Survival (15%) and Safety (Crime Penalty, −20%).</p>` +
      `<p>Browse every country's score, tier and pillar breakdown, and compare against reference indexes. <a href="/index-landscape">See how the SHE Score relates to other gender indices</a> or <a href="/methodology">read the methodology</a>.</p>`,
  });
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
  try {
    writeFileSync(resolve(DIST, "whitepaper.html"), whitepaperPage(template), "utf8");
    writeFileSync(resolve(DIST, "dashboard.html"), dashboardPage(template), "utf8");
    writeFileSync(resolve(DIST, "why-back-she.html"), whyBackShePage(template), "utf8");
    writeFileSync(resolve(DIST, "simulator.html"), simulatorPage(template), "utf8");
    console.log("[prerender] wrote → dist/whitepaper.html, dist/dashboard.html, dist/why-back-she.html, dist/simulator.html");
  } catch (e) {
    console.warn(`[prerender] whitepaper/dashboard/why-back-she snapshot failed (${e})`);
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
