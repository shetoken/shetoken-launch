"""
SHEtoken — WEI India States Data Generator
===========================================
Generates Women's Empowerment Index scores for
major Indian states using the official WEI formula.

Usage:
    python generate_india_states.py

Output:
    data/india-states-2025.csv

Formula:
    WEI = (Empowerment × 0.25)
        + (Education   × 0.20)
        + (Economic    × 0.20)
        + (Health      × 0.15)
        − (Crime       × 0.20)

India-specific data sources:
    - NCRB  (National Crime Records Bureau)     → Crime Penalty pillar
    - DISE  (District Information System)       → Education pillar
    - NSSO  (National Sample Survey Office)     → Economic pillar
    - NFHS  (National Family Health Survey)     → Health pillar
    - ECI   (Election Commission of India)      → Empowerment pillar

Full methodology: wei-index/methodology.md
Data sources:     data/sources.md

© 2026 SHE Foundation. Licensed under MIT.
"""

import csv
import os
import io


# ── WEI FORMULA ──────────────────────────────────────────────────────────────

def calculate_wei(empowerment, education, economic, health, crime_penalty):
    """
    Calculate the Women's Empowerment Index score.

    Args:
        empowerment    (float): Political participation, legal rights (0–100)
        education      (float): Literacy, enrollment, dropout rate (0–100)
        economic       (float): Wage gap, labour participation, banking (0–100)
        health         (float): Maternal mortality, life expectancy (0–100)
        crime_penalty  (float): Rape, DV, femicide, trafficking (0–100, subtracted)

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


# ── STATE DATA ────────────────────────────────────────────────────────────────
#
# Format: (state, state_code, region, population_millions,
#          empowerment, education, economic, health, crime_penalty,
#          key_programs, notes)
#
# Pillar score notes:
#
#   Empowerment  — Women MLAs (%), women in IAS/state services,
#                  panchayat representation (73rd Amendment data)
#   Education    — Female literacy rate (Census/DISE),
#                  secondary enrollment, dropout rates
#   Economic     — Female LFPR (PLFS), gender wage gap (NSSO),
#                  women with bank accounts (PMJDY data)
#   Health       — MMR (SRS), female life expectancy (NFHS-5),
#                  institutional delivery rate
#   Crime        — Rape rate per 100K women (NCRB),
#                  DV prevalence (NFHS-5), dowry deaths

STATES = [

    # ── SOUTH INDIA — generally higher WEI ───────────────────────────────────

    (
        "Kerala", "KL", "South",
        35.0,
        # emp   edu   eco   hlt  crime
         78,    94,   62,   88,   22,
        "Kudumbashree (1998) — 46 lakh members, Asia's largest women's SHG network",
        "Highest female literacy (95.2%). Kudumbashree integrated with half of Kerala families."
    ),
    (
        "Tamil Nadu", "TN", "South",
        77.8,
        # emp   edu   eco   hlt  crime
         68,    88,   58,   82,   28,
        "Tamil Nadu Corporation for Development of Women; Uzhavar Sandhai women vendors",
        "Strong reservation in panchayats. Above-average female literacy at 73.9%."
    ),
    (
        "Telangana", "TS", "South",
        37.4,
        # emp   edu   eco   hlt  crime
         62,    78,   52,   76,   34,
        "Stree Nidhi Credit Cooperative; Mission Bhagiratha women SHGs",
        "Strong SHG movement inherited from Andhra Pradesh bifurcation."
    ),
    (
        "Andhra Pradesh", "AP", "South",
        53.9,
        # emp   edu   eco   hlt  crime
         60,    76,   54,   74,   32,
        "SERP (Society for Elimination of Rural Poverty); Velugu/IKP program",
        "pioneered SHG-bank linkage model, scaled nationally as NRLM."
    ),
    (
        "Karnataka", "KA", "South",
        67.6,
        # emp   edu   eco   hlt  crime
         60,    78,   54,   76,   36,
        "Stree Shakti SHG program; Karnataka Mahila Abhivrudhi Yojana",
        "Mysuru, Dharwad districts show strong women's enterprise activity."
    ),
    (
        "Goa", "GA", "West",
         1.5,
        # emp   edu   eco   hlt  crime
         64,    90,   58,   86,   24,
        "Goa Mahila Aarthik Vikas Mahamandal microfinance",
        "Highest HDI in India. Strong female literacy and health outcomes."
    ),

    # ── EAST INDIA ────────────────────────────────────────────────────────────

    (
        "West Bengal", "WB", "East",
        99.6,
        # emp   edu   eco   hlt  crime
         52,    74,   46,   70,   42,
        "Lakshmi Bhandar (24.1M), Kanyashree (10M girls, UNESCO prize), "
        "Rupashree (2.3M), Swasthya Sathi (2.42M)",
        "Fastest-improving state. Lakshmi Bhandar is world's largest women's "
        "direct cash transfer. Kanyashree won UN Public Service Award."
    ),
    (
        "Odisha", "OD", "East",
        46.4,
        # emp   edu   eco   hlt  crime
         48,    70,   40,   66,   38,
        "Mission Shakti SHG network — 70 lakh women members",
        "Mission Shakti is one of India's largest state SHG programs."
    ),
    (
        "Assam", "AS", "Northeast",
        35.6,
        # emp   edu   eco   hlt  crime
         44,    70,   38,   62,   44,
        "Assam Mahila Samakhya; tea garden women's cooperatives",
        "High MMR remains a challenge. Tea garden workers face economic vulnerability."
    ),

    # ── NORTH INDIA ───────────────────────────────────────────────────────────

    (
        "Himachal Pradesh", "HP", "North",
         7.5,
        # emp   edu   eco   hlt  crime
         58,    86,   50,   80,   26,
        "HP State Women's Commission; women-led MGNREGA groups",
        "High female literacy (76.6%). Strong panchayat women's reservation."
    ),
    (
        "Uttarakhand", "UK", "North",
        11.3,
        # emp   edu   eco   hlt  crime
         54,    82,   46,   76,   30,
        "Mahila Mangal Dal forest groups; Van Panchayats women leaders",
        "Women lead forest governance. Above-average literacy for hill state."
    ),
    (
        "Delhi", "DL", "North",
        20.7,
        # emp   edu   eco   hlt  crime
         54,    84,   52,   78,   62,
        "Delhi Mahila Kosh microfinance; Mahila Panchayat scheme",
        "High urban crime rate pulls score down significantly despite strong education."
    ),
    (
        "Punjab", "PB", "North",
        30.1,
        # emp   edu   eco   hlt  crime
         50,    78,   48,   76,   32,
        "Punjab Women Development Corporation; ATMA women farmer groups",
        "Improving female literacy. Strong women's panchayat representation."
    ),
    (
        "Haryana", "HR", "North",
        28.9,
        # emp   edu   eco   hlt  crime
         42,    72,   44,   66,   58,
        "Mahila Samridhi Yojana; Beti Bachao Beti Padhao (origin state)",
        "Lowest sex ratio at birth in India (historically). Active Beti Bachao "
        "program has improved ratio from 832 to 916 per 1000 male births."
    ),

    # ── WEST INDIA ────────────────────────────────────────────────────────────

    (
        "Maharashtra", "MH", "West",
       124.7,
        # emp   edu   eco   hlt  crime
         56,    80,   54,   74,   44,
        "Mann Deshi Bank (100K+ women); Mahila Arthik Vikas Mahamandal (MAVIM); "
        "Pune District Women's Enterprise program",
        "Strong urban women's enterprise ecosystem. Mann Deshi Bank pioneered "
        "rural women's banking. Mumbai has India's highest women's workforce."
    ),
    (
        "Gujarat", "GJ", "West",
        63.9,
        # emp   edu   eco   hlt  crime
         52,    78,   54,   74,   28,
        "SEWA (Self Employed Women's Association) — 3.78M members, 20 states; "
        "SEWA Bank (1974) — pioneered global microfinance",
        "SEWA founded here in 1972. One of world's most influential women's "
        "labour organisations. Strong women's enterprise and cooperative sector."
    ),
    (
        "Rajasthan", "RJ", "West",
        81.0,
        # emp   edu   eco   hlt  crime
         46,    62,   38,   64,   40,
        "Educate Girls (6.7M beneficiaries, 380K+ girls enrolled); "
        "Rajasthan Gramin Aajeevika Vikas Parishad SHGs",
        "Educate Girls has transformed female enrollment in rural Rajasthan. "
        "Child marriage remains a challenge despite declining rates."
    ),

    # ── CENTRAL INDIA ─────────────────────────────────────────────────────────

    (
        "Madhya Pradesh", "MP", "Central",
        85.4,
        # emp   edu   eco   hlt  crime
         44,    64,   36,   60,   46,
        "Educate Girls (operates in MP); Tejaswini Rural Women's Empowerment",
        "Among India's highest rape reporting rates (NCRB). "
        "Educate Girls active in Rajasthan and MP."
    ),
    (
        "Chhattisgarh", "CG", "Central",
        29.4,
        # emp   edu   eco   hlt  crime
         48,    68,   38,   62,   42,
        "Chhattisgarh Women's Self Help Group Mission; tribal women's cooperatives",
        "Strong tribal women's forest rights movement. Above-average panchayat "
        "representation for women."
    ),

    # ── EAST/CENTRAL ─────────────────────────────────────────────────────────

    (
        "Jharkhand", "JH", "East",
        38.6,
        # emp   edu   eco   hlt  crime
         42,    62,   34,   58,   40,
        "Jharkhand State Livelihood Promotion Society (JSLPS) women SHGs",
        "Large tribal population. Women's forest rights and land ownership "
        "remain significant challenges."
    ),

    # ── BIHAR — SPECIAL FOCUS ─────────────────────────────────────────────────

    (
        "Bihar", "BR", "East",
       128.5,
        # emp   edu   eco   hlt  crime
         36,    58,   28,   54,   36,
        "JEEViKA — 1.04M SHGs, 34,000+ villages, ₹11,000+ crore bank credit; "
        "Mukhyamantri Kanya Utthan Yojana (girl child incentive scheme)",
        "JEEViKA is India's most successful rural livelihood program, scaled "
        "nationally as NRLM. Bihar has lowest female LFPR in India (4-6%) "
        "but JEEViKA is transforming economic outcomes at scale."
    ),

    # ── NORTHEAST ────────────────────────────────────────────────────────────

    (
        "Manipur", "MN", "Northeast",
         3.2,
        # emp   edu   eco   hlt  crime
         56,    80,   52,   72,   28,
        "Ima Keithel (Mothers' Market) — world's largest all-women market",
        "Unique matrilineal trading traditions. Ima Keithel in Imphal is an "
        "extraordinary example of women's economic autonomy."
    ),
    (
        "Mizoram", "MZ", "Northeast",
         1.3,
        # emp   edu   eco   hlt  crime
         58,    90,   50,   80,   18,
        "Mizoram Women's Commission; Young Mizo Association women's wing",
        "Highest female literacy in Northeast (89.4%). Low crime rate."
    ),
    (
        "Meghalaya", "ML", "Northeast",
         3.4,
        # emp   edu   eco   hlt  crime
         60,    82,   52,   76,   22,
        "Meghalaya Livelihoods and Access to Markets (MLAM) women SHGs",
        "Matrilineal society (Khasi and Jaintia tribes). Women own property "
        "and pass family name — one of India's most gender-equal cultures."
    ),

    # ── UTTAR PRADESH ────────────────────────────────────────────────────────

    (
        "Uttar Pradesh", "UP", "North",
       241.1,
        # emp   edu   eco   hlt  crime
         34,    58,   28,   54,   52,
        "UP State Rural Livelihoods Mission (UPSRLM) SHGs; "
        "Mahila Shakti Kendras (one-stop centres)",
        "India's most populous state. High crime rate and low female literacy "
        "drive score down. UPSRLM has 9M+ SHG members — significant scale."
    ),
]


# ── GENERATE DATA ──────────────────────────────────────────────────────────────

def generate_india_states(output_path="data/india-states-2025.csv", year=2025):
    """
    Generate the India states WEI CSV file.

    Args:
        output_path (str): Path to write the CSV file
        year (int): Baseline year
    """
    rows = []

    for (state, code, region, pop,
         emp, edu, eco, hlt, crime,
         key_programs, notes) in STATES:

        score = calculate_wei(emp, edu, eco, hlt, crime)
        ticker = f"SHE-{code}"

        # Change from previous year (illustrative — shows program impact)
        # States with major active programs show stronger improvement
        change_map = {
            "WB": +3.4,   # Lakshmi Bhandar expansion + Kanyashree records
            "KL": +2.1,   # Kudumbashree silver jubilee impact
            "TN": +1.2,   # Women's SHG growth
            "MH": +1.4,   # MAVIM and Mann Deshi expansion
            "RJ": +1.8,   # Educate Girls milestone year
            "BR": -0.8,   # JEEViKA progress offset by low LFPR
            "UP": -0.4,   # Slow improvement in crime stats
            "HR": +0.6,   # Beti Bachao sex ratio improvement
            "ML": +0.8,   # Matrilineal society stability
            "MZ": +0.5,
            "MN": +0.7,
            "GJ": +0.9,   # SEWA expansion
            "DL": -0.3,   # Urban crime remains high
        }
        change = change_map.get(code, round((score - 45) * 0.03, 1))
        previous_score = round(score - change, 1)

        # Hot flag — fastest improving states
        hot = code in ["WB", "RJ", "KL"]

        rows.append({
            "state":              state,
            "state_code":         code,
            "ticker":             ticker,
            "region":             region,
            "population_millions": pop,
            "empowerment_score":  emp,
            "education_score":    edu,
            "economic_score":     eco,
            "health_score":       hlt,
            "crime_penalty_score": crime,
            "wei_score":          score,
            "previous_wei_score": previous_score,
            "change":             change,
            "hot":                "true" if hot else "false",
            "verified":           "false",
            "update_frequency":   "annual",
            "key_programs":       key_programs,
            "year":               year,
            "notes":              notes,
        })

    # Sort by WEI score descending
    rows.sort(key=lambda x: x["wei_score"], reverse=True)

    # Add rank
    for i, row in enumerate(rows):
        row["rank"] = i + 1

    # Calculate India national average (population-weighted)
    total_weighted = sum(r["wei_score"] * r["population_millions"] for r in rows)
    total_pop = sum(r["population_millions"] for r in rows)
    india_avg = round(total_weighted / total_pop, 1)

    # Ensure output directory exists
    os.makedirs(
        os.path.dirname(output_path) if os.path.dirname(output_path) else ".",
        exist_ok=True
    )

    # Header comment
    header = (
        f"# SHEtoken WEI India States Baseline — {year}\n"
        f"# Women's Empowerment Index scores for {len(rows)} Indian states\n"
        f"# India population-weighted WEI average: {india_avg}\n"
        f"# Formula: WEI = (Empowerment x 0.25) + (Education x 0.20) "
        f"+ (Economic x 0.20) + (Health x 0.15) - (Crime x 0.20)\n"
        f"# Data sources: NCRB, DISE/UDISE+, NSSO/PLFS, NFHS-5, ECI\n"
        f"# Full methodology: wei-index/methodology.md\n"
        f"# Generated: May 2026 | shetoken.org\n"
        f"#\n"
    )

    fieldnames = [
        "rank", "state", "state_code", "ticker", "region",
        "population_millions", "empowerment_score", "education_score",
        "economic_score", "health_score", "crime_penalty_score",
        "wei_score", "previous_wei_score", "change", "hot",
        "verified", "update_frequency", "key_programs", "year", "notes",
    ]

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        f.write(header)
        f.write(buf.getvalue())

    # Print summary
    print(f"SHEtoken WEI India States {year}")
    print(f"{'='*50}")
    print(f"States scored:            {len(rows)}")
    print(f"India WEI avg ({year}):    {india_avg}")
    print(f"Highest:                  {rows[0]['state']} ({rows[0]['wei_score']})")
    print(f"Lowest:                   {rows[-1]['state']} ({rows[-1]['wei_score']})")
    print(f"Output:                   {output_path}")
    print(f"{'='*50}")
    print(f"\nFull leaderboard:")
    print(f"  {'Rank':<5} {'State':<20} {'Ticker':<12} {'WEI':>6}  {'Change':>7}  {'Hot'}")
    print(f"  {'-'*60}")
    for r in rows:
        hot_flag = " 🔥" if r["hot"] == "true" else ""
        change_str = f"+{r['change']}" if r["change"] >= 0 else str(r["change"])
        print(f"  {r['rank']:<5} {r['state']:<20} {r['ticker']:<12} "
              f"{r['wei_score']:>6}  {change_str:>7}{hot_flag}")


# ── ENTRY POINT ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    generate_india_states(
        output_path="data/india-states-2025.csv",
        year=2025,
    )
