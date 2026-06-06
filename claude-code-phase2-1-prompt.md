# SHEtoken.org — Phase 2.1 Prompt for Claude Code
## Consistency & credibility fixes before investor demo (two-tier pillar architecture)

Work through these tasks in order. After each task, list files changed and wait for my confirmation before proceeding.

---

## Task 1 — Two-tier pillar architecture (LIVE v2 + v3 In Validation)

The score currently computed is the documented five-pillar formula:

```
SHE Score = (Empowerment × 0.25)
          + (Education & Literacy × 0.20)
          + (Economic Inclusion × 0.20)
          + (Health & Survival × 0.15)
          − (Safety / Crime Penalty × 0.20)
```

The nine-pillar layout stays on the homepage and methodology page as the **full framework**, restructured as follows:

(a) Homepage section header becomes: **"Nine pillars. One vision. Five compute the score today."**

(b) Each pillar card gets a status badge:
- **LIVE** — Empowerment (25%), Education & Literacy (20%), Economic Inclusion (20%), Health & Survival (15%), Safety (Crime Penalty) (−20%). Restore these documented weights.
- **v3 — IN VALIDATION** — Bodily Autonomy, Dignity & Welfare, Digital & Social, and the expanded Safety & Justice indicators (police responsiveness, legal aid, honour-based violence). Remove percentage weights from these; show "weight TBD on activation."

(c) Add this activation disclaimer beneath the pillar grid on BOTH pages:

> The SHE Score (v2) is computed from the five LIVE pillars using the published formula. The four v3 pillars — Bodily Autonomy, Dignity & Welfare, Digital & Social, and the expanded Safety & Justice indicators — are part of the full SHE framework but do not yet affect published scores or $SHE supply mechanics. They will be activated individually when each meets our data standard: an independent institutional source covering ≥80% of scored countries, published within two years. Track activation status on the methodology page.

(d) Methodology page: the formula section shows ONLY the five-pillar v2 formula. Add a new section "v3 Expansion Pillars" listing each pending pillar with: candidate indicators, candidate data sources, and the blocking gap (e.g., "Bodily Autonomy — period poverty: no institutional 105-country dataset; candidate source: UNICEF/WHO JMP menstrual health module").

(e) Ensure nothing anywhere on the site implies v3 pillars affect published scores or $SHE supply mechanics.

(f) Add FAQ entry: "Why do only five of the nine pillars count today?" → Because every live indicator must meet the published data standard (independent institutional source, ≥80% country coverage, published within 2 years); v3 pillars activate one at a time as they qualify.

## Task 2 — Remove unsupportable superlatives

Delete "the most comprehensive women's empowerment index ever published" and the "the only one that prices..." claim (it is false — OECD SIGI covers FGM and child marriage, and our own /index-landscape page says so).

Replace with: "A women's empowerment index built for accountability — measuring dimensions most indices treat as footnotes, with a direct penalty for violence against women."

Audit the whole site for "first," "only," "most," and "ever" claims. Keep only "world's first data-backed gender accountability token." Flag every other instance to me with your recommendation.

## Task 3 — Fix /whitepaper and /dashboard

Both routes currently serve homepage content with canonical pointing to "/".

(a) **/whitepaper:** create a real prerendered page hosting the whitepaper (HTML summary + downloadable PDF link), or remove it from nav until ready.
(b) **/dashboard:** if the dashboard app exists, ensure the route serves it with its own title, meta description, and correct canonical. If it doesn't exist yet, change the nav label to "Dashboard — coming soon" and remove the "See live scores for 105 countries" CTA.

No route may serve duplicate homepage content with a mismatched canonical.

## Task 4 — Remove or relocate the "signal layer"

The methodology page mentions a signal layer using 100+ multilingual news sources, arXiv, PubMed, and GDELT. It is not in the methodology documentation. Remove it from the methodology section; if we keep the idea visible, move it to a "Future research" note clearly marked as not part of score calculation or token mechanics.

## Task 5 — Soften the price-certainty claim

Replace "When the index rises, $SHE rises" with: "When the index rises, token supply mechanics respond — minting to the Impact Fund on progress, burning on regression."

Audit for any other sentence stating or implying guaranteed price appreciation and rewrite to describe mechanics, not price outcomes.

## Task 6 — Terminology and nav unification

(a) Standardize the live penalty pillar's name to "Safety (Crime Penalty)" everywhere, including the /index-landscape WPS entry.
(b) Make the top nav identical on every page: SHEtoken · Dashboard · The Landscape · Methodology · Whitepaper · Community.
(c) Re-verify the naming key (SHE Score / $SHE / SHE Foundation) and footer independence disclaimer render on every page, including any new ones.

## Task 7 — "Why another index?" FAQ + homepage line

Add this FAQ entry to the methodology page (and the homepage FAQ if one exists):

**"There are already many gender indices. Why a new one?"**

> Existing indices measure; none of them move money. The WEF, UNDP, Georgetown and OECD indices are research instruments — published as reports, read by policymakers, with no economic consequence attached to a score rising or falling. The SHE Score is built to be the accountability layer on top of that measurement tradition: it updates quarterly for registered governments instead of annually or biennially, it scores sub-nationally (Indian states today) so individual programs are visible, and it is the only gender index wired to a financial instrument — $SHE supply expands when the score rises and contracts when it falls. We use the same institutional data the great indices use. The difference is what happens when the number changes.

Link the phrase "many gender indices" to /index-landscape.

---

## Final deliverables

1. Changelog by file
2. The rendered homepage pillar section (showing LIVE and v3 badges)
3. `curl` output for /, /methodology, /whitepaper, and /dashboard showing unique content and correct canonicals
4. List of every superlative claim found and what was done with it
