# SHEtoken — Master Build Prompt for Claude Code
## Four tracks, run in order: A) urgent route fixes, B) data engine v2/v3 versioning, C) Methodology Lab, D) Phase 3 completion

Work through tracks in order. Within each track, complete tasks sequentially. After each track, list files changed, show the verification output requested, and wait for my confirmation before starting the next track.

---

# TRACK A — URGENT: route staleness and dashboard fallback

**A1.** /dashboard and /community currently serve stale or duplicate homepage content. /dashboard is serving a PRE-Phase-2.1 build containing removed superlative claims, the old pillar weights, and the "$SHE rises" price claim. Find the cause: stale prerender output for those routes, stale CDN/edge cache, or SPA fallback pointing at an old index.html. Purge and redeploy so every route serves current content.

**A2.** Add a deploy-time check that FAILS the build if any route's output contains these banned strings:
- "most comprehensive women's empowerment index ever published"
- "the only one that prices"
- "When the index rises, $SHE rises"
- "updated weekly"

**A3.** The data API is broken (Track B repairs it). Until then, /dashboard must fail gracefully: a prerendered page with its own title and canonical, the leaderboard structure, and a clear "Live data temporarily unavailable — methodology and baseline data here" state linking to /methodology and the GitHub data CSVs. Change the homepage CTA from "See live scores for 105 countries" to "Explore the scores." No hanging spinners, no empty tables.

**A4.** Prerender /community with its own real content and canonical (or remove from nav until it exists).

**A5.** Unified nav on every page: SHEtoken · Dashboard · The Lab · The Landscape · Methodology · Whitepaper · Community.

**Verify:** curl output for /, /dashboard, /community showing unique content and correct canonicals, plus proof the banned-string check runs in the build.

---

# TRACK B — Data engine: versioned scoring architecture (v2 frozen, v3 shadow)

Do NOT modify scoring math in place at any step. The goal is one engine, versioned configs — the published v2 calculation must remain byte-identical.

**B1 — Diagnose before touching anything.** The data API is broken. Report: failing component, exact error, and whether the cause is an upstream source change, auth/key expiry, schema mismatch, or code defect. Propose the minimal fix. No refactoring during diagnosis. Apply the minimal fix only after reporting.

**B2 — Extract scoring definitions into versioned configs.** Refactor so the engine reads pillar definitions, indicator lists, per-indicator weights, normalization bounds (min/max per indicator), inverted-indicator flags, and the aggregation formula from config files — nothing hardcoded in logic. Create:

- `config/v2.json` — the published five-pillar methodology EXACTLY:
  - Empowerment 0.25, Education & Literacy 0.20, Economic Inclusion 0.20, Health & Survival 0.15, Safety (Crime Penalty) −0.20
  - Sub-indicator weights per the published methodology (e.g., Empowerment: parliamentary seats 30%, ministerial 20%, legal rights 25%, freedom of movement 15%, senior management 10%)
  - Inverted indicators flagged: maternal mortality, adolescent birth rate, pay gap, rape rate, DV rate, femicide rate, trafficking rate
  - `"status": "official"`, `"frozen": true`
- `config/v3.json` — the nine-pillar expansion framework: the five v2 pillars plus Bodily Autonomy, Dignity & Welfare, Digital & Social, and expanded Safety & Justice indicators. Provisional weights clearly labeled `"provisional": true`. `"status": "shadow"`.

**B3 — Regression-lock v2.** Before AND after the refactor, run the engine against the West Bengal worked example (Empowerment 52, Education 67, Economic 52, Health 71, Crime Penalty 42) and assert:
- Output = 39.1 (39.05 pre-rounding)
- Kanyashree scenario (Education 67 → 76) yields 40.9, +1.8 points, 18,000,000-unit mint

Add both as permanent automated tests in CI. If any refactor step changes any v2 output for any country, STOP and report — do not "fix" by adjusting the config.

**B4 — Shadow mode.** On every scoring run, compute v3 scores wherever indicator data exists; write to internal storage tagged `v3-shadow`. Where a v3 indicator lacks data for a country, record "insufficient data" with a coverage count (e.g., 61/105) — never impute, never silently skip. Expose v3 nowhere public except the Lab endpoints defined in Track C.

**B5 — Snapshot inputs.** Every scoring run archives its raw input dataset with timestamp, source identifiers, and config version, so any published score can be recomputed byte-for-byte. Document the recompute command in the repo README.

**B6 — API versioning.**
- `/api/v2/scores/...` — official scores. `/api/scores` aliases to v2.
- `/api/v3-preview/...` — shadow scores only; every response body includes `"version": "v3", "status": "shadow"` and per-pillar coverage counts.
- No other public surface serves v3. The dashboard consumes only the v2 endpoint.

**Verify:** B1 diagnosis report; both config files; passing regression test output; a sample response from each endpoint; the recompute documentation.

---

# TRACK C — The Methodology Lab (front end for v3 shadow scores)

Framing: the Lab is where the next version of the index is validated in public. Official numbers and Lab numbers must be impossible to confuse — by label AND by pixels.

**C1 — /lab page.** Create a prerendered page "The Methodology Lab":
- Intro: the SHE Score ships conservatively — every pillar must meet the published data standard (independent institutional source, ≥80% of scored countries, published within 2 years) before it can affect official scores. The Lab is where v3 candidates are shadow-scored in the open until they qualify.
- The full v3 shadow leaderboard, every value rendered in the distinct shadow style (see C3) under a persistent badge: "SHADOW — v3 in validation · does not affect published scores or $SHE supply mechanics"
- Per-pillar activation tracker: for each v3 pillar, candidate indicators, candidate data sources, current coverage (e.g., "Bodily Autonomy — 61/105 countries · BLOCKED: no institutional dataset for period poverty; candidate: UNICEF/WHO JMP menstrual health module"), and status (Gathering data / In validation / Ready for governance vote)
- Where data is insufficient, show "insufficient data — N/105" — the gaps are the proof the standard is real
- Add "The Lab" to the unified nav

**C2 — Country page v3 Preview panel.** On each country page, a visually separated panel: official v2 score prominent; v3 shadow score beside it in shadow style with per-pillar divergence ("v3 scores this country 2.3 lower, driven by Digital & Social"); the persistent shadow badge; a link to /lab.

**C3 — Visual asymmetry rules (enforce in components, not just copy):**
- v3 values render in a distinct outlined/ghosted style, never the same fill/weight as v2 values
- v3 values never appear in the same chart series, table column, or component as v2 without the shadow badge
- v3 values NEVER appear on /why-back-she, /simulator, or any page describing token mechanics
- No screenshot of the main dashboard or leaderboard can contain a v3 number

**C4 — Lab data plumbing.** /lab and the country panels consume only `/api/v3-preview/...`. If the endpoint is unavailable, the Lab shows its own graceful "shadow data unavailable" state — it must never fall back to v2 data.

**Verify:** curl output for /lab; a country page showing the v2/v3 panel; confirmation that searching the built output for v3 values finds them only on /lab and country preview panels.

---

# TRACK D — Phase 3 completion check

Confirm every item from the Phase 3 prompt is deployed and live; complete any that are not:

**D1.** /why-back-she — three audience sections; Token Participants section contains mechanics only (verify against the banned-words rule: no "invest," "returns," "profit," "upside," "opportunity" in that section).
**D2.** /simulator — West Bengal baseline 39.1, live recompute on the v2 formula, ±10M units/point supply counter from 1,000,000,000, Crisis Trigger at +15% crime increase, presets (Kanyashree: +1.8 / 18M mint), persistent "SIMULATION — no real token exists" banner, units only, no currency values, no web3 libraries.
**D3.** Segmented CTA "Back the SHE Score" (Fund the index / Get notified at token launch / Register a program or government) on homepage, /simulator, /why-back-she — wording rules enforced (no reserve/whitelist/presale/early-access language; no payment; confirmation restates no entitlement).
**D4.** /petition live with moderated signature wall and privacy note.
**D5.** /privacy linked from every capture form and the footer; unchecked-by-default consent boxes.
**D6.** Validation analytics: per-list counts with source page, simulator engagement counters, auth-protected admin route or CSV export.
**D7.** Status ribbon on every page from one config constant: "Status: Pre-launch — Phase 3 of 7. The SHE Score methodology is published; no token has been issued."
**D8.** Final compliance sweep across ALL routes including /lab: no return/price-appreciation language near $SHE; simulator banner persistent; v3 never on token-adjacent pages; report any sentence you were unsure about rather than silently keeping it.

**Verify:** curl output for /why-back-she, /simulator, /petition, /privacy, /lab; the compliance sweep report; analytics access instructions.

---

# Final deliverables (after all four tracks)

1. Changelog by file, grouped by track
2. The B1 diagnosis report and the regression test results
3. curl outputs proving: every route serves unique current content; banned strings appear nowhere; /api/scores serves v2 only; /api/v3-preview carries shadow labels
4. Rendered views of: the two-tier homepage, /lab, a country page with the v3 Preview panel, the simulator mid-Crisis-Trigger, and the segmented CTA
5. The D8 compliance report
6. A one-paragraph summary I can paste to my reviewer describing exactly what is official (v2), what is shadow (v3), and what is simulated (the /simulator page)
