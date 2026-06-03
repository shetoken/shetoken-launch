import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowRight, Mail, Users, Heart, ShieldCheck } from "lucide-react";

const emailSchema = z.string().email();

export default function Community() {
  const { user, openAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) { toast.error("Please enter a valid email."); return; }
    setLoading(true);
    try {
      await api.subscribe(parsed.data, "community");
      setDone(true);
      setEmail("");
      toast.success("You're on the list — welcome to the movement.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Join the SHEtoken Community — A Movement for Women"
        description="Be part of the SHEtoken movement. Subscribe to the newsletter and create your account to join a growing community making women's empowerment measurable — with a safe, women-first space on the way."
        url="https://www.shetoken.org/community"
      />
      <Nav />

      <main className="pt-24 pb-24">
        {/* HERO + JOIN */}
        <section className="container max-w-3xl text-center py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-8">
            <Users className="h-3 w-3" /> Join the movement
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Be part of the<br />
            <span className="text-gradient">SHEtoken</span> community.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            We're building a movement to make women's empowerment measurable — and a safe,
            women-first space is on the way. Start by joining: subscribe to the newsletter and
            create your account.
          </p>

          {/* Newsletter subscribe */}
          <form onSubmit={handleSubscribe} id="subscribe" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 bg-card/40 border-border/60"
            />
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-6 bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90 shrink-0"
            >
              {loading ? "…" : done ? "Subscribed ✓" : "Subscribe"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mb-10">
            WEI reports, safety signals and early-access invites. No spam — unsubscribe anytime.
          </p>

          {!user ? (
            <Button
              size="lg"
              variant="outline"
              onClick={() => openAuth("signup")}
              className="h-12 px-8 border-border/60 bg-card/40 backdrop-blur"
            >
              Create an account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="text-foreground">{user.email}</span> — thanks for being here.
            </p>
          )}
        </section>

        {/* What being part of it means (gentle teaser — no closed-group claims) */}
        <section className="container max-w-4xl">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Mail, title: "Stay in the loop", desc: "Women's-empowerment intelligence: WEI movements, safety signals and the stories behind the numbers." },
              { icon: ShieldCheck, title: "A space built for women", desc: "We're designing a verified, women-first community — trust-based and privacy-first. Members get early access." },
              { icon: Heart, title: "Help drive change", desc: "Your voice and the data make the index sharper and the case for women stronger, everywhere." },
            ].map((f) => (
              <div key={f.title} className="bg-gradient-card border border-border/40 rounded-2xl p-5 shadow-card text-left">
                <f.icon className="h-5 w-5 text-accent mb-3" />
                <div className="font-semibold text-sm mb-1">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/why" className="text-sm text-accent hover:underline">Read why $SHE exists →</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
