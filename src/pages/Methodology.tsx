import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { ShieldAlert, FlaskConical, Calendar, Database } from "lucide-react";
import methodology from "@/data/methodology.json";

export default function Methodology() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Methodology — How the SHE Score Is Built"
        description="How the SHE Score is built: eight weighted pillars minus a violence penalty, normalised 0–100 from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data. Published annually, quarterly for registered governments. Independent — see the FAQ."
        url="https://www.shetoken.org/methodology"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-4">
          <FlaskConical className="h-3 w-3" /> Methodology
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-5">How the SHE Score is built</h1>
        {methodology.intro.map((p, i) => (
          <p key={i} className="text-muted-foreground leading-relaxed mb-4 md:text-lg">{p}</p>
        ))}

        {/* Independence disclaimer — prominent */}
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 my-8 flex gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1">Independence</div>
            <p className="text-sm text-foreground/90">{methodology.disclaimer}</p>
          </div>
        </div>

        {/* Formula */}
        <h2 className="text-2xl font-bold mb-3">The formula</h2>
        <div className="rounded-xl border border-border/40 bg-card/40 p-4 mb-8 font-mono text-sm text-accent overflow-x-auto">
          {methodology.formula}
        </div>

        {/* Pillars */}
        <h2 className="text-2xl font-bold mb-4">The eight pillars</h2>
        <div className="space-y-2.5 mb-10">
          {methodology.pillars.map((p) => (
            <div key={p.name} className="flex items-start gap-3 rounded-xl border border-border/40 bg-gradient-card p-4 shadow-card">
              <span className="text-sm font-bold text-accent shrink-0 w-12 text-right tabular-nums">{p.weight}</span>
              <div>
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sources + cadence */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold mb-3"><Database className="h-4 w-4 text-accent" /> Data sources</div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {methodology.sources.map((s) => <li key={s} className="flex gap-1.5"><span className="text-accent">·</span>{s}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold mb-3"><Calendar className="h-4 w-4 text-accent" /> How often it updates</div>
            <p className="text-xs text-muted-foreground leading-relaxed">{methodology.cadence}</p>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-bold mb-4">Frequently asked</h2>
        <div className="space-y-3 mb-10">
          {methodology.faq.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
              <div className="font-semibold mb-1.5">{f.q}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.a}{" "}
                {f.link && <Link to={f.link} className="text-accent hover:underline">{f.linkText} →</Link>}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <Link to="/whitepaper" className="text-accent hover:underline">Read the full whitepaper →</Link>
          <Link to="/index-landscape" className="text-accent hover:underline">Compare with other indices →</Link>
          <Link to="/dashboard" className="text-accent hover:underline">Explore the live scores →</Link>
        </div>
      </main>
    </div>
  );
}
