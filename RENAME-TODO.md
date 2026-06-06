# WEI → SHE Score rename — preserved identifiers (TODO / decisions)

Task 2 renamed all **user-facing** copy from "WEI / Women's Empowerment Index" to
**SHE Score**. The following are **identifiers**, deliberately left unchanged.
They are a separate decision (esp. anything API- or contract-facing).

## Preserved — API / data field names (do NOT rename without backend coordination)
- `wei_score` — field on every country/state record from `api.shetoken.org`.
- `global_wei_score`, and the per-index `*_global_avg` fields (gpi/svi/wadi/…).
- API routes: `/v1/wei/countries`, `/v1/wei/countries/:iso`, `/v1/wei/states/:c`,
  `/v1/wei/history/{global,all,country/:iso}`, `/v1/wei/leaderboard`.
- React-Query keys: `"wei-countries"`, `"wei-states"` (cosmetic, but coupled to call sites).

These come straight from the backend; renaming requires an API version bump.

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
