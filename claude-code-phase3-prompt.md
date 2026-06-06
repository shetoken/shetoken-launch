# SHEtoken.org — Phase 3 Build Prompt for Claude Code
## Investor-facing layer: Why Back SHE, the SHE Score Simulator, segmented CTA, and demand-validation instrumentation

Work through tasks in order. After each task, list files changed and wait for my confirmation before proceeding.

---

## Task 0 — Prerequisite check

Verify Phase 2.1 is complete before building anything:
- Two-tier pillar architecture live (5 LIVE pillars with documented weights; 4 pillars badged "v3 — IN VALIDATION" with no weights)
- No superlative claims ("most comprehensive," "the only one that...") anywhere
- /whitepaper and /dashboard serve unique content with correct canonicals (or are removed/marked coming soon)
- "Signal layer" removed from methodology or relocated to a Future Research note
- No sentence implying guaranteed price appreciation
- Unified nav and "Safety (Crime Penalty)" terminology

If any item is incomplete, fix it first and flag it to me before continuing.

---

## Task 1 — "Why Back SHE" page (/why-back-she)

Create a prerendered page with three audience sections. Tone: confident, factual, zero hype.

**Section 1 — Funders & Philanthropy.** The infrastructure pitch: independent, continuous, comparable measurement of women's outcomes across 105 countries and sub-nationally; one grant funds the instrument that makes all programs measurable; philanthropic capital recruits market capital behind the same outcomes. Strategic-value language IS allowed here.

**Section 2 — Impact & ESG Investors.** The measurement-instrument pitch: gender-lens investing gets what carbon markets gave climate — a quantified, third-party-sourced, continuously tracked metric with an instrument attached; WEI Impact Bonds let capital take a position on a specific government's programs succeeding, with verified data deciding the outcome. Strategic-value language allowed.

**Section 3 — Token Participants.** MECHANICS ONLY. Describe: how supply responds to score movements (mint to Impact Fund on rise, burn from reserve on fall, 10M units per point), staking (lockup, reward structure), governance rights, and Impact Bond structure. Include the full risk disclosure list from the whitepaper (volatility, data lag, regulatory, early stage, oracle risk). HARD RULE: no language anywhere in this section stating or implying financial returns, upside, profit, price appreciation, or "early" advantage. Do not include the words "invest," "returns," "profit," "upside," or "opportunity" in this section. Describe what the system does, not what a holder gains.

**Page close:** "Right now, the only people financially exposed to women's progress are women. Everyone else participates morally. $SHE exists to change which side capital is on."

Add /why-back-she to the unified nav as "Why Back SHE."

## Task 2 — SHE Score Simulator (/simulator)

An interactive, client-side page where visitors manipulate the v2 formula and watch consequences execute.

**Mechanics (must exactly match published methodology):**
- Default scenario: the West Bengal worked example — Empowerment 52, Education 67, Economic 52, Health 71, Crime Penalty 42 → base score 39.1
- Sliders for each of the five LIVE pillar sub-scores (0–100)
- Score recomputes live: `(E×0.25)+(Ed×0.20)+(Ec×0.20)+(H×0.15)−(C×0.20)`, displayed to one decimal
- Token supply responds per documented rules: ±10,000,000 SHE units per point of score change, shown as "minted to Impact Fund" or "burned from Reserve" with a running supply counter starting at 1,000,000,000
- Crisis Trigger: if the user raises the Crime Penalty sub-score by more than 15% above its baseline, fire a visible "CRISIS TRIGGER" alert explaining the DAO emergency vote protocol (72-hour window, options A–D)
- Include 2–3 preset scenario buttons: "Kanyashree succeeds" (Education 67→76, matching the methodology's worked example, +1.8 points, 18M minted), "Crime spike" (fires the trigger), "Reset to baseline"

**Compliance requirements (non-negotiable):**
- Persistent banner, visible at all scroll positions: "SIMULATION — illustrative data only. No real token exists. Nothing on this page is an offer to sell or a solicitation to buy any asset."
- Token quantities shown in SHE units ONLY — never any currency value, never a price, never "$" attached to a token amount
- Page title and copy in future tense: "How It Will Work"
- Show the current roadmap phase indicator ("Pre-launch — Phase 3 of 7") near the title
- All simulation logic client-side; no wallet connection, no web3 libraries, nothing that could be mistaken for a live protocol

Link the simulator prominently from the homepage hero ("See how it will work") and from /why-back-she.

## Task 3 — Segmented CTA: "Back the SHE Score"

A single CTA block component, placed on: homepage (below the pillar section), /simulator (below the sim), and /why-back-she (below each audience section, preselecting the matching option).

**Three buttons, each opening a minimal email-capture form tagged to a separate list:**
1. **"Fund the index"** → list: `funders` — copy: "Be first to know when the index crowdfund opens."
2. **"Get notified at token launch"** → list: `token_interest` — copy: "We'll email you when $SHE goes live. No commitment, no reservation, nothing to buy today."
3. **"Register a program or government"** → list: `registrants` — extra fields: organization name, country/state, program type. Copy: "For NGOs and government bodies interested in verified scoring."

**Wording rules (audit the final copy against these):**
- Button 2 must never use: "reserve," "pre-order," "whitelist," "secure your spot," "early access," "presale," or any allocation language
- No form may take payment or promise tokens
- Each form's confirmation message restates: signing up creates no entitlement of any kind

**Backend:** implement the simplest reliable capture for this stack — either a small API route writing to a database/JSON-lines store with list tag + timestamp + source page, or integration with the form/email service already configured for the project (ask me which before choosing). Include double opt-in confirmation email if an email service exists; otherwise store and flag for later confirmation. Validate and rate-limit the endpoint.

## Task 4 — Petition page (/petition)

A lightweight advocacy page: "Demand the world measure women's progress."

- One-paragraph case: every major gender index is a report nobody is accountable to; sign to support a public, auditable, continuously updated SHE Score
- Signature form: name (first name + last initial displayed), email (into list: `petition`), country, optional "why I'm signing" (moderated before display)
- Live signature counter and a wall of recent signatures (display name + country only)
- Footer of the page links to the segmented CTA ("Want to do more than sign?")
- Privacy note adjacent to the form; signatures never displayed with full email or full surname

## Task 5 — Privacy policy and email compliance

We are now collecting emails, so:
- Create /privacy: what we collect (email, list tag, optional org fields, petition signatures), why, retention, how to be removed (mailto link), no sale of data, cookie usage if any analytics added
- Link /privacy from every capture form and the footer
- Every capture form gets an unchecked-by-default consent checkbox: "Email me updates about the SHE Score and $SHE launch"
- Confirmation/unsubscribe handling consistent with double opt-in if email service exists

## Task 6 — Validation analytics

Instrument the demand test so thresholds are measurable:
- Per-list signup counts with daily timestamps, exposed at a simple private admin route or exportable CSV (protect with a basic auth token I'll set via environment variable)
- Track source page for every signup (homepage / simulator / why-back-she / petition)
- Simulator engagement: count of sessions that moved at least one slider, and count that fired the Crisis Trigger (anonymous counters only — no per-user tracking without consent)
- A small private dashboard or CSV summary showing progress against thresholds: total signups, % funders list, registrant count, petition count

## Task 7 — Status ribbon

Site-wide footer line or thin ribbon on every page: "Status: Pre-launch — Phase 3 of 7. The SHE Score methodology is published; no token has been issued." Update the phase number in ONE config constant so future phases are a one-line change.

## Task 8 — Final compliance sweep

After all tasks, run a sitewide audit and report to me:
- Every page where "$SHE" appears: confirm no sentence promises or implies price appreciation or returns
- Every capture form: confirm no payment, no token entitlement, no reservation language
- Simulator: confirm banner persistence, units-only display, no currency values
- Confirm /privacy is linked from every form
- List any sentence you were unsure about rather than silently keeping it

---

## Final deliverables

1. Changelog by file
2. Screenshots or rendered HTML of: the Why Back SHE page, the simulator at baseline and mid-crisis-trigger, the three-button CTA block, and the petition page
3. curl output for /why-back-she, /simulator, /petition, /privacy showing unique prerendered content and correct canonicals
4. The compliance sweep report from Task 8
5. Instructions for me: how to access the analytics route, set the auth token, and export the signup CSV
