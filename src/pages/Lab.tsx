import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";
import { v3Score, PILLAR_WEIGHT_TABLE } from "@/lib/scoring";
import { FlaskConical, AlertTriangle } from "lucide-react";
import methodology from "@/data/methodology.json";

/* The Methodology Lab (Track C C1). v3 candidates are shadow-scored in public
   until they meet the published data standard. The live v3 shadow leaderboard +
   per-country preview consume /api/v3-preview and are added in Track C; this is
   the page shell + activation tracker. v3 values use the distinct shadow style. */

const SHADOW_BADGE = "SHADOW — v3 in validation · does not affect published scores or $SHE supply mechanics";

export default function Lab() {
  // v3 shadow scores are computed locally from the real pillar values on each
  // country (works online or on the baseline fallback). v3 reweights the five
  // live pillars; it never affects published scores or $SHE supply.
  const { data: res, isLoading, isError } = useQuery({
    queryKey: ["lab-countries"], queryFn: () => api.wei.countries(105), staleTime: 5 * 60 * 1000,
  });
  const rows = (res?.data ?? [])
    .map((c) => ({ iso: c.iso_code, country: c.country, v2: c.she_score ?? 0, v3: v3Score(c) }))
    .sort((a, b) => b.v3 - a.v3);
  const shadowUnavailable = !isLoading && (isError || rows.length === 0);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="The Methodology Lab — v3 Shadow Scores in Validation"
        description="The Methodology Lab is where the next version of the SHE Score is validated in public. v3 candidate pillars are shadow-scored openly until they meet the published data standard — they never affect published scores or $SHE supply mechanics."
        url="https://www.shetoken.org/lab"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-4">
          <FlaskConical className="h-3 w-3" /> The Lab
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4">The Methodology Lab</h1>
        <p className="text-muted-foreground md:text-lg max-w-2xl mb-6">
          The SHE Score ships conservatively. Every pillar must meet the published data standard — an independent
          institutional source covering ≥80% of scored countries, published within two years — before it can affect
          official scores. The Lab is where v3 candidates are shadow-scored in the open until they qualify.
        </p>

        {/* Persistent shadow badge */}
        <div className="rounded-xl border-2 border-dashed border-amber-400/50 bg-amber-400/5 px-4 py-2.5 mb-10 flex items-center gap-2 text-amber-300 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {SHADOW_BADGE}
        </div>

        {/* v3 reweight table */}
        <h2 className="text-2xl font-bold mb-2">v3 shadow vs. v2 official</h2>
        <p className="text-sm text-muted-foreground mb-3 max-w-2xl">
          v3 reweights the five live pillars — heavier <span className="text-foreground">Economic Inclusion</span> and{" "}
          <span className="text-foreground">Safety (Crime Penalty)</span>, lighter Empowerment and Education — so every
          score shifts versus v2. It's a stricter lens, so most countries score somewhat lower (typically 5–8 points).
          It uses only existing pillar data; nothing is imputed. (Four further candidate pillars are still gathering data
          and contribute nothing yet — tracked below.)
        </p>

        {/* weight changes */}
        <div className="mb-5 inline-flex flex-wrap gap-2">
          {PILLAR_WEIGHT_TABLE.filter((p) => p.v2 !== p.v3).map((p) => (
            <span key={p.label} className="text-[11px] rounded-full border border-amber-400/30 bg-amber-400/[0.05] px-2.5 py-1">
              <span className="text-foreground/80">{p.label}</span>{" "}
              <span className="font-mono text-muted-foreground">{(p.v2 * 100).toFixed(0)}%→</span>
              <span className="font-mono text-amber-300 font-semibold">{(p.v3 * 100).toFixed(0)}%</span>
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/[0.03] p-6 text-sm text-muted-foreground mb-10">Loading shadow scores…</div>
        ) : shadowUnavailable ? (
          <div className="rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/[0.03] p-6 mb-10">
            <div className="font-semibold text-amber-300 mb-1">Shadow data unavailable</div>
            <p className="text-sm text-muted-foreground">Country pillar data is offline, so the shadow leaderboard can't be computed right now. The candidate-pillar tracker below is unaffected.</p>
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border-2 border-dashed border-amber-400/40 bg-amber-400/[0.03] shadow-card overflow-hidden">
            <div className="px-4 py-2 border-b border-amber-400/20 text-[10px] font-bold text-amber-300 uppercase tracking-widest">
              SHADOW · v3 reweight · {rows.length} countries · computed from live pillar data
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="text-muted-foreground"><tr>{["#", "Country", "v2 official", "v3 shadow", "Δ"].map((h) => <th key={h} className="text-left px-4 py-2 font-medium text-xs">{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => {
                  const d = r.v3 - r.v2;
                  return (
                    <tr key={r.iso} className="border-t border-amber-400/10">
                      <td className="px-4 py-1.5 text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-4 py-1.5">{r.country}</td>
                      <td className="px-4 py-1.5 font-mono text-muted-foreground">{r.v2.toFixed(1)}</td>
                      {/* shadow style: outlined/ghosted, never the solid v2 fill */}
                      <td className="px-4 py-1.5"><span className="font-mono text-amber-300/90 border border-amber-400/30 rounded px-1.5 py-0.5 text-xs">{r.v3.toFixed(1)}</span></td>
                      <td className={`px-4 py-1.5 font-mono tabular-nums ${d > 0 ? "text-emerald-400" : d < 0 ? "text-red-400" : "text-muted-foreground"}`}>{d > 0 ? "+" : ""}{d.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground/60 mb-10">Shadow scores are rendered in a distinct outlined style and never affect published v2 scores or $SHE supply mechanics.</p>

        {/* Per-pillar activation tracker */}
        <h2 className="text-2xl font-bold mb-4">v3 pillar activation tracker</h2>
        <div className="space-y-3 mb-10">
          {methodology.v3Pillars.map((p) => (
            <div key={p.name} className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <div className="font-semibold">{p.name}</div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  Gathering data · insufficient data
                </span>
              </div>
              <div className="text-xs text-muted-foreground"><span className="text-foreground/80">Candidate indicators:</span> {p.indicators}</div>
              <div className="text-xs text-muted-foreground"><span className="text-foreground/80">Candidate source:</span> {p.source}</div>
              <div className="text-xs text-muted-foreground"><span className="text-foreground/80">Blocking gap:</span> {p.gap}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/40 p-5 text-sm text-muted-foreground">
          The reweighting above is live as a shadow preview — it changes how the existing pillars are balanced, not the
          underlying data. The four candidate pillars stay in the Lab until each gap closes, and none of this touches
          published scores or $SHE supply.{" "}
          <Link to="/methodology" className="text-accent hover:underline">Read the methodology →</Link>
        </div>
      </main>
    </div>
  );
}
