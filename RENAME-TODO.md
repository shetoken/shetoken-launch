# WEI → SHE Score rename — preserved identifiers (TODO / decisions)

Task 2 renamed all **user-facing** copy from "WEI / Women's Empowerment Index" to
**SHE Score**. The following are **identifiers**, deliberately left unchanged.
They are a separate decision (esp. anything API- or contract-facing).

## Frontend adapter — `wei_score` → `she_score` (DONE)
The frontend now speaks `she_score` / `global_she_score`. We normalise once at the
API boundary in `src/lib/api.ts` (`normCountry` / `normState` / `normSummary`):
the backend's `wei_score` / `global_wei_score` is copied to `she_score` /
`global_she_score`, and the **raw `wei_score` is preserved on the runtime object**
so backend-shaped field accessors keep working. All consumer code reads the
SHE-named fields; React-Query keys are `"she-countries"` / `"she-states"`.

## Still backend-owned (unchanged — separate decision)
- The **API still emits `wei_score` / `global_wei_score`** — renaming the wire
  format requires an API version bump on `api.shetoken.org`.
- **API routes keep `/v1/wei/*`** (`/v1/wei/countries`, `/countries/:iso`,
  `/states/:c`, `/history/*`, `/leaderboard`) and the `?sort=wei_score` query param.
- `methodology.ts` keeps two literal `"wei_score"` accessors on purpose: the
  Compliance component reads the (un-normalised) compliance row, and the native
  scoreField reads the runtime object that still carries `wei_score`.
- The prerender script (`scripts/prerender.mjs`) reads the raw API, so it uses
  `wei_score` directly.

## Preserved — code identifiers (internal, safe to rename later if desired)
- `CountryWEI` (TS type), `WeiTrendChart` (component), `isWEI` (local flag).
- Note: the **internal index code/key** that selects the native index was renamed
  `"WEI"` → `"SHE Score"` **consistently** (TS `IndexKey` union, `METHODOLOGY` key,
  `INDEX_STRIP` code, `methodRows`/`indexAvgs` keys). This is frontend-only and has
  no API/contract coupling, so it was kept aligned with the new name.

## Smart-contract-facing identifiers — SEPARATE DECISION (not touched)
- Any on-chain symbol/identifier referencing "WEI" (e.g. oracle keys, token metadata).
  None are in this repo today; flag for the contracts team before changing.

## Three canonical terms (enforced site-wide)
- **SHE Score** = the index (0–100, per country/state)
- **$SHE** = the token that tracks it
- **SHE Foundation** = the publisher
