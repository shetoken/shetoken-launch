import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { FlaskConical, AlertTriangle } from "lucide-react";
import methodology from "@/data/methodology.json";

/* The Methodology Lab (Track C C1). v3 candidates are shadow-scored in public
   until they meet the published data standard. The live v3 shadow leaderboard +
   per-country preview consume /api/v3-preview and are added in Track C; this is
   the page shell + activation tracker. v3 values use the distinct shadow style. */

const SHADOW_BADGE = "SHADOW — v3 in validation · does not affect published scores or $SHE supply mechanics";

export default function Lab() {
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
          The live v3 shadow leaderboard and per-country preview render here once the shadow scoring endpoint is online.
          Until then, the gaps above are the proof the standard is real.{" "}
          <Link to="/methodology" className="text-accent hover:underline">Read the methodology →</Link>
        </div>
      </main>
    </div>
  );
}
