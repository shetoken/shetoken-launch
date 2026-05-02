# WEI Methodology
## Women's Empowerment Index — Full Technical Specification

> **Version 2.0 | May 2026**
> This document is the authoritative reference for how the Women's Empowerment Index (WEI) is calculated, weighted, and applied to SHEtoken's token supply mechanics.

---

## Table of Contents

1. [Overview](#1-overview)
2. [The Five Pillars](#2-the-five-pillars)
3. [The WEI Formula](#3-the-wei-formula)
4. [Sub-Score Normalisation](#4-sub-score-normalisation)
5. [Crime Penalty — How It Works](#5-crime-penalty--how-it-works)
6. [Country Tiers](#6-country-tiers)
7. [India State-Level Scoring](#7-india-state-level-scoring)
8. [Data Sources Per Pillar](#8-data-sources-per-pillar)
9. [Annual Update Process](#9-annual-update-process)
10. [Token Supply Mechanics](#10-token-supply-mechanics)
11. [Crisis Triggers](#11-crisis-triggers)
12. [Audit & Challenge Process](#12-audit--challenge-process)
13. [Worked Example — West Bengal](#13-worked-example--west-bengal)
14. [Changelog](#14-changelog)

---

## 1. Overview

The Women's Empowerment Index (WEI) is a composite annual score calculated for every UN-recognised country and major Indian state on a **0–100 scale**.

- **0** = worst possible outcomes for women across all dimensions
- **100** = perfect equality and safety across all dimensions
- **Global WEI** = population-weighted average of all country scores

The WEI is designed to be:

| Property | Description |
|---|---|
| **Reproducible** | Any researcher can replicate scores using published data and this formula |
| **Auditable** | All inputs, weights, and calculations published openly on GitHub |
| **Challengeable** | A 30-day public review window follows every annual publication |
| **Actionable** | Governments and NGOs can directly improve their score through verifiable programs |

---

## 2. The Five Pillars

The WEI is built on five pillars. Each pillar has a defined weight and direction (positive contribution or penalty).

### Pillar 1 — Empowerment (25%)

Measures women's participation in political and civic life and their legal rights.

| Indicator | Weight within Pillar | Source |
|---|---|---|
| % of parliamentary seats held by women | 30% | IPU Parline database |
| % of ministerial positions held by women | 20% | UN Women |
| Women's legal rights index (property, inheritance, divorce) | 25% | World Bank Women Business & the Law |
| Freedom of movement score | 15% | OECD SIGI |
| % of women in senior management roles | 10% | ILO |

**Direction:** Positive. Higher female political participation = higher WEI score.

---

### Pillar 2 — Education & Literacy (20%)

Measures women's access to and completion of education at all levels.

| Indicator | Weight within Pillar | Source |
|---|---|---|
| Female adult literacy rate (15+) | 35% | UNESCO Institute for Statistics |
| Female primary school enrollment rate | 20% | UNESCO |
| Female secondary school enrollment rate | 20% | UNESCO |
| Female tertiary enrollment rate | 15% | UNESCO |
| Female STEM participation rate | 10% | UNESCO / OECD |

**Direction:** Positive. Higher female literacy and enrollment = higher WEI score.

---

### Pillar 3 — Economic Inclusion (20%)

Measures women's economic participation, financial access, and income equality.

| Indicator | Weight within Pillar | Source |
|---|---|---|
| Gender pay gap (% difference in median wages) | 30% | ILO Global Wage Report |
| Female labour force participation rate | 25% | ILO |
| % of women with a formal bank account | 20% | World Bank Global Findex |
| Women's property ownership rights score | 15% | World Bank Women Business & the Law |
| % of women-owned businesses | 10% | IFC / World Bank |

**Direction:** Positive. Greater economic participation and equality = higher WEI score.

---

### Pillar 4 — Health & Survival (15%)

Measures women's health outcomes and access to reproductive healthcare.

| Indicator | Weight within Pillar | Source |
|---|---|---|
| Maternal mortality ratio (per 100,000 live births) | 35% | WHO Global Health Observatory |
| Female life expectancy at birth | 25% | WHO / World Bank |
| Adolescent birth rate (per 1,000 women aged 15–19) | 20% | WHO |
| Access to skilled birth attendants (%) | 10% | WHO |
| Female-to-male survival ratio at birth | 10% | World Bank |

**Direction:** Positive. Better health outcomes = higher WEI score.

> **Note on Maternal Mortality:** Higher maternal mortality = **lower** pillar score. The indicator is inverted during normalisation so that improvement always increases the score.

---

### Pillar 5 — Safety / Crime Penalty (20%)

Measures crimes specifically targeting women. This pillar functions as a **penalty** — higher reported crime reduces the WEI score.

| Indicator | Weight within Pillar | Source |
|---|---|---|
| Reported rape rate (per 100,000 women) | 30% | UNODC |
| Domestic violence prevalence rate (%) | 25% | WHO / UN Women |
| Female homicide / femicide rate (per 100,000 women) | 20% | UNODC |
| Human trafficking victims — female (per 100,000) | 15% | UNODC |
| Acid attack and disfigurement incidents | 10% | UNODC / national records |

**Direction:** Negative (Penalty). Higher crime = **lower** WEI score.

> **Note on Underreporting:** Crime statistics significantly underreport actual prevalence. Where available, WHO survey-based prevalence estimates are used alongside UNODC reported crime data to adjust for known underreporting biases.

---

## 3. The WEI Formula

```
WEI Score = (Empowerment_Score   × 0.25)
          + (Education_Score     × 0.20)
          + (Economic_Score      × 0.20)
          + (Health_Score        × 0.15)
          − (Crime_Penalty_Score × 0.20)
```

Where each sub-score is normalised to a **0–100 scale** before applying weights.

### Weight Rationale

| Pillar | Weight | Rationale |
|---|---|---|
| Empowerment | 25% | Political participation is the highest-leverage indicator — it determines how all other pillars are resourced |
| Safety | 20% | Crime is a direct penalty because violence against women undermines every other pillar |
| Education | 20% | Literacy is foundational — it enables economic participation, healthcare access, and political voice |
| Economic | 20% | Financial independence is the most direct path out of structural disadvantage |
| Health | 15% | Strong correlation with other pillars; weighted lower to avoid double-counting |

---

## 4. Sub-Score Normalisation

Every raw indicator is normalised to 0–100 before being combined into a pillar score.

### Normalisation Formula

```python
def normalise(value, min_val, max_val, invert=False):
    """
    Normalise a raw value to 0-100 scale.
    
    Args:
        value: Raw indicator value
        min_val: Worst observed value globally (baseline year)
        max_val: Best observed value globally (baseline year)
        invert: True for indicators where higher = worse (e.g. maternal mortality)
    
    Returns:
        Normalised score 0-100
    """
    if max_val == min_val:
        return 50  # No variation — assign midpoint
    
    score = (value - min_val) / (max_val - min_val) * 100
    
    if invert:
        score = 100 - score
    
    return max(0, min(100, score))
```

### Inverted Indicators

The following indicators are **inverted** during normalisation (higher raw value = lower normalised score):

| Indicator | Why Inverted |
|---|---|
| Maternal mortality ratio | Higher mortality = worse outcome |
| Adolescent birth rate | Higher rate = worse outcome |
| Gender pay gap | Higher gap = worse outcome |
| Reported rape rate | Higher rate = worse outcome |
| Domestic violence rate | Higher rate = worse outcome |
| Femicide rate | Higher rate = worse outcome |
| Trafficking rate | Higher rate = worse outcome |

---

## 5. Crime Penalty — How It Works

The Crime Penalty pillar is the most distinctive feature of the WEI formula. It functions differently from the other four pillars:

### How the Penalty is Applied

```
Final WEI = Positive_Pillars_Sum − Crime_Penalty_Score × 0.20
```

This means:

- A country can score perfectly (100) on all four positive pillars
- But if it has high violence against women, the Crime Penalty reduces the final score
- **Maximum possible WEI = 100** (all positive pillars max, crime penalty = 0)
- **Minimum possible WEI = −20** (theoretically, if all positive pillars = 0 and crime = 100)
- In practice, scores cluster between 20 and 80

### Why a Penalty Rather Than a Standard Pillar?

Using subtraction rather than inclusion makes the signal clearer:

> A country cannot compensate for violence against women by performing well in education or economics. Safety is a non-negotiable floor. The penalty architecture reflects this.

### Crime Spike Trigger

If any country's Crime Index rises **more than 15% year-over-year**, a **Crisis Trigger** is automatically flagged. See [Section 11](#11-crisis-triggers).

---

## 6. Country Tiers

Countries are grouped into four tiers based on their WEI score. Tier affects their **population weight** in the Global WEI calculation.

| Tier | WEI Score Range | Examples | Population Weight |
|---|---|---|---|
| **Tier 1** | 70–100 | Iceland, Norway, Finland, Sweden, New Zealand | Full weight (1.0×) |
| **Tier 2** | 45–69 | India, Brazil, South Africa, Mexico | Full weight (1.0×) |
| **Tier 3** | 20–44 | Pakistan, Nigeria, Ethiopia, Bangladesh | Reduced weight (0.8×) |
| **Tier 4** | 0–19 | Yemen, Afghanistan, DRC, Syria | Minimum weight (0.6×) |

> **Tier weight rationale:** Lower-tier countries have less reliable data, higher underreporting of crime, and more volatile year-over-year changes. Reduced weighting prevents data quality issues from distorting the Global WEI.

---

## 7. India State-Level Scoring

India receives both a national score (`$SHE-IND`) and individual state scores for major states.

### States Currently Scored

| State | Ticker | Key Data Sources |
|---|---|---|
| West Bengal | `$SHE-WB` | NCRB, DISE, NSSO, state government portals |
| Kerala | `$SHE-KL` | NCRB, DISE, Kerala Planning Board |
| Tamil Nadu | `$SHE-TN` | NCRB, DISE, NSSO |
| Maharashtra | `$SHE-MH` | NCRB, DISE, NSSO |
| Bihar | `$SHE-BR` | NCRB, JEEViKA data, NSSO |
| Rajasthan | `$SHE-RJ` | NCRB, Educate Girls data, NSSO |

### State-Level Data Sources

| Source | Data Provided |
|---|---|
| **NCRB (National Crime Records Bureau)** | State-level crime against women data |
| **DISE (District Information System for Education)** | Female enrollment, dropout, literacy |
| **NSSO (National Sample Survey Office)** | Economic participation, wages, poverty |
| **State Government Portals** | Verified program beneficiary counts |
| **Registered NGO Data** | Verified milestone data from registered programs |

### Government Registration Bonus

States that formally register with SHEtoken and submit verified program data receive:
- ✅ **Blue Tick** verification on the SHEtoken dashboard
- ✅ **Quarterly updates** instead of annual
- ✅ Eligibility to issue **WEI Impact Bonds**

---

## 8. Data Sources Per Pillar

### Full Source Reference

| Pillar | Primary Source | Secondary Source | Update Frequency |
|---|---|---|---|
| Empowerment | IPU Parline, UN Women | World Bank WBL | Annual |
| Education | UNESCO UIS | World Bank EdStats | Annual |
| Economic | ILO, World Bank Findex | OECD | Annual |
| Health | WHO GHO | UNICEF | Annual |
| Safety | UNODC | WHO (survey data) | Annual |
| India States | NCRB, DISE | State portals | Annual / Quarterly* |

*Quarterly for registered governments only.

### Data Quality Standards

All data must meet the following standards to be included:

```
✓ Collected by a recognised international or national statistical body
✓ Methodology publicly documented
✓ Country/state coverage ≥ 80% of scored nations
✓ Published within the last 2 years
✓ Not self-reported by the government being scored
```

---

## 9. Annual Update Process

The WEI follows a strict annual update cycle to ensure transparency and community trust.

```
MONTH 1  — Data collection begins
           Pull latest datasets from all primary sources
           Flag any missing or anomalous data points

MONTH 2  — Calculation
           Run normalisation scripts
           Calculate pillar scores
           Calculate country and state WEI scores
           Flag significant year-over-year changes (>10 points)

MONTH 3  — Draft publication
           Publish draft WEI scores on GitHub
           Open 30-day public review window
           Accept challenges via GitHub Issues

MONTH 4  — Challenge review
           DAO governance votes on any disputed data points
           Simple majority (51%) required to accept a challenge
           Final scores locked after challenge window

MONTH 5  — Smart contract execution
           Oracle submits final WEI scores to Chainlink
           Smart contract compares to previous year
           Minting or burning executed automatically
           Annual WEI Report published at shetoken.org
```

---

## 10. Token Supply Mechanics

The WEI score change drives SHEtoken's supply directly.

### Minting (Supply Expansion)

```
If Global_WEI_Current > Global_WEI_Previous:
    Points_Gained = Global_WEI_Current - Global_WEI_Previous
    Tokens_Minted = Points_Gained × 10,000,000
    Destination = WEI Impact Fund (DAO treasury)
```

**Example:** Global WEI rises from 54.2 to 55.6 (+1.4 points)
→ 14,000,000 new SHE tokens minted to the Impact Fund

### Burning (Supply Contraction)

```
If Global_WEI_Current < Global_WEI_Previous:
    Points_Lost = Global_WEI_Previous - Global_WEI_Current
    Tokens_Burned = Points_Lost × 10,000,000
    Source = Reserve & Liquidity Pool
```

**Example:** Global WEI falls from 54.2 to 53.8 (−0.4 points)
→ 4,000,000 SHE tokens permanently burned

### Country Sub-Token Mechanics

Country sub-tokens (`$SHE-IND`, `$SHE-WB` etc.) follow the same logic but use their individual WEI scores rather than the global average.

---

## 11. Crisis Triggers

A Crisis Trigger is automatically flagged when any country's Crime Index rises **more than 15% in a single year**.

### Crisis Trigger Protocol

```
Step 1 — Automatic flag
         Oracle detects >15% crime spike
         Red Flag alert published on shetoken.org dashboard
         DAO governance vote automatically opened

Step 2 — DAO Vote (72-hour emergency window)
         Token holders vote on response package:
         Option A: Emergency grants from WEI Impact Fund to affected NGOs
         Option B: Additional token burn beyond standard formula
         Option C: Both A and B
         Option D: No additional action

Step 3 — Execution
         Winning option executed on-chain within 24 hours of vote close
         Public report published explaining the crisis and response
```

---

## 12. Audit & Challenge Process

### How to Challenge a WEI Score

Anyone — researcher, government, NGO, or token holder — can challenge a published WEI score:

1. **Open a GitHub Issue** in this repository with the label `wei-challenge`
2. Provide:
   - Country or state being challenged
   - Specific indicator(s) in dispute
   - Alternative data source with methodology documentation
   - Quantitative impact on WEI score
3. The issue is reviewed by the Advisory Council
4. A DAO governance vote is held if the challenge has merit
5. Simple majority (51%) required to accept the challenge and revise the score

### Challenge Window

Challenges must be submitted within **30 days** of the draft WEI publication. After the challenge window closes, scores are locked until the following annual cycle.

---

## 13. Worked Example — West Bengal

This worked example shows how West Bengal's WEI score is calculated using real program data.

### Input Data (Illustrative 2025 Baseline)

| Pillar | Indicator | Raw Value | Normalised Score |
|---|---|---|---|
| **Empowerment** | Women in state assembly | 13.7% | 42 |
| | Women in senior govt roles | 18.2% | 48 |
| | Legal rights index | 0.72/1.0 | 72 |
| | **Empowerment Score** | — | **52** |
| **Education** | Female literacy rate | 71.2% | 64 |
| | Secondary enrollment | 78.4% | 71 |
| | **Education Score** | — | **67** |
| **Economic** | Gender pay gap | 28% gap | 55 |
| | Female labour participation | 23.4% | 38 |
| | Bank account access | 68% | 62 |
| | **Economic Score** | — | **52** |
| **Health** | Maternal mortality (per 100K) | 98 | 74 |
| | Female life expectancy | 71.4 years | 68 |
| | **Health Score** | — | **71** |
| **Safety** | Reported rape rate | 8.2 per 100K | 45 |
| | Domestic violence rate | 29% | 38 |
| | **Crime Penalty Score** | — | **42** |

### WEI Calculation

```
WEI (West Bengal) = (52 × 0.25)
                  + (67 × 0.20)
                  + (52 × 0.20)
                  + (71 × 0.15)
                  − (42 × 0.20)

                = 13.0 + 13.4 + 10.4 + 10.65 − 8.4

                = 39.05  →  rounded to  39.1
```

### Impact of Kanyashree Program

If Kanyashree successfully increases female secondary enrollment from 78.4% to 85%:

```
Education Score improves from 67 → 76

New WEI = (52 × 0.25)
        + (76 × 0.20)   ← improved
        + (52 × 0.20)
        + (71 × 0.15)
        − (42 × 0.20)

        = 13.0 + 15.2 + 10.4 + 10.65 − 8.4

        = 40.85  →  40.9
```

**Net WEI improvement: +1.8 points**
→ Triggers minting of **18,000,000 SHE tokens** to the Impact Fund

---

## 14. Changelog

| Version | Date | Changes |
|---|---|---|
| v1.0 | January 2026 | Initial methodology published |
| v2.0 | May 2026 | Added state-level scoring for India. Added underreporting adjustment for crime data. Added Crisis Trigger protocol. Expanded worked example. |

---

## Questions & Contributions

- Open an issue: [github.com/shetoken/issues](https://github.com/shetoken/issues)
- Email the index team: contact@shetoken.org
- Challenge a score: Open a GitHub Issue with label `wei-challenge`
- Suggest a new data source: Open a GitHub Issue with label `data-source`

---

*© 2026 SHE Foundation. Licensed under MIT.*
*WEI methodology is open-source and freely auditable by any researcher, NGO, or government body.*