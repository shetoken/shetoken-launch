import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowRight, Mail, Users, Heart, ShieldCheck, CheckCircle, Sparkles } from "lucide-react";

const emailSchema = z.string().email();

const GENDERS = ["Woman", "Non-binary", "Man", "Prefer to self-describe", "Prefer not to say"];
const ELIGIBLE = new Set(["Woman", "Non-binary"]);
const AGE_BANDS = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Prefer not to say"];
const INTERESTS = ["Safety", "Health", "Career", "Education", "Finance", "Motherhood", "Legal rights", "Mental health", "Entrepreneurship", "Activism"];
const PROFESSIONS = ["Student", "Healthcare", "Education", "Tech", "Business", "NGO / Social work", "Government", "Arts & media", "Homemaker", "Other"];
const REASONS = ["Find support", "Share my story", "Help other women", "Find resources", "Stay informed", "Networking", "Other"];

const selectCls = "w-full h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

/* ── SHE Community early-access intake ── */
function SheCommunityCard() {
  const { user, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ gender: "", age_band: "", country: "", city: "", profession: "", profession_other: "", reason: "", reason_other: "" });
  const [interests, setInterests] = useState<string[]>([]);
  const [interestsOther, setInterestsOther] = useState("");

  const { data: member, refetch } = useQuery({
    queryKey: ["community-member", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("she_community_members").select("id,gender,eligible").eq("user_id", user!.id).maybeSingle();
      return data as { id: string; gender: string; eligible: boolean } | null;
    },
  });

  const toggleInterest = (i: string) => setInterests((arr) => arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.gender || !f.age_band || !f.country.trim()) { toast.error("Please fill in your self-ID, age and country."); return; }
    if (f.age_band === "Under 18") { toast.error("SHE Community is for adults (18+)."); return; }
    setLoading(true);
    const eligible = ELIGIBLE.has(f.gender);
    try {
      const { error } = await supabase.from("she_community_members").upsert({
        user_id: user!.id, email: user!.email,
        gender: f.gender, eligible, age_band: f.age_band, country: f.country.trim(), city: f.city.trim() || null,
        interests, interests_other: interestsOther.trim() || null,
        profession: f.profession || null, profession_other: f.profession_other.trim() || null,
        reason: f.reason || null, reason_other: f.reason_other.trim() || null,
      }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success(eligible ? "You're on the SHE Community early-access list — welcome." : "Thanks — you're on our community list.");
      setOpen(false);
      refetch();
    } catch (err) {
      console.warn("community join failed", err);
      toast.error("Could not save. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 p-6 shadow-card">
      <div className="flex items-center gap-2 text-accent text-xs font-semibold mb-2"><Sparkles className="h-3.5 w-3.5" /> EARLY ACCESS</div>
      <h2 className="text-2xl font-bold mb-2">SHE Community</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-xl">
        A private, verified community built for women — support, safety, solidarity. We're opening it to early members.
        Tell us a little about you and we'll let you in as it rolls out.
      </p>

      {!user ? (
        <Button onClick={() => openAuth("signup")} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
          Sign in to join <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : member ? (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span className="text-muted-foreground">You're on the early-access list{member.eligible ? " for SHE Community" : ""}. We'll be in touch.</span>
        </div>
      ) : !open ? (
        <Button onClick={() => setOpen(true)} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
          Join SHE Community <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="text-xs font-medium mb-1 block">I identify as *</label>
            <select className={selectCls} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
              <option value="">Select…</option>{GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <p className="text-[10px] text-muted-foreground mt-1">We ask so we can offer the women-first space. Offered to women &amp; non-binary people.</p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Age band *</label>
            <select className={selectCls} value={f.age_band} onChange={(e) => setF({ ...f, age_band: e.target.value })}>
              <option value="">Select…</option>{AGE_BANDS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Country *</label>
            <Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="Country" className="bg-background/60 border-border/60" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">City</label>
            <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="City (optional)" className="bg-background/60 border-border/60" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1.5 block">Interests</label>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((i) => (
                <button type="button" key={i} onClick={() => toggleInterest(i)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-smooth ${interests.includes(i) ? "border-accent bg-accent/15 text-accent" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
                  {i}
                </button>
              ))}
            </div>
            <Input value={interestsOther} onChange={(e) => setInterestsOther(e.target.value)} placeholder="Other interests (optional)" className="bg-background/60 border-border/60 mt-2" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Profession</label>
            <select className={selectCls} value={f.profession} onChange={(e) => setF({ ...f, profession: e.target.value })}>
              <option value="">Select…</option>{PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {f.profession === "Other" && <Input value={f.profession_other} onChange={(e) => setF({ ...f, profession_other: e.target.value })} placeholder="Your profession" className="bg-background/60 border-border/60 mt-2" />}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Why are you joining?</label>
            <select className={selectCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })}>
              <option value="">Select…</option>{REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {f.reason === "Other" && <Input value={f.reason_other} onChange={(e) => setF({ ...f, reason_other: e.target.value })} placeholder="Tell us more" className="bg-background/60 border-border/60 mt-2" />}
          </div>
          <div className="sm:col-span-2 flex gap-3">
            <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
              {loading ? "Saving…" : "Join the early-access list"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border/60 bg-card/40">Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Community() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) { toast.error("Please enter a valid email."); return; }
    setLoading(true);
    try { await api.subscribe(parsed.data, "community"); setDone(true); setEmail(""); toast.success("You're on the list — welcome to the movement."); }
    catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Join the SHEtoken Community — A Movement for Women"
        description="Be part of the SHEtoken movement. Subscribe to the newsletter, create your account, and join SHE Community — a private, verified space built for women."
        url="https://www.shetoken.org/community"
      />
      <Nav />

      <main className="pt-24 pb-24">
        {/* HERO */}
        <section className="container max-w-3xl text-center pt-12 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-8">
            <Users className="h-3 w-3" /> Join the movement
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Be part of the<br /><span className="text-gradient">SHEtoken</span> community.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A movement to make women's empowerment measurable — and a private, women-first space built for women.
          </p>
        </section>

        {/* SHE Community — primary action, above everything else */}
        <section className="container max-w-3xl mb-8">
          <SheCommunityCard />
        </section>

        {/* Newsletter — lighter, secondary (no account needed) */}
        <section className="container max-w-3xl mb-12">
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card text-center">
            <p className="text-sm text-muted-foreground mb-3">Not ready to join? Just get the newsletter — no account needed.</p>
            <form onSubmit={handleSubscribe} id="subscribe" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="h-11 bg-background/60 border-border/60" />
              <Button type="submit" disabled={loading} className="h-11 px-6 bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90 shrink-0">
                {loading ? "…" : done ? "Subscribed ✓" : "Subscribe"}
              </Button>
            </form>
            <p className="text-[11px] text-muted-foreground mt-2">WEI reports, safety signals and early-access invites. No spam — unsubscribe anytime.</p>
          </div>
        </section>

        {/* gentle teaser */}
        <section className="container max-w-4xl">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Mail, title: "Stay in the loop", desc: "Women's-empowerment intelligence: WEI movements, safety signals and the stories behind the numbers." },
              { icon: ShieldCheck, title: "A space built for women", desc: "A verified, women-first community — trust-based and privacy-first. Early members get in first." },
              { icon: Heart, title: "Help drive change", desc: "Your voice and the data make the index sharper and the case for women stronger, everywhere." },
            ].map((x) => (
              <div key={x.title} className="bg-gradient-card border border-border/40 rounded-2xl p-5 shadow-card text-left">
                <x.icon className="h-5 w-5 text-accent mb-3" />
                <div className="font-semibold text-sm mb-1">{x.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{x.desc}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10"><Link to="/why" className="text-sm text-accent hover:underline">Read why $SHE exists →</Link></div>
        </section>
      </main>
    </div>
  );
}
