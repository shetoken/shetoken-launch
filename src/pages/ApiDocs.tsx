import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Code2 } from "lucide-react";

const BASE = "https://api.shetoken.org";

type Ep = { m: "GET" | "POST"; path: string; desc: string; shadow?: boolean };
type Group = { title: string; note?: string; eps: Ep[] };

const GROUPS: Group[] = [
  {
    title: "Versioned scores",
    note: "The official score is v2. v3 is shadow-only and never affects published scores or $SHE supply mechanics.",
    eps: [
      { m: "GET", path: "/api/scores", desc: "Official SHE Score for all countries (alias of v2)." },
      { m: "GET", path: "/api/v2/scores", desc: "Official v2 scores (frozen, published five-pillar methodology)." },
      { m: "GET", path: "/api/v2/scores/{iso}", desc: "Official v2 score for one country." },
      { m: "GET", path: "/api/v3-preview/scores", desc: "SHADOW v3 scores; response carries version/status + per-pillar coverage.", shadow: true },
    ],
  },
  {
    title: "Core",
    eps: [
      { m: "GET", path: "/health", desc: "Service health check." },
      { m: "GET", path: "/v1/summary", desc: "Global summary: average score, tier counts, highest/lowest." },
      { m: "GET", path: "/v1/methodology", desc: "Per-indicator provenance and methodology metadata." },
      { m: "GET", path: "/v1/scan-stats", desc: "Latest data-agent scan statistics." },
    ],
  },
  {
    title: "SHE Score (countries, states, cities)",
    eps: [
      { m: "GET", path: "/v1/wei/countries", desc: "All country scores. Params: limit, sort, order." },
      { m: "GET", path: "/v1/wei/countries/{iso}", desc: "One country's full score + pillar breakdown." },
      { m: "GET", path: "/v1/wei/leaderboard", desc: "Top countries by score. Param: limit." },
      { m: "GET", path: "/v1/wei/states/{country}", desc: "Sub-national scores (e.g. india, usa)." },
      { m: "GET", path: "/v1/wei/states/{country}/{state_code}", desc: "One state/region's score." },
      { m: "GET", path: "/v1/wei/cities", desc: "City-level scores." },
      { m: "GET", path: "/v1/wei/cities/{slug}", desc: "One city's score." },
    ],
  },
  {
    title: "History & trends",
    eps: [
      { m: "GET", path: "/v1/wei/history/country/{iso}", desc: "Score history for one country." },
      { m: "GET", path: "/v1/wei/history/all-countries", desc: "History for all countries." },
      { m: "GET", path: "/v1/wei/history/global-trend", desc: "Global average over time." },
      { m: "GET", path: "/v1/wei/history/india-states", desc: "Indian-state history." },
      { m: "GET", path: "/v1/wei/history/usa-states", desc: "US-state history." },
      { m: "GET", path: "/v1/wei/history/compare", desc: "Compare history across countries." },
    ],
  },
  {
    title: "Comparison indexes",
    note: "Reference indexes shown alongside the SHE Score — never inputs to it.",
    eps: [
      { m: "GET", path: "/v1/gpi", desc: "Gender Poverty Index (+ /{iso}, /history)." },
      { m: "GET", path: "/v1/svi", desc: "Sexual Violence Index (+ /{iso}, /history)." },
      { m: "GET", path: "/v1/wadi", desc: "Women & AI Displacement Index (+ /{iso}, /occupations/high-risk)." },
      { m: "GET", path: "/v1/wevi", desc: "Widow Vulnerability Index (+ /{iso})." },
      { m: "GET", path: "/v1/whi", desc: "Women's Health Index (+ /{iso})." },
      { m: "GET", path: "/v1/wvi", desc: "Women's Voice Index (+ /{iso})." },
      { m: "GET", path: "/v1/compliance/countries", desc: "Rights-compliance index (+ /{iso}, /usa-states)." },
    ],
  },
  {
    title: "Vital statistics & life path",
    eps: [
      { m: "GET", path: "/v1/vital/countries", desc: "Women's vital statistics, all countries." },
      { m: "GET", path: "/v1/vital/countries/{iso}", desc: "Vital stats for one country (powers the She-Clock)." },
      { m: "GET", path: "/v1/vital/global-counters", desc: "Live global counters." },
      { m: "GET", path: "/v1/lifepath/{iso}", desc: "Life-of-100-girls life-path stages for a country." },
    ],
  },
  {
    title: "Signals",
    eps: [
      { m: "GET", path: "/v1/signals/latest", desc: "Latest news/research signals. Param: limit." },
      { m: "GET", path: "/v1/signals/top-movers", desc: "Biggest recent movers." },
      { m: "GET", path: "/v1/signals/pillar-summary", desc: "Signal summary by pillar." },
    ],
  },
  {
    title: "Ecosystem (markets, partners, newsletters)",
    eps: [
      { m: "GET", path: "/v1/token", desc: "Token / ecosystem metadata (+ /ecosystem)." },
      { m: "GET", path: "/v1/markets", desc: "Prediction markets (+ /{market_id})." },
      { m: "GET", path: "/v1/etf", desc: "SHE-economy ETF spec." },
      { m: "GET", path: "/v1/mfi/basket", desc: "Microfinance bond basket." },
      { m: "GET", path: "/v1/savings", desc: "Savings product spec." },
      { m: "GET", path: "/v1/partners/countries", desc: "Partner directory (+ /programs, /companies)." },
      { m: "GET", path: "/v1/newsletters", desc: "Newsletters (+ /latest, /{week})." },
    ],
  },
];

function Method({ m }: { m: string }) {
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m === "GET" ? "bg-emerald-400/15 text-emerald-300" : "bg-blue-400/15 text-blue-300"}`}>{m}</span>;
}

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="API Reference — SHEtoken Data API"
        description="The SHEtoken Data API: SHE Score, comparison indexes, vital statistics, history, signals and the versioned v2 (official) / v3-preview (shadow) score endpoints."
        url="https://www.shetoken.org/api"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-4">
          <Code2 className="h-3 w-3" /> API Reference
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-3">SHEtoken Data API</h1>
        <p className="text-muted-foreground md:text-lg max-w-2xl mb-6">
          A public REST API serving the SHE Score, comparison indexes, vital statistics, history and signals. All endpoints
          are read-only JSON over HTTPS.
        </p>
        <div className="rounded-xl border border-border/40 bg-card/40 p-4 mb-10 font-mono text-sm">
          <div className="text-muted-foreground text-xs mb-1">Base URL</div>
          <div className="text-accent">{BASE}</div>
          <div className="text-[11px] text-muted-foreground mt-2">Interactive docs: <a href={`${BASE}/docs`} target="_blank" rel="noreferrer" className="text-accent hover:underline">{BASE}/docs</a></div>
        </div>

        <div className="space-y-8">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h2 className="text-xl font-bold mb-1">{g.title}</h2>
              {g.note && <p className="text-xs text-muted-foreground mb-3">{g.note}</p>}
              <div className="rounded-2xl border border-border/40 bg-gradient-card shadow-card divide-y divide-border/20 overflow-hidden">
                {g.eps.map((e) => (
                  <div key={e.path} className={`flex items-start gap-3 px-4 py-3 ${e.shadow ? "bg-amber-400/[0.04]" : ""}`}>
                    <Method m={e.m} />
                    <div className="min-w-0 flex-1">
                      <code className={`text-sm font-mono ${e.shadow ? "text-amber-300" : "text-foreground"}`}>{e.path}</code>
                      {e.shadow && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">SHADOW</span>}
                      <div className="text-xs text-muted-foreground mt-0.5">{e.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-10">
          Scores are informational and intended for research & awareness, not financial advice. The v3-preview endpoint is a
          shadow surface for the in-validation methodology and must not be used as an official score.
        </p>
      </main>
    </div>
  );
}
