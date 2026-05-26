import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, CountryWEI, IndexScore } from "@/lib/api";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorldMap } from "@/components/WorldMap";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  ArrowRight, ArrowUpDown, TrendingUp, TrendingDown,
  Search, Globe2, Sparkles, AlertCircle, Map, List, X, Loader2,
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
type IndexKey = "WEI" | "GPI" | "SVI" | "WADI" | "WEVI" | "WHI" | "WVI" | "Compliance";

interface IndexConfig {
  label: IndexKey;
  desc: string;
  tailwind: string;      // Tailwind classes: text + border + bg
  accent: string;        // Hex colour for the KDE curve
  scoreField: string;    // Field name in the IndexScore rows from the API
}

const INDEX_CONFIGS: IndexConfig[] = [
  {
    label: "WEI", desc: "Women's Empowerment",
    tailwind: "text-amber-400  border-amber-400/30  bg-amber-400/5",
    accent: "#f59e0b", scoreField: "wei_score",
  },
  {
    label: "GPI", desc: "Gender Poverty",
    tailwind: "text-purple-400 border-purple-400/30 bg-purple-400/5",
    accent: "#a855f7", scoreField: "gpi_score",
  },
  {
    label: "SVI", desc: "Sexual Violence",
    tailwind: "text-red-400    border-red-400/30    bg-red-400/5",
    accent: "#ef4444", scoreField: "svi_score",
  },
  {
    label: "WADI", desc: "AI Displacement",
    tailwind: "text-blue-400   border-blue-400/30   bg-blue-400/5",
    accent: "#3b82f6", scoreField: "wadi_score",
  },
  {
    label: "WEVI", desc: "Widow Vulnerability",
    tailwind: "text-orange-400 border-orange-400/30 bg-orange-400/5",
    accent: "#f97316", scoreField: "wevi_score",
  },
  {
    label: "WHI", desc: "Women's Health",
    tailwind: "text-pink-400   border-pink-400/30   bg-pink-400/5",
    accent: "#ec4899", scoreField: "whi_score",
  },
  {
    label: "WVI", desc: "Women's Voice",
    tailwind: "text-cyan-400   border-cyan-400/30   bg-cyan-400/5",
    accent: "#06b6d4", scoreField: "wvi_score",
  },
  {
    label: "Compliance", desc: "Rights Compliance",
    tailwind: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
    accent: "#10b981", scoreField: "compliance_score",
  },
];

/* ── Distribution curve types ── */
interface DistPillar { label: string; color: string; width: number; }

// WEI multi-pillar curves (shown when WEI is active)
const WEI_DIST_PILLARS: DistPillar[] = [
  { label: "WEI",         color: "#f59e0b", width: 2.5 },
  { label: "Empowerment", color: "#a855f7", width: 1.5 },
  { label: "Education",   color: "#3b82f6", width: 1.5 },
  { label: "Economic",    color: "#eab308", width: 1.5 },
  { label: "Health",      color: "#ec4899", width: 1.5 },
  { label: "Safety",      color: "#ef4444", width: 1.5 },
];

// Which CountryWEI fields drive the WEI KDE curves
const WEI_DIST_KEYS: Array<{ key: keyof CountryWEI; label: string }> = [
  { key: "wei_score",            label: "WEI" },
  { key: "empowerment_score",    label: "Empowerment" },
  { key: "education_score",      label: "Education" },
  { key: "economic_score",       label: "Economic" },
  { key: "health_score",         label: "Health" },
  { key: "safety_justice_score", label: "Safety" },
];

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

type SortKey = "rank" | "wei_score" | "country";
type ViewMode = "map" | "table";

/* ════════════════════════════════════════════ */
export default function Dashboard() {
  const [search, setSearch]                   = useState("");
  const [sortKey, setSortKey]                 = useState<SortKey>("rank");
  const [sortAsc, setSortAsc]                 = useState(true);
  const [view, setView]                       = useState<ViewMode>("map");
  const [selectedCountry, setSelectedCountry] = useState<CountryWEI | null>(null);
  const [selectedIndex, setSelectedIndex]     = useState<IndexKey>("WEI");

  const isWEI    = selectedIndex === "WEI";
  const idxConf  = INDEX_CONFIGS.find((c) => c.label === selectedIndex)!;

  /* ── Core WEI data ── */
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["summary"],
    queryFn:  api.summary,
    staleTime: 5 * 60 * 1000,
  });

  const { data: countriesRes, isLoading: loadingCountries } = useQuery({
    queryKey: ["wei-countries"],
    queryFn:  () => api.wei.countries(105),
    staleTime: 5 * 60 * 1000,
  });

  const countries = countriesRes?.data ?? [];

  /* ── Lazy-loaded non-WEI index data ── */
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

  /* ── Build scoreOverride map for the active non-WEI index ── */
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

  /* ── Distribution pillars (what curves appear in the chart) ── */
  const activeDistPillars = useMemo<DistPillar[]>(() => {
    if (isWEI) return WEI_DIST_PILLARS;
    return [{ label: selectedIndex, color: idxConf.accent, width: 2.5 }];
  }, [isWEI, selectedIndex, idxConf.accent]);

  /* ── KDE data for the distribution chart ── */
  const activeDistData = useMemo(() => {
    if (isWEI) {
      if (!countries.length) return [];
      const kdes = WEI_DIST_KEYS.map(({ key }) =>
        computeKDE(
          countries
            .map((c) => c[key] as number)
            .filter((v): v is number => v != null && v > 0)
        )
      );
      return Array.from({ length: 101 }, (_, i) => {
        const pt: Record<string, number> = { x: i };
        WEI_DIST_KEYS.forEach(({ label }, j) => { pt[label] = kdes[j][i]; });
        return pt;
      });
    }

    // Non-WEI: single curve from the index data
    if (!activeIndexData?.length) return [];
    const values = activeIndexData
      .map((r) => (r[idxConf.scoreField] as number | undefined) ?? (r.score as number | undefined))
      .filter((v): v is number => v != null && !isNaN(v) && v > 0);
    const kde = computeKDE(values);
    return Array.from({ length: 101 }, (_, i) => ({ x: i, [selectedIndex]: kde[i] }));
  }, [isWEI, selectedIndex, countries, activeIndexData, idxConf.scoreField]);

  /* ── Selected country's score for the active index ── */
  const selectedIndexScore = useMemo<number | null>(() => {
    if (!selectedCountry) return null;
    if (isWEI) return selectedCountry.wei_score;
    return scoreOverride?.get(selectedCountry.iso_code) ?? null;
  }, [selectedCountry, isWEI, scoreOverride]);

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
        title="Live WEI Dashboard — Women's Empowerment Index for 105 Countries"
        description="Track the Women's Empowerment Index live across 105 countries. Interactive world map, country leaderboard, and 8 pillar scores — all built from UN, World Bank and WHO data."
        url="https://www.shetoken.org/dashboard"
      />
      <Nav />

      <main className="pt-24 pb-20 container max-w-7xl">

        {/* ── COMPACT HEADER ── */}
        <section className="mb-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-3 animate-glow-pulse">
                <Sparkles className="h-3 w-3" /> Live WEI Data · {summary?.countries_scored ?? "…"} countries scored
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                Global WEI Score:{" "}
                {loadingSummary ? (
                  <span className="text-muted-foreground">loading…</span>
                ) : (
                  <span className="text-gradient">{summary?.global_wei_score}</span>
                )}
                <span className="text-muted-foreground font-normal text-xl ml-2">/ 100</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Women's Empowerment Index ·{" "}
                {new Date(summary?.last_updated ?? Date.now()).toLocaleDateString("en-US", {
                  month: "long", year: "numeric",
                })}
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

        {/* ── INDEX STRIP ── (interactive — click to filter map & chart) ── */}
        <section className="mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" /> 8 indexes powering $SHE · click to filter map &amp; chart
          </p>

          <div className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {INDEX_CONFIGS.map((idx) => {
              const isActive = selectedIndex === idx.label;
              return (
                <button
                  key={idx.label}
                  onClick={() => setSelectedIndex(idx.label)}
                  title={
                    idx.label === "WEI"
                      ? `Women's Empowerment Index · global average: ${summary?.global_wei_score ?? "loading"}`
                      : `Click to view ${idx.desc} (${idx.label}) on the map and chart. Global average not computed — explore by country.`
                  }
                  className={`shrink-0 border rounded-xl px-4 py-2.5 text-xs text-left transition-all duration-200 ${idx.tailwind} ${
                    isActive
                      ? "ring-2 ring-current ring-offset-1 ring-offset-background shadow-lg opacity-100 scale-[1.03]"
                      : "opacity-55 hover:opacity-85 hover:scale-[1.01] cursor-pointer"
                  }`}
                >
                  <div className="font-bold text-base flex items-center gap-1.5">
                    {idx.label}
                    {isActive && !isWEI && loadingIndex && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                  </div>
                  <div className="font-semibold text-lg leading-tight mt-0.5">
                    {idx.label === "WEI" && summary?.global_wei_score != null
                      ? summary.global_wei_score.toFixed(1)
                      : isActive && !isWEI && !loadingIndex && activeIndexData?.length
                        ? `${activeIndexData.length} ctys`   // show country count when loaded
                        : "—"}
                  </div>
                  <div className="opacity-80 whitespace-nowrap mt-0.5 text-[11px]">{idx.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Sub-label when a non-WEI index is active */}
          {!isWEI && (
            <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-2 flex-wrap">
              {loadingIndex ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading {selectedIndex} country scores…
                </>
              ) : (
                <>
                  <span className="font-medium" style={{ color: idxConf.accent }}>{selectedIndex}</span>
                  <span>· {idxConf.desc} · {activeCountryCount} countries · global avg not computed</span>
                  <span className="text-border/60">·</span>
                  <button
                    onClick={() => setSelectedIndex("WEI")}
                    className="text-accent hover:underline"
                  >
                    ← back to WEI
                  </button>
                </>
              )}
            </p>
          )}
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
                  <Map className="h-3.5 w-3.5" /> Map
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
            <>
              {/* Map — passes scoreOverride when a non-WEI index is active */}
              <WorldMap
                countries={countries}
                selectedIso={selectedCountry?.iso_code}
                onSelect={setSelectedCountry}
                scoreOverride={scoreOverride}
                indexLabel={isWEI ? "WEI" : selectedIndex}
              />

              {/* ── Distribution + Selected country panel ── */}
              <div className="mt-6 grid md:grid-cols-5 gap-5">

                {/* Distribution KDE chart */}
                <div className="md:col-span-3 bg-gradient-card border border-border/40 rounded-2xl p-5 shadow-card">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold">
                      {isWEI
                        ? `Score Distribution — All ${countries.length} Countries`
                        : `${selectedIndex} Distribution — ${activeCountryCount} Countries`}
                    </h3>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      KDE curve · peak = most countries
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {isWEI
                      ? "Each curve shows how countries cluster on that measure."
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

                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={activeDistData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <XAxis
                        dataKey="x"
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "hsl(260 15% 50%)" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}`}
                        label={{
                          value: "Score (0 – 100) →",
                          position: "insideBottomRight",
                          offset: -4,
                          fontSize: 9,
                          fill: "hsl(260 15% 45%)",
                        }}
                      />
                      <YAxis hide domain={["auto", "auto"]} />

                      {/* Selected country reference line */}
                      {selectedCountry && selectedIndexScore != null && (
                        <ReferenceLine
                          x={Math.round(selectedIndexScore)}
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="5 3"
                          label={{
                            value: selectedCountry.iso_code,
                            position: "top",
                            fill: "#f59e0b",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        />
                      )}

                      <ReTooltip
                        contentStyle={{
                          background: "hsl(260 35% 9%)",
                          border: "1px solid hsl(260 30% 20%)",
                          borderRadius: 8,
                          fontSize: 11,
                          padding: "6px 10px",
                        }}
                        labelStyle={{ color: "hsl(40 30% 96%)", fontWeight: 600 }}
                        labelFormatter={(x) => `Score: ${x}`}
                        formatter={(v: number, name: string) => [
                          `${(v * 100).toFixed(1)}%`,
                          name,
                        ]}
                        itemStyle={{ padding: "1px 0" }}
                      />

                      {activeDistPillars.map((p) => (
                        <Line
                          key={p.label}
                          type="monotone"
                          dataKey={p.label}
                          stroke={p.color}
                          strokeWidth={p.width}
                          dot={false}
                          strokeOpacity={isWEI && p.label !== "WEI" ? 0.55 : 1}
                          name={p.label}
                          activeDot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>

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

                {/* Selected country panel */}
                <div className="md:col-span-2">
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

                      {/* Active index score — shown prominently when non-WEI */}
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

                      {/* WEI score */}
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`font-bold text-gradient leading-none ${!isWEI ? "text-3xl" : "text-5xl"}`}>
                          {selectedCountry.wei_score.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {!isWEI ? "WEI" : ""} / 100
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

                      {/* WEI pillar mini-bars */}
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
                        {isWEI ? "WEI scores" : `${selectedIndex} score`} and position on the distribution curve
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>

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
                        <button onClick={() => toggleSort("wei_score")} className="flex items-center gap-1 hover:text-foreground">
                          WEI Score <ArrowUpDown className="h-3 w-3" />
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
                          <ScoreBar value={c.wei_score} />
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
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 SheToken · shetoken.org · Data: api.shetoken.org</span>
          <span>WEI v3.0 · {summary?.countries_scored ?? "…"} countries scored</span>
        </div>
      </footer>
    </div>
  );
}
