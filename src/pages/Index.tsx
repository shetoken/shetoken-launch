import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { api } from "@/lib/api";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowRight, Sparkles, TrendingUp, Shield, GraduationCap, Heart, Scale,
  Globe2, Coins, Flame, Lock, HandHeart, Wifi, Sprout, Users,
  Star, Building2, Gem
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/she-logo.jpg";

const emailSchema = z.string().trim().email({ message: "Enter a valid email" }).max(255);

const Index = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await api.subscribe(parsed.data);
      toast.success("Welcome to the movement. Check your inbox soon.");
      setEmail("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { value: "1 in 3", label: "Women experience violence globally", source: "WHO 2021", href: "https://www.who.int/news-room/fact-sheets/detail/violence-against-women" },
    { value: "70%", label: "Of the world's extreme poor are women", source: "World Bank", href: "https://www.worldbank.org/en/topic/gender/overview" },
    { value: "2/3", label: "Of illiterate adults are women", source: "UNESCO", href: "https://www.unesco.org/en/gender-equality/education" },
    { value: "26%", label: "Of parliamentary seats held by women", source: "IPU 2024", href: "https://data.ipu.org/women-ranking" },
  ];

  const pillars = [
    { icon: Scale, title: "Empowerment", weight: "15%", desc: "Parliamentary seats, ministerial roles, legal rights, freedom of movement" },
    { icon: Sprout, title: "Bodily Autonomy", weight: "15%", desc: "Reproductive rights, child marriage, FGM, period poverty — new in v3.0" },
    { icon: Shield, title: "Safety & Justice", weight: "14%", desc: "DV laws, femicide, honour-based violence, legal aid, police responsiveness" },
    { icon: GraduationCap, title: "Education", weight: "12%", desc: "Literacy, enrollment, STEM, menstrual barriers to attendance" },
    { icon: Coins, title: "Economic Inclusion", weight: "12%", desc: "Pay gap, formal employment, banking access, property rights" },
    { icon: Heart, title: "Health & Survival", weight: "12%", desc: "Maternal mortality, life expectancy, anaemia, cancer screening" },
    { icon: HandHeart, title: "Dignity & Welfare", weight: "10%", desc: "Widow rights, caregiver burden, food insecurity, mental health" },
    { icon: Wifi, title: "Digital & Social", weight: "10%", desc: "Online harassment, internet & mobile gender gaps — new in v3.0" },
    { icon: Flame, title: "Violence Penalty", weight: "−10%", desc: "Rape, acid attacks, dowry violence, femicide — subtracted from score" },
  ];

  const COMMUNITY_PREVIEW = [
    {
      id: "impact-investors",
      name: "Impact Investor Network",
      category: "Use Case",
      color: "text-yellow-400",
      border: "border-yellow-400/20",
      bg: "bg-yellow-400/5",
      members: 63,
      teaser: "Discussion: How to weight WEI compliance scores in SFDR Article 9 reporting...",
    },
    {
      id: "south-asia",
      name: "South Asia Circle",
      category: "Region",
      color: "text-orange-400",
      border: "border-orange-400/20",
      bg: "bg-orange-400/5",
      members: 47,
      teaser: "Latest: India's Kanyashree program shows +2.3pt Education pillar impact in West Bengal...",
    },
    {
      id: "ngo-partners",
      name: "NGO & Non-profit Partners",
      category: "Use Case",
      color: "text-pink-400",
      border: "border-pink-400/20",
      bg: "bg-pink-400/5",
      members: 38,
      teaser: "Resource shared: Template for citing WEI data in UN funding applications...",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO />
      <Nav />

      {/* HERO */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        <div className="container relative z-10 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm mb-8 animate-glow-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            World's first data-backed gender accountability token
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
            She was always the currency. <br className="hidden md:block" />
            <span className="text-gradient">We just never measured it.</span><br />
            <span className="italic font-serif">Until now.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            $SHE is tied to the Women's Empowerment Index — built from UN, World Bank, WHO, UNESCO and UNODC data across 105 nations.
            When women's lives improve, the index rises. When the index rises, $SHE rises.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90 text-base h-12 px-8">
              <a href="#subscribe">Get early access <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 border-border/60 bg-card/40 backdrop-blur">
              <Link to="/why">Why this matters</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="mission" className="py-20 border-y border-border/40 bg-card/30">
        <div className="container">
          <p className="text-center text-sm uppercase tracking-widest text-muted-foreground mb-12">The scale of the problem</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-3">{s.value}</div>
                <div className="text-sm text-muted-foreground mb-2">{s.label}</div>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground/50 hover:text-accent underline underline-offset-2 transition-smooth"
                >
                  {s.source} ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WEI INDEX */}
      <section id="index" className="py-28">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-accent text-sm uppercase tracking-widest mb-4">The WEI Formula · v3.0</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Nine pillars. <span className="text-gradient">One score.</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The most comprehensive women's empowerment index ever published — the only one that prices period poverty, FGM,
              dowry violence, caregiver burden and digital harassment.
              Nine weighted pillars, one auditable score, updated annually from independent institutional data.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <div key={p.title} className="group bg-gradient-card border border-border/40 rounded-2xl p-7 shadow-card hover:border-primary/40 transition-smooth">
                <div className="flex items-center justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                    <p.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-2xl font-bold text-accent">{p.weight}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button asChild variant="outline" className="border-border/60 bg-card/40">
              <Link to="/dashboard">See live scores for 105 countries <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* COMMUNITY TEASER */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-6">
              <Users className="h-3 w-3" /> 280+ members across 8 focus groups
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The people making women's empowerment<br />
              <span className="text-gradient">financially measurable.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Impact investors, NGOs, policy researchers and advocates — connected by WEI data.
              Closed focus groups. Real intelligence. Not noise.
            </p>
          </div>

          {/* Preview cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {COMMUNITY_PREVIEW.map((group) => (
              <div key={group.id} className={`relative bg-gradient-card border ${group.border} rounded-2xl overflow-hidden shadow-card`}>
                <div className={`p-4 ${group.bg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-xs uppercase tracking-wide text-muted-foreground mb-0.5`}>{group.category}</div>
                      <h3 className="font-bold text-sm">{group.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {group.members}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="relative rounded-lg border border-border/30 bg-background/20 p-3 overflow-hidden">
                    <div className="blur-sm select-none text-xs text-muted-foreground leading-relaxed">
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

          <div className="text-center">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90 h-12 px-8">
              <Link to="/community">See all 8 focus groups <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">Members only. We review each application.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="earn" className="py-28">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-accent text-sm uppercase tracking-widest mb-4">How $SHE works</p>
            <h2 className="text-4xl md:text-5xl font-bold">Progress = <span className="text-gradient">value</span>.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Index-linked value", desc: "As the global WEI improves year on year, $SHE token supply expands and value appreciates. You hold accountability, not just currency." },
              { icon: Flame, title: "Regression burns tokens", desc: "When the WEI score falls — when conditions worsen — tokens are permanently burned. Regression has a cost. Progress has a reward." },
              { icon: Lock, title: "Long-term commitment", desc: "Lock $SHE for 6–12 months and earn bonus tokens for sustained belief in the mission. We reward patience and conviction." },
            ].map((f) => (
              <div key={f.title} className="bg-gradient-card border border-border/40 rounded-2xl p-8 shadow-card">
                <f.icon className="h-8 w-8 text-accent mb-5" />
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="outline" className="border-border/60 bg-card/40">
              <Link to="/why">Read the full case for impact tokens <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* GEO */}
      <section className="py-28 bg-card/30 border-y border-border/40">
        <div className="container max-w-5xl text-center">
          <Globe2 className="h-12 w-12 text-accent mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Global index. <span className="text-gradient">Local accountability.</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Track progress at the global level, drill into individual countries, or go deeper with state-level impact data.
            The first accountability index that works at every scale.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
            {[
              { tier: "Global", token: "$SHE", desc: "One token. The whole world." },
              { tier: "Country", token: "$SHE-IND", desc: "Track a nation's progress." },
              { tier: "State", token: "$SHE-KL", desc: "Local programs. Local impact." },
            ].map((t) => (
              <div key={t.token} className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{t.tier}</p>
                <p className="text-2xl font-bold text-gradient mb-2">{t.token}</p>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="border-border/60 bg-card/40 backdrop-blur">
            <Link to="/dashboard">Explore the live index <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* GET INVOLVED */}
      <section id="join" className="py-28">
        <div className="container max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-accent text-sm uppercase tracking-widest mb-4">Work with us</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              We're early. <span className="text-gradient">The right people matter.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The index is live across 105 countries. The token is in development.
              We're looking for advisors, strategic partners and early supporters who see what we're building.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Advisor */}
            <div className="flex flex-col bg-gradient-card border border-purple-400/20 rounded-2xl p-8 shadow-card">
              <div className="h-12 w-12 rounded-xl bg-purple-400/10 flex items-center justify-center mb-5">
                <Star className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Advisor</h3>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                Expertise in gender economics, impact investing, international development or blockchain?
                We're building a formal advisory structure and want people who've done this before.
              </p>
              <a
                href="mailto:contact@shetoken.org?subject=Advisor Interest — SHEtoken&body=Hi, I'm interested in exploring an advisory role with SHEtoken. My background is in..."
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-smooth"
              >
                Express interest <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Strategic Partner */}
            <div className="flex flex-col bg-gradient-card border border-blue-400/20 rounded-2xl p-8 shadow-card">
              <div className="h-12 w-12 rounded-xl bg-blue-400/10 flex items-center justify-center mb-5">
                <Building2 className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Strategic Partner</h3>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                NGOs, research institutions, government bodies and media organisations —
                co-brand research, access early WEI data and help shape the index methodology.
              </p>
              <a
                href="mailto:contact@shetoken.org?subject=Partnership Interest — SHEtoken&body=Hi, we're interested in exploring a strategic partnership with SHEtoken. Our organisation is..."
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-smooth"
              >
                Get in touch <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Early Supporter */}
            <div className="flex flex-col bg-gradient-card border border-accent/20 rounded-2xl p-8 shadow-card">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <Gem className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Early Supporter</h3>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                Interested in early token allocation or pre-seed investment?
                Join the waitlist — first in line when we open allocation rounds. No commitment required.
              </p>
              <a
                href="mailto:contact@shetoken.org?subject=Early Supporter Interest — SHEtoken&body=Hi, I'm interested in joining the early supporter waitlist for SHEtoken. I'm an..."
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-smooth"
              >
                Join the waitlist <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground/50 mt-10">
            No commitments. We review every message and follow up personally.
          </p>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section id="subscribe" className="py-28 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-background/40" />
        <div className="container relative z-10 max-w-2xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-5">Be first in line.</h2>
          <p className="text-lg text-foreground/80 mb-10">
            Join the SheToken newsletter — WEI score reports, signal alerts, community updates and early-access invites.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 bg-background/60 backdrop-blur border-border/60 text-base"
              maxLength={255}
            />
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="h-12 px-6 bg-gradient-primary text-primary-foreground border-0 shadow-gold hover:opacity-90"
            >
              {loading ? "..." : "Subscribe"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-5">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/40 py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-6 w-6 rounded-full object-cover" />
            <span>© 2026 SHE Foundation · shetoken.org</span>
          </div>
          <div className="flex flex-wrap gap-6 justify-center">
            <Link to="/why" className="hover:text-foreground transition-smooth">Why $SHE</Link>
            <Link to="/community" className="hover:text-foreground transition-smooth">Community</Link>
            <Link to="/dashboard" className="hover:text-foreground transition-smooth">Live Data</Link>
            <Link to="/whitepaper" className="hover:text-foreground transition-smooth">Whitepaper</Link>
            <a href="#join" className="hover:text-foreground transition-smooth">Work with us</a>
            <a href="mailto:contact@shetoken.org" className="hover:text-foreground transition-smooth">Contact</a>
            <a href="https://github.com/shetoken" className="hover:text-foreground transition-smooth">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
