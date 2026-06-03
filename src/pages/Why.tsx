import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Globe2, Coins, AlertCircle, CheckCircle, XCircle, Activity, Store, Users } from "lucide-react";

function Stat({ value, label, source, href }: { value: string; label: string; source: string; href?: string }) {
  return (
    <div className="text-center p-6 bg-gradient-card border border-border/40 rounded-2xl shadow-card">
      <div className="text-4xl md:text-5xl font-bold text-gradient mb-3">{value}</div>
      <div className="text-sm font-medium mb-2">{label}</div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-accent underline underline-offset-2 transition-smooth"
        >
          {source} ↗
        </a>
      ) : (
        <div className="text-xs text-muted-foreground">{source}</div>
      )}
    </div>
  );
}

function ProCon({ type, title, desc }: { type: "pro" | "con"; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      {type === "pro"
        ? <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        : <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />}
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

export default function Why() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Why $SHE — The First Asset Backed by the Advancement of Women"
        description="SHEtoken makes women's empowerment measurable, investable and economically active. One system, four parts: the Live Data index (the backing), the $SHE token (outcome-priced capital), SHEconomy (the women-owned marketplace) and SHE Community (the people)."
        url="https://www.shetoken.org/why"
      />
      <Nav />

      <main className="pt-24 pb-20">

        {/* HERO */}
        <section className="container max-w-4xl text-center py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-8">
            <AlertCircle className="h-3 w-3" /> Why impact tokens matter
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            She was always the currency.<br />
            <span className="text-gradient">The world just needed a way to measure it.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Aid is charity. ESG is self-reporting. Traditional crypto is speculation.
            SHEtoken is a third way — a financial instrument mathematically tied to real outcomes,
            built from independent data, auditable by anyone.
          </p>
          <p className="text-base md:text-lg font-semibold text-foreground mt-6">The first asset backed by the advancement of women.</p>
        </section>

        {/* THE NUMBERS */}
        <section className="py-16 bg-card/30 border-y border-border/40">
          <div className="container max-w-5xl">
            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-10">The scale of the problem</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat
                value="$360B"
                label="Annual cost of gender inequality to global GDP"
                source="McKinsey Global Institute"
                href="https://www.mckinsey.com/featured-insights/gender-equality/the-power-of-parity-how-advancing-womens-equality-can-add-12-trillion-to-global-growth"
              />
              <Stat
                value="1 in 3"
                label="Women experience physical or sexual violence in their lifetime"
                source="WHO 2021"
                href="https://www.who.int/news-room/fact-sheets/detail/violence-against-women"
              />
              <Stat
                value="135 yrs"
                label="Time to close the global gender gap at current pace"
                source="World Economic Forum 2023"
                href="https://www.weforum.org/reports/global-gender-gap-report-2023/"
              />
              <Stat
                value="$0"
                label="Amount of capital directly priced against measurable gender outcomes"
                source="SHEtoken research"
              />
            </div>
          </div>
        </section>

        {/* THE SYSTEM — FOUR-PILLAR FLYWHEEL */}
        <section className="py-20 container max-w-5xl">
          <div className="text-center mb-4">
            <p className="text-xs uppercase tracking-widest text-accent mb-3">The system</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Measure. Invest. Build. <span className="text-gradient">Belong.</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              $SHE isn't backed by gold — it's backed by the <strong className="text-foreground">measured advancement of women</strong>.
              Four parts, one flywheel: as the community and the women's economy create real progress, the index rises — and the asset rises with it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-12">
            {[
              { n: "01", verb: "Measure", icon: Activity, title: "Live Data — the Women's Empowerment Index", desc: "You can't value what you can't measure. The WEI scores women's empowerment across 105 countries, updated weekly from UN, WHO and World Bank data. This is what $SHE is backed by.", to: "/dashboard", cta: "Explore the data" },
              { n: "02", verb: "Invest", icon: Coins, title: "$SHE — outcome-priced capital", desc: "When women's lives improve, $SHE is minted; when they deteriorate, it's burned. Progress for women becomes financial value — so investing in women becomes investing in $SHE.", to: "/simulator", cta: "Try the $SHE Simulator" },
              { n: "03", verb: "Build", icon: Store, title: "SHEconomy — the women-owned marketplace", desc: "Real women-owned businesses, real income. The marketplace is where empowerment is produced — turning the index from a number into livelihoods.", to: "/marketplace", cta: "Visit SHEconomy" },
              { n: "04", verb: "Belong", icon: Users, title: "SHE Community — the people behind the data", desc: "The verified women who power it all — sellers, members, supporters. A private, women-first space built for support and solidarity.", to: "/community", cta: "Join SHE Community" },
            ].map((p) => (
              <div key={p.verb} className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">{p.n} · {p.verb}</span>
                <div className="flex items-center gap-2 mb-2"><p.icon className="h-6 w-6 text-accent shrink-0" /><h3 className="text-lg font-bold leading-tight">{p.title}</h3></div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{p.desc}</p>
                <Link to={p.to} className="inline-flex items-center gap-1 text-sm text-accent hover:gap-1.5 transition-all">{p.cta} <ArrowRight className="h-4 w-4" /></Link>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground bg-card/30 border border-border/40 rounded-2xl p-5 leading-relaxed">
            <span className="text-accent font-semibold">The flywheel:</span> SHE Community + SHEconomy create real economic progress for women → the WEI rises → $SHE (backed by the WEI) appreciates → capital flows back into women's businesses and programs → progress compounds.
          </div>
        </section>

        {/* THREE SYSTEMS THAT FAILED */}
        <section className="py-20 container max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Three systems that <span className="text-gradient">aren't enough</span></h2>
            <p className="text-muted-foreground">Each approach has moved the needle. None has created financial accountability at scale.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Foreign Aid & Philanthropy",
                icon: Globe2,
                pros: [
                  { type: "pro" as const, title: "Funds real programs", desc: "Kanyashree, JEEViKA, Kudumbashree — proven at scale" },
                ],
                cons: [
                  { type: "con" as const, title: "Doesn't scale with outcomes", desc: "Disbursement tied to politics, not results" },
                  { type: "con" as const, title: "No market signal", desc: "When programs succeed, capital doesn't automatically flow to more" },
                ],
              },
              {
                title: "ESG Funds & Ratings",
                icon: TrendingUp,
                pros: [
                  { type: "pro" as const, title: "$35 trillion in assets", desc: "Enormous capital base already aligned with ESG mandates" },
                ],
                cons: [
                  { type: "con" as const, title: "Self-reported data", desc: "Companies score themselves. No independent audit trail." },
                  { type: "con" as const, title: "No direct accountability", desc: "A high ESG score doesn't mean women in your supply chain are safe" },
                ],
              },
              {
                title: "Traditional Crypto",
                icon: Coins,
                pros: [
                  { type: "pro" as const, title: "Transparent & borderless", desc: "On-chain transactions are public, permanent, global" },
                ],
                cons: [
                  { type: "con" as const, title: "No real-world grounding", desc: "Most tokens have no connection to measurable outcomes" },
                  { type: "con" as const, title: "Speculative by design", desc: "Value driven by sentiment, not impact" },
                ],
              },
            ].map((system) => (
              <div key={system.title} className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
                <system.icon className="h-7 w-7 text-accent mb-4" />
                <h3 className="text-lg font-bold mb-5">{system.title}</h3>
                <div className="space-y-4">
                  {system.pros.map((p, i) => <ProCon key={i} {...p} />)}
                  {system.cons.map((c, i) => <ProCon key={i} {...c} />)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* THE THIRD WAY */}
        <section className="py-20 bg-card/30 border-y border-border/40">
          <div className="container max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              The third way: <span className="text-gradient">outcome-priced capital</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
              What if the financial return on your investment was mathematically tied to whether
              women's lives actually improved? Not a promise. Not a report. A formula. On-chain. Auditable.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left mb-12">
              {[
                { icon: Shield, title: "Real data. Independent sources.", desc: "WEI scores are built from UN Women, WHO, World Bank, UNESCO and UNODC — the same databases governments and researchers rely on. Not self-reported. Not curated by issuers." },
                { icon: TrendingUp, title: "Price moves with outcomes.", desc: "When the global WEI score rises — measurably, verifiably — $SHE tokens are minted. When it falls, tokens are burned. Progress is rewarded. Regression has a price." },
                { icon: Globe2, title: "Blockchain accountability.", desc: "Every supply change is executed by a smart contract responding to oracle data. No intermediary. No board vote. No PR spin. The chain doesn't lie." },
              ].map((item) => (
                <div key={item.title} className="bg-background/40 border border-border/40 rounded-xl p-5">
                  <item.icon className="h-6 w-6 text-accent mb-3" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DATA SOURCES STRIP */}
        <section className="py-10 container max-w-5xl">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">WEI data draws from</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {[
              { name: "UN Women", href: "https://www.unwomen.org/en/digital-library/sdg-report" },
              { name: "World Health Organization", href: "https://www.who.int/data/gho/data/themes/topics/indicator-groups/indicator-group-details/GHO/violence-against-women" },
              { name: "World Bank Gender Data", href: "https://genderdata.worldbank.org/" },
              { name: "UNESCO Institute for Statistics", href: "https://uis.unesco.org/en/topic/education-and-gender" },
              { name: "UNODC", href: "https://www.unodc.org/unodc/en/data-and-analysis/gender.html" },
              { name: "IPU Women in Parliament", href: "https://data.ipu.org/women-ranking" },
              { name: "ILO Gender Statistics", href: "https://ilostat.ilo.org/topics/gender/" },
            ].map(({ name, href }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-accent underline underline-offset-2 transition-smooth"
              >
                {name} ↗
              </a>
            ))}
          </div>
        </section>

        {/* WHY NOW */}
        <section className="py-20 container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why now</h2>
            <p className="text-muted-foreground">Three forces converging that make 2026 the right moment.</p>
          </div>
          <div className="space-y-4">
            {[
              { num: "01", title: "Institutional ESG is under pressure to prove impact", desc: "Regulators in the EU, UK and US are demanding ESG funds show measurable outcomes — not just policies. SHEtoken provides the measurement layer that institutional funds currently lack." },
              { num: "02", title: "Web3 infrastructure is mature enough", desc: "Chainlink oracles can reliably connect real-world data to on-chain contracts. Layer 2 networks make transactions affordable. The infrastructure that didn't exist in 2017 exists now." },
              { num: "03", title: "The data has never been better", desc: "WHO, UN Women, World Bank and UNODC now publish granular, country-level gender data annually. The WEI can be calculated rigorously across 105 countries. Five years ago this wasn't possible." },
            ].map((item) => (
              <div key={item.num} className="flex gap-5 p-6 bg-gradient-card border border-border/40 rounded-2xl shadow-card">
                <div className="text-4xl font-bold text-accent/30 shrink-0 w-12">{item.num}</div>
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-background/50" />
          <div className="container max-w-2xl text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Hold $SHE. <span className="text-gradient">Back the data that backs the women.</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Join the investors, researchers, NGOs and advocates who are making women's empowerment
              financially measurable — one index point at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90 h-12 px-8">
                <Link to="/community">Join the community <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 border-border/60 bg-card/40 backdrop-blur">
                <Link to="/dashboard">Explore the data</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 SHE Foundation · shetoken.org</span>
          <div className="flex gap-6">
            <Link to="/whitepaper" className="hover:text-foreground">Whitepaper</Link>
            <Link to="/dashboard" className="hover:text-foreground">Live Data</Link>
            <Link to="/community" className="hover:text-foreground">Community</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
