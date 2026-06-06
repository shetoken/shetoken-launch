import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, isApiFallback, CountryWEI, IndexScore } from "@/lib/api";
import { ApiVersionSelect, ShadowBanner } from "@/components/ApiVersionSelect";
import { useApiVersion } from "@/config/apiVersion";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorldMap } from "@/components/WorldMap";
import {
  ArrowRight, ArrowUpDown, TrendingUp, TrendingDown,
  Search, Globe2, Sparkles, AlertCircle, Map as MapIcon, List, X, Loader2,
  Activity, Zap, ShieldAlert, Clock,
} from "lucide-react";

/* ── Tier labels ── */
const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Preferred", color: "text-emerald-400" },
  2: { label: "Acceptable", color: "text-yellow-400" },
  3: { label: "Caution", color: "text-orange-400" },
  4: { label: "Avoid", color: "text-red-400" },
};

/* ── Table pillar columns ── */
const PILLAR_COLS: Array<{ key: keyof CountryWEI; label: string }> = [
  { key: "empowerment_score", label: "Empowerment" },
  { key: "education_score", label: "Education" },
  { key: "economic_score", label: "Economic" },
  { key: "health_score", label: "Health" },
  { key: "safety_justice_score", label: "Safety" },
  { key: "bodily_autonomy_score", label: "Autonomy" },
  { key: "dignity_welfare_score", label: "Dignity" },
  { key: "digital_social_score", label: "Digital" },
];

/* ── Index configuration ── */
type IndexKey = "SHE Score" | "GPI" | "SVI" | "WADI" | "WEVI" | "WHI" | "WVI" | "Compliance";

interface IndexConfig {
  label: IndexKey;
  desc: string;
  tailwind: string;      // Tailwind classes: text + border + bg
  accent: string;        // Hex colour for the KDE curve
  scoreField: string;    // Field name in the IndexScore rows from the API
  title: string;         // Full index name for the tooltip header
  formula: { label: string; weight?: string }[];  // Methodology components
  note: string;          // Footer note explaining how the index is built
}

const INDEX_CONFIGS: IndexConfig[] = [
  {
    label: "SHE Score", desc: "Women's Empowerment",
    tailwind: "text-amber-400  border-amber-400/30  bg-amber-400/5",
    accent: "#f59e0b", scoreField: "she_score",
    title: "SHE Score",
    formula: [
      { label: "Empowerment",      weight: "×15%" },
      { label: "Bodily Autonomy",  weight: "×15%" },
      { label: "Safety & Justice", weight: "×14%" },
      { label: "Education",        weight: "×12%" },
      { label: "Economic",         weight: "×12%" },
      { label: "Health",           weight: "×12%" },
      { label: "Dignity & Welfare",weight: "×10%" },
      { label: "Digital & Social", weight: "×10%" },
      { label: "− Safety (Crime Penalty)",weight: "×10%" },
    ],
    note: "SHEtoken's native index. The published score (v2) uses five LIVE weighted pillars (Empowerment, Education, Economic, Health, Safety/Crime Penalty); four further pillars are in validation. All sub-scores normalised 0–100. The 7 cards to the right are external comparison indexes.",
  },
  {
    label: "GPI", desc: "Gender Poverty",
    tailwind: "text-purple-400 border-purple-400/30 bg-purple-400/5",
    accent: "#a855f7", scoreField: "gpi_score",
    title: "Gender Poverty Index",
    formula: [
      { label: "Income poverty (F:M)" },
      { label: "Wealth gap" },
      { label: "Wage gap" },
      { label: "Labour participation" },
      { label: "Financial inclusion" },
      { label: "Food security" },
      { label: "Time poverty (unpaid care)" },
      { label: "Land ownership" },
      { label: "Social protection" },
    ],
    note: "Measures female economic deprivation relative to men across 9 indicators. Sources: World Bank, ILO, OECD.",
  },
  {
    label: "SVI", desc: "Sexual Violence",
    tailwind: "text-red-400    border-red-400/30    bg-red-400/5",
    accent: "#ef4444", scoreField: "svi_score",
    title: "Sexual Violence Index",
    formula: [
      { label: "WHO lifetime prevalence" },
      { label: "UNODC reported rate" },
      { label: "Reporting gap" },
      { label: "Marital rape criminalised" },
      { label: "Conflict-related SV risk" },
      { label: "Digital sexual violence" },
      { label: "Legal framework" },
      { label: "Support services" },
    ],
    note: "Higher score = safer. Combines prevalence, legal protection and support services. Sources: WHO, UNODC.",
  },
  {
    label: "WADI", desc: "AI Displacement",
    tailwind: "text-blue-400   border-blue-400/30   bg-blue-400/5",
    accent: "#3b82f6", scoreField: "wadi_score",
    title: "Women & AI Displacement Index",
    formula: [
      { label: "Automation exposure" },
      { label: "Female sector concentration" },
      { label: "Reskilling access" },
      { label: "Digital skills gap" },
      { label: "AI-policy inclusion" },
    ],
    note: "Higher score = more resilient. Estimates how exposed women's jobs are to AI automation and the capacity to adapt. Sources: ILO, OECD, WEF.",
  },
  {
    label: "WEVI", desc: "Widow Vulnerability",
    tailwind: "text-orange-400 border-orange-400/30 bg-orange-400/5",
    accent: "#f97316", scoreField: "wevi_score",
    title: "Widow Vulnerability Index",
    formula: [
      { label: "Inheritance rights" },
      { label: "Remarriage freedom" },
      { label: "Property rights" },
      { label: "Economic support" },
      { label: "Social protection" },
    ],
    note: "Higher score = better protected. Legal and economic status of widows. Sources: UN Women, national law.",
  },
  {
    label: "WHI", desc: "Women's Health",
    tailwind: "text-pink-400   border-pink-400/30   bg-pink-400/5",
    accent: "#ec4899", scoreField: "whi_score",
    title: "Women's Health Index",
    formula: [
      { label: "Depression prevalence" },
      { label: "Suicide rate" },
      { label: "Anaemia" },
      { label: "Menstrual access" },
      { label: "Contraceptive unmet need" },
      { label: "Maternal mental-health support" },
    ],
    note: "Higher score = healthier. Focus on reproductive and mental health. Sources: WHO, UNICEF.",
  },
  {
    label: "WVI", desc: "Women's Voice",
    tailwind: "text-cyan-400   border-cyan-400/30   bg-cyan-400/5",
    accent: "#06b6d4", scoreField: "wvi_score",
    title: "Women's Voice Index",
    formula: [
      { label: "Parliamentary seats" },
      { label: "Ministerial roles" },
      { label: "Local government" },
      { label: "Civic participation" },
      { label: "Press & protest freedom" },
    ],
    note: "Higher score = louder voice. Political representation and civic freedom. Sources: IPU, V-Dem.",
  },
  {
    label: "Compliance", desc: "Rights Compliance",
    tailwind: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
    accent: "#10b981", scoreField: "compliance_score",
    title: "Rights Compliance Index",
    formula: [
      { label: "CEDAW ratification" },
      { label: "SDG 5 progress" },
      { label: "Legal frameworks" },
      { label: "Labour conventions" },
      { label: "Treaty adherence" },
    ],
    note: "Higher score = stronger compliance. Adherence to international women's-rights treaties. Sources: UN, ILO.",
  },
];

/* ── Distribution curve types ── */
interface DistPillar { label: string; color: string; width: number; }

// When SHE Score is active the KDE shows all 8 external index distributions —
// one curve per index, derived live from INDEX_CONFIGS + allIndexQueries data.

/* ── Relative time helper ── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7)  return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/* ── Side-list item type ── */
interface SideListItem {
  iso: string;
  country: string;
  score: number;
  weiData: CountryWEI | null;
}

/* ── Kernel density estimate (Gaussian, unnormalised) ── */
function computeKDE(values: number[], bandwidth = 9): number[] {
  const n = values.length;
  if (n === 0) return Array(101).fill(0);
  return Array.from({ length: 101 }, (_, x) =>
    values.reduce((sum, xi) => {
      const u = (x - xi) / bandwidth;
      return sum + Math.exp(-0.5 * u * u);
    }, 0) / n
  );
}

/* ── Mini score bar ── */
function ScoreBar({ value, color = "" }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const barColor = color || (pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500");
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums w-8 text-right">{value?.toFixed(1)}</span>
    </div>
  );
}

type SortKey = "rank" | "she_score" | "country";
type ViewMode = "map" | "table";

/* ── Global average helper ── */
function avgScore(data: IndexScore[] | undefined, field: string): number | null {
  if (!data?.length) return null;
  const vals = data
    .map((r) => (r[field] as number | undefined) ?? (r.score as number | undefined))
    .filter((v): v is number => v != null && !isNaN(v));
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
}

/* ════════════════════════════════════════════ */
export default function Dashboard() {
  const [search, setSearch]                   = useState("");
  const [sortKey, setSortKey]                 = useState<SortKey>("rank");
  const [sortAsc, setSortAsc]                 = useState(true);
  const [view, setView]                       = useState<ViewMode>("map");
  const [selectedCountry, setSelectedCountry] = useState<CountryWEI | null>(null);
  const [selectedIndex, setSelectedIndex]     = useState<IndexKey>("SHE Score");

  const isWEI    = selectedIndex === "SHE Score";
  const idxConf  = INDEX_CONFIGS.find((c) => c.label === selectedIndex)!;

  /* ── Core SHE Score data ── */
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["summary"],
    queryFn:  api.summary,
    staleTime: 5 * 60 * 1000,
  });

  const { data: countriesRes, isLoading: loadingCountries } = useQuery({
    queryKey: ["she-countries"],
    queryFn:  () => api.wei.countries(105),
    staleTime: 5 * 60 * 1000,
  });

  const countries = countriesRes?.data ?? [];
  // A3 — graceful fallback when the live data API is unavailable.
  const apiDown = !loadingCountries && countries.length === 0;
  const usingBaseline = !loadingCountries && countries.length > 0 && isApiFallback();
  const { version } = useApiVersion();

  /* ── Lazy-loaded non-SHE Score index data ── */
  const { data: activeIndexData, isLoading: loadingIndex } = useQuery({
    queryKey: ["index-data", selectedIndex],
    queryFn: async (): Promise<IndexScore[]> => {
      switch (selectedIndex) {
        case "GPI":        return api.gpi.all();
        case "SVI":        return api.svi.all();
        case "WADI":       return api.wadi.all();
        case "WEVI":       return api.wevi.all();
        case "WHI":        return api.whi.all();
        case "WVI":        return api.wvi.all();
        case "Compliance": return api.compliance.countries();
        default:           return [];
      }
    },
    enabled:   !isWEI,
    staleTime: 10 * 60 * 1000,
  });

  /* ── Scan stats history (last 12 weeks) ── */
  const { data: scanStatsRes } = useQuery({
    queryKey: ["scan-stats"],
    queryFn:  () => api.scanStats(12),
    staleTime: 10 * 60 * 1000,
  });
  const scanHistory = scanStatsRes?.data ?? [];

  /* ── Eager-load all non-SHE Score indexes for global average computation ── */
  const allIndexQueries = useQueries({
    queries: [
      { queryKey: ["index-data", "GPI"],        queryFn: () => api.gpi.all(),              staleTime: 10 * 60 * 1000 },
      { queryKey: ["index-data", "SVI"],        queryFn: () => api.svi.all(),              staleTime: 10 * 60 * 1000 },
      { queryKey: ["index-data", "WADI"],       queryFn: () => api.wadi.all(),             staleTime: 10 * 60 * 1000 },
      { queryKey: ["index-data", "WEVI"],       queryFn: () => api.wevi.all(),             staleTime: 10 * 60 * 1000 },
      { queryKey: ["index-data", "WHI"],        queryFn: () => api.whi.all(),              staleTime: 10 * 60 * 1000 },
      { queryKey: ["index-data", "WVI"],        queryFn: () => api.wvi.all(),              staleTime: 10 * 60 * 1000 },
      { queryKey: ["index-data", "Compliance"], queryFn: () => api.compliance.countries(), staleTime: 10 * 60 * 1000 },
    ],
  });

  /* ── Build scoreOverride map for the active non-SHE Score index ── */
  const scoreOverride = useMemo<Map<string, number> | undefined>(() => {
    if (isWEI || !activeIndexData?.length) return undefined;
    const map = new Map<string, number>();
    for (const row of activeIndexData) {
      const iso   = String(row.iso_code ?? "").toUpperCase();
      // Try specific score field, then fall back to generic "score"
      const score = (row[idxConf.scoreField] as number | undefined)
                 ?? (row.score as number | undefined);
      if (iso && score != null && !isNaN(score)) map.set(iso, score);
    }
    return map;
  }, [isWEI, selectedIndex, activeIndexData, idxConf.scoreField]);

  /* ── Distribution pillars — one curve per index (SHE Score mode = all 8) ── */
  const activeDistPillars = useMemo<DistPillar[]>(() => {
    if (isWEI) {
      // All 8 index curves; only include non-SHE Score ones whose data has arrived
      const pillars: DistPillar[] = [
        { label: "SHE Score", color: "#f59e0b", width: 2.5 },
      ];
      const extras = [
        { label: "GPI",        q: allIndexQueries[0], color: "#a855f7" },
        { label: "SVI",        q: allIndexQueries[1], color: "#ef4444" },
        { label: "WADI",       q: allIndexQueries[2], color: "#3b82f6" },
        { label: "WEVI",       q: allIndexQueries[3], color: "#f97316" },
        { label: "WHI",        q: allIndexQueries[4], color: "#ec4899" },
        { label: "WVI",        q: allIndexQueries[5], color: "#06b6d4" },
        { label: "Compliance", q: allIndexQueries[6], color: "#10b981" },
      ] as const;
      for (const { label, q, color } of extras) {
        if (q.data && (q.data as IndexScore[]).length > 0)
          pillars.push({ label, color, width: 1.5 });
      }
      return pillars;
    }
    return [{ label: selectedIndex, color: idxConf.accent, width: 2.5 }];
  }, [isWEI, selectedIndex, idxConf.accent, allIndexQueries]);

  /* ── KDE data for the distribution chart ── */
  const activeDistData = useMemo(() => {
    if (isWEI) {
      if (!countries.length) return [];

      // Build a dataset per index (only those with loaded data)
      type DS = { label: string; values: number[] };
      const datasets: DS[] = [
        { label: "SHE Score", values: countries.map(c => c.she_score).filter(v => v > 0) },
      ];

      const extras = [
        { label: "GPI",        q: allIndexQueries[0], field: "gpi_score" },
        { label: "SVI",        q: allIndexQueries[1], field: "svi_score" },
        { label: "WADI",       q: allIndexQueries[2], field: "wadi_score" },
        { label: "WEVI",       q: allIndexQueries[3], field: "wevi_score" },
        { label: "WHI",        q: allIndexQueries[4], field: "whi_score" },
        { label: "WVI",        q: allIndexQueries[5], field: "wvi_score" },
        { label: "Compliance", q: allIndexQueries[6], field: "compliance_score" },
      ];
      for (const { label, q, field } of extras) {
        const data = q.data as IndexScore[] | undefined;
        if (!data?.length) continue;
        const values = data
          .map(r => (r[field] as number | undefined) ?? (r.score as number | undefined) ?? 0)
          .filter(v => v > 0);
        if (values.length) datasets.push({ label, values });
      }

      const kdes = datasets.map(({ values }) => computeKDE(values));
      return Array.from({ length: 101 }, (_, i) => {
        const pt: Record<string, number> = { x: i };
        datasets.forEach(({ label }, j) => { pt[label] = kdes[j][i]; });
        return pt;
      });
    }

    // Non-SHE Score: single curve from the active index data
    if (!activeIndexData?.length) return [];
    const values = activeIndexData
      .map((r) => (r[idxConf.scoreField] as number | undefined) ?? (r.score as number | undefined))
      .filter((v): v is number => v != null && !isNaN(v) && v > 0);
    const kde = computeKDE(values);
    return Array.from({ length: 101 }, (_, i) => ({ x: i, [selectedIndex]: kde[i] }));
  }, [isWEI, selectedIndex, countries, activeIndexData, idxConf.scoreField, allIndexQueries]);

  /* ── Selected country's score for the active index ── */
  const selectedIndexScore = useMemo<number | null>(() => {
    if (!selectedCountry) return null;
    if (isWEI) return selectedCountry.she_score;
    return scoreOverride?.get(selectedCountry.iso_code) ?? null;
  }, [selectedCountry, isWEI, scoreOverride]);

  /* ── Side list for the map view (country ranked tiles) ── */
  const sideListItems = useMemo<SideListItem[]>(() => {
    if (isWEI) {
      return [...countries]
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 30)
        .map((c) => ({ iso: c.iso_code, country: c.country, score: c.she_score, weiData: c }));
    }
    if (!activeIndexData?.length) return [];
    const weiMap = new Map(countries.map((c) => [c.iso_code, c]));
    return [...activeIndexData]
      .map((r) => {
        const iso   = String(r.iso_code ?? "").toUpperCase();
        const score = (r[idxConf.scoreField] as number | undefined) ?? (r.score as number | undefined) ?? 0;
        return { iso, country: String(r.country ?? iso), score, weiData: weiMap.get(iso) ?? null };
      })
      .filter((r) => r.iso && r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  }, [isWEI, countries, activeIndexData, idxConf.scoreField]);

  /* ── Auto-select the #1 country on initial load ── */
  useEffect(() => {
    if (countries.length > 0) setSelectedCountry((prev) => prev ?? countries[0]);
  }, [countries.length]); // fires once when data arrives; respects subsequent user selections

  /* ── Global averages for each index chip ──
   * Prefers pre-computed values from /v1/summary (zero extra requests).
   * Falls back to client-side mean of the already-loaded index arrays
   * so the chips populate immediately even before the backend ships the fields.
   */
  const indexGlobalAvgs = useMemo<Record<IndexKey, number | null>>(() => {
    const [gpiD, sviD, wadiD, weviD, whiD, wviD, compD] = allIndexQueries.map(
      (q) => q.data as IndexScore[] | undefined
    );
    return {
      "SHE Score":      summary?.global_she_score          ?? null,
      GPI:        summary?.gpi_global_avg            ?? avgScore(gpiD,  "gpi_score"),
      SVI:        summary?.svi_global_avg            ?? avgScore(sviD,  "svi_score"),
      WADI:       summary?.wadi_global_avg           ?? avgScore(wadiD, "wadi_score"),
      WEVI:       summary?.wevi_global_avg           ?? avgScore(weviD, "wevi_score"),
      WHI:        summary?.whi_global_avg            ?? avgScore(whiD,  "whi_score"),
      WVI:        summary?.wvi_global_avg            ?? avgScore(wviD,  "wvi_score"),
      Compliance: summary?.compliance_global_avg     ?? avgScore(compD, "compliance_score"),
    };
  }, [summary, allIndexQueries]);

  /* ── Tier distribution data for the bar chart ── */
  const tierDistData = useMemo(() => [
    { label: "Tier 1 · Preferred",  count: summary?.tier_1_count ?? 0, color: "#10b981" },
    { label: "Tier 2 · Acceptable", count: summary?.tier_2_count ?? 0, color: "#eab308" },
    { label: "Tier 3 · Caution",    count: summary?.tier_3_count ?? 0, color: "#f97316" },
    { label: "Tier 4 · Avoid",      count: summary?.tier_4_count ?? 0, color: "#ef4444" },
  ], [summary]);

  /* ── Table filtering / sorting ── */
  const filtered = countries
    .filter(
      (c) =>
        c.country.toLowerCase().includes(search.toLowerCase()) ||
        c.iso_code.toLowerCase().includes(search.toLowerCase()) ||
        c.region.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av: string | number = sortKey === "country" ? a.country : a[sortKey];
      const bv: string | number = sortKey === "country" ? b.country : b[sortKey];
      if (typeof av === "string")
        return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(key === "rank"); }
  }

  const activeCountryCount = isWEI
    ? countries.length
    : activeIndexData?.length ?? 0;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Live SHE Score Dashboard — SHE Score for 105 Countries"
        description="Track the SHE Score live across 105 countries. Interactive world map, country leaderboard, and 8 pillar scores — all built from UN, World Bank and WHO data."
        url="https://www.shetoken.org/dashboard"
      />
      <Nav />

      <main className="pt-24 pb-20 container max-w-7xl">

        {/* ── API VERSION SELECTOR ── */}
        <div className="flex justify-end mb-3"><ApiVersionSelect /></div>
        {version === "v3" && <ShadowBanner />}

        {/* ── LIVE-DATA FALLBACK (A3) ── */}
        {(apiDown || usingBaseline) && (
          <div className="mb-7 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-foreground">{usingBaseline ? "Showing 2025 baseline scores — live updates temporarily offline." : "Live data temporarily unavailable."}</div>
              <p className="text-muted-foreground mt-0.5">
                The live scoring API is being upgraded.{usingBaseline ? " These are the published v2 baseline scores; weekly movement and the comparison indexes will return when the API is back." : " The published methodology and baseline dataset are available now."}{" "}
                <Link to="/methodology" className="text-accent hover:underline">Read the methodology</Link>{" "}or browse the{" "}
                <a href="https://github.com/shetoken/shetoken-launch/tree/main/data" target="_blank" rel="noreferrer" className="text-accent hover:underline">baseline data CSVs on GitHub</a>.
              </p>
            </div>
          </div>
        )}

        {/* ── COMPACT HEADER ── */}
        <section className="mb-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-3 animate-glow-pulse">
                <Sparkles className="h-3 w-3" /> Live SHE Score Data · {summary?.countries_scored ?? "…"} countries scored
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                Global SHE Score:{" "}
                {loadingSummary ? (
                  <span className="text-muted-foreground">loading…</span>
                ) : (
                  <span className="text-gradient">{summary?.global_she_score}</span>
                )}
                <span className="text-muted-foreground font-normal text-xl ml-2">/ 100</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                SHE Score ·{" "}
                {new Date(summary?.last_updated ?? Date.now()).toLocaleDateString("en-US", {
                  month: "long", year: "numeric",
                })}
                {summary?.last_updated && (
                  <span className="inline-flex items-center gap-1 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full font-medium text-[10px]">
                    ↻ data refreshed {timeAgo(summary.last_updated)}
                  </span>
                )}
              </p>
            </div>

            {summary && (
              <div className="flex gap-2 flex-wrap shrink-0">
                {[
                  { label: "Highest", value: `${summary.highest_country} · ${summary.highest_score}`, color: "text-emerald-400" },
                  { label: "Lowest",  value: `${summary.lowest_country} · ${summary.lowest_score}`,   color: "text-red-400" },
                  { label: "Tier 1",  value: `${summary.tier_1_count} countries`,                      color: "text-emerald-400" },
                  { label: "Critical",value: `${summary.tier_4_count} countries`,                      color: "text-red-400" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-card/40 border border-border/40 rounded-xl px-3 py-2 text-xs min-w-[110px]"
                  >
                    <div className="text-muted-foreground mb-0.5">{s.label}</div>
                    <div className={`font-semibold leading-snug ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── SIGNAL PULSE ── source breakdown from latest agent run ── */}
        {(summary?.scan_stats || scanHistory.length > 0) && (() => {
          const s = summary?.scan_stats ?? scanHistory[0];
          if (!s) return null;
          const total = s.total_fetched || 1;
          const sources = [
            { label: "RSS",      count: s.rss_count,       color: "#3b82f6",  bar: "bg-blue-500" },
            { label: "GDELT",    count: s.gdelt_count,      color: "#a855f7",  bar: "bg-purple-500" },
            { label: "Research", count: s.research_count,   color: "#10b981",  bar: "bg-emerald-500" },
            { label: "Social",   count: s.social_count,     color: "#ec4899",  bar: "bg-pink-500" },
            { label: "YouTube",  count: s.youtube_count,    color: "#ef4444",  bar: "bg-red-500" },
            { label: "Reddit",   count: s.reddit_count,     color: "#f97316",  bar: "bg-orange-500" },
            ...(s.llm_scout_count > 0
              ? [{ label: "LLM Scout", count: s.llm_scout_count, color: "#f59e0b", bar: "bg-amber-500" }]
              : []),
          ].filter(x => x.count > 0);
          return (
            <section className="mb-6">
              <div className="bg-card/30 border border-border/30 rounded-2xl px-4 py-3.5 shadow-card">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-accent" />
                    Signal Pulse · {s.week}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{(s.total_after_dedup ?? s.total_fetched).toLocaleString()} articles processed</span>
                    <span className="text-accent font-medium">
                      {s.signals_found.toLocaleString()} signals
                    </span>
                    {s.crisis_signals > 0 && (
                      <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                        <Zap className="h-3 w-3" />{s.crisis_signals} crisis
                      </span>
                    )}
                  </div>
                </div>

                {/* Source chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {sources.map(({ label, count, color, bar }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 bg-card/60 border border-border/20 rounded-lg px-2.5 py-1 text-xs"
                    >
                      <div className={`w-2 h-2 rounded-full ${bar} shrink-0`} />
                      <span className="font-semibold tabular-nums" style={{ color }}>
                        {count.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Mini stacked bar showing source proportions */}
                <div className="flex h-2 rounded-full overflow-hidden gap-px">
                  {sources.map(({ label, count, bar }) => {
                    const pct = (count / total) * 100;
                    return pct > 0.5 ? (
                      <div
                        key={label}
                        className={`${bar} h-full transition-all`}
                        style={{ width: `${pct}%` }}
                        title={`${label}: ${count}`}
                      />
                    ) : null;
                  })}
                </div>

                {/* Weekly history sparkline (if we have multiple weeks) */}
                {scanHistory.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-border/20">
                    <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Articles processed · last {scanHistory.length} weeks
                    </p>
                    <div className="flex items-end gap-1 h-8">
                      {[...scanHistory].reverse().map((w, i) => {
                        const maxFetched = Math.max(...scanHistory.map(x => x.total_fetched || 0), 1);
                        const h = Math.max(2, ((w.total_fetched || 0) / maxFetched) * 100);
                        const isLatest = i === scanHistory.length - 1;
                        return (
                          <div
                            key={w.week}
                            className="relative flex-1 flex flex-col items-center justify-end group"
                            title={`${w.week}: ${w.total_fetched} fetched → ${w.signals_found} signals`}
                          >
                            <div
                              className={`w-full rounded-sm transition-all ${
                                isLatest ? "bg-accent" : "bg-muted/50 group-hover:bg-muted"
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-0.5">
                      <span>{[...scanHistory].reverse()[0]?.week}</span>
                      <span>{scanHistory[0]?.week}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* ── INDEX STRIP ── (interactive — click to filter map & chart) ── */}
        <section className="mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" /> 8 indexes powering $SHE · click to filter map &amp; chart
          </p>

          <div className="bg-card/30 border border-border/30 rounded-2xl px-4 py-4 shadow-card overflow-visible">
            {/* flex-wrap instead of overflow-x-auto so absolute tooltips aren't clipped */}
            <div className="flex gap-2 flex-wrap px-2 py-2">
              {INDEX_CONFIGS.map((idx) => {
                const isActive = selectedIndex === idx.label;
                const isNative = idx.label === "SHE Score";
                const isDerived = idx.label === "Compliance";
                return (
                  <div key={idx.label} className="relative flex-1 min-w-[105px] group/idx">
                    <button
                      onClick={() => setSelectedIndex(idx.label)}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs text-left transition-all duration-200 ${
                        isNative
                          ? "border-amber-400/60 bg-amber-400/8 text-amber-400"
                          : idx.tailwind
                      } ${
                        isActive
                          ? "ring-2 ring-current ring-offset-2 ring-offset-background shadow-lg opacity-100"
                          : "opacity-55 hover:opacity-80 hover:scale-[1.01] cursor-pointer"
                      }`}
                    >
                      <div className="font-bold text-base flex items-center gap-1.5">
                        {idx.label}
                        {isNative && (
                          <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-amber-400/20 text-amber-400 leading-none tracking-wide">
                            NATIVE
                          </span>
                        )}
                        {isDerived && (
                          <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-400/20 text-emerald-400 leading-none tracking-wide">
                            DERIVED
                          </span>
                        )}
                        {isActive && !isWEI && loadingIndex && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                      </div>
                      <div className="font-semibold text-lg leading-tight mt-0.5">
                        {indexGlobalAvgs[idx.label] != null
                          ? indexGlobalAvgs[idx.label]!.toFixed(1)
                          : "—"}
                      </div>
                      <div className="opacity-80 whitespace-nowrap mt-0.5 text-[11px]">{idx.desc}</div>
                    </button>

                    {/* Methodology tooltip — shown on hover for every index */}
                    <div className="absolute left-0 top-full mt-2 z-50 w-72 hidden group-hover/idx:block">
                      <div
                        className="bg-card rounded-xl p-3.5 shadow-xl text-xs border"
                        style={{ borderColor: `${idx.accent}4D` }}
                      >
                        <p className="font-bold mb-2" style={{ color: idx.accent }}>
                          {idx.title}
                        </p>
                        <div className="space-y-1 text-muted-foreground font-mono text-[10px] leading-relaxed">
                          {idx.formula.map((f) => {
                            const isPenalty = f.label.trim().startsWith("−");
                            return (
                              <div
                                key={f.label}
                                className={`flex justify-between ${
                                  isPenalty ? "border-t border-border/30 pt-1 mt-1 text-red-400" : ""
                                }`}
                              >
                                <span>{f.label}</span>
                                {f.weight && (
                                  <span style={isPenalty ? undefined : { color: idx.accent }}>
                                    {f.weight}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-muted-foreground/60 text-[9px] mt-2">{idx.note}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sub-label when a non-SHE Score index is active */}
            {!isWEI && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2 flex-wrap">
                {loadingIndex ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading {selectedIndex} country scores…
                  </>
                ) : (
                  <>
                    <span className="font-medium" style={{ color: idxConf.accent }}>{selectedIndex}</span>
                    <span>
                      · {idxConf.desc} · {activeCountryCount} countries
                      {indexGlobalAvgs[selectedIndex] != null
                        ? ` · global avg ${indexGlobalAvgs[selectedIndex]!.toFixed(1)}`
                        : " · global avg computing…"}
                    </span>
                    <span className="text-border/60">·</span>
                    <button
                      onClick={() => setSelectedIndex("SHE Score")}
                      className="text-accent hover:underline"
                    >
                      ← back to SHE Score
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        </section>

        {/* ── COUNTRY EXPLORER ── */}
        <section>
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold">
              {isWEI ? "Country Explorer" : `${idxConf.desc} (${selectedIndex})`}{" "}
              <span className="text-muted-foreground font-normal text-sm ml-2">
                {isWEI
                  ? `${countries.length} countries`
                  : loadingIndex
                    ? "loading…"
                    : `${activeCountryCount} countries`}
              </span>
            </h2>
            <div className="flex items-center gap-3">
              {/* Map / Table toggle */}
              <div className="flex items-center rounded-lg border border-border/60 bg-card/40 p-1">
                <button
                  onClick={() => setView("map")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-smooth ${
                    view === "map"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MapIcon className="h-3.5 w-3.5" /> Map
                </button>
                <button
                  onClick={() => setView("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-smooth ${
                    view === "table"
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="h-3.5 w-3.5" /> Table
                </button>
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search country or region…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-card/40 border-border/60"
                />
              </div>
            </div>
          </div>

          {loadingCountries ? (
            <div className="text-muted-foreground py-20 text-center">Loading country data…</div>
          ) : view === "map" ? (

            /* ─────────── MAP VIEW ─────────── */
            <div className="flex flex-col gap-5">

              {/* ── Row 1: Map (left) + Selected country panel (right) ── */}
              <div className="grid xl:grid-cols-12 gap-5 items-start">

                {/* Map column */}
                <div className="xl:col-span-8">
                  <WorldMap
                    countries={countries}
                    selectedIso={selectedCountry?.iso_code}
                    onSelect={setSelectedCountry}
                    scoreOverride={scoreOverride}
                    indexLabel={isWEI ? "SHE Score" : selectedIndex}
                    mapHeight={380}
                  />
                </div>

                {/* Selected country panel */}
                <div className="xl:col-span-4">
                  {selectedCountry ? (
                    <div className="bg-gradient-card border border-amber-400/30 rounded-2xl p-5 shadow-card relative h-full flex flex-col">
                      <button
                        onClick={() => setSelectedCountry(null)}
                        className="absolute top-3 right-3 p-1 rounded-md hover:bg-muted/20 text-muted-foreground transition-smooth"
                        aria-label="Deselect country"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <div className="text-xs text-muted-foreground mb-0.5">
                        {selectedCountry.region} · Rank #{selectedCountry.rank} of {countries.length}
                      </div>
                      <div className="text-2xl font-bold mb-2 leading-tight pr-6">
                        {selectedCountry.country}
                      </div>

                      {/* Active index score — shown prominently when non-SHE Score */}
                      {!isWEI && (
                        <div className="mb-3 pb-3 border-b border-border/30">
                          <div className="text-xs text-muted-foreground mb-0.5">{selectedIndex} Score</div>
                          <div className="flex items-baseline gap-2">
                            <span
                              className="text-4xl font-bold leading-none"
                              style={{ color: idxConf.accent }}
                            >
                              {selectedIndexScore != null ? selectedIndexScore.toFixed(1) : "—"}
                            </span>
                            <span className="text-muted-foreground text-sm">/ 100</span>
                          </div>
                          {selectedIndexScore == null && (
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              Not included in this dataset
                            </p>
                          )}
                        </div>
                      )}

                      {/* SHE Score */}
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`font-bold text-gradient leading-none ${!isWEI ? "text-3xl" : "text-5xl"}`}>
                          {selectedCountry.she_score.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {!isWEI ? "SHE Score" : ""} / 100
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          selectedCountry.tier === 1 ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" :
                          selectedCountry.tier === 2 ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" :
                          selectedCountry.tier === 3 ? "text-orange-400 border-orange-400/30 bg-orange-400/10" :
                                                       "text-red-400 border-red-400/30 bg-red-400/10"
                        }`}>
                          Tier {selectedCountry.tier} · {TIER_LABELS[selectedCountry.tier]?.label}
                        </span>
                        <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                          {selectedCountry.ticker}
                        </span>
                      </div>

                      {/* SHE Score pillar mini-bars */}
                      <div className="space-y-2 flex-1">
                        {[
                          { key: "empowerment_score",    label: "Empowerment", bar: "bg-purple-500" },
                          { key: "education_score",      label: "Education",   bar: "bg-blue-500" },
                          { key: "economic_score",       label: "Economic",    bar: "bg-yellow-500" },
                          { key: "health_score",         label: "Health",      bar: "bg-pink-500" },
                          { key: "safety_justice_score", label: "Safety",      bar: "bg-red-500" },
                        ].map((p) => {
                          const v = (selectedCountry[p.key as keyof CountryWEI] as number) ?? 0;
                          return (
                            <div key={p.key}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-muted-foreground">{p.label}</span>
                                <span className="font-medium tabular-nums">{v.toFixed(1)}</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${p.bar} rounded-full transition-all duration-500`}
                                  style={{ width: `${Math.min(100, v)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Link to={`/country/${selectedCountry.iso_code}`} className="mt-5 block">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-gold hover:opacity-90"
                        >
                          Full country profile <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-gradient-card border border-dashed border-border/40 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center gap-3">
                      <Globe2 className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
                        Click any country on the map to see its{" "}
                        {isWEI ? "SHE Scores" : `${selectedIndex} score`} and pillar breakdown
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Row 2: KDE distribution (left 50%) + Tier heatmap (right 50%) ── */}
              <div className="grid xl:grid-cols-2 gap-5 items-stretch">

                {/* Distribution KDE chart */}
                <div className="bg-gradient-card border border-border/40 rounded-2xl p-5 shadow-card flex flex-col h-full">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold">
                      {isWEI
                        ? `8-Index Score Distributions — ${countries.length} Countries`
                        : `${selectedIndex} Distribution — ${activeCountryCount} Countries`}
                    </h3>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      KDE · peak = most countries
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {isWEI
                      ? "Each curve is one of the 8 SheToken indexes — these are separate scoring systems, not SHE Score sub-pillars."
                      : `${idxConf.desc} scores (0–100). Higher score = better performance.`}
                    {selectedCountry && selectedIndexScore != null && (
                      <span className="text-amber-400 ml-1">
                        Gold line = {selectedCountry.country} ({selectedIndexScore.toFixed(1)})
                      </span>
                    )}
                    {selectedCountry && !isWEI && selectedIndexScore == null && (
                      <span className="text-muted-foreground/50 ml-1">
                        ({selectedCountry.country} not in this dataset)
                      </span>
                    )}
                  </p>

                  {/* Pure SVG KDE chart — no Recharts, no internal scale crashes */}
                  {(() => {
                    if (activeDistData.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-xs" style={{ minHeight: 180 }}>
                          {!isWEI && loadingIndex ? "Loading distribution…" : "No score data available"}
                        </div>
                      );
                    }
                    const VW = 500, VH = 160;
                    const pad = { l: 4, r: 4, t: 8, b: 20 };
                    const cw = VW - pad.l - pad.r;
                    const ch = VH - pad.t - pad.b;

                    const allVals = activeDistData.flatMap(pt =>
                      activeDistPillars.map(p => (pt[p.label] as number) ?? 0)
                    );
                    const maxVal = Math.max(...allVals, 0.001);

                    const sx = (score: number) => pad.l + (score / 100) * cw;
                    const sy = (v: number)     => pad.t + ch - (v / maxVal) * ch;

                    const toPolyline = (label: string) =>
                      activeDistData
                        .map(pt => `${sx(pt.x as number).toFixed(1)},${sy((pt[label] as number) ?? 0).toFixed(1)}`)
                        .join(" ");

                    return (
                      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none"
                           width="100%" style={{ minHeight: 180, display: "block" }}>
                        {/* baseline */}
                        <line x1={pad.l} y1={pad.t + ch} x2={VW - pad.r} y2={pad.t + ch}
                              stroke="hsl(260 15% 22%)" strokeWidth={0.5} />
                        {/* curves */}
                        {activeDistPillars.map(p => (
                          <polyline key={p.label} points={toPolyline(p.label)}
                            stroke={p.color} strokeWidth={p.width * 0.7} fill="none"
                            strokeOpacity={isWEI && p.label !== "SHE Score" ? 0.5 : 1} />
                        ))}
                        {/* selected country reference line */}
                        {selectedCountry && selectedIndexScore != null && (
                          <g>
                            <line x1={sx(selectedIndexScore)} y1={pad.t}
                                  x2={sx(selectedIndexScore)} y2={pad.t + ch}
                                  stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 3" />
                            <text x={sx(selectedIndexScore)} y={pad.t - 2}
                                  textAnchor="middle" fontSize={8} fontWeight={700} fill="#f59e0b">
                              {selectedCountry.iso_code}
                            </text>
                          </g>
                        )}
                        {/* x-axis labels */}
                        {[0, 25, 50, 75, 100].map(v => (
                          <text key={v} x={sx(v)} y={VH - 4} textAnchor="middle"
                                fontSize={8} fill="hsl(260 15% 48%)">{v}</text>
                        ))}
                        <text x={VW - pad.r} y={VH - 4} textAnchor="end"
                              fontSize={7} fill="hsl(260 15% 38%)">Score →</text>
                      </svg>
                    );
                  })()}

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {activeDistPillars.map((p) => (
                      <span key={p.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="w-5 h-0.5 rounded-full inline-block"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tier heatmap bar chart */}
                <div className="bg-gradient-card border border-border/40 rounded-2xl p-5 shadow-card flex flex-col h-full">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold">Country Distribution by Tier</h3>
                    <span className="text-xs text-muted-foreground hidden sm:block">SHE Score tiers · {countries.length} countries</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    How countries are distributed across the four SHE Score investment tiers.
                  </p>

                  {/* Pure CSS horizontal bars — no Recharts, no crashes */}
                  <div className="flex flex-col gap-4 flex-1 justify-center" style={{ minHeight: 180 }}>
                    {(() => {
                      const maxCount = Math.max(...tierDistData.map(t => t.count), 1);
                      const total    = tierDistData.reduce((s, t) => s + t.count, 0);
                      return tierDistData.map((tier) => {
                        const barPct  = (tier.count / maxCount) * 100;
                        const ofTotal = total > 0 ? ((tier.count / total) * 100).toFixed(1) : "0";
                        return (
                          <div key={tier.label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-muted-foreground">{tier.label}</span>
                              <span className="text-xs font-bold tabular-nums" style={{ color: tier.color }}>
                                {tier.count}
                                <span className="text-muted-foreground font-normal ml-1">({ofTotal}%)</span>
                              </span>
                            </div>
                            <div className="h-7 rounded-lg overflow-hidden" style={{ background: "hsl(260 15% 14%)" }}>
                              <div
                                className="h-full rounded-lg transition-all duration-700"
                                style={{ width: `${barPct}%`, backgroundColor: tier.color, opacity: 0.85 }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Tier legend */}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {tierDistData.map((t) => (
                      <span key={t.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: t.color }} />
                        {t.label.split(" · ")[1]}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/20">
                    <Link
                      to="/compare"
                      className="flex items-center justify-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-smooth font-medium"
                    >
                      Compare countries side-by-side <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          ) : (

            /* ─────────── TABLE VIEW ─────────── */
            <div className="rounded-2xl border border-border/40 overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-card/60 border-b border-border/40">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium w-12">
                        <button onClick={() => toggleSort("rank")} className="flex items-center gap-1 hover:text-foreground">
                          # <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                        <button onClick={() => toggleSort("country")} className="flex items-center gap-1 hover:text-foreground">
                          Country <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Region</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Ticker</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                        <button onClick={() => toggleSort("she_score")} className="flex items-center gap-1 hover:text-foreground">
                          SHE Score <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Δ Week</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden xl:table-cell">Tier</th>
                      {PILLAR_COLS.slice(0, 3).map((c) => (
                        <th key={c.key} className="text-left px-4 py-3 text-muted-foreground font-medium hidden 2xl:table-cell">
                          {c.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr
                        key={c.iso_code}
                        className={`border-b border-border/20 hover:bg-card/40 transition-smooth ${i % 2 === 0 ? "" : "bg-card/10"}`}
                      >
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">{c.rank}</td>
                        <td className="px-4 py-3 font-medium">
                          <Link to={`/country/${c.iso_code}`} className="hover:text-accent transition-smooth">
                            {c.country}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.region}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded">
                            {c.ticker}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBar value={c.she_score} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {c.weekly_delta === 0 ? (
                            <span className="text-muted-foreground text-xs">—</span>
                          ) : c.weekly_delta > 0 ? (
                            <span className="text-emerald-400 text-xs flex items-center gap-0.5">
                              <TrendingUp className="h-3 w-3" /> +{c.weekly_delta.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-red-400 text-xs flex items-center gap-0.5">
                              <TrendingDown className="h-3 w-3" /> {c.weekly_delta.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className={`text-xs font-medium ${TIER_LABELS[c.tier]?.color ?? "text-muted-foreground"}`}>
                            {TIER_LABELS[c.tier]?.label ?? `T${c.tier}`}
                          </span>
                        </td>
                        {PILLAR_COLS.slice(0, 3).map((col) => (
                          <td key={col.key} className="px-4 py-3 hidden 2xl:table-cell tabular-nums text-xs">
                            {((c[col.key] as number) ?? 0).toFixed(1)}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <Link to={`/country/${c.iso_code}`}>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Globe2 className="h-8 w-8 opacity-40" />
                  No countries match "{search}"
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── EXPLORE: Safety + She-Clock (consolidated from the old nav tabs) ── */}
        <section className="mt-12">
          <h2 className="text-base font-bold mb-4">Explore the data</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/safety" className="group rounded-2xl border border-border/40 bg-gradient-card p-6 shadow-card hover:border-accent/50 transition-smooth">
              <div className="flex items-center gap-2 text-accent mb-2"><ShieldAlert className="h-5 w-5" /><span className="font-bold text-foreground">Women's Safety Advisory</span></div>
              <p className="text-sm text-muted-foreground mb-4">Where it's safe to travel as a woman — country advisories, state-level maps and local helplines, from WHO, UNODC &amp; UN Women data.</p>
              <span className="inline-flex items-center gap-1 text-sm text-accent">Open the safety map <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
            <Link to="/she-clock" className="group rounded-2xl border border-border/40 bg-gradient-card p-6 shadow-card hover:border-accent/50 transition-smooth">
              <div className="flex items-center gap-2 text-accent mb-2"><Clock className="h-5 w-5" /><span className="font-bold text-foreground">She-Clock</span></div>
              <p className="text-sm text-muted-foreground mb-4">A live, per-second picture of what girls and women face today — births, violence and loss — across countries, in real time.</p>
              <span className="inline-flex items-center gap-1 text-sm text-accent">Open the full clock <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
          </div>
        </section>

        {/* ── ABOUT THE DATA ── */}
        <section className="mt-14 mb-4">
          <div className="bg-card/30 border border-border/30 rounded-2xl px-6 py-6 shadow-card">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <span className="text-accent">📊</span> About the Data
            </h2>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 text-xs text-muted-foreground leading-relaxed">

              {/* SHE Score */}
              <div>
                <p className="font-semibold text-foreground mb-1">SHE Score</p>
                <p>
                  SHEtoken's native composite index. The published score (v2) is computed from
                  five LIVE pillars — Empowerment (25%), Education &amp; Literacy (20%), Economic
                  Inclusion (20%), Health &amp; Survival (15%) and Safety (Crime Penalty, −20%).
                  Four further pillars (Bodily Autonomy, Dignity &amp; Welfare, Digital &amp; Social,
                  expanded Safety &amp; Justice) are in validation and do not yet affect published
                  scores or $SHE supply. Published annually, quarterly for registered governments.
                </p>
              </div>

              {/* External indexes */}
              <div>
                <p className="font-semibold text-foreground mb-1">Comparison Indexes</p>
                <ul className="space-y-1">
                  <li><span className="text-purple-400 font-medium">GPI</span> — Gender Poverty Index: female poverty rates &amp; resource access</li>
                  <li><span className="text-red-400 font-medium">SVI</span> — Sexual Violence Index: prevalence &amp; legal protection</li>
                  <li><span className="text-blue-400 font-medium">WADI</span> — Women &amp; AI Displacement Index: automation risk by gender</li>
                  <li><span className="text-orange-400 font-medium">WEVI</span> — Widow Vulnerability Index: legal &amp; economic widow status</li>
                  <li><span className="text-pink-400 font-medium">WHI</span> — Women's Health Index: maternal, reproductive &amp; mental health</li>
                  <li><span className="text-cyan-400 font-medium">WVI</span> — Women's Voice Index: political representation &amp; civic freedom</li>
                  <li><span className="text-emerald-400 font-medium">Compliance</span> — Rights Compliance: CEDAW, SDG 5 &amp; treaty adherence</li>
                </ul>
              </div>

              {/* Methodology & sources */}
              <div>
                <p className="font-semibold text-foreground mb-1">Sources &amp; Methodology</p>
                <p className="mb-2">
                  Baseline data is derived from UN Women, World Bank Gender Data Portal,
                  WHO, UNICEF, OECD, ILO, and Amnesty International reports (2023–2025).
                </p>
                <p className="mb-2 text-muted-foreground/70">
                  <span className="uppercase tracking-widest text-[10px] font-semibold">Future research</span> — not part of
                  score calculation or $SHE mechanics: an experimental signal layer surfaces qualitative momentum between
                  publications from public news and academic sources. It never affects the published score or token supply.
                </p>
                <p>
                  All scores are normalised 0–100. Higher = better for women.
                  Scores are indicative and intended for research &amp; awareness, not as
                  financial advice.
                </p>
              </div>

            </div>

            <p className="text-[10px] text-muted-foreground/50 mt-5 pt-4 border-t border-border/20">
              Data last updated:{" "}
              {summary?.last_updated
                ? new Date(summary.last_updated).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : "—"}{" "}
              · SHE Score v3.0 · {summary?.countries_scored ?? "…"} countries scored ·{" "}
              <a href="https://www.shetoken.org/whitepaper" target="_blank" rel="noopener noreferrer"
                 className="underline hover:text-muted-foreground/80">
                Full methodology →
              </a>
            </p>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 SheToken · shetoken.org · Data: api.shetoken.org</span>
          <span>SHE Score v3.0 · {summary?.countries_scored ?? "…"} countries scored</span>
        </div>
      </footer>
    </div>
  );
}
