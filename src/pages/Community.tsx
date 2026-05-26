import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Lock, Users, Globe2, TrendingUp, BookOpen, Shield, Cpu, Flag } from "lucide-react";
import logo from "@/assets/she-logo.jpg";

const FOCUS_GROUPS = [
  {
    id: "south-asia",
    name: "South Asia Circle",
    icon: Globe2,
    color: "text-orange-400",
    border: "border-orange-400/20",
    bg: "bg-orange-400/5",
    category: "Region",
    description: "Investors, NGOs and researchers tracking India, Bangladesh, Pakistan, Nepal and Sri Lanka WEI movements and program impact.",
    members: 47,
    countries: ["IND", "BGD", "PAK", "NPL", "LKA"],
    teaser: "Latest: India's Kanyashree program shows +2.3pt Education pillar impact in West Bengal...",
  },
  {
    id: "sub-saharan-africa",
    name: "Sub-Saharan Africa Watch",
    icon: Globe2,
    color: "text-emerald-400",
    border: "border-emerald-400/20",
    bg: "bg-emerald-400/5",
    category: "Region",
    description: "Tracking progress and crises across Sub-Saharan Africa, with a focus on Nigeria, Kenya, Ethiopia, Ghana and Tanzania.",
    members: 31,
    countries: ["NGA", "KEN", "ETH", "GHA", "TZA"],
    teaser: "Alert: Nigeria SVI signal detected — new legislation under review...",
  },
  {
    id: "impact-investors",
    name: "Impact Investor Network",
    icon: TrendingUp,
    color: "text-yellow-400",
    border: "border-yellow-400/20",
    bg: "bg-yellow-400/5",
    category: "Use Case",
    description: "ESG-aligned investors using WEI data for capital allocation decisions, portfolio screening and impact reporting to LPs.",
    members: 63,
    countries: [],
    teaser: "Discussion: How to weight WEI compliance scores in SFDR Article 9 reporting...",
  },
  {
    id: "ngo-partners",
    name: "NGO & Non-profit Partners",
    icon: Shield,
    color: "text-pink-400",
    border: "border-pink-400/20",
    bg: "bg-pink-400/5",
    category: "Use Case",
    description: "NGOs and non-profits using WEI data for advocacy campaigns, grant applications and program outcome measurement.",
    members: 38,
    countries: [],
    teaser: "Resource shared: Template for citing WEI data in UN funding applications...",
  },
  {
    id: "policy-circle",
    name: "Policy & Government Circle",
    icon: Flag,
    color: "text-blue-400",
    border: "border-blue-400/20",
    bg: "bg-blue-400/5",
    category: "Use Case",
    description: "Government officials and policy researchers tracking how legislation moves WEI scores at national and state level.",
    members: 22,
    countries: [],
    teaser: "New: EU Gender Equality Strategy — mapping to WEI pillar outcomes...",
  },
  {
    id: "methodology-circle",
    name: "Methodology Circle",
    icon: BookOpen,
    color: "text-purple-400",
    border: "border-purple-400/20",
    bg: "bg-purple-400/5",
    category: "Research",
    description: "Researchers and academics auditing the WEI formula, discussing indicator selection, data sources and index methodology.",
    members: 19,
    countries: [],
    teaser: "Open question: Weighting bodily autonomy at 15% vs GPI at 9%  — discussion thread...",
  },
  {
    id: "blockchain-accountability",
    name: "Blockchain Accountability Circle",
    icon: Cpu,
    color: "text-cyan-400",
    border: "border-cyan-400/20",
    bg: "bg-cyan-400/5",
    category: "Technology",
    description: "Exploring how blockchain transparency and immutable on-chain records can advance women's safety, rights accountability and impact verification.",
    members: 28,
    countries: [],
    teaser: "Thread: Using Chainlink oracles for tamper-proof WEI data feeds to smart contracts...",
  },
  {
    id: "usa-postdobbs",
    name: "USA Post-Dobbs Watch",
    icon: Flag,
    color: "text-red-400",
    border: "border-red-400/20",
    bg: "bg-red-400/5",
    category: "Country",
    description: "Tracking the measurable WEI impact of reproductive rights changes across US states following the Dobbs decision.",
    members: 41,
    countries: ["USA"],
    teaser: "Data update: 14 states now show bodily autonomy score below 30 — compliance map updated...",
  },
];

const ARCHETYPES = [
  { icon: "💰", title: "Impact Investors", desc: "Using WEI data to screen portfolios, satisfy ESG mandates and report impact to LPs with independent data." },
  { icon: "🤝", title: "NGOs & Non-profits", desc: "Citing WEI scores in grant applications, measuring program outcomes, connecting with funders in their focus regions." },
  { icon: "🔬", title: "Researchers", desc: "Auditing the methodology, contributing to the open-source index, publishing WEI-cited academic work." },
  { icon: "🏛️", title: "Policy Makers", desc: "Tracking legislative impact on WEI scores, using data in policy briefs and international reporting." },
  { icon: "🌱", title: "Advocates", desc: "Amplifying WEI findings in campaigns, connecting with organisations working in their focus countries." },
  { icon: "⛓️", title: "Blockchain Builders", desc: "Exploring how on-chain accountability mechanisms can make women's rights data tamper-proof and globally accessible." },
];

export default function Community() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Join the SHEtoken Community — Impact Investors, NGOs & Researchers"
        description="Connect with 280+ impact investors, NGOs, policy researchers and advocates tracking women's empowerment data in closed focus groups. Closed membership. Real intelligence."
        url="https://www.shetoken.org/community"
      />

      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40">
        <nav className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <img src={logo} alt="SheToken logo" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-gradient">SheToken</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-smooth flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Home</Link>
            <Link to="/why" className="hover:text-foreground transition-smooth">Why $SHE</Link>
            <Link to="/dashboard" className="hover:text-foreground transition-smooth">Live Data</Link>
            <Link to="/whitepaper" className="hover:text-foreground transition-smooth">Whitepaper</Link>
          </div>
          <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground border-0 shadow-gold hover:opacity-90">
            <a href="/#subscribe">Join early access <ArrowRight className="ml-1 h-4 w-4" /></a>
          </Button>
        </nav>
      </header>

      <main className="pt-24 pb-20">

        {/* HERO */}
        <section className="container max-w-4xl text-center py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-8">
            <Users className="h-3 w-3" /> 280+ members across 8 focus groups
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            The people making<br />
            <span className="text-gradient">women's empowerment</span><br />
            financially measurable.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Closed focus groups connecting impact investors, NGOs, researchers, policy makers
            and advocates around shared WEI data and real intelligence — not noise.
          </p>
          <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90 h-12 px-10 text-base">
            <a href="/#subscribe">Request access <ArrowRight className="ml-2 h-4 w-4" /></a>
          </Button>
          <p className="text-xs text-muted-foreground mt-4">Members only. We review each application.</p>
        </section>

        {/* WHO'S IN HERE */}
        <section className="py-16 bg-card/30 border-y border-border/40">
          <div className="container max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-10">Who's already here</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ARCHETYPES.map((a) => (
                <div key={a.title} className="flex gap-3 p-4 bg-gradient-card border border-border/40 rounded-xl shadow-card">
                  <span className="text-2xl shrink-0">{a.icon}</span>
                  <div>
                    <div className="font-semibold text-sm mb-1">{a.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOCUS GROUPS */}
        <section className="py-20 container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">8 closed focus groups</h2>
            <p className="text-muted-foreground">Members only see inside. Each group has its own signal feed, member directory and discussion threads.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {FOCUS_GROUPS.map((group) => (
              <div key={group.id} className={`relative bg-gradient-card border ${group.border} rounded-2xl overflow-hidden shadow-card`}>
                {/* Header */}
                <div className={`p-5 ${group.bg}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <group.icon className={`h-5 w-5 ${group.color}`} />
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">{group.category}</div>
                        <h3 className="font-bold">{group.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {group.members} members
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <p className="text-sm text-muted-foreground mb-4">{group.description}</p>

                  {/* Locked preview */}
                  <div className="relative rounded-lg border border-border/30 bg-background/20 p-3 overflow-hidden">
                    <div className="blur-sm select-none text-xs text-muted-foreground">
                      {group.teaser}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" /> Members only
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHY JOIN */}
        <section className="py-16 bg-card/30 border-y border-border/40">
          <div className="container max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-10">What you get inside</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "WEI signal alerts", desc: "Get notified when news events move the WEI for your focus countries. Before the data updates. Before the market moves." },
                { title: "Member directory", desc: "See who else is in your focus group. NGO in India? You'll see the investors who have India in their portfolio." },
                { title: "Request to connect", desc: "Send a connection request to any member. We send an email introduction. No cold outreach. No spam." },
                { title: "Research & publications", desc: "Curated library of peer-reviewed research that underpins the WEI methodology. Cite it. Build on it. Challenge it." },
                { title: '"Show the math" audit panel', desc: "See the raw indicators behind every WEI score. Full transparency on data sources, weights and calculations." },
                { title: "Personalised dashboard", desc: "Your saved countries float to the top of the leaderboard. Your focus group signals appear first." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 p-4 bg-gradient-card border border-border/40 rounded-xl">
                  <div className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm mb-1">{item.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 container max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to join?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start with the newsletter to get a sense of the intelligence we share. Full community access comes with your account.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90 h-12 px-8">
              <a href="/#subscribe">Join the newsletter <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 border-border/60 bg-card/40 backdrop-blur">
              <Link to="/why">Read our case →</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 SHE Foundation · shetoken.org</span>
          <div className="flex gap-6">
            <Link to="/why" className="hover:text-foreground">Why $SHE</Link>
            <Link to="/whitepaper" className="hover:text-foreground">Whitepaper</Link>
            <Link to="/dashboard" className="hover:text-foreground">Live Data</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
