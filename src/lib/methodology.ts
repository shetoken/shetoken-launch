/**
 * Per-index methodology + data-source registry.
 * Drives the "How this score is calculated" breakdown on the country profile.
 *
 * Three calculation kinds:
 *   weighted   — score = Σ(value × weight) ÷ Σweight   (WEI, Compliance) — exactly reproducible
 *   average    — score = mean(sub-scores)               (GPI)            — exactly reproducible
 *   indicators — raw inputs shown; normalised & combined per methodology v3.0
 *                (SVI, WADI, WEVI, WHI, WVI) — inputs + sources shown, exact weights in the doc
 *
 * `field` names match the keys returned by the per-country index API rows.
 */

export type MethodKind = "weighted" | "average" | "indicators";

/** A primary-source indicator that composes a WEI pillar. */
export interface SubIndicator {
  label: string;
  weight: string;     // intra-pillar weight, e.g. "30%"
  source: string;     // source-body name (see SRC)
}

export interface MethodComponent {
  label: string;
  field: string;      // API field on the index row
  weight?: number;    // weighted/composite kinds
  invert?: boolean;   // value used = 100 − raw (e.g. WADI inside Compliance)
  unit?: string;      // "%", "/100k", "/10", "/6", "yrs"
  source?: string;    // short per-indicator source tag
  indicators?: SubIndicator[];  // pillar sub-indicators (WEI only) — drill-down
}

export interface IndexMethodology {
  code: string;
  title: string;
  accent: string;
  kind: MethodKind;
  scoreField: string;
  formula: string;
  components: MethodComponent[];
  sources: { name: string; url: string }[];
  note: string;
  vintage: string;    // data vintage / "as of" — when the underlying data is from
  derived?: boolean;  // true = composite of OTHER SheToken indexes, not raw data
}

const SRC = {
  unwomen:   { name: "UN Women",            url: "https://data.unwomen.org" },
  wbgender:  { name: "World Bank Gender",   url: "https://genderdata.worldbank.org" },
  unesco:    { name: "UNESCO UIS",          url: "https://uis.unesco.org" },
  unodc:     { name: "UNODC",               url: "https://www.unodc.org/unodc/en/data-and-analysis" },
  who:       { name: "WHO GHO",             url: "https://www.who.int/data/gho" },
  ilo:       { name: "ILO ILOSTAT",         url: "https://ilostat.ilo.org" },
  oecd:      { name: "OECD",                url: "https://www.oecd.org/gender/" },
  wef:       { name: "WEF Gender Gap",      url: "https://www.weforum.org/reports/global-gender-gap-report-2024" },
  ipu:       { name: "IPU Parline",         url: "https://data.ipu.org" },
  vdem:      { name: "V-Dem",               url: "https://v-dem.net" },
  rsf:       { name: "RSF Press Freedom",   url: "https://rsf.org/en/index" },
  unicef:    { name: "UNICEF Data",         url: "https://data.unicef.org" },
  nfhs:      { name: "NFHS-5 (India)",      url: "http://rchiips.org/nfhs/" },
  ncrb:      { name: "NCRB Crime in India", url: "https://www.ncrb.gov.in/crime-in-india" },
} as const;

export const METHODOLOGY: Record<string, IndexMethodology> = {
  WEI: {
    code: "WEI",
    title: "Women's Empowerment Index",
    accent: "#f59e0b",
    kind: "weighted",
    scoreField: "wei_score",
    formula: "WEI = Σ(pillar × weight) − (Violence Penalty × 0.10)",
    components: [
      { label: "Empowerment", field: "empowerment_score", weight: 0.15, indicators: [
        { label: "% parliamentary seats held by women", weight: "30%", source: "IPU Parline" },
        { label: "% ministerial positions held by women", weight: "20%", source: "UN Women" },
        { label: "Women's legal rights index", weight: "25%", source: "World Bank WBL" },
        { label: "Freedom of movement", weight: "15%", source: "OECD SIGI" },
        { label: "% women in senior management", weight: "10%", source: "ILO" },
      ]},
      { label: "Bodily Autonomy", field: "bodily_autonomy_score", weight: 0.15, indicators: [
        { label: "Child marriage rate (under 18)", weight: "30%", source: "UNICEF MICS" },
        { label: "Reproductive rights legal score", weight: "25%", source: "Guttmacher / HRW" },
        { label: "FGM prevalence", weight: "20%", source: "UNICEF / WHO" },
        { label: "Access to contraception", weight: "15%", source: "WHO / UNFPA" },
        { label: "Menstrual health / product access", weight: "10%", source: "UNICEF / Plan Intl" },
      ]},
      { label: "Safety & Justice", field: "safety_justice_score", weight: 0.14, indicators: [
        { label: "DV law strength & enforcement", weight: "30%", source: "UN Women" },
        { label: "% female police officers", weight: "20%", source: "UNODC" },
        { label: "Free legal-aid access", weight: "20%", source: "World Bank Justice" },
        { label: "Rape reporting rate", weight: "15%", source: "UNODC / WHO" },
        { label: "DV shelter coverage", weight: "15%", source: "UN Women" },
      ]},
      { label: "Education", field: "education_score", weight: 0.12, indicators: [
        { label: "Female adult literacy (15+)", weight: "35%", source: "UNESCO UIS" },
        { label: "Female primary enrollment", weight: "20%", source: "UNESCO" },
        { label: "Female secondary enrollment", weight: "20%", source: "UNESCO" },
        { label: "Female tertiary enrollment", weight: "15%", source: "UNESCO" },
        { label: "Female STEM participation", weight: "10%", source: "UNESCO / OECD" },
      ]},
      { label: "Economic", field: "economic_score", weight: 0.12, indicators: [
        { label: "Gender pay gap", weight: "30%", source: "ILO Global Wage Report" },
        { label: "Female labour-force participation", weight: "25%", source: "ILO" },
        { label: "% women with a bank account", weight: "20%", source: "World Bank Findex" },
        { label: "Women's property-ownership rights", weight: "15%", source: "World Bank WBL" },
        { label: "% women-owned businesses", weight: "10%", source: "IFC / World Bank" },
      ]},
      { label: "Health", field: "health_score", weight: 0.12, indicators: [
        { label: "Maternal mortality ratio (per 100k)", weight: "35%", source: "WHO GHO" },
        { label: "Female life expectancy", weight: "25%", source: "WHO / World Bank" },
        { label: "Adolescent birth rate", weight: "20%", source: "WHO" },
        { label: "Skilled-birth-attendant access", weight: "10%", source: "WHO" },
        { label: "Female-to-male survival ratio", weight: "10%", source: "World Bank" },
      ]},
      { label: "Dignity & Welfare", field: "dignity_welfare_score", weight: 0.10, indicators: [
        { label: "Widow property-rights enforcement", weight: "25%", source: "World Bank / HRW" },
        { label: "Food-insecurity gender gap", weight: "25%", source: "FAO SOFI" },
        { label: "Unpaid care-work hours ratio", weight: "25%", source: "ILO / OECD" },
        { label: "Women's housing security", weight: "15%", source: "UN Habitat" },
        { label: "Elder-care access", weight: "10%", source: "HelpAge International" },
      ]},
      { label: "Digital & Social", field: "digital_social_score", weight: 0.10, indicators: [
        { label: "Internet gender gap", weight: "30%", source: "GSMA / ITU" },
        { label: "Online-harassment law strength", weight: "25%", source: "APC / ITU" },
        { label: "% women in tech workforce", weight: "25%", source: "ILO / UNESCO" },
        { label: "Mobile-phone ownership gap", weight: "20%", source: "GSMA" },
      ]},
      { label: "− Violence Penalty", field: "violence_penalty_score", weight: -0.10, indicators: [
        { label: "Rape rate per 100k women", weight: "30%", source: "UNODC (+ WHO adj.)" },
        { label: "Domestic-violence prevalence", weight: "25%", source: "WHO / UN Women" },
        { label: "Femicide rate", weight: "20%", source: "UNODC" },
        { label: "Trafficking rate", weight: "15%", source: "UNODC" },
        { label: "Acid attacks / disfigurement", weight: "10%", source: "UNODC / national records" },
      ]},
    ],
    sources: [SRC.unwomen, SRC.wbgender, SRC.unesco, SRC.who, SRC.unodc, SRC.ilo, SRC.ipu, SRC.oecd],
    note: "SHEtoken's native composite. 8 pillars (each a weighted blend of primary-source indicators, normalised 0–100) minus a violence penalty. Click any pillar below to see its indicators and sources. Inverted indicators (e.g. maternal mortality, pay gap, rape rate) are flipped so higher always = better. The penalty is subtracted — a higher penalty lowers the WEI; where WHO survey data exists it is weighted 70% vs 30% UNODC to correct underreporting.",
    vintage: "2025 baseline · primary-source releases 2023–2025",
  },

  GPI: {
    code: "GPI",
    title: "Gender Poverty Index",
    accent: "#a855f7",
    kind: "average",
    scoreField: "gpi_score",
    formula: "GPI = mean of 9 normalised sub-scores (0–100)",
    components: [
      { label: "Income poverty (F:M)",  field: "gpi_income_poverty",       source: SRC.wbgender.name },
      { label: "Wealth gap",            field: "gpi_wealth",               source: SRC.wbgender.name },
      { label: "Wage gap",              field: "gpi_wage",                 source: SRC.ilo.name },
      { label: "Labour participation",  field: "gpi_labour_participation", source: SRC.ilo.name },
      { label: "Financial inclusion",   field: "gpi_financial_inclusion",  source: SRC.wbgender.name },
      { label: "Food security",         field: "gpi_food_security",        source: SRC.who.name },
      { label: "Time poverty",          field: "gpi_time_poverty",         source: SRC.oecd.name },
      { label: "Land ownership",        field: "gpi_land_ownership",       source: SRC.wbgender.name },
      { label: "Social protection",     field: "gpi_social_protection",    source: SRC.ilo.name },
    ],
    sources: [SRC.wbgender, SRC.ilo, SRC.oecd, SRC.who],
    note: "Female economic deprivation relative to men. Each sub-score is normalised 0–100 (higher = better) then averaged.",
    vintage: "2025 edition · World Bank / ILO / OECD releases 2022–2024",
  },

  SVI: {
    code: "SVI",
    title: "Sexual Violence Index",
    accent: "#ef4444",
    kind: "indicators",
    scoreField: "svi_score",
    formula: "Prevalence, legal protection & support services → normalised 0–100 (higher = safer)",
    components: [
      { label: "WHO lifetime prevalence", field: "who_lifetime_prevalence_pct",   unit: "%",     source: SRC.who.name },
      { label: "Reported rate",           field: "unodc_reported_rate_per_100k",   unit: "/100k", source: "UNODC / NCRB" },
      { label: "Reporting gap",           field: "reporting_gap_pct",              unit: "%",     source: SRC.unodc.name },
      { label: "Est. actual rate",        field: "estimated_actual_rate_per_100k", unit: "/100k", source: SRC.who.name },
      { label: "Marital rape criminalised", field: "marital_rape_criminalised",    unit: "0/1",   source: SRC.unwomen.name },
      { label: "Digital sexual violence", field: "digital_sv_rate_pct",            unit: "%",     source: SRC.unwomen.name },
      { label: "Legal framework",         field: "legal_framework_score",          unit: "/10",   source: SRC.unwomen.name },
      { label: "Support services",        field: "support_services_score",         unit: "/10",   source: SRC.who.name },
    ],
    sources: [SRC.who, SRC.unodc, SRC.unwomen, SRC.ncrb],
    note: "Higher score = safer. Combines prevalence surveys, reporting gaps, legal protection and survivor support. India's reported-crime figures are anchored to NCRB 'Crime in India'. Exact sub-weights in methodology v3.0.",
    vintage: "2025 edition · WHO / UNODC releases 2018–2024",
  },

  WADI: {
    code: "WADI",
    title: "Women & AI Displacement Index",
    accent: "#3b82f6",
    kind: "indicators",
    scoreField: "wadi_score",
    formula: "Automation exposure vs. adaptive capacity → normalised 0–100 (higher = more at risk)",
    components: [
      { label: "Female workforce in high-risk sectors", field: "pct_female_workforce_in_high_risk_sectors", unit: "%",   source: SRC.ilo.name },
      { label: "Digital skills gap",      field: "digital_skills_gap_score",  unit: "/100", source: SRC.wef.name },
      { label: "Reskilling access",       field: "reskilling_access_score",   unit: "/100", source: SRC.oecd.name },
      { label: "Women in AI/tech",        field: "pct_women_in_ai_tech",      unit: "%",    source: SRC.wef.name },
      { label: "Remote-work access",      field: "remote_work_access_pct",    unit: "%",    source: SRC.ilo.name },
      { label: "Unemployment coverage",   field: "unemployment_coverage_pct", unit: "%",    source: SRC.ilo.name },
      { label: "Gig-worker share",        field: "gig_worker_pct",            unit: "%",    source: SRC.ilo.name },
      { label: "AI-policy gender inclusion", field: "ai_policy_gender_inclusion", unit: "/10", source: SRC.oecd.name },
    ],
    sources: [SRC.ilo, SRC.oecd, SRC.wef],
    note: "Estimates how exposed women's jobs are to AI automation and the capacity to adapt. Exact sub-weights in methodology v3.0.",
    vintage: "2025 edition · ILO / OECD / WEF releases 2023–2025",
  },

  WEVI: {
    code: "WEVI",
    title: "Widow Vulnerability Index",
    accent: "#f97316",
    kind: "indicators",
    scoreField: "wevi_score",
    formula: "Legal, economic & social status of widows → normalised 0–100 (higher = better protected)",
    components: [
      { label: "Widow population",        field: "widow_population_millions", unit: "M",   source: SRC.unwomen.name },
      { label: "Widows in poverty",       field: "widows_in_poverty_pct",     unit: "%",   source: SRC.unwomen.name },
      { label: "Legal inheritance rights",field: "legal_inheritance_rights",  unit: "/6",  source: SRC.wbgender.name },
      { label: "Inheritance enforcement", field: "inheritance_enforcement",   unit: "/10", source: SRC.wbgender.name },
      { label: "Social restrictions",     field: "social_restrictions_score", unit: "/10", source: SRC.unwomen.name },
      { label: "Abandonment rate",        field: "widow_abandonment_rate",    unit: "%",   source: SRC.unwomen.name },
      { label: "Elderly women homeless",  field: "elderly_women_homeless_pct",unit: "%",   source: SRC.unwomen.name },
      { label: "Pension coverage",        field: "pension_coverage_pct",      unit: "%",   source: SRC.ilo.name },
      { label: "Elder-care access",       field: "elder_care_access_score",   unit: "/10", source: SRC.who.name },
    ],
    sources: [SRC.unwomen, SRC.wbgender, SRC.ilo, SRC.who],
    note: "Higher score = widows better protected. Combines inheritance law, poverty, social stigma and elder-care access. Exact sub-weights in methodology v3.0.",
    vintage: "2025 edition · UN Women / World Bank releases 2021–2024",
  },

  WHI: {
    code: "WHI",
    title: "Women's Health Index",
    accent: "#ec4899",
    kind: "indicators",
    scoreField: "whi_score",
    formula: "Maternal, reproductive & mental-health indicators → normalised 0–100 (higher = healthier)",
    components: [
      { label: "Maternal mortality (childbirth deaths)", field: "maternal_mortality_per_100k", unit: "/100k", source: SRC.who.name },
      { label: "Depression prevalence",  field: "depression_prev_pct",      unit: "%",     source: SRC.who.name },
      { label: "Suicide rate",           field: "suicide_rate_per_100k",    unit: "/100k", source: SRC.who.name },
      { label: "Anaemia",                field: "anaemia_pct",              unit: "%",     source: SRC.nfhs.name },
      { label: "Menstrual access",       field: "menstrual_access_pct",     unit: "%",     source: SRC.unicef.name },
      { label: "Contraceptive unmet need",field: "contraceptive_unmet_pct", unit: "%",     source: SRC.who.name },
      { label: "Maternal MH support",    field: "maternal_mh_support",      unit: "/10",   source: SRC.who.name },
    ],
    sources: [SRC.who, SRC.unicef, SRC.nfhs],
    note: "Higher score = healthier. Maternal mortality — death due to childbirth (WHO 2020, deaths per 100k live births) — carries the largest weight (20%); a country scores 0 on this dimension at ≥500 deaths/100k. The rest cover mental and reproductive health. Inverted indicators (mortality, depression, suicide, anaemia, unmet need) are flipped so higher = better.",
    vintage: "2025 edition · maternal mortality WHO GHO 2020 · mental/menstrual modelled, anaemia NFHS-5 2019–21",
  },

  WVI: {
    code: "WVI",
    title: "Women's Voice Index",
    accent: "#06b6d4",
    kind: "indicators",
    scoreField: "wvi_score",
    formula: "Political representation & civic freedom → normalised 0–100 (higher = louder voice)",
    components: [
      { label: "Online gender-based violence", field: "online_gbv_pct",    unit: "%",   source: SRC.unwomen.name },
      { label: "Media leadership",       field: "media_leadership_pct",     unit: "%",   source: SRC.vdem.name },
      { label: "Women in tech",          field: "women_tech_pct",           unit: "%",   source: SRC.wef.name },
      { label: "Civil society",          field: "civil_society_score",      unit: "/10", source: SRC.vdem.name },
      { label: "Women journalists",      field: "journalists_pct",          unit: "%",   source: SRC.rsf.name },
      { label: "Press freedom",          field: "press_freedom_score",      unit: "/10", source: SRC.rsf.name },
    ],
    sources: [SRC.ipu, SRC.vdem, SRC.rsf, SRC.wef],
    note: "Higher score = louder voice. Combines representation, media presence and press/protest freedom. Exact sub-weights in methodology v3.0.",
    vintage: "2025 edition · IPU / V-Dem / RSF releases 2023–2024",
  },

  Compliance: {
    code: "Compliance",
    title: "Rights Compliance Index (WRBCS)",
    accent: "#10b981",
    kind: "weighted",
    scoreField: "compliance_score",
    formula: "Compliance = (WEI×0.40 + SVI×0.25 + GPI×0.20 + (100−WADI)×0.15) ÷ Σweight",
    components: [
      { label: "WEI",            field: "wei_score",  weight: 0.40 },
      { label: "SVI",            field: "svi_score",  weight: 0.25 },
      { label: "GPI",            field: "gpi_score",  weight: 0.20 },
      { label: "WADI (inverted)",field: "wadi_score", weight: 0.15, invert: true },
    ],
    sources: [SRC.unwomen, SRC.wbgender, SRC.who, SRC.unodc, SRC.ilo],
    note: "A DERIVED index — unlike the others it uses no new primary data. It is a weighted re-mix of WEI, SVI, GPI and WADI to give corporations a single outsourcing-risk number. WADI is inverted (100−WADI) because higher AI-displacement risk worsens compliance. Its true data sources are whatever feed those four upstream indexes.",
    vintage: "2025 · recomputed from current WEI / SVI / GPI / WADI",
    derived: true,
  },
};

/** Reproduce the final score from a country's index row, for the weighted/average kinds. */
export function computeScore(
  m: IndexMethodology,
  row: Record<string, unknown>,
): { contributions: { label: string; raw: number; used: number; contribution?: number; weight?: number }[]; total: number | null } {
  const contributions = m.components.map((c) => {
    const raw  = Number(row[c.field] ?? NaN);
    const used = c.invert ? 100 - raw : raw;
    if (m.kind === "weighted" && c.weight != null) {
      return { label: c.label, raw, used, weight: c.weight, contribution: used * c.weight };
    }
    return { label: c.label, raw, used };
  });

  if (m.kind === "weighted") {
    const totalWeight = m.components.reduce((s, c) => s + Math.abs(c.weight ?? 0), 0);
    const sum = contributions.reduce((s, c) => s + (c.contribution ?? 0), 0);
    // WEI weights sum to 1.0 incl. the −0.10 penalty already in the sum; Compliance weights sum to 1.0.
    const total = totalWeight ? sum / (m.code === "Compliance" ? totalWeight : 1) : null;
    return { contributions, total: total != null ? Math.round(total * 10) / 10 : null };
  }
  if (m.kind === "average") {
    const vals = contributions.map((c) => c.used).filter((v) => !isNaN(v));
    const total = vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null;
    return { contributions, total };
  }
  return { contributions, total: null };
}
