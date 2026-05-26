/**
 * /compare — Side-by-side country comparison
 *
 * Select up to 4 countries. Shows:
 *  • Grouped horizontal bar chart: 8 WEI pillars vs global average
 *  • WEI score cards per country (tier, weekly delta, top 5 pillar bars)
 *  • Recent news signals filtered to selected countries (global signals endpoint)
 *
 * URL: /compare?countries=USA,IND,NGA  (pre-loads countries from query string)
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { api, CountryWEI } from "@/lib/api";
import { Nav } from "@/components/Nav";
import { SEO } from "@/lib/seo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, ReferenceLine,
} from "recharts";
import {
  Search, X, Plus, ArrowLeft, TrendingUp, TrendingDown,
  BarChart2, Globe2, AlertCircle, ExternalLink, Zap, ArrowRight,
} from "lucide-react";

/* ── Pillar definitions (mirrors CountryDetail.tsx) ── */
const PILLARS: Array<{
  key: keyof CountryWEI;
  label: string;
  shortLabel: string;
  globalAvg: number;
  color: string;
}> = [
  { key: "empowerment_score",    label: "Empowerment",    shortLabel: "Empowerment",  globalAvg: 38, color: "#a855f7" },
  { key: "education_score",      label: "Education",      shortLabel: "Education",    globalAvg: 62, color: "#3b82f6" },
  { key: "economic_score",       label: "Economic",       shortLabel: "Economic",     globalAvg: 47, color: "#eab308" },
  { key: "health_score",         label: "Health",         shortLabel: "Health",       globalAvg: 67, color: "#ec4899" },
  { key: "safety_justice_score", label: "Safety/Justice", shortLabel: "Safety",       globalAvg: 41, color: "#ef4444" },
  { key: "bodily_autonomy_score",label: "Bodily Autonomy",shortLabel: "Autonomy",     globalAvg: 44, color: "#f97316" },
  { key: "dignity_welfare_score",label: "Dignity/Welfare",shortLabel: "Dignity",      globalAvg: 52, color: "#10b981" },
  { key: "digital_social_score", label: "Digital/Social", shortLabel: "Digital",      globalAvg: 56, color: "#06b6d4" },
];

/* ── Up to 4 country accent colours ── */
const COUNTRY_COLORS = ["#f59e0b", "#a855f7", "#3b82f6", "#10b981"] as const;

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Preferred",   color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  2: { label: "Acceptable",  color: "text-yellow-400  border-yellow-400/30  bg-yellow-400/10"  },
  3: { label: "Caution",     color: "text-orange-400  border-orange-400/30  bg-orange-400/10"  },
  4: { label: "Avoid",       color: "text-red-400     border-red-400/30     bg-red-400/10"     },
};

/* ════════════════════════════════════════════ */
export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  /* Pre-load ISOs from URL query string (?countries=USA,IND) */
  const [selectedIsos, setSelectedIsos] = useState<string[]>(() => {
    const raw = searchParams.get("countries") ?? "";
    return raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 4);
  });

  /* Keep URL in sync with selections */
  useEffect(() => {
    if (selectedIsos.length > 0) {
      setSearchParams({ countries: selectedIsos.join(",") }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [selectedIsos, setSearchParams]);

  /* ── All WEI countries (for picker autocomplete) ── */
  const { data: countriesRes } = useQuery({
    queryKey: ["wei-countries"],
    queryFn: () => api.wei.countries(105),
    staleTime: 5 * 60 * 1000,
  });
  const allCountries = countriesRes?.data ?? [];

  /* ── Per-country detail queries ── */
  const countryQueries = useQueries({
    queries: selectedIsos.map((iso) => ({
      queryKey: ["country", iso],
      queryFn:  () => api.wei.country(iso),
      enabled:  !!iso,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const selectedCountries = countryQueries
    .map((q) => q.data)
    .filter((c): c is CountryWEI => !!c);

  const anyLoading = countryQueries.some((q) => q.isLoading);

  /* ── Signals (news) — fetch latest and filter to selected countries ── */
  const { data: signals } = useQuery({
    queryKey: ["signals-latest-50"],
    queryFn:  () => api.signals.latest(),
    staleTime: 5 * 60 * 1000,
    enabled: selectedIsos.length > 0,
  });

  const filteredSignals = useMemo(() => {
    if (!signals?.length || !selectedIsos.length) return [];
    const isoSet = new Set(selectedIsos.map((s) => s.toUpperCase()));
    return signals
      .filter((s) => {
        const country = String(s["country"] ?? s["iso_code"] ?? "").toUpperCase();
        return isoSet.has(country);
      })
      .slice(0, 15);
  }, [signals, selectedIsos]);

  /* ── Comparison bar-chart data ── */
  const chartData = useMemo(() =>
    PILLARS.map((p) => ({
      pillar: p.shortLabel,
      "Global Avg": p.globalAvg,
      ...Object.fromEntries(
        selectedCountries.map((c) => [c.iso_code, (c[p.key] as number) ?? 0])
      ),
    })),
    [selectedCountries]
  );

  /* ── Picker autocomplete ── */
  const searchResults = useMemo(() => {
    if (search.trim().length < 1) return [];
    const q = search.toLowerCase();
    return allCountries
      .filter(
        (c) =>
          (c.country.toLowerCase().includes(q) || c.iso_code.toLowerCase().includes(q)) &&
          !selectedIsos.includes(c.iso_code)
      )
      .slice(0, 8);
  }, [search, allCountries, selectedIsos]);

  function addCountry(iso: string) {
    if (selectedIsos.length >= 4 || selectedIsos.includes(iso)) return;
    setSelectedIsos((prev) => [...prev, iso]);
    setSearch("");
  }

  function removeCountry(iso: string) {
    setSelectedIsos((prev) => prev.filter((i) => i !== iso));
  }

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Compare Countries — Women's Empowerment Index"
        description="Compare WEI scores, pillar breakdowns and gender equality metrics side-by-side for up to 4 countries."
        url="https://www.shetoken.org/compare"
      />
      <Nav />

      <main className="pt-24 pb-20 container max-w-7xl">

        {/* ── PAGE HEADER ── */}
        <div className="mb-8 flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <span className="text-border/40">/</span>
          <h1 className="text-2xl font-bold">Country Comparison</h1>
        </div>

        {/* ── COUNTRY PICKER ── */}
        <section className="mb-8 bg-gradient-card border border-border/40 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Select countries to compare</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Up to 4 countries · scores update live from the index
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{selectedIsos.length} / 4</span>
          </div>

          {/* Selected country chips */}
          {selectedIsos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedIsos.map((iso, i) => {
                const c = allCountries.find((x) => x.iso_code === iso);
                return (
                  <span
                    key={iso}
                    className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full border text-xs font-medium"
                    style={{
                      color: COUNTRY_COLORS[i],
                      borderColor: `${COUNTRY_COLORS[i]}40`,
                      backgroundColor: `${COUNTRY_COLORS[i]}10`,
                    }}
                  >
                    {c?.country ?? iso}
                    <button
                      onClick={() => removeCountry(iso)}
                      className="rounded-full p-0.5 hover:bg-black/20 transition-smooth"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              <button
                onClick={() => setSelectedIsos([])}
                className="text-xs text-muted-foreground/60 hover:text-foreground transition-smooth underline underline-offset-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Search */}
          {selectedIsos.length < 4 && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search country to add…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-card/40 border-border/60"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-card border border-border/60 rounded-xl shadow-card overflow-hidden">
                  {searchResults.map((c) => (
                    <button
                      key={c.iso_code}
                      onClick={() => addCountry(c.iso_code)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/10 text-left text-sm transition-smooth"
                    >
                      <Plus className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="flex-1">{c.country}</span>
                      <span className="text-xs text-muted-foreground font-mono">{c.iso_code}</span>
                      <span className="text-xs font-bold text-gradient">{c.wei_score.toFixed(1)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick suggestions when empty */}
          {selectedIsos.length === 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Quick start — try comparing:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["USA", "IND", "NGA"],
                  ["NOR", "SWE", "ISL"],
                  ["CHN", "BRA", "MEX"],
                  ["DEU", "GBR", "FRA"],
                ].map((group) => (
                  <button
                    key={group.join("-")}
                    onClick={() => setSelectedIsos(group)}
                    className="text-xs border border-border/40 bg-card/40 hover:border-accent/40 hover:bg-accent/5 rounded-lg px-3 py-1.5 transition-smooth"
                  >
                    {group.join(" · ")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── LOADING STATE ── */}
        {anyLoading && selectedIsos.length > 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Loading country data…
          </div>
        )}

        {/* ── COMPARISON BAR CHART ── */}
        {selectedCountries.length >= 1 && !anyLoading && (
          <section className="mb-8 bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-semibold">8 Pillar Comparison</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Score 0–100 · global average shown in grey
                </p>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {selectedCountries.map((c, i) => (
                  <span key={c.iso_code} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-1.5 rounded-full inline-block"
                      style={{ backgroundColor: COUNTRY_COLORS[i] }}
                    />
                    {c.country}
                  </span>
                ))}
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-full inline-block bg-muted/60" />
                  Global avg
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                barGap={2}
                barCategoryGap="20%"
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "hsl(260 15% 50%)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="pillar"
                  tick={{ fontSize: 11, fill: "hsl(260 15% 70%)" }}
                  width={75}
                  axisLine={false}
                  tickLine={false}
                />
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(260 30% 18%)" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(260 35% 9%)",
                    border: "1px solid hsl(260 30% 20%)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}`, name]}
                  cursor={{ fill: "hsl(260 30% 14%)" }}
                />
                {/* Global average bar */}
                <Bar
                  dataKey="Global Avg"
                  name="Global Avg"
                  fill="hsl(260 30% 28%)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={10}
                />
                {/* Per-country bars */}
                {selectedCountries.map((c, i) => (
                  <Bar
                    key={c.iso_code}
                    dataKey={c.iso_code}
                    name={c.country}
                    fill={COUNTRY_COLORS[i]}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={12}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* ── SIDE-BY-SIDE STAT CARDS ── */}
        {selectedCountries.length >= 1 && !anyLoading && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Country scorecards
            </h2>
            <div
              className="grid gap-5"
              style={{
                gridTemplateColumns: `repeat(${Math.min(selectedCountries.length, 2)}, minmax(0, 1fr))`,
              }}
            >
              {selectedCountries.map((c, i) => {
                const tierInfo  = TIER_LABELS[c.tier];
                const color     = COUNTRY_COLORS[i];
                return (
                  <div
                    key={c.iso_code}
                    className="bg-gradient-card border rounded-2xl p-6 shadow-card"
                    style={{ borderColor: `${color}30` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">
                          {c.region} · Rank #{c.rank}
                        </div>
                        <h3 className="text-xl font-bold leading-tight">{c.country}</h3>
                        <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded mt-1 inline-block">
                          {c.ticker}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold" style={{ color }}>
                          {c.wei_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">/ 100</div>
                        {c.weekly_delta !== 0 && (
                          <div className={`flex items-center justify-end gap-0.5 text-xs mt-0.5 ${c.weekly_delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {c.weekly_delta > 0
                              ? <TrendingUp className="h-3 w-3" />
                              : <TrendingDown className="h-3 w-3" />}
                            {c.weekly_delta > 0 ? "+" : ""}{c.weekly_delta.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tier badge */}
                    {tierInfo && (
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mb-4 ${tierInfo.color}`}>
                        Tier {c.tier} · {tierInfo.label}
                      </span>
                    )}

                    {/* Pillar bars */}
                    <div className="space-y-2.5">
                      {PILLARS.slice(0, 5).map((p) => {
                        const score = (c[p.key] as number) ?? 0;
                        const avg   = p.globalAvg;
                        const delta = score - avg;
                        return (
                          <div key={p.key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{p.label}</span>
                              <span className="flex items-center gap-1.5">
                                <span className="font-medium tabular-nums">{score.toFixed(1)}</span>
                                <span className={`text-[10px] tabular-nums ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {delta >= 0 ? "+" : ""}{delta.toFixed(0)} vs avg
                                </span>
                              </span>
                            </div>
                            <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, score)}%`, backgroundColor: color, opacity: 0.8 }}
                              />
                              {/* Global avg marker */}
                              <div
                                className="absolute top-0 w-0.5 h-full bg-white/30"
                                style={{ left: `${avg}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Violence penalty: <span className="font-semibold text-red-400">−{c.violence_penalty_score?.toFixed(1) ?? "0"}</span>
                      </div>
                      <Link
                        to={`/country/${c.iso_code}`}
                        className="text-xs flex items-center gap-1 text-accent hover:text-accent/80 transition-smooth"
                      >
                        Full profile <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── QUICK STATS TABLE ── */}
        {selectedCountries.length >= 2 && (
          <section className="mb-8 bg-gradient-card border border-border/40 rounded-2xl overflow-hidden shadow-card">
            <div className="px-5 py-3 border-b border-border/20">
              <h2 className="text-sm font-semibold">At a glance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Metric</th>
                    {selectedCountries.map((c, i) => (
                      <th
                        key={c.iso_code}
                        className="text-right px-5 py-3 text-xs font-semibold"
                        style={{ color: COUNTRY_COLORS[i] }}
                      >
                        {c.country}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "WEI Score",         fn: (c: CountryWEI) => c.wei_score.toFixed(1) },
                    { label: "Global Rank",        fn: (c: CountryWEI) => `#${c.rank}` },
                    { label: "Tier",               fn: (c: CountryWEI) => `${c.tier} — ${TIER_LABELS[c.tier]?.label}` },
                    { label: "Empowerment",        fn: (c: CountryWEI) => (c.empowerment_score ?? 0).toFixed(1) },
                    { label: "Education",          fn: (c: CountryWEI) => (c.education_score ?? 0).toFixed(1) },
                    { label: "Economic",           fn: (c: CountryWEI) => (c.economic_score ?? 0).toFixed(1) },
                    { label: "Health",             fn: (c: CountryWEI) => (c.health_score ?? 0).toFixed(1) },
                    { label: "Safety & Justice",   fn: (c: CountryWEI) => (c.safety_justice_score ?? 0).toFixed(1) },
                    { label: "Bodily Autonomy",    fn: (c: CountryWEI) => (c.bodily_autonomy_score ?? 0).toFixed(1) },
                    { label: "Dignity & Welfare",  fn: (c: CountryWEI) => (c.dignity_welfare_score ?? 0).toFixed(1) },
                    { label: "Digital & Social",   fn: (c: CountryWEI) => (c.digital_social_score ?? 0).toFixed(1) },
                    { label: "Violence Penalty",   fn: (c: CountryWEI) => `−${(c.violence_penalty_score ?? 0).toFixed(1)}` },
                    { label: "Population",         fn: (c: CountryWEI) => `${c.population_millions?.toFixed(1)}M` },
                    { label: "Weekly Δ",           fn: (c: CountryWEI) => `${c.weekly_delta > 0 ? "+" : ""}${c.weekly_delta.toFixed(2)}` },
                  ].map((row, ri) => (
                    <tr key={row.label} className={`border-b border-border/10 ${ri % 2 === 0 ? "" : "bg-card/20"}`}>
                      <td className="px-5 py-2.5 text-xs text-muted-foreground">{row.label}</td>
                      {selectedCountries.map((c) => (
                        <td key={c.iso_code} className="px-5 py-2.5 text-xs font-medium text-right tabular-nums">
                          {row.fn(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── RECENT SIGNALS / NEWS ── */}
        {selectedCountries.length >= 1 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-accent" />
              Recent news signals for selected countries
            </h2>
            {filteredSignals.length === 0 ? (
              <div className="bg-gradient-card border border-border/40 rounded-2xl p-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  No recent signals found for these countries.
                  Signals are generated weekly by the SLM pipeline.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSignals.map((sig, i) => {
                  const isoCode = String(sig["country"] ?? sig["iso_code"] ?? "").toUpperCase();
                  const idx = selectedIsos.indexOf(isoCode);
                  const color = idx >= 0 ? COUNTRY_COLORS[idx] : "#a855f7";
                  const cName = allCountries.find((c) => c.iso_code === isoCode)?.country ?? isoCode;
                  const direction = Number(sig["direction"] ?? 0);
                  const pillar = String(sig["pillar"] ?? "");
                  const url = String(sig["url"] ?? "#");
                  const title = String(sig["title"] ?? sig["summary_en"] ?? "Signal");
                  const source = String(sig["source"] ?? "");
                  const date = String(sig["published"] ?? "");

                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-card border border-border/40 hover:border-border/80 rounded-xl p-4 shadow-card transition-smooth block group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                          style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
                        >
                          {cName}
                        </span>
                        {pillar && (
                          <span className="text-[10px] text-accent/70 uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-full">
                            {pillar.replace(/_/g, " ")}
                          </span>
                        )}
                        <span className={`ml-auto text-xs font-bold ${direction > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {direction > 0 ? "▲" : "▼"}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug group-hover:text-accent transition-smooth line-clamp-2 mb-2">
                        {title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                        <ExternalLink className="h-3 w-3" />
                        <span>{source}</span>
                        {date && (
                          <span>·{" "}
                            {new Date(date).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── EMPTY STATE ── */}
        {selectedIsos.length === 0 && (
          <div className="py-20 text-center">
            <Globe2 className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
            <h2 className="text-xl font-semibold mb-2">No countries selected</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm mb-6">
              Search for up to 4 countries above to compare their WEI scores,
              8-pillar breakdowns, and recent news signals side-by-side.
            </p>
            <Button asChild variant="outline" className="border-border/60 bg-card/40">
              <Link to="/dashboard">
                <BarChart2 className="h-4 w-4 mr-2" /> Browse all countries
              </Link>
            </Button>
          </div>
        )}

      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 SheToken · shetoken.org · Data: api.shetoken.org</span>
          <Link to="/dashboard" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to dashboard
          </Link>
        </div>
      </footer>
    </div>
  );
}
