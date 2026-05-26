import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, CountryWEI } from "@/lib/api";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  ArrowLeft, ArrowRight, BarChart2, TrendingUp, TrendingDown,
  Info, AlertCircle, Users
} from "lucide-react";

const PILLAR_COLS: Array<{ key: keyof CountryWEI; label: string; description: string; color: string }> = [
  { key: "empowerment_score", label: "Empowerment", description: "Parliamentary seats, ministerial roles, legal rights", color: "text-purple-400" },
  { key: "education_score", label: "Education", description: "Literacy, enrollment, STEM, menstrual barriers", color: "text-blue-400" },
  { key: "economic_score", label: "Economic", description: "Pay gap, formal employment, banking access, property rights", color: "text-yellow-400" },
  { key: "health_score", label: "Health & Survival", description: "Maternal mortality, life expectancy, anaemia", color: "text-pink-400" },
  { key: "safety_justice_score", label: "Safety & Justice", description: "DV laws, femicide, honour-based violence, legal aid", color: "text-red-400" },
  { key: "bodily_autonomy_score", label: "Bodily Autonomy", description: "Reproductive rights, child marriage, FGM, period poverty", color: "text-orange-400" },
  { key: "dignity_welfare_score", label: "Dignity & Welfare", description: "Widow rights, caregiver burden, food insecurity, mental health", color: "text-emerald-400" },
  { key: "digital_social_score", label: "Digital & Social", description: "Online harassment, internet & mobile gender gaps", color: "text-cyan-400" },
];

function PillarCard({ label, description, score, color }: { label: string; description: string; score: number; color: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const barColor = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="bg-gradient-card border border-border/40 rounded-xl p-5 shadow-card">
      <div className={`text-xs font-semibold uppercase tracking-widest ${color} mb-1`}>{label}</div>
      <div className="text-3xl font-bold mb-2">{score?.toFixed(1) ?? "—"}</div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-muted-foreground">{description}</div>
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

  const { data: lifepath, isLoading: loadingLifepath } = useQuery({
    queryKey: ["lifepath", iso],
    queryFn: () => api.lifepath(iso!),
    enabled: !!iso,
    staleTime: 10 * 60 * 1000,
  });

  const chartData = history?.history?.map((row) => ({
    year: row.year,
    score: row.wei_score ?? row.score,
  })).filter((r) => r.score != null) ?? [];

  const tierInfo = country ? TIER_INFO[country.tier] : null;

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
      <Nav />

      <main className="pt-24 pb-20 container max-w-6xl">
        {loadingCountry ? (
          <div className="py-20 text-center text-muted-foreground">Loading country data…</div>
        ) : country ? (
          <>
            {/* COUNTRY HEADER */}
            <section className="mb-12">
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

            {/* PILLAR BREAKDOWN */}
            <section className="mb-12">
              <h2 className="text-xl font-bold mb-5">8 Pillar Breakdown</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PILLAR_COLS.map((col) => (
                  <PillarCard
                    key={col.key}
                    label={col.label}
                    description={col.description}
                    score={(country[col.key] as number) ?? 0}
                    color={col.color}
                  />
                ))}
              </div>
              <div className="mt-4 bg-gradient-card border border-red-400/20 rounded-xl p-5 shadow-card">
                <div className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-1">Violence Penalty</div>
                <div className="text-3xl font-bold mb-1 text-red-400">−{country.violence_penalty_score?.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Rape, acid attacks, dowry violence, femicide — subtracted from total WEI score</div>
              </div>
            </section>

            {/* WEI TREND CHART */}
            <section className="mb-12">
              <h2 className="text-xl font-bold mb-5">WEI Score Trend (2015–2024)</h2>
              <div className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
                {loadingHistory ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">Loading trend data…</div>
                ) : chartData.length < 2 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <BarChart2 className="h-8 w-8 opacity-40" />
                    <span className="text-sm">Trend data accumulating — check back next cycle.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 30% 20%)" />
                      <XAxis dataKey="year" tick={{ fill: "hsl(260 15% 70%)", fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(260 15% 70%)", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(260 35% 9%)", border: "1px solid hsl(260 30% 20%)", borderRadius: 8 }}
                        labelStyle={{ color: "hsl(40 30% 96%)" }}
                        itemStyle={{ color: "hsl(45 95% 60%)" }}
                      />
                      <ReferenceLine y={50} stroke="hsl(260 30% 30%)" strokeDasharray="4 4" />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(45 95% 60%)"
                        strokeWidth={2.5}
                        dot={{ fill: "hsl(45 95% 60%)", r: 4 }}
                        activeDot={{ r: 6 }}
                        name="WEI Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* STATS SIDEBAR */}
            <section className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <StatRow label="Rank" value={`#${country.rank} of ${105}`} />
                <StatRow label="Region" value={country.region} />
                <StatRow label="Tier" value={`${country.tier} — ${TIER_INFO[country.tier]?.label}`} />
                <StatRow label="Token" value={<span className="font-mono text-accent">{country.ticker}</span>} />
                <StatRow label="Population" value={`${country.population_millions?.toFixed(1)}M`} />
                <StatRow label="Data Year" value={country.year} />
              </div>

              {lifepath && !loadingLifepath && (
                <div className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
                  <h3 className="text-lg font-semibold mb-4">Life Path: 100 Girls</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    What happens to 100 girls born in {country.country} today, across their life stages.
                  </p>
                  <div className="space-y-3">
                    {lifepath.stages?.slice(0, 5).map((stage) => (
                      <div key={stage.age} className="flex items-start gap-3">
                        <div className="shrink-0 w-14 text-xs font-mono text-accent">{stage.age}</div>
                        <div>
                          <div className="text-sm font-medium">{stage.title}</div>
                          <div className="text-xs text-muted-foreground">{stage.description}</div>
                        </div>
                        <div className="ml-auto shrink-0 text-sm font-bold text-gradient">{stage.girls_affected}</div>
                      </div>
                    ))}
                    {(lifepath.stages?.length ?? 0) > 5 && (
                      <p className="text-xs text-muted-foreground pt-2">
                        +{lifepath.stages.length - 5} more life stages…
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>

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
