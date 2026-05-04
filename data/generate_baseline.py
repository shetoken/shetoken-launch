"""
SHEtoken — WEI Baseline Data Generator
=======================================
Generates the Women's Empowerment Index baseline scores
for 83 countries using the official WEI formula.

Usage:
    python generate_baseline.py

Output:
    data/baseline-2025.csv

Formula:
    WEI = (Empowerment × 0.25)
        + (Education   × 0.20)
        + (Economic    × 0.20)
        + (Health      × 0.15)
        − (Crime       × 0.20)

All pillar scores are normalised to 0–100 before weighting.
Full methodology: wei-index/methodology.md
Data sources: data/sources.md

© 2026 SHE Foundation. Licensed under MIT.
"""

import csv
import os


# ── WEI FORMULA ──────────────────────────────────────────────────────────────

def calculate_wei(empowerment, education, economic, health, crime_penalty):
    """
    Calculate the Women's Empowerment Index score for a country.

    Args:
        empowerment    (float): Empowerment pillar score (0–100)
        education      (float): Education & Literacy pillar score (0–100)
        economic       (float): Economic Inclusion pillar score (0–100)
        health         (float): Health & Survival pillar score (0–100)
        crime_penalty  (float): Safety/Crime Penalty score (0–100, subtracted)

    Returns:
        float: WEI score rounded to 1 decimal place
    """
    score = (
        (empowerment   * 0.25) +
        (education     * 0.20) +
        (economic      * 0.20) +
        (health        * 0.15) -
        (crime_penalty * 0.20)
    )
    return round(score, 1)


# ── COUNTRY DATA ─────────────────────────────────────────────────────────────
#
# Format: (country, iso_code, region, tier, population_millions,
#          empowerment, education, economic, health, crime_penalty)
#
# Tier definitions:
#   Tier 1 = WEI 70+   (high performing, full population weight 1.0x)
#   Tier 2 = WEI 45-69 (mid performing, full population weight 1.0x)
#   Tier 3 = WEI 20-44 (developing, reduced weight 0.8x)
#   Tier 4 = WEI <20   (crisis level, minimum weight 0.6x)
#
# Pillar scores are illustrative 2025 baseline estimates derived from:
#   - UN Women, World Bank, UNESCO, UNODC, WHO, ILO, OECD, IPU
#   - See data/sources.md for full source reference
#
# NOTE: These are baseline estimates for index initialisation.
# Annual updates will replace these with verified data.

COUNTRIES = [

    # ── TIER 1 — WEI 70+ ─────────────────────────────────────────────────────
    # name,                  iso,   region,        tier, pop_M,  emp, edu, eco, hlt, crime
    ("Iceland",              "ISL", "Europe",          1,   0.4,   95,  98,  88,  97,   12),
    ("Norway",               "NOR", "Europe",          1,   5.4,   93,  97,  86,  98,   10),
    ("Finland",              "FIN", "Europe",          1,   5.5,   92,  98,  85,  97,    9),
    ("Sweden",               "SWE", "Europe",          1,  10.4,   91,  97,  87,  97,   11),
    ("Denmark",              "DNK", "Europe",          1,   5.9,   89,  96,  85,  96,   10),
    ("New Zealand",          "NZL", "Oceania",         1,   5.1,   88,  97,  83,  96,   14),
    ("Germany",              "DEU", "Europe",          1,  83.2,   84,  95,  81,  95,   13),
    ("Switzerland",          "CHE", "Europe",          1,   8.7,   83,  96,  82,  97,   11),
    ("Canada",               "CAN", "N. America",      1,  38.2,   85,  97,  80,  96,   15),
    ("Australia",            "AUS", "Oceania",         1,  25.9,   82,  96,  79,  96,   17),
    ("Ireland",              "IRL", "Europe",          1,   5.1,   82,  97,  80,  97,   12),
    ("Netherlands",          "NLD", "Europe",          1,  17.5,   84,  96,  82,  97,   13),
    ("Belgium",              "BEL", "Europe",          1,  11.5,   80,  96,  80,  96,   14),
    ("Austria",              "AUT", "Europe",          1,   9.0,   79,  95,  79,  96,   13),
    ("France",               "FRA", "Europe",          1,  67.4,   78,  95,  78,  95,   16),
    ("United Kingdom",       "GBR", "Europe",          1,  67.0,   79,  96,  78,  95,   17),
    ("Spain",                "ESP", "Europe",          1,  47.4,   76,  96,  76,  95,   15),
    ("Portugal",             "PRT", "Europe",          1,  10.3,   74,  95,  74,  94,   14),
    ("United States",        "USA", "N. America",      1, 331.0,   77,  96,  73,  93,   22),
    ("Japan",                "JPN", "Asia",            1, 125.7,   68,  97,  71,  98,    8),
    ("South Korea",          "KOR", "Asia",            1,  51.7,   65,  97,  68,  97,   12),
    ("Israel",               "ISR", "Middle East",     1,   9.3,   72,  96,  74,  95,   16),
    ("Uruguay",              "URY", "S. America",      1,   3.5,   72,  95,  68,  93,   28),

    # ── TIER 2 — WEI 45–69 ───────────────────────────────────────────────────
    ("Argentina",            "ARG", "S. America",      2,  45.4,   60,  93,  58,  91,   38),
    ("Brazil",               "BRA", "S. America",      2, 213.0,   55,  90,  54,  88,   46),
    ("Chile",                "CHL", "S. America",      2,  19.1,   58,  92,  57,  90,   36),
    ("Colombia",             "COL", "S. America",      2,  51.0,   52,  90,  50,  87,   44),
    ("Mexico",               "MEX", "N. America",      2, 128.9,   51,  88,  48,  85,   48),
    ("South Africa",         "ZAF", "Africa",          2,  60.0,   56,  85,  50,  78,   72),
    ("China",                "CHN", "Asia",            2,1412.0,   62,  93,  64,  90,   24),
    ("India",                "IND", "Asia",            2,1408.0,   48,  74,  42,  68,   38),
    ("Indonesia",            "IDN", "Asia",            2, 273.5,   44,  82,  48,  78,   32),
    ("Philippines",          "PHL", "Asia",            2, 111.0,   65,  91,  58,  82,   34),
    ("Sri Lanka",            "LKA", "Asia",            2,  22.2,   56,  92,  52,  85,   28),
    ("Vietnam",              "VNM", "Asia",            2,  97.3,   58,  90,  56,  88,   22),
    ("Thailand",             "THA", "Asia",            2,  71.6,   57,  88,  58,  88,   28),
    ("Mongolia",             "MNG", "Asia",            2,   3.3,   55,  91,  52,  84,   38),
    ("Botswana",             "BWA", "Africa",          2,   2.6,   56,  87,  52,  74,   48),
    ("Namibia",              "NAM", "Africa",          2,   2.6,   58,  88,  50,  76,   52),
    ("Tunisia",              "TUN", "Africa",          2,  12.0,   46,  85,  48,  82,   30),
    ("Morocco",              "MAR", "Africa",          2,  37.1,   40,  76,  42,  80,   28),
    ("Kenya",                "KEN", "Africa",          2,  54.0,   48,  80,  44,  68,   42),
    ("Ghana",                "GHA", "Africa",          2,  32.4,   45,  82,  42,  70,   38),
    ("Rwanda",               "RWA", "Africa",          2,  13.5,   64,  84,  48,  72,   36),
    ("Kazakhstan",           "KAZ", "Central Asia",    2,  19.1,   54,  92,  60,  88,   28),
    ("Ukraine",              "UKR", "Europe",          2,  43.5,   58,  93,  62,  90,   30),
    ("Turkey",               "TUR", "Europe/Asia",     2,  84.3,   48,  82,  52,  86,   36),
    ("Russia",               "RUS", "Europe",          2, 144.1,   56,  92,  60,  88,   28),
    ("Bolivia",              "BOL", "S. America",      2,  11.8,   52,  88,  48,  82,   42),
    ("Honduras",             "HND", "C. America",      2,  10.3,   48,  85,  46,  80,   56),
    ("Peru",                 "PER", "S. America",      2,  32.9,   50,  88,  48,  82,   42),

    # ── TIER 3 — WEI 20–44 ───────────────────────────────────────────────────
    ("Bangladesh",           "BGD", "Asia",            3, 166.3,   38,  70,  36,  68,   40),
    ("Nepal",                "NPL", "Asia",            3,  29.7,   36,  68,  34,  66,   36),
    ("Myanmar",              "MMR", "Asia",            3,  54.4,   34,  72,  38,  70,   44),
    ("Cambodia",             "KHM", "Asia",            3,  16.7,   32,  74,  38,  72,   34),
    ("Laos",                 "LAO", "Asia",            3,   7.3,   32,  72,  36,  70,   30),
    ("Papua New Guinea",     "PNG", "Oceania",         3,   9.1,   26,  60,  28,  58,   60),
    ("Pakistan",             "PAK", "Asia",            3, 225.2,   24,  50,  28,  62,   44),
    ("Nigeria",              "NGA", "Africa",          3, 213.4,   28,  60,  30,  52,   48),
    ("Ethiopia",             "ETH", "Africa",          3, 117.9,   26,  55,  28,  52,   38),
    ("Tanzania",             "TZA", "Africa",          3,  61.5,   30,  64,  32,  58,   46),
    ("Uganda",               "UGA", "Africa",          3,  47.1,   34,  66,  30,  56,   52),
    ("Mozambique",           "MOZ", "Africa",          3,  32.2,   28,  58,  28,  52,   46),
    ("Zambia",               "ZMB", "Africa",          3,  18.9,   30,  64,  32,  56,   48),
    ("Zimbabwe",             "ZWE", "Africa",          3,  15.1,   32,  72,  30,  58,   50),
    ("Cameroon",             "CMR", "Africa",          3,  27.2,   28,  60,  28,  52,   44),
    ("Ivory Coast",          "CIV", "Africa",          3,  26.4,   26,  58,  28,  50,   40),
    ("Guatemala",            "GTM", "C. America",      3,  17.1,   34,  70,  36,  74,   52),
    ("Haiti",                "HTI", "Caribbean",       3,  11.4,   24,  56,  26,  46,   48),
    ("Egypt",                "EGY", "Middle East",     3, 102.3,   24,  70,  32,  74,   32),
    ("Jordan",               "JOR", "Middle East",     3,  10.2,   24,  80,  30,  80,   28),
    ("Iraq",                 "IRQ", "Middle East",     3,  40.2,   18,  58,  22,  70,   36),
    ("Sudan",                "SDN", "Africa",          3,  44.9,   16,  42,  20,  48,   36),

    # ── TIER 4 — WEI <20 ─────────────────────────────────────────────────────
    ("Yemen",                "YEM", "Middle East",     4,  33.7,   10,  28,  12,  38,   56),
    ("Afghanistan",          "AFG", "Asia",            4,  40.1,    6,  18,   8,  32,   48),
    ("DRC",                  "COD", "Africa",          4,  95.9,   14,  38,  14,  36,   62),
    ("Syria",                "SYR", "Middle East",     4,  21.3,   16,  44,  16,  46,   52),
    ("Mali",                 "MLI", "Africa",          4,  22.4,   14,  36,  16,  38,   40),
    ("Chad",                 "TCD", "Africa",          4,  16.9,   12,  28,  14,  32,   42),
    ("Niger",                "NER", "Africa",          4,  25.1,   10,  24,  12,  30,   36),
    ("Central African Rep.", "CAF", "Africa",          4,   4.8,   12,  30,  14,  32,   56),
    ("South Sudan",          "SSD", "Africa",          4,  11.2,   14,  28,  14,  30,   54),
    ("Somalia",              "SOM", "Africa",          4,  17.1,    8,  20,  10,  28,   58),
]


# ── TIER POPULATION WEIGHTS ───────────────────────────────────────────────────
#
# Lower-tier countries have less reliable data and higher underreporting.
# Reduced weighting prevents data quality issues from distorting the Global WEI.

TIER_WEIGHTS = {1: 1.0, 2: 1.0, 3: 0.8, 4: 0.6}


# ── GENERATE DATA ─────────────────────────────────────────────────────────────

def generate_baseline(output_path="data/baseline-2025.csv", year=2025):
    """
    Generate the WEI baseline CSV file.

    Args:
        output_path (str): Path to write the CSV file
        year (int): Baseline year
    """
    rows = []

    for (country, iso, region, tier, pop,
         emp, edu, eco, hlt, crime) in COUNTRIES:

        score = calculate_wei(emp, edu, eco, hlt, crime)
        pop_weight = TIER_WEIGHTS[tier]
        ticker = f"SHE-{iso}"

        rows.append({
            "country":           country,
            "iso_code":          iso,
            "region":            region,
            "tier":              tier,
            "population_millions": pop,
            "empowerment_score": emp,
            "education_score":   edu,
            "economic_score":    eco,
            "health_score":      hlt,
            "crime_penalty_score": crime,
            "wei_score":         score,
            "population_weight": pop_weight,
            "ticker":            ticker,
            "year":              year,
            "verified":          "false",
            "notes":             "",
        })

    # Sort by WEI score descending
    rows.sort(key=lambda x: x["wei_score"], reverse=True)

    # Add rank
    for i, row in enumerate(rows):
        row["rank"] = i + 1

    # Calculate global WEI — population-weighted average
    total_weighted = sum(
        r["wei_score"] * r["population_millions"] * r["population_weight"]
        for r in rows
    )
    total_pop_weighted = sum(
        r["population_millions"] * r["population_weight"]
        for r in rows
    )
    global_wei = round(total_weighted / total_pop_weighted, 1)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)

    # Build header comment
    header = (
        f"# SHEtoken WEI Baseline Data — {year}\n"
        f"# Women's Empowerment Index scores for {len(rows)} countries\n"
        f"# Global WEI {year} (population-weighted average): {global_wei}\n"
        f"# Formula: WEI = (Empowerment x 0.25) + (Education x 0.20) "
        f"+ (Economic x 0.20) + (Health x 0.15) - (Crime x 0.20)\n"
        f"# All scores normalised 0-100\n"
        f"# Full methodology: wei-index/methodology.md\n"
        f"# Data sources: data/sources.md\n"
        f"# Generated: May 2026 | shetoken.org\n"
        f"#\n"
    )

    fieldnames = [
        "rank", "country", "iso_code", "region", "tier",
        "population_millions", "empowerment_score", "education_score",
        "economic_score", "health_score", "crime_penalty_score",
        "wei_score", "population_weight", "ticker", "year",
        "verified", "notes",
    ]

    # Write CSV
    import io
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        f.write(header)
        f.write(buf.getvalue())

    # Print summary
    print(f"SHEtoken WEI Baseline {year}")
    print(f"{'='*40}")
    print(f"Countries scored:     {len(rows)}")
    print(f"Global WEI {year}:     {global_wei}")
    print(f"Highest:              {rows[0]['country']} ({rows[0]['wei_score']})")
    print(f"Lowest:               {rows[-1]['country']} ({rows[-1]['wei_score']})")
    print(f"Output:               {output_path}")
    print(f"{'='*40}")
    print(f"\nTier breakdown:")
    for t in [1, 2, 3, 4]:
        tier_rows = [r for r in rows if r["tier"] == t]
        avg = round(sum(r["wei_score"] for r in tier_rows) / len(tier_rows), 1)
        print(f"  Tier {t}: {len(tier_rows):2d} countries | avg WEI {avg}")


# ── ENTRY POINT ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    generate_baseline(
        output_path="data/baseline-2025.csv",
        year=2025,
    )
