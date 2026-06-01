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

export interface MethodComponent {
  label: string;
  field: string;      // API field on the index row
  weight?: number;    // weighted/composite kinds
  invert?: boolean;   // value used = 100 − raw (e.g. WADI inside Compliance)
  unit?: string;      // "%", "/100k", "/10", "/6", "yrs"
  source?: string;    // short per-indicator source tag
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
      { label: "Empowerment",       field: "empowerment_score",     weight: 0.15 },
      { label: "Bodily Autonomy",   field: "bodily_autonomy_score", weight: 0.15 },
      { label: "Safety & Justice",  field: "safety_justice_score",  weight: 0.14 },
      { label: "Education",         field: "education_score",       weight: 0.12 },
      { label: "Economic",          field: "economic_score",        weight: 0.12 },
      { label: "Health",            field: "health_score",          weight: 0.12 },
      { label: "Dignity & Welfare", field: "dignity_welfare_score", weight: 0.10 },
      { label: "Digital & Social",  field: "digital_social_score",  weight: 0.10 },
      { label: "− Violence Penalty",field: "violence_penalty_score",weight: -0.10 },
    ],
    sources: [SRC.unwomen, SRC.wbgender, SRC.unesco, SRC.who, SRC.unodc, SRC.ilo],
    note: "SHEtoken's native composite. 8 pillars (each normalised 0–100) minus a violence penalty. The penalty is subtracted, so a higher penalty score lowers the WEI.",
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
      { label: "Reported rate",           field: "unodc_reported_rate_per_100k",   unit: "/100k", source: SRC.unodc.name },
      { label: "Reporting gap",           field: "reporting_gap_pct",              unit: "%",     source: SRC.unodc.name },
      { label: "Est. actual rate",        field: "estimated_actual_rate_per_100k", unit: "/100k", source: SRC.who.name },
      { label: "Marital rape criminalised", field: "marital_rape_criminalised",    unit: "0/1",   source: SRC.unwomen.name },
      { label: "Digital sexual violence", field: "digital_sv_rate_pct",            unit: "%",     source: SRC.unwomen.name },
      { label: "Legal framework",         field: "legal_framework_score",          unit: "/10",   source: SRC.unwomen.name },
      { label: "Support services",        field: "support_services_score",         unit: "/10",   source: SRC.who.name },
    ],
    sources: [SRC.who, SRC.unodc, SRC.unwomen],
    note: "Higher score = safer. Combines prevalence surveys, reporting gaps, legal protection and survivor support. Exact sub-weights in methodology v3.0.",
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
  },

  WHI: {
    code: "WHI",
    title: "Women's Health Index",
    accent: "#ec4899",
    kind: "indicators",
    scoreField: "whi_score",
    formula: "Reproductive & mental-health indicators → normalised 0–100 (higher = healthier)",
    components: [
      { label: "Depression prevalence",  field: "depression_prev_pct",      unit: "%",     source: SRC.who.name },
      { label: "Suicide rate",           field: "suicide_rate_per_100k",    unit: "/100k", source: SRC.who.name },
      { label: "Anaemia",                field: "anaemia_pct",              unit: "%",     source: SRC.nfhs.name },
      { label: "Menstrual access",       field: "menstrual_access_pct",     unit: "%",     source: SRC.unicef.name },
      { label: "Contraceptive unmet need",field: "contraceptive_unmet_pct", unit: "%",     source: SRC.who.name },
      { label: "Maternal MH support",    field: "maternal_mh_support",      unit: "/10",   source: SRC.who.name },
    ],
    sources: [SRC.who, SRC.unicef, SRC.nfhs],
    note: "Higher score = healthier. Focus on reproductive and mental health. Exact sub-weights in methodology v3.0.",
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
    note: "Corporate outsourcing-risk score, derived from four other indexes. WADI is inverted (100−WADI) because higher AI-displacement risk worsens compliance.",
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
