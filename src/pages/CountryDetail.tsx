import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api, CountryWEI } from "@/lib/api";
import { Nav } from "@/components/Nav";
import { CountrySEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList, Cell
} from "recharts";
import {
  ArrowLeft, ArrowRight, BarChart2, TrendingUp, TrendingDown,
  Info, AlertCircle, Users, ShieldAlert, ExternalLink, Cpu, Download
} from "lucide-react";
import { PerformanceSource } from "@/lib/api";
import { MethodologyPanel } from "@/components/MethodologyPanel";
import { LifePathModal } from "@/components/LifePathModal";
import { WeiTrendChart } from "@/components/WeiTrendChart";
import { downloadCountryReport } from "@/lib/countryReport";

/* ── Pillar definitions with global-average and improvement lever ── */
const PILLAR_COLS: Array<{
  key: keyof CountryWEI;
  code: string;          // short WEI sub-pillar code shown on the card
  label: string;
  description: string;
  color: string;
  globalAvg: number;
  improvement: string;
}> = [
  {
    key: "empowerment_score", code: "EMP",
    label: "Empowerment",
    description: "Parliamentary seats, ministerial roles, legal rights",
    color: "text-purple-400",
    globalAvg: 38,
    improvement: "Increasing women in parliament and cabinet, strengthening property and inheritance laws.",
  },
  {
    key: "education_score", code: "EDU",
    label: "Education",
    description: "Literacy, enrollment, STEM, menstrual barriers",
    color: "text-blue-400",
    globalAvg: 62,
    improvement: "Eliminating menstrual barriers to school attendance, expanding girls' STEM pathways.",
  },
  {
    key: "economic_score", code: "ECO",
    label: "Economic",
    description: "Pay gap, formal employment, banking access, property rights",
    color: "text-yellow-400",
    globalAvg: 47,
    improvement: "Equal pay legislation, expanding women's banking access and formal employment.",
  },
  {
    key: "health_score", code: "HLT",
    label: "Health & Survival",
    description: "Maternal mortality, life expectancy, anaemia",
    color: "text-pink-400",
    globalAvg: 67,
    improvement: "Reducing maternal mortality through skilled birth attendance and pre-natal care.",
  },
  {
    key: "safety_justice_score", code: "SAF",
    label: "Safety & Justice",
    description: "DV laws, femicide, honour-based violence, legal aid",
    color: "text-red-400",
    globalAvg: 41,
    improvement: "Enforcing domestic violence legislation, improving reporting rates and prosecution.",
  },
  {
    key: "bodily_autonomy_score", code: "AUT",
    label: "Bodily Autonomy",
    description: "Reproductive rights, child marriage, FGM, period poverty",
    color: "text-orange-400",
    globalAvg: 44,
    improvement: "Ending child marriage, expanding reproductive healthcare access, addressing FGM.",
  },
  {
    key: "dignity_welfare_score", code: "DIG",
    label: "Dignity & Welfare",
    description: "Widow rights, caregiver burden, food insecurity, mental health",
    color: "text-emerald-400",
    globalAvg: 52,
    improvement: "Protecting widow property rights, reducing unpaid caregiver burden on women.",
  },
  {
    key: "digital_social_score", code: "SOC",
    label: "Digital & Social",
    description: "Online harassment, internet & mobile gender gaps",
    color: "text-cyan-400",
    globalAvg: 56,
    improvement: "Closing the mobile ownership gap, enforcing online harassment accountability.",
  },
];

/* ── 8 external SheToken indexes (separate from WEI's internal pillars) ── */
const INDEX_STRIP = [
  { code: "GPI",        label: "Gender Poverty",       color: "text-purple-400", accent: "#a855f7", scoreField: "gpi_score",        queryFn: (iso: string) => import("@/lib/api").then(m => m.api.gpi.country(iso)) },
  { code: "SVI",        label: "Sexual Violence",       color: "text-red-400",    accent: "#ef4444", scoreField: "svi_score",        queryFn: (iso: string) => import("@/lib/api").then(m => m.api.svi.country(iso)) },
  { code: "WADI",       label: "AI Displacement",       color: "text-blue-400",   accent: "#3b82f6", scoreField: "wadi_score",       queryFn: (iso: string) => import("@/lib/api").then(m => m.api.wadi.country(iso)) },
  { code: "WEVI",       label: "Widow Vulnerability",   color: "text-orange-400", accent: "#f97316", scoreField: "wevi_score",       queryFn: (iso: string) => import("@/lib/api").then(m => m.api.wevi.country(iso)) },
  { code: "WHI",        label: "Women's Health",        color: "text-pink-400",   accent: "#ec4899", scoreField: "whi_score",        queryFn: (iso: string) => import("@/lib/api").then(m => m.api.whi.country(iso)) },
  { code: "WVI",        label: "Women's Voice",         color: "text-cyan-400",   accent: "#06b6d4", scoreField: "wvi_score",        queryFn: (iso: string) => import("@/lib/api").then(m => m.api.wvi.country(iso)) },
  { code: "Compliance", label: "Rights Compliance",     color: "text-emerald-400",accent: "#10b981", scoreField: "compliance_score", queryFn: (iso: string) => import("@/lib/api").then(m => m.api.compliance.country(iso)) },
] as const;

/* ── Violence penalty severity thresholds ── */
function violenceSeverity(score: number): { label: string; color: string; context: string } {
  if (score >= 20)
    return {
      label: "Critical",
      color: "text-red-400",
      context:
        "Among the highest documented violence burdens globally. This reflects severe rape prevalence rates, high femicide counts, widespread dowry violence, and/or acid attack incidence — all verified through WHO, UNODC and UN Women data.",
    };
  if (score >= 12)
    return {
      label: "High",
      color: "text-orange-400",
      context:
        "Significant documented violence against women, pulling the WEI materially downward. Drivers include elevated femicide rates, under-prosecuted sexual violence, and systemic barriers to legal recourse for survivors.",
    };
  if (score >= 6)
    return {
      label: "Moderate",
      color: "text-yellow-400",
      context:
        "Moderate violence indicators. Progress on legal frameworks exists, but enforcement gaps and under-reporting keep the penalty elevated. Stronger prosecution and survivor support would reduce this score.",
    };
  return {
    label: "Low",
    color: "text-emerald-400",
    context:
      "Below-average violence penalty, reflecting stronger legal protections and lower documented prevalence. Continued investment in prevention and reporting infrastructure can push this lower.",
  };
}

/* ── Generate performance blurb from country data ── */
function performanceBlurb(c: CountryWEI): string {
  const pillars = PILLAR_COLS.map((p) => ({
    label: p.label.toLowerCase(),
    score: (c[p.key] as number) ?? 0,
  })).sort((a, b) => b.score - a.score);

  const best  = pillars[0];
  const worst = pillars[pillars.length - 1];

  const tierCtx: Record<number, string> = {
    1: "is among the world's strongest performers on gender equality",
    2: "shows moderate protections with meaningful room to grow",
    3: "faces significant structural gaps in women's rights that constrain economic and social participation",
    4: "is in a critical gender equality crisis — rights violations are documented across multiple pillars",
  };

  const trendCtx =
    c.weekly_delta > 0.5
      ? `The WEI is currently trending upward (+${c.weekly_delta.toFixed(2)} this week), signalling recent positive signals.`
      : c.weekly_delta < -0.5
      ? `The WEI is declining (${c.weekly_delta.toFixed(2)} this week), flagging deteriorating conditions or new negative signals.`
      : "The WEI is currently stable — no significant signal movement in the past week.";

  return (
    `${c.country} ${tierCtx[c.tier] ?? "has notable variation across pillars"}. ` +
    `Its strongest area is ${best.label} (${best.score.toFixed(1)} / 100), while ${worst.label} ` +
    `(${worst.score.toFixed(1)} / 100) remains the primary drag on the overall score. ` +
    trendCtx +
    ` A sustained improvement in ${worst.label} would have the largest single impact on ${c.country}'s WEI ranking.`
  );
}

/* ── Pillar card with inline hover-expand ── */
function PillarCard({
  code, label, description, score, color, globalAvg, improvement,
}: {
  code: string;
  label: string;
  description: string;
  score: number;
  color: string;
  globalAvg: number;
  improvement: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.max(0, Math.min(100, score));
  const barColor = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  const delta = score - globalAvg;
  const aboveAvg = delta >= 0;

  return (
    <div
      className="bg-gradient-card border border-border/40 rounded-xl p-5 shadow-card cursor-pointer select-none group"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex items-center justify-between mb-1">
        <div className={`text-xs font-semibold uppercase tracking-widest ${color}`}>{label}</div>
        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${color} border-current bg-current/10`}>
          {code}
        </span>
      </div>
      <div className="text-3xl font-bold mb-2">{score?.toFixed(1) ?? "—"}</div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-muted-foreground">{description}</div>

      {/* Hover-reveal comparison panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-40 opacity-100 mt-3 pt-3 border-t border-border/20" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Global average</span>
            <span className="font-medium">{globalAvg.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">vs. global avg</span>
            <span className={`font-semibold ${aboveAvg ? "text-emerald-400" : "text-red-400"}`}>
              {aboveAvg ? "+" : ""}{delta.toFixed(1)} pts
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Percentile tier</span>
            <span className="font-medium">
              {pct >= 70 ? "Top tier" : pct >= 40 ? "Mid tier" : "Bottom tier"}
            </span>
          </div>
          <p className="text-muted-foreground/80 leading-relaxed mt-1.5">{improvement}</p>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

const TIER_INFO: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: "Preferred", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", desc: "Strong women's rights environment — recommended for investment & operations." },
  2: { label: "Acceptable", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", desc: "Moderate protections in place. Improvement underway." },
  3: { label: "Caution", color: "text-orange-400 border-orange-400/30 bg-orange-400/10", desc: "Significant gaps in rights or enforcement. Monitor closely." },
  4: { label: "Avoid / Embargo", color: "text-red-400 border-red-400/30 bg-red-400/10", desc: "Critical rights violations. Not recommended for investment." },
};

export default function CountryDetail() {
  const { iso } = useParams<{ iso: string }>();
  const navigate = useNavigate();
  const [openMethod, setOpenMethod] = useState<string | null>(null);
  const [lifeModalOpen, setLifeModalOpen] = useState(false);

  const { data: country, isLoading: loadingCountry, error: countryError } = useQuery({
    queryKey: ["country", iso],
    queryFn: () => api.wei.country(iso!),
    enabled: !!iso,
    staleTime: 5 * 60 * 1000,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ["history", iso],
    queryFn: () => api.wei.history(iso!),
    enabled: !!iso,
    staleTime: 5 * 60 * 1000,
  });

  // Some countries don't have lifepath data — catch 404 silently and return null
  const { data: lifepath, isLoading: loadingLifepath } = useQuery({
    queryKey: ["lifepath", iso],
    queryFn: async () => {
      try {
        return await api.lifepath(iso!);
      } catch {
        return null;
      }
    },
    enabled: !!iso,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  // Benchmark cohort for the Life Path modal (Norway = high-outcome reference)
  const benchmarkIso = iso?.toUpperCase() === "NOR" ? "ISL" : "NOR";
  const { data: benchmarkLife } = useQuery({
    queryKey: ["lifepath", benchmarkIso],
    queryFn: async () => { try { return await api.lifepath(benchmarkIso); } catch { return null; } },
    enabled: lifeModalOpen,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  /* ── Per-indicator data provenance (source + collection year) ── */
  const { data: provenance } = useQuery({
    queryKey: ["methodology"],
    queryFn:  api.methodology,
    staleTime: 60 * 60 * 1000,
  });

  /* ── All-country WEI history (faint backdrop for the trend) ── */
  const { data: allHistory } = useQuery({
    queryKey: ["wei-all-history"],
    queryFn:  api.wei.allHistory,
    staleTime: 30 * 60 * 1000,
  });

  /* ── Fetch all 7 external index scores for this country ── */
  const indexQueries = useQueries({
    queries: INDEX_STRIP.map((idx) => ({
      queryKey: ["index-country", idx.code, iso],
      queryFn:  () => idx.queryFn(iso!),
      enabled:  !!iso,
      staleTime: 10 * 60 * 1000,
      retry: false,
    })),
  });

  const chartData = history?.data?.map((row) => ({
    year: row.year,
    score: row.wei_score ?? row.score,
  })).filter((r) => r.score != null) ?? [];

  const tierInfo = country ? TIER_INFO[country.tier] : null;
  const vSeverity = country ? violenceSeverity(country.violence_penalty_score ?? 0) : null;

  function handleDownloadPdf() {
    if (!country) return;
    const indexes = [
      { code: "WEI", label: "Women's Empowerment", accent: "#f59e0b", score: country.wei_score ?? null },
      ...INDEX_STRIP.map((idx, i) => {
        const raw = indexQueries[i].data as Record<string, unknown> | undefined;
        const score = raw
          ? ((raw[idx.scoreField] as number | undefined) ?? (raw.score as number | undefined) ?? null)
          : null;
        return { code: idx.code, label: idx.label, accent: idx.accent, score };
      }),
    ];
    const pillars = PILLAR_COLS.map((p) => ({
      label: p.label, code: p.code, description: p.description,
      score: (country[p.key] as number) ?? 0, globalAvg: p.globalAvg, improvement: p.improvement,
    }));
    const vs = violenceSeverity(country.violence_penalty_score ?? 0);
    const methodRows: Record<string, Record<string, unknown> | undefined> = {
      WEI: country as unknown as Record<string, unknown>,
    };
    INDEX_STRIP.forEach((idx, i) => {
      methodRows[idx.code] = indexQueries[i].data as Record<string, unknown> | undefined;
    });
    void downloadCountryReport({
      country,
      indexes,
      pillars,
      methodRows,
      provenance: provenance?.indexes,
      performanceSummary: performanceBlurb(country),
      violence: { score: country.violence_penalty_score ?? 0, label: vs.label, context: vs.context },
      trend: chartData.filter((d): d is { year: number; score: number } =>
        typeof d.year === "number" && typeof d.score === "number"),
      lifepath: (lifepath?.stages ?? []).map((s) => ({
        age_band: s.age_band, headline: s.headline, cohort: s.cohort,
        detail: s.detail, felt: s.felt, source: s.source,
      })),
      milestones: (lifepath?.milestones ?? []).map((m) => ({ label: m.label, reached: m.reached })),
    });
  }

  if (countryError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-muted-foreground">Country not found: {iso}</p>
        <Link to="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {country && (
        <CountrySEO
          country={country.country}
          iso={country.iso_code}
          score={Number(country.wei_score?.toFixed(1) ?? 0)}
          region={country.region}
        />
      )}
      <Nav />

      <main className="pt-24 pb-20 container max-w-6xl">

        {/* BACK NAVIGATION */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={!country}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 border border-accent/30 hover:border-accent/60 bg-accent/5 hover:bg-accent/10 rounded-lg px-3 py-1.5 transition-smooth disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </button>
            <Link
              to={`/compare?countries=${iso}`}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 border border-accent/30 hover:border-accent/60 bg-accent/5 hover:bg-accent/10 rounded-lg px-3 py-1.5 transition-smooth"
            >
              <BarChart2 className="h-3.5 w-3.5" /> Compare with another country
            </Link>
          </div>
        </div>

        {loadingCountry ? (
          <div className="py-20 text-center text-muted-foreground">Loading country data…</div>
        ) : country ? (
          <>
            {/* COUNTRY HEADER */}
            <section className="mb-10">
              <div className="flex flex-col md:flex-row md:items-end gap-6 mb-6">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <BarChart2 className="h-3.5 w-3.5" /> {country.region} · Rank #{country.rank} globally
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold mb-3">
                    {country.country}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20">
                      {country.ticker}
                    </span>
                    {tierInfo && (
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${tierInfo.color}`}>
                        Tier {country.tier}: {tierInfo.label}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {country.population_millions?.toFixed(1)}M population
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-7xl font-bold text-gradient">{country.wei_score?.toFixed(1)}</div>
                  <div className="text-muted-foreground text-sm">WEI Score / 100</div>
                  {country.weekly_delta !== 0 && (
                    <div className={`flex items-center justify-end gap-1 mt-1 text-sm ${country.weekly_delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {country.weekly_delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {country.weekly_delta > 0 ? "+" : ""}{country.weekly_delta?.toFixed(2)} this week
                    </div>
                  )}
                </div>
              </div>

              {tierInfo && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${tierInfo.color} text-sm`}>
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{tierInfo.desc}</span>
                </div>
              )}
            </section>

            {/* 8-INDEX SCORECARD */}
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-1">8-Index Scorecard</h2>
              <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                <Info className="h-3 w-3" />
                These are 8 separate SheToken indexes — not WEI sub-pillars. Click any tile to see how its score is calculated and the data sources.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {/* WEI tile */}
                <button
                  onClick={() => setOpenMethod(openMethod === "WEI" ? null : "WEI")}
                  className={`bg-gradient-card border rounded-xl p-3 text-center shadow-card transition-all hover:scale-[1.03] cursor-pointer ${
                    openMethod === "WEI" ? "ring-2 ring-amber-400 border-amber-400/60" : "border-amber-400/30"
                  }`}
                >
                  <div className="text-[10px] font-bold font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5 inline-block mb-2">WEI</div>
                  <div className="text-2xl font-bold text-gradient leading-none mb-1">{country.wei_score?.toFixed(1)}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">Women's<br />Empowerment</div>
                </button>

                {/* External index tiles */}
                {INDEX_STRIP.map((idx, i) => {
                  const q = indexQueries[i];
                  const raw = q.data;
                  const score = raw
                    ? ((raw[idx.scoreField as keyof typeof raw] as number | undefined) ??
                       (raw.score as number | undefined))
                    : null;
                  const isOpen = openMethod === idx.code;
                  return (
                    <button
                      key={idx.code}
                      onClick={() => setOpenMethod(isOpen ? null : idx.code)}
                      className={`bg-gradient-card border rounded-xl p-3 text-center shadow-card transition-all hover:scale-[1.03] cursor-pointer ${isOpen ? "ring-2" : ""}`}
                      style={{ borderColor: `${idx.accent}${isOpen ? "99" : "33"}`, ...(isOpen ? { boxShadow: `0 0 0 2px ${idx.accent}` } : {}) }}
                    >
                      <div
                        className="text-[10px] font-bold font-mono rounded px-1.5 py-0.5 inline-block mb-2 border"
                        style={{ color: idx.accent, backgroundColor: `${idx.accent}18`, borderColor: `${idx.accent}40` }}
                      >
                        {idx.code}
                      </div>
                      {idx.code === "Compliance" && (
                        <div className="text-[8px] font-semibold uppercase tracking-wide mb-1 opacity-70" style={{ color: idx.accent }}>
                          derived
                        </div>
                      )}
                      <div className="text-2xl font-bold leading-none mb-1" style={{ color: idx.accent }}>
                        {q.isLoading ? "…" : score != null ? score.toFixed(1) : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">{idx.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Methodology breakdown for the clicked index */}
              {openMethod && (
                <MethodologyPanel
                  code={openMethod}
                  country={country.country}
                  row={
                    openMethod === "WEI"
                      ? (country as unknown as Record<string, unknown>)
                      : (indexQueries[INDEX_STRIP.findIndex((x) => x.code === openMethod)]?.data as Record<string, unknown> | undefined)
                  }
                  provenance={provenance?.indexes?.[openMethod]}
                  onClose={() => setOpenMethod(null)}
                />
              )}
            </section>

            {/* PERFORMANCE SUMMARY — SLM blurb when available, template fallback */}
            <section className="mb-10">
              <div className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" /> Performance Summary
                  {country.performance_summary && (
                    <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground normal-case tracking-normal">
                      <Cpu className="h-3 w-3" /> signal-backed · Phi-3.5
                    </span>
                  )}
                </h2>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {country.performance_summary ?? performanceBlurb(country)}
                </p>

                {/* Source links — only shown when SLM blurb is present */}
                {country.sources && country.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/20 space-y-2">
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-widest mb-2">
                      Signal sources this week
                    </p>
                    {country.sources.map((src: PerformanceSource, i: number) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 group hover:bg-accent/5 rounded-lg p-2 -mx-2 transition-smooth"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground group-hover:text-accent transition-smooth truncate leading-snug">
                            {src.title || src.source}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-2">
                            <span>{src.source}</span>
                            {src.pillar && (
                              <span className="uppercase tracking-widest text-accent/60">
                                {src.pillar.replace(/_/g, " ")}
                              </span>
                            )}
                            {src.date && <span>{new Date(src.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* No sources — show data attribution */}
                {(!country.sources || country.sources.length === 0) && (
                  <div className="mt-4 pt-4 border-t border-border/20">
                    <p className="text-xs text-muted-foreground/60 italic">
                      Scores derived from UN Women, World Bank, WHO, UNESCO and UNODC data for {country.year}.
                      Signal-backed summaries appear after the weekly pipeline runs.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* PILLAR CARDS */}
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-2">8 Pillar Breakdown</h2>
              <p className="text-xs text-muted-foreground mb-5 flex items-center gap-1">
                <Info className="h-3 w-3" /> Hover any card to see improvement lever and vs. global average
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PILLAR_COLS.map((col) => (
                  <PillarCard
                    key={col.key}
                    code={col.code}
                    label={col.label}
                    description={col.description}
                    score={(country[col.key] as number) ?? 0}
                    color={col.color}
                    globalAvg={col.globalAvg}
                    improvement={col.improvement}
                  />
                ))}
              </div>
            </section>

            {/* VIOLENCE PENALTY */}
            {country.violence_penalty_score != null && vSeverity && (
              <section className="mb-10">
                <div className="bg-gradient-card border border-red-400/20 rounded-xl p-5 shadow-card">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                      <ShieldAlert className="h-6 w-6 text-red-400" />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-0.5">
                          Violence Penalty ·{" "}
                          <span className={vSeverity.color}>{vSeverity.label}</span>
                        </div>
                        <div className="text-4xl font-bold text-red-400 leading-none">
                          −{country.violence_penalty_score?.toFixed(1)} pts
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          subtracted from total WEI score
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {vSeverity.context}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: "Covers", value: "Rape prevalence, femicide, acid attacks, dowry violence, HBV" },
                          { label: "Impact", value: `Removes ${country.violence_penalty_score?.toFixed(1)} points directly from the composite WEI score` },
                          { label: "Data sources", value: "WHO, UNODC, UN Women — verified annually" },
                          { label: "To reduce this", value: "Prosecution rates, survivor legal aid, DV law enforcement" },
                        ].map((item) => (
                          <div key={item.label} className="bg-red-400/5 border border-red-400/10 rounded-lg p-2">
                            <div className="text-red-400/70 font-medium mb-0.5">{item.label}</div>
                            <div className="text-muted-foreground leading-relaxed">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* WEI TREND CHART — selected country vs. all 105 countries */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-xl font-bold">WEI Score Trend (2015–2024)</h2>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 rounded" style={{ background: "#f59e0b" }} />{country.country}</span>
                  <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 rounded border-t border-dashed" style={{ borderColor: "hsl(260 15% 65%)", height: 0 }} />Global avg</span>
                  <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 rounded" style={{ background: "hsl(260 15% 45%)", opacity: 0.4 }} />All countries</span>
                </div>
              </div>
              <div className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
                {loadingHistory && !allHistory ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">Loading trend data…</div>
                ) : chartData.length < 2 && !allHistory ? (
                  <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <BarChart2 className="h-8 w-8 opacity-40" />
                    <span className="text-sm">Trend data accumulating — check back next cycle.</span>
                  </div>
                ) : (
                  <>
                    <WeiTrendChart
                      years={allHistory?.years ?? chartData.map(d => d.year as number)}
                      countries={allHistory?.countries ?? []}
                      globalAvg={allHistory?.global_avg ?? []}
                      selectedIso={country.iso_code}
                      selectedName={country.country}
                      selectedScores={
                        allHistory?.countries.find(c => c.iso_code === country.iso_code)?.scores
                        ?? chartData.map(d => (d.score as number) ?? null)
                      }
                    />
                    <p className="text-[11px] text-muted-foreground/60 mt-2 text-center">
                      Hover any line to identify the country.
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* STATS SIDEBAR */}
            <section className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <StatRow label="Rank" value={`#${country.rank} of ${105}`} />
                <StatRow label="Region" value={country.region} />
                <StatRow label="Tier" value={`${country.tier} — ${TIER_INFO[country.tier]?.label}`} />
                <StatRow label="Token" value={<span className="font-mono text-accent">{country.ticker}</span>} />
                <StatRow label="Population" value={`${country.population_millions?.toFixed(1)}M`} />
                <StatRow label="Data Year" value={country.year} />
              </div>

              {lifepath?.stages?.length && !loadingLifepath ? (
                <div className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
                  <h3 className="text-lg font-semibold mb-4">Life Path: 100 Girls</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    What happens to 100 girls born in {country.country} today, across their life stages.
                  </p>
                  <div className="space-y-3">
                    {lifepath.stages?.slice(0, 5).map((stage) => (
                      <div key={stage.stage} className="flex items-start gap-3 border-l-2 border-accent/30 pl-3">
                        <div className="shrink-0 w-16 text-[11px] font-mono text-accent leading-tight pt-0.5">
                          {stage.age_band}
                          <div className="text-[9px] text-muted-foreground/60 mt-0.5">{stage.stage}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-snug">{stage.headline}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{stage.cohort}</div>
                          {stage.detail && (
                            <div className="text-[11px] text-muted-foreground/60 mt-1">{stage.detail}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setLifeModalOpen(true)}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 border border-accent/30 hover:border-accent/60 bg-accent/5 hover:bg-accent/10 rounded-lg px-3 py-2 transition-smooth"
                  >
                    View full journey &amp; drop-off funnel <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                /* Placeholder when lifepath not available */
                <div className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card flex flex-col items-center justify-center text-center gap-3">
                  <Users className="h-8 w-8 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Life path data</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Life path modelling for {country.country} is being computed. Check back next update cycle.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>

      {/* Life Path funnel modal */}
      {lifepath?.milestones?.length ? (
        <LifePathModal
          open={lifeModalOpen}
          onClose={() => setLifeModalOpen(false)}
          lifepath={lifepath}
          benchmark={benchmarkLife}
          benchmarkLabel={benchmarkLife?.country}
        />
      ) : null}

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 SheToken · Data: api.shetoken.org</span>
          <Link to="/dashboard" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to all countries
          </Link>
        </div>
      </footer>
    </div>
  );
}
