import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { ExternalLink, ShieldAlert, Layers, Check } from "lucide-react";
import landscape from "@/data/landscape.json";

export default function IndexLandscape() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="The Index Landscape — SHE Score vs. the World's Gender Indices"
        description="How the SHE Score relates to the world's leading gender indices — UNDP/UN Women WEI, WEF Global Gender Gap, Georgetown WPS, EIGE, OECD SIGI, IFPRI WEAI, the EY SHE Index, World Bank WBL and UNDP GII. The one difference: the SHE Score is investable."
        url="https://www.shetoken.org/index-landscape"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-4xl">
        {/* Intro */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-4">
            <Layers className="h-3 w-3" /> The Landscape
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-5">The Index Landscape</h1>
          {landscape.intro.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed mb-4 md:text-lg">{p}</p>
          ))}
        </div>

        {/* Independence disclaimer — prominent */}
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 mb-12 flex gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1">Independence disclaimer</div>
            <p className="text-sm text-foreground/90">{landscape.disclaimer}</p>
          </div>
        </div>

        {/* Nine index profile cards */}
        <div className="space-y-5 mb-14">
          {landscape.indices.map((idx, i) => (
            <article key={idx.title} className="rounded-2xl border border-border/40 bg-gradient-card p-6 shadow-card">
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl font-bold text-accent/40 leading-none tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-bold leading-tight">
                    <a href={idx.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-smooth inline-flex items-start gap-1.5">
                      {idx.title} <ExternalLink className="h-3.5 w-3.5 mt-1 shrink-0 opacity-60" />
                    </a>
                  </h2>
                  <div className="text-xs text-muted-foreground mt-1">{idx.facts}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{idx.description}</p>
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-3.5">
                <div className="text-[10px] font-semibold text-accent uppercase tracking-widest mb-1">How the SHE Score relates</div>
                <p className="text-sm text-foreground/90 leading-relaxed">{idx.relates}</p>
              </div>
              <div className="mt-3 text-xs">
                <a href={idx.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
                  Official source: {idx.sourceName} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Comparison table */}
        <h2 className="text-2xl font-bold mb-4">At a glance</h2>
        <div className="overflow-x-auto rounded-2xl border border-border/40 shadow-card mb-12">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-muted-foreground">
              <tr>
                {["Index", "Publisher", "Coverage", "Frequency", "Investable?"].map((h, i) => (
                  <th key={h} className={`text-left px-4 py-3 font-medium whitespace-nowrap ${i === 4 ? "bg-accent/10 text-accent" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {landscape.table.map((r) => (
                <tr key={r.index} className={`border-t border-border/20 ${r.she ? "bg-accent/5" : ""}`}>
                  <td className={`px-4 py-3 ${r.she ? "font-bold text-foreground" : "font-medium"}`}>{r.index}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.publisher}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.coverage}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.frequency}</td>
                  <td className={`px-4 py-3 whitespace-nowrap ${i_investable(r)}`}>
                    {r.she ? (
                      <span className="inline-flex items-center gap-1.5 font-bold text-accent">
                        <Check className="h-4 w-4" /> {r.investable}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">{r.investable}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closing */}
        <div className="rounded-2xl border border-border/40 bg-gradient-card p-6 md:p-8 shadow-card">
          <p className="text-base md:text-lg text-foreground/90 leading-relaxed">{landscape.closing}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/dashboard" className="text-sm text-accent hover:underline">Explore the SHE Score for 105 countries →</Link>
            <Link to="/whitepaper" className="text-sm text-accent hover:underline">Read the methodology →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Emphasize the Investable column cell background for the SHE Score row. */
function i_investable(r: { she?: boolean }) {
  return r.she ? "bg-accent/10" : "bg-accent/[0.03]";
}
