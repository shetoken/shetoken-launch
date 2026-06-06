# SHEtoken.org — Phase 2 Build Prompt for Claude Code

I've placed `index-landscape.md` in the repo root — it contains the full content for Task 4.

Work through these tasks in order. After each task, list files changed and wait for my confirmation before proceeding.

---

## Task 1 — Make the site crawlable (prerequisite for everything else)

The site currently ships an empty JS-rendered body; crawlers see only meta tags. Convert the homepage and methodology page to static or server-side rendering. If this is a React/Vite app, add prerendering or migrate the landing content to static HTML, mounting the app only for interactive widgets (leaderboard, dashboard).

**Acceptance test:** `curl https://www.shetoken.org` returns the hero headline, pitch line, and pillar descriptions as visible HTML text.

## Task 2 — Global rename: WEI → SHE Score, plus naming key

Rename the index from "Women's Empowerment Index (WEI)" to "SHE Score" across the entire site: page copy, meta tags, nav, alt text, JSON/data labels, and URLs (add 301 redirects from any /wei paths). Keep "measuring women's empowerment" as descriptive language, but the index's proper name is now **SHE Score**.

Do NOT rename API field names or smart-contract-facing identifiers yet — flag those in a TODO list instead; contract identifiers are a separate decision.

Add a short "naming key" near the homepage hero or in the footer:
- **SHE Score** = the index (0–100, per country/state)
- **$SHE** = the token that tracks it
- **SHE Foundation** = the publisher

Enforce these three terms consistently sitewide: never "SHEtoken Score," never "$SHE" when referring to the index, never "SHE Score" when referring to the token price. While renaming, catch and rewrite any ambiguous sentence (e.g., "SHE rose 2 points this year") so it explicitly says score or token.

## Task 3 — Consistency corrections

(a) Replace every claim that scores update "weekly" with: **annual updates, quarterly for registered governments**. New meta description:

> "SHE Score: a data-backed 0–100 score for women in 105 countries, built from UN Women, World Bank, WHO & UNODC data. Published annually, quarterly for registered governments. $SHE rises when the world gets better for women."

(b) Standardize the country count to "105 countries" everywhere; flag any instance of "every nation."

## Task 4 — Add an "Index Landscape" page

Create a new page at `/index-landscape` (linked from main nav as "The Landscape") using the content in `index-landscape.md` from the repo root. Where that file says "WEI" in self-references to our own index, use "SHE Score" per Task 2.

Structure:
- Intro block
- Nine index profile cards (each with publisher, coverage, scale, description, and a highlighted "How the SHE Score relates" line)
- The comparison table, with the "Investable?" column visually emphasized for the SHE Score row
- Closing copy

Every third-party index name links out to its official source (UNDP/UN Women, weforum.org, giwps.georgetown.edu, eige.europa.eu, oecd.org, weai.ifpri.info, sheindex.com, World Bank Women Business and the Law, hdr.undp.org). This page must be statically rendered per Task 1.

## Task 5 — Independence disclaimers

Add to the site footer and to the methodology page:

> "The SHE Score is an independent project and is not affiliated with, endorsed by, or derived from the UNDP/UN Women Women's Empowerment Index, the SHE Index powered by EY, or any other index referenced on this site."

Also add an FAQ entry: "Is the SHE Score the same as the UN's Women's Empowerment Index?" → No, with a one-line explanation and a link to the Landscape page.

## Task 6 — Per-country comparison panel ("How the world's indices see this country")

On each country page, add a **display-only** panel showing that country's standing in third-party indices alongside its SHE Score.

Build it data-driven: create `data/external-indices.json` with schema:

```json
{ "country_code": { "wef_gggi": {"score": 0, "rank": 0, "year": 0},
                    "wps_index": {"score": 0, "rank": 0, "edition": ""},
                    "sigi": {"category": "", "year": 0} } }
```

Populate with clearly marked placeholder/sample data for 5 countries (India, USA, Iceland, Nigeria, Kenya); I will replace these with licensed or manually sourced values. Do NOT scrape or hardcode real third-party scores.

Each value must display its source name and year. Include a visible caption:

> "Third-party scores shown for reference only. They are not inputs to the SHE Score or to $SHE token supply mechanics."

**Hard requirement:** nothing in this panel may feed any calculation, oracle, or token logic anywhere in the codebase — display only.

## Task 7 — No composite meta-index

Do NOT build a combined/composite index of third-party scores. If any existing code averages or blends external index values into a single number, remove it and flag it to me.

## Task 8 — SEO/accessibility cleanup

- Per-page meta descriptions
- Exactly one `<h1>` per page
- Alt text on all images, including the coin logo
- Confirm `/og-image.png` resolves
- Add the new Landscape page to the sitemap

---

## Final deliverables

When all tasks are done, give me:
1. A changelog by file
2. The rendered text of the new footer disclaimer and naming key
3. The `curl` output proving Task 1 passes
