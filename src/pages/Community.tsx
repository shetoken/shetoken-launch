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
import { ArrowRight, Mail, Users, Heart, ShieldCheck, CheckCircle, Sparkles, HeartHandshake, Building2, Store, GraduationCap, Award } from "lucide-react";
import { SupportersMarquee } from "@/components/SupportersMarquee";

const emailSchema = z.string().email();

/* ── Partner / sponsor intake ── */
const PARTNER_TYPES = ["Impact investor", "Foundation / grantmaker", "Corporate / CSR", "Government", "Web3 infrastructure", "Individual donor"];
const PARTNER_INTERESTS = ["Sponsor a scholarship drive", "Fund microfinance", "Match funding", "Strategic partnership", "Provide infrastructure", "General partnership"];
const BUDGET_BANDS = ["In-kind / non-cash", "Under $5k", "$5k–25k", "$25k–100k", "$100k+", "Prefer not to say"];
const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

const GENDERS = ["Woman", "Non-binary", "Man", "Prefer to self-describe", "Prefer not to say"];
const ELIGIBLE = new Set(["Woman", "Non-binary"]);
const AGE_BANDS = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Prefer not to say"];
const INTERESTS = ["Safety", "Health", "Career", "Education", "Finance", "Motherhood", "Legal rights", "Mental health", "Entrepreneurship", "Activism"];
const PROFESSIONS = ["Student", "Healthcare", "Education", "Tech", "Business", "NGO / Social work", "Government", "Arts & media", "Homemaker", "Other"];
const REASONS = ["Find support", "Share my story", "Help other women", "Find resources", "Stay informed", "Networking", "Other"];
const CARING = ["Parents", "Grandparents", "In-laws", "Partner / spouse", "Sibling(s)", "A person with a disability", "Other"];
const COUNTS = ["0", "1", "2", "3", "4", "5+"];
const CIRCUMSTANCES = ["Sole earner for my family", "Young carer (caring since I was young)", "Lost a parent", "Widow", "Caring while studying or working", "Survivor"];
const numFrom = (s: string) => (s === "" ? null : s === "5+" ? 5 : parseInt(s, 10));

const selectCls = "w-full h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

/* ── SHE Community early-access intake ── */
function SheCommunityCard() {
  const { user, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ gender: "", age_band: "", country: "", city: "", profession: "", profession_other: "", reason: "", reason_other: "", single_mother: "" });
  const [interests, setInterests] = useState<string[]>([]);
  const [interestsOther, setInterestsOther] = useState("");
  const [depGirls, setDepGirls] = useState("");
  const [depBoys, setDepBoys] = useState("");
  const [caring, setCaring] = useState<string[]>([]);
  const [caringOther, setCaringOther] = useState("");
  const [circumstances, setCircumstances] = useState<string[]>([]);
  const [story, setStory] = useState("");
  const toggleCaring = (i: string) => setCaring((arr) => arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);
  const toggleCircumstance = (i: string) => setCircumstances((arr) => arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);

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
        single_mother: f.single_mother || null,
        dependent_girls: numFrom(depGirls), dependent_boys: numFrom(depBoys),
        caring_for: caring, caring_for_other: caringOther.trim() || null,
        circumstances, story: story.trim() || null,
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
          {/* Family & care — optional */}
          <div className="sm:col-span-2 border-t border-border/30 pt-4 mt-1">
            <p className="text-xs font-semibold">Family &amp; care <span className="text-muted-foreground font-normal">(optional)</span></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Caregiving shapes women's lives and opportunities — this helps us understand and support members. All optional.</p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Are you a single mother?</label>
            <select className={selectCls} value={f.single_mother} onChange={(e) => setF({ ...f, single_mother: e.target.value })}>
              <option value="">Prefer not to say</option><option value="Yes">Yes</option><option value="No">No</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Dependent girls</label>
              <select className={selectCls} value={depGirls} onChange={(e) => setDepGirls(e.target.value)}>
                <option value="">—</option>{COUNTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Dependent boys</label>
              <select className={selectCls} value={depBoys} onChange={(e) => setDepBoys(e.target.value)}>
                <option value="">—</option>{COUNTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1.5 block">Also caring for someone in the family?</label>
            <div className="flex flex-wrap gap-1.5">
              {CARING.map((i) => (
                <button type="button" key={i} onClick={() => toggleCaring(i)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-smooth ${caring.includes(i) ? "border-accent bg-accent/15 text-accent" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
                  {i}
                </button>
              ))}
            </div>
            {caring.includes("Other") && <Input value={caringOther} onChange={(e) => setCaringOther(e.target.value)} placeholder="Who else? (optional)" className="bg-background/60 border-border/60 mt-2" />}
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1.5 block">Does any of this describe your journey? <span className="text-muted-foreground font-normal">(optional — choose what feels right)</span></label>
            <div className="flex flex-wrap gap-1.5">
              {CIRCUMSTANCES.map((i) => (
                <button type="button" key={i} onClick={() => toggleCircumstance(i)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-smooth ${circumstances.includes(i) ? "border-accent bg-accent/15 text-accent" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
                  {i}
                </button>
              ))}
            </div>
            <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={2}
              placeholder="Anything about your journey you'd like to share? (optional)"
              className="w-full mt-2 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
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

/* ── Partner / sponsor sign-up ── */
function PartnerCard() {
  const { user, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ org_name: "", partner_type: "", contact_name: "", website: "", regions: "", budget_band: "", message: "" });
  const [interests, setInterests] = useState<string[]>([]);
  const toggle = (i: string) => setInterests((arr) => arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);

  const { data: existing, refetch } = useQuery({
    queryKey: ["partner", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("she_partners").select("id,org_name,status").eq("user_id", user!.id).maybeSingle();
      return data as { id: string; org_name: string; status: string } | null;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.org_name.trim() || !f.partner_type) { toast.error("Please add your organisation name and type."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("she_partners").upsert({
        user_id: user!.id, email: user!.email,
        org_name: f.org_name.trim(), partner_type: f.partner_type,
        contact_name: f.contact_name.trim() || null, website: f.website.trim() || null,
        interests, regions: splitList(f.regions),
        budget_band: f.budget_band || null, message: f.message.trim() || null,
        status: "pending",
      }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Thank you — your partner registration is in. We'll be in touch.");
      setOpen(false); refetch();
    } catch (err) { console.warn("partner join failed", err); toast.error("Could not save. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-purple-400/25 bg-purple-400/5 p-6 shadow-card">
      <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold mb-2"><HeartHandshake className="h-3.5 w-3.5" /> PARTNER WITH US</div>
      <h2 className="text-2xl font-bold mb-2">Partners &amp; sponsors</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-xl">
        Impact investors, foundations, corporates, governments and Web3 infrastructure partners — fund scholarship and
        microfinance drives, sponsor regions, and help make women's advancement measurable and investable.
      </p>

      {!user ? (
        <Button onClick={() => openAuth("signup")} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
          Sign in to register <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : existing ? (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span className="text-muted-foreground">{existing.org_name} is registered as a partner ({existing.status}). We'll reach out.</span>
        </div>
      ) : !open ? (
        <Button onClick={() => setOpen(true)} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
          Register as a partner <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="text-xs font-medium mb-1 block">Organisation name *</label>
            <Input value={f.org_name} onChange={(e) => setF({ ...f, org_name: e.target.value })} placeholder="Organisation / fund" className="bg-background/60 border-border/60" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Partner type *</label>
            <select className={selectCls} value={f.partner_type} onChange={(e) => setF({ ...f, partner_type: e.target.value })}>
              <option value="">Select…</option>{PARTNER_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Contact name</label>
            <Input value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} placeholder="Your name" className="bg-background/60 border-border/60" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Website</label>
            <Input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://" className="bg-background/60 border-border/60" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1.5 block">How would you like to partner?</label>
            <div className="flex flex-wrap gap-1.5">
              {PARTNER_INTERESTS.map((i) => (
                <button type="button" key={i} onClick={() => toggle(i)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-smooth ${interests.includes(i) ? "border-accent bg-accent/15 text-accent" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Regions of interest</label>
            <Input value={f.regions} onChange={(e) => setF({ ...f, regions: e.target.value })} placeholder="e.g. Massachusetts, West Bengal" className="bg-background/60 border-border/60" />
            <p className="text-[10px] text-muted-foreground mt-1">Comma-separated.</p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Indicative support</label>
            <select className={selectCls} value={f.budget_band} onChange={(e) => setF({ ...f, budget_band: e.target.value })}>
              <option value="">Prefer not to say</option>{BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block">Anything else?</label>
            <textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={2}
              placeholder="Tell us what you're hoping to support (optional)"
              className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
          <div className="sm:col-span-2 flex gap-3">
            <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
              {loading ? "Saving…" : "Submit registration"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-border/60 bg-card/40">Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ── NGO / nonprofit self-registration ── */
function NgoSelfSignupCard() {
  const { user, openAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({ name: "", country: "", city: "", focus_area: "", website: "", contact_name: "", contact_email: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) { toast.error("Please add your organisation name."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("she_ngos").insert({
        name: f.name.trim(), country: f.country.trim() || null, city: f.city.trim() || null,
        focus_area: f.focus_area.trim() || null, website: f.website.trim() || null,
        contact_name: f.contact_name.trim() || null,
        contact_email: f.contact_email.trim() || user?.email || null,
        verified: false, submitted_by: user?.id ?? null,
      });
      if (error) throw error;
      toast.success("Thank you — your organisation is submitted for review.");
      setDone(true);
    } catch (err) { console.warn("ngo signup failed", err); toast.error("Could not submit. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-6 shadow-card">
      <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold mb-2"><Building2 className="h-3.5 w-3.5" /> FOR ORGANISATIONS</div>
      <h2 className="text-2xl font-bold mb-2">NGO &amp; nonprofit registry</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-xl">
        Women- and girls-serving organisations: join the SHE Community directory. Verified NGOs become disbursement and
        advocacy partners for scholarship and microfinance drives — and can represent women without a phone of their own.
      </p>

      {!user ? (
        <Button onClick={() => openAuth("signup")} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
          Sign in to register <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : done ? (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span className="text-muted-foreground">Submitted for review. We verify each organisation before it goes live.</span>
        </div>
      ) : (
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4 mt-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block">Organisation name *</label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Organisation name" className="bg-background/60 border-border/60" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Country</label>
            <Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="Country" className="bg-background/60 border-border/60" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">City</label>
            <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="City" className="bg-background/60 border-border/60" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block">Focus area</label>
            <Input value={f.focus_area} onChange={(e) => setF({ ...f, focus_area: e.target.value })} placeholder="e.g. GBV support, girls' education, microfinance" className="bg-background/60 border-border/60" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Contact name</label>
            <Input value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} placeholder="Your name" className="bg-background/60 border-border/60" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Contact email</label>
            <Input value={f.contact_email} onChange={(e) => setF({ ...f, contact_email: e.target.value })} placeholder={user?.email ?? "contact@org.org"} className="bg-background/60 border-border/60" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block">Website</label>
            <Input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://" className="bg-background/60 border-border/60" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
              {loading ? "Submitting…" : "Submit for review"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

const ROLES = [
  { key: "member", label: "Join as a member", desc: "Women & non-binary — support, safety, solidarity.", Icon: Users },
  { key: "partner", label: "Partner / Sponsor", desc: "Announce scholarship & microfinance drives, sponsor regions.", Icon: HeartHandshake },
  { key: "ngo", label: "NGO / Nonprofit", desc: "Register your organisation to the directory.", Icon: Building2 },
  { key: "business", label: "Business owner", desc: "Sell products & services on SHEconomy.", Icon: Store },
] as const;
type Role = typeof ROLES[number]["key"];

export default function Community() {
  const [role, setRole] = useState<Role>("member");
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

        {/* Rolling supporters — partners, sponsors, NGOs, businesses */}
        <SupportersMarquee />

        {/* Role gateway — choose how you're joining */}
        <section className="container max-w-3xl mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-3 text-center">I'm joining as…</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {ROLES.map((r) => {
              const active = role === r.key;
              return (
                <button key={r.key} onClick={() => setRole(r.key)}
                  className={`text-left rounded-2xl border p-4 transition-smooth ${active ? "border-accent bg-accent/10 shadow-glow" : "border-border/40 bg-gradient-card hover:border-accent/40"}`}>
                  <r.Icon className={`h-5 w-5 mb-2 ${active ? "text-accent" : "text-muted-foreground"}`} />
                  <div className="font-semibold text-sm leading-tight mb-1">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">{r.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected role panel */}
        <section className="container max-w-3xl mb-8">
          {role === "member" && <SheCommunityCard />}
          {role === "partner" && <PartnerCard />}
          {role === "ngo" && <NgoSelfSignupCard />}
          {role === "business" && (
            <div className="rounded-2xl border border-border/40 bg-gradient-card p-6 shadow-card">
              <div className="flex items-center gap-2 text-accent text-xs font-semibold mb-2"><Store className="h-3.5 w-3.5" /> SHEconomy</div>
              <h2 className="text-2xl font-bold mb-2">Sell on SHEconomy</h2>
              <p className="text-sm text-muted-foreground mb-5 max-w-xl">
                Women-owned businesses can open a shop, list products and services, and reach buyers who want to put their
                money behind women. Set up your shop in the SHEconomy marketplace.
              </p>
              <Link to="/marketplace">
                <Button className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
                  Open your shop <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Drives — scholarship / microfinance */}
        <section className="container max-w-3xl mb-12">
          <div className="rounded-2xl border border-purple-400/25 bg-gradient-to-br from-purple-400/10 to-emerald-400/5 p-6 shadow-card flex flex-col sm:flex-row sm:items-center gap-4">
            <GraduationCap className="h-8 w-8 text-purple-300 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Scholarship &amp; microfinance drives</h3>
              <p className="text-sm text-muted-foreground">
                Partners, foundations and individuals fund scholarships, microfinance and grants for women and girls —
                disbursed by vetted partner NGOs. Apply for support, or nominate a woman who can't apply herself.
              </p>
            </div>
            <Link to="/drives" className="shrink-0">
              <Button className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
                View drives <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Initiatives we celebrate */}
        <section className="container max-w-3xl mb-12">
          <div className="rounded-2xl border border-accent/25 bg-accent/5 p-6 shadow-card flex flex-col sm:flex-row sm:items-center gap-4">
            <Award className="h-8 w-8 text-accent shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Initiatives we celebrate</h3>
              <p className="text-sm text-muted-foreground">
                Advancing women belongs to many. We recognize organizations and movements making women safer, freer and
                more powerful — whether or not they partner with us.
              </p>
            </div>
            <Link to="/initiatives" className="shrink-0">
              <Button variant="outline" className="border-accent/40 text-accent bg-card/40 hover:bg-accent/10">
                See who we celebrate <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
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
            <p className="text-[11px] text-muted-foreground mt-2">SHE Score reports, safety signals and early-access invites. No spam — unsubscribe anytime. See our <Link to="/privacy" className="text-accent hover:underline">privacy policy</Link>.</p>
          </div>
        </section>

        {/* gentle teaser */}
        <section className="container max-w-4xl">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Mail, title: "Stay in the loop", desc: "Women's-empowerment intelligence: SHE Score movements, safety signals and the stories behind the numbers." },
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
