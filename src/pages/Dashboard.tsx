import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, CountryWEI } from "@/lib/api";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorldMap } from "@/components/WorldMap";
import {
  ArrowRight, ArrowUpDown, TrendingUp, TrendingDown,
  Search, Globe2, Sparkles, BarChart2, AlertCircle, Map, List
} from "lucide-react";

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Preferred", color: "text-emerald-400" },
  2: { label: "Acceptable", color: "text-yellow-400" },
  3: { label: "Caution", color: "text-orange-400" },
  4: { label: "Avoid", color: "text-red-400" },
};

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

function ScoreBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums w-8 text-right">{value?.toFixed(1)}</span>
    </div>
  );
}

function IndexCard({
  label, score, rank, description, color
}: {
  label: string; score: number | null; rank?: number | null; description: string; color: string;
}) {
  return (
    <div className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card hover:border-primary/40 transition-smooth">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold uppercase tracking-widest ${color}`}>{label}</span>
        {rank != null && <span className="text-xs text-muted-foreground">#{rank} global</span>}
      </div>
      {score != null ? (
        <div className="text-4xl font-bold mb-1">{score.toFixed(1)}</div>
      ) : (
        <div className="text-2xl font-bold text-muted-foreground mb-1">—</div>
      )}
      <div className="text-xs text-muted-foreground">{description}</div>
      {score != null && (
        <div className="mt-4">
          <ScoreBar value={score} />
        </div>
      )}
    </div>
  );
}

type SortKey = "rank" | "wei_score" | "country";
type ViewMode = "map" | "table";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [view, setView] = useState<ViewMode>("map");

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["summary"],
    queryFn: api.summary,
    staleTime: 5 * 60 * 1000,
  });

  const { data: countriesRes, isLoading: loadingCountries } = useQuery({
    queryKey: ["wei-countries"],
    queryFn: () => api.wei.countries(105),
    staleTime: 5 * 60 * 1000,
  });

  const countries = countriesRes?.data ?? [];

  const filtered = countries
    .filter((c) =>
      c.country.toLowerCase().includes(search.toLowerCase()) ||
      c.iso_code.toLowerCase().includes(search.toLowerCase()) ||
      c.region.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let av: string | number = sortKey === "country" ? a.country : a[sortKey];
      let bv: string | number = sortKey === "country" ? b.country : b[sortKey];
      if (typeof av === "string") return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(key === "rank"); }
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Live WEI Dashboard — Women's Empowerment Index for 105 Countries"
        description="Track the Women's Empowerment Index live across 105 countries. Interactive world map, country leaderboard, and 8 pillar scores — all built from UN, World Bank and WHO data."
        url="https://www.shetoken.org/dashboard"
      />
      <Nav />

      <main className="pt-24 pb-20 container max-w-7xl">
        {/* TOKEN HEADER */}
        <section className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-6 animate-glow-pulse">
            <Sparkles className="h-3 w-3" /> Live WEI Data — {summary?.countries_scored ?? "..."} countries
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Global WEI Score:{" "}
            {loadingSummary ? (
              <span className="text-muted-foreground">loading…</span>
            ) : (
              <span className="text-gradient">{summary?.global_wei_score}</span>
            )}
            <span className="text-muted-foreground text-2xl ml-3">/ 100</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Women's Empowerment Index · {new Date(summary?.last_updated ?? Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>

          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Highest", value: `${summary.highest_country} ${summary.highest_score}`, sub: "Tier 1 leader" },
                { label: "Lowest", value: `${summary.lowest_country} ${summary.lowest_score}`, sub: "Needs urgent action" },
                { label: "Tier 1 (Preferred)", value: summary.tier_1_count, sub: "score ≥ 70" },
                { label: "Tier 4 (Critical)", value: summary.tier_4_count, sub: "score < 30" },
              ].map((s) => (
                <div key={s.label} className="bg-gradient-card border border-border/40 rounded-xl p-5 shadow-card">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{s.label}</div>
                  <div className="text-xl font-bold text-gradient">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* INDEX CARDS */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">
            The 8 sister indexes <span className="text-muted-foreground font-normal text-base ml-2">powering $SHE</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <IndexCard label="WEI" score={summary?.global_wei_score ?? null} rank={null} description="Women's Empowerment Index — the master score" color="text-accent" />
            <IndexCard label="GPI" score={null} rank={null} description="Gender Poverty Index — 9 dimensions of poverty" color="text-purple-400" />
            <IndexCard label="SVI" score={null} rank={null} description="Sexual Violence Index — WHO prevalence based" color="text-red-400" />
            <IndexCard label="WADI" score={null} rank={null} description="AI Displacement Index — automation risk for women" color="text-blue-400" />
            <IndexCard label="WEVI" score={null} rank={null} description="Widow & Elderly Vulnerability Index" color="text-orange-400" />
            <IndexCard label="WHI" score={null} rank={null} description="Women's Health Index — mental health, anaemia, menstrual care" color="text-pink-400" />
            <IndexCard label="WVI" score={null} rank={null} description="Women's Voice Index — online GBV, media, civil freedom" color="text-cyan-400" />
            <IndexCard label="Compliance" score={null} rank={null} description="Women's Rights Business Compliance Score" color="text-emerald-400" />
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Click a country below to see all index scores for that country.
          </p>
        </section>

        {/* COUNTRY EXPLORER — Map + Table */}
        <section>
          {/* Header row with toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">
              Country Explorer{" "}
              <span className="text-muted-foreground font-normal text-base ml-2">
                {countries.length} countries
              </span>
            </h2>
            <div className="flex items-center gap-3">
              {/* View toggle */}
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

              {/* Search (always visible) */}
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
            /* ── MAP VIEW ── */
            <WorldMap countries={countries} />
          ) : (
            /* ── TABLE VIEW ── */
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
                        <th key={c.key} className="text-left px-4 py-3 text-muted-foreground font-medium hidden 2xl:table-cell">{c.label}</th>
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
                          <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded">{c.ticker}</span>
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
          <span>WEI v3.0 · {summary?.countries_scored ?? "..."} countries scored</span>
        </div>
      </footer>
    </div>
  );
}
