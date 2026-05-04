import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Sparkles, TrendingUp, Shield, GraduationCap, Heart, Scale, Globe2, Coins, Flame, Lock, HandHeart, Wifi, Sprout } from "lucide-react";
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
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.success("You're already on the list — thank you!");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return;
    }
    toast.success("Welcome to the movement. Check your inbox soon.");
    setEmail("");
  };

  const stats = [
    { value: "1 in 3", label: "Women experience violence globally" },
    { value: "70%", label: "Of the world's extreme poor are women" },
    { value: "2/3", label: "Of illiterate adults are women" },
    { value: "26%", label: "Of parliamentary seats held by women" },
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

  const features = [
    { icon: TrendingUp, title: "Price Appreciation", desc: "As global WEI improves, demand rises and so does the token value." },
    { icon: Flame, title: "Token Scarcity", desc: "When the WEI score falls, tokens are permanently burned — your holdings get rarer." },
    { icon: Lock, title: "Staking Rewards", desc: "Lock $SHE for 6–12 months and earn bonus tokens for long-term belief." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40">
        <nav className="container flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2 font-bold text-lg">
            <img src={logo} alt="SheToken logo" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-gradient">SheToken</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#mission" className="hover:text-foreground transition-smooth">Mission</a>
            <a href="#index" className="hover:text-foreground transition-smooth">WEI Index</a>
            <a href="#earn" className="hover:text-foreground transition-smooth">Earn</a>
            <a href="#subscribe" className="hover:text-foreground transition-smooth">Newsletter</a>
          </div>
          <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground border-0 shadow-gold hover:opacity-90">
            <a href="#subscribe">Join <ArrowRight className="ml-1 h-4 w-4" /></a>
          </Button>
        </nav>
      </header>

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
            <span className="italic font-serif">$SHE goes up.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            SHE is the world's first data-backed cryptocurrency, algorithmically tied to the Women's Empowerment Index — 8 pillars built from UN, World Bank, WHO, UNESCO & UNODC data across every nation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90 text-base h-12 px-8">
              <a href="#subscribe">Get early access <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 border-border/60 bg-card/40 backdrop-blur">
              <a href="#index">Read the index</a>
            </Button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="mission" className="py-20 border-y border-border/40 bg-card/30">
        <div className="container">
          <p className="text-center text-sm uppercase tracking-widest text-muted-foreground mb-12">The critical moment</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-3">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground/60 mt-10">Sources: WHO, UN Women, UNESCO, IPU 2024</p>
        </div>
      </section>

      {/* WEI INDEX */}
      <section id="index" className="py-28">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-accent text-sm uppercase tracking-widest mb-4">The WEI Formula</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Five pillars. One score. <span className="text-gradient">Real accountability.</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A composite annual score for every country — fully open-source, fully auditable.</p>
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
        </div>
      </section>

      {/* EARN */}
      <section id="earn" className="py-28 bg-card/30 border-y border-border/40">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-accent text-sm uppercase tracking-widest mb-4">3 ways to earn</p>
            <h2 className="text-4xl md:text-5xl font-bold">Progress = <span className="text-gradient">value</span>.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-gradient-card border border-border/40 rounded-2xl p-8 shadow-card">
                <f.icon className="h-8 w-8 text-accent mb-5" />
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GEO */}
      <section className="py-28">
        <div className="container max-w-5xl text-center">
          <Globe2 className="h-12 w-12 text-accent mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Invest globally — or in <span className="text-gradient">your state</span>.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Choose the master $SHE token, country sub-tokens like $SHE-IND, or state-level impact bonds. The first government accountability crypto bond.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { tier: "Global", token: "$SHE", desc: "One token. The whole world." },
              { tier: "Country", token: "$SHE-IND", desc: "Bet on a nation's progress." },
              { tier: "State", token: "$SHE-KL", desc: "Profit from local programs." },
            ].map((t) => (
              <div key={t.token} className="bg-gradient-card border border-border/40 rounded-2xl p-6 shadow-card">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{t.tier}</p>
                <p className="text-2xl font-bold text-gradient mb-2">{t.token}</p>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section id="subscribe" className="py-28 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-background/40" />
        <div className="container relative z-10 max-w-2xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-5">Be first in line.</h2>
          <p className="text-lg text-foreground/80 mb-10">
            Join the SheToken newsletter for launch updates, WEI score reports, and early-access invites.
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
            <span>© 2026 SheToken — shetoken.org</span>
          </div>
          <div className="flex gap-6">
            <a href="mailto:contact@shetoken.org" className="hover:text-foreground transition-smooth">contact@shetoken.org</a>
            <a href="https://github.com/shetoken" className="hover:text-foreground transition-smooth">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
