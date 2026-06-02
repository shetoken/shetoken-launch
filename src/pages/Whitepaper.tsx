import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, CheckCircle, ExternalLink, FileText } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email"),
  company: z.string().min(1, "Please enter your organisation name"),
  job_title: z.string().optional(),
  org_type: z.string().min(1, "Please select your organisation type"),
  country: z.string().min(1, "Please enter your country"),
  intended_use: z.string().min(5, "Please describe how you intend to use this information"),
});

type FormData = z.infer<typeof formSchema>;

const ORG_TYPES = [
  "Impact Investor / ESG Fund",
  "Institutional Investor",
  "NGO / Non-profit",
  "Government / Policy",
  "Research / Academic",
  "Media / Press / Analyst",
  "Corporate / ESG Team",
  "Web3 / Crypto Project",
  "Other",
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold mt-10 mb-4 text-gradient">{children}</h2>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-5 rounded-xl border border-border/40">
      <table className="w-full text-sm">
        <thead className="bg-card/60 border-b border-border/40">
          <tr>{headers.map((h) => <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-border/20 ${i % 2 === 0 ? "" : "bg-card/10"}`}>
              {row.map((cell, j) => <td key={j} className="px-4 py-3">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WhitepaperContent() {
  return (
    <article className="prose prose-invert max-w-none text-foreground">
      <div className="bg-accent/10 border border-accent/20 rounded-xl p-5 mb-8 text-sm text-accent">
        SHEtoken Whitepaper · Version 2.0 · May 2026 · Ticker: $SHE
      </div>

      <SectionHeading>Abstract</SectionHeading>
      <p className="text-muted-foreground leading-relaxed">
        SHE (the Women's Empowerment Index Token) is the world's first data-backed cryptocurrency whose value is
        algorithmically tied to real-world women's empowerment outcomes. SHE's value is governed by the Women's
        Empowerment Index (WEI) — a composite annual score measuring female literacy, economic empowerment,
        safety from crime, poverty levels, and political participation across every nation and major state or province.
      </p>
      <ul className="mt-4 space-y-2 text-muted-foreground list-none pl-0">
        <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> When women's conditions improve → tokens are <strong className="text-foreground">minted</strong></li>
        <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" /> When crimes against women rise or female poverty deepens → tokens are <strong className="text-foreground">burned</strong></li>
      </ul>
      <p className="text-muted-foreground mt-4 italic">
        Mission: To make the advancement of women's rights financially measurable, publicly transparent, and globally
        investable — so that the world's progress on gender equality is not just moral, but economic.
      </p>

      <SectionHeading>1. The Problem</SectionHeading>
      <Table
        headers={["Indicator", "Scale", "Source"]}
        rows={[
          ["Violence against women", "1 in 3 women experience physical/sexual violence globally", "WHO 2021"],
          ["Female literacy gap", "Two-thirds of the world's illiterate adults are women", "UNESCO"],
          ["Feminization of poverty", "Women represent 70% of those in extreme poverty", "UN Women"],
          ["Political representation", "Only 26% of parliamentary seats held by women", "IPU 2024"],
          ["Gender pay gap", "Women earn 20% less than men on average", "ILO"],
        ]}
      />
      <p className="text-muted-foreground">
        No single public-facing tool simultaneously measures, penalises, and rewards progress across all these
        dimensions. Existing indices are for researchers. Existing women-focused crypto is speculative. SHE bridges this gap.
      </p>

      <SectionHeading>2. The WEI Formula v3.0</SectionHeading>
      <p className="text-muted-foreground mb-4">
        The Women's Empowerment Index (WEI) is calculated annually for each country on a <strong className="text-foreground">0–100 scale</strong>,
        covering 8 weighted pillars plus a violence penalty:
      </p>
      <Table
        headers={["Pillar", "Weight", "Key Indicators"]}
        rows={[
          ["Empowerment", "15%", "Parliamentary seats, ministerial roles, legal rights, freedom of movement"],
          ["Bodily Autonomy", "15%", "Reproductive rights, child marriage, FGM, period poverty — new in v3.0"],
          ["Safety & Justice", "14%", "DV laws, femicide, honour-based violence, legal aid, police responsiveness"],
          ["Education", "12%", "Literacy, enrollment, STEM, menstrual barriers to attendance"],
          ["Economic Inclusion", "12%", "Pay gap, formal employment, banking access, property rights"],
          ["Health & Survival", "12%", "Maternal mortality, life expectancy, anaemia, cancer screening"],
          ["Dignity & Welfare", "10%", "Widow rights, caregiver burden, food insecurity, mental health"],
          ["Digital & Social", "10%", "Online harassment, internet & mobile gender gaps — new in v3.0"],
          ["Violence Penalty", "−10%", "Rape, acid attacks, dowry violence, femicide — subtracted from score"],
        ]}
      />
      <div className="bg-card/40 border border-border/40 rounded-xl p-5 font-mono text-sm my-4">
        <p className="text-accent mb-1">WEI Formula:</p>
        <p className="text-muted-foreground">WEI = (Empowerment × 0.15) + (Bodily Autonomy × 0.15) + (Safety × 0.14)</p>
        <p className="text-muted-foreground">{"    "}+ (Education × 0.12) + (Economic × 0.12) + (Health × 0.12)</p>
        <p className="text-muted-foreground">{"    "}+ (Dignity × 0.10) + (Digital × 0.10) − (Violence Penalty × 0.10)</p>
      </div>
      <Table
        headers={["Tier", "WEI Score", "Description"]}
        rows={[
          ["Tier 1 — Preferred", "70+", "High-performing nations (Nordic, Canada, NZ) — recommended for investment"],
          ["Tier 2 — Acceptable", "45–69", "Mid-performing, showing progress"],
          ["Tier 3 — Caution", "20–44", "Significant gender gaps"],
          ["Tier 4 — Avoid", "<20", "Crisis-level gender inequality"],
        ]}
      />

      <SectionHeading>3. Tokenomics</SectionHeading>
      <Table
        headers={["Parameter", "Value"]}
        rows={[
          ["Token Name", "SHE (Women's Empowerment Index Token)"],
          ["Ticker", "$SHE"],
          ["Blockchain", "Ethereum ERC-20 + Polygon L2"],
          ["Total Supply", "1,000,000,000 SHE"],
          ["Smart Contract", "CertiK + OpenZeppelin audit (pre-launch)"],
        ]}
      />
      <Table
        headers={["Allocation", "%"]}
        rows={[
          ["Public Sale / Community", "40%"],
          ["WEI Impact Fund", "25%"],
          ["Founding Team (3-year vesting)", "15%"],
          ["Ecosystem & Partnerships", "10%"],
          ["Reserve & Liquidity", "10%"],
        ]}
      />

      <SectionHeading>4. Geographic Investment Tiers</SectionHeading>
      <Table
        headers={["Tier", "Token Format", "Description", "Launch"]}
        rows={[
          ["Global Index", "$SHE", "Tracks worldwide WEI score. One token, whole world", "Year 1"],
          ["Country Sub-Token", "$SHE-IND, $SHE-NGA, $SHE-USA", "Each country pegged to its own national WEI score", "Year 2"],
          ["State / Province Token", "$SHE-WB, $SHE-KL, $SHE-MH", "State-level tokens. Profit directly from local programs", "Year 3"],
        ]}
      />

      <SectionHeading>5. India as a Model</SectionHeading>
      <p className="text-muted-foreground mb-4">
        India provides the most compelling real-world proof that targeted programs measurably improve women's empowerment.
      </p>
      <Table
        headers={["Scheme", "Scale", "WEI Pillar"]}
        rows={[
          ["Lakshmi Bhandar (West Bengal)", "24.1M beneficiaries — direct cash ₹1,500–1,700/month", "Economic Inclusion"],
          ["Kanyashree (West Bengal)", "10M girls — UNESCO top honour winner", "Education & Literacy"],
          ["Kudumbashree (Kerala)", "Asia's largest women's SHG network — 46 lakh members", "Economic, Education, Health"],
          ["JEEViKA (Bihar)", "1.04M SHGs — ₹11,000+ crore in bank credit leveraged", "Economic Inclusion"],
          ["Educate Girls (Rajasthan/MP)", "6.7M beneficiaries — 380,000+ girls enrolled", "Education & Literacy"],
        ]}
      />

      <SectionHeading>6. Data Sources</SectionHeading>
      <Table
        headers={["Source", "Data Provided"]}
        rows={[
          ["UN Women", "Political empowerment, legal protections, violence statistics"],
          ["World Bank Gender Data Portal", "Economic participation, poverty rates, financial inclusion"],
          ["UNESCO Institute for Statistics", "Female literacy rates, school enrollment, education completion"],
          ["UNODC (UN Crime Office)", "Femicide rates, sexual violence reporting, trafficking statistics"],
          ["WHO Global Health Observatory", "Maternal mortality, reproductive health, life expectancy"],
          ["ILO", "Gender pay gap, labour force participation rates"],
          ["OECD SIGI", "Social norms, inheritance rights, legal discrimination"],
        ]}
      />

      <SectionHeading>7. Roadmap</SectionHeading>
      <Table
        headers={["Phase", "Timeline", "Key Milestone"]}
        rows={[
          ["Foundation", "Months 1–3", "Whitepaper, WEI formula, shetoken.org live"],
          ["Build", "Months 4–6", "Smart contract dev, NGO outreach, institutional pitches"],
          ["Testnet", "Months 7–9", "Ethereum testnet, Chainlink oracle, DAO governance"],
          ["Mainnet", "Months 10–12", "Public token sale, Uniswap V3, CoinGecko listing"],
          ["Country Tokens", "Year 2", "$SHE-IND, $SHE-NGA, $SHE-USA + 10 more"],
          ["State Tokens", "Year 3", "$SHE-WB, $SHE-KL, $SHE-MH, NGO portal"],
          ["Scale", "Year 4+", "UN Women partnership, 50+ country tokens"],
        ]}
      />

      <SectionHeading>8. Legal Disclaimer</SectionHeading>
      <p className="text-muted-foreground text-sm leading-relaxed">
        This whitepaper is for informational purposes only and does not constitute financial, investment, or legal advice.
        Cryptocurrency investments carry significant risk. SHEtoken is in pre-launch phase and no tokens are currently
        available for purchase. Past performance of any index does not guarantee future token value. Please consult a
        qualified financial advisor before making any investment decisions.
      </p>

      <div className="mt-10 p-5 bg-card/40 border border-accent/20 rounded-xl text-center">
        <p className="text-accent font-semibold mb-2">Interested in partnering?</p>
        <p className="text-muted-foreground text-sm mb-4">We welcome impact investors, NGOs, government partners, and Web3 infrastructure providers.</p>
        <a href="mailto:contact@shetoken.org" className="inline-flex items-center gap-2 text-accent hover:underline">
          contact@shetoken.org <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

const WP_UNLOCK_KEY = "she_whitepaper_unlocked";

export default function Whitepaper() {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<FormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  // Access persists: once granted (this browser) or while signed in.
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try { return localStorage.getItem(WP_UNLOCK_KEY) === "1"; } catch { return false; }
  });

  // Signed-in users get the whitepaper — having an account is access.
  useEffect(() => { if (user) setUnlocked(true); }, [user]);

  function handleChange(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = formSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    // Save the lead (best-effort) — never block access on it. If the table is
    // missing or RLS rejects the insert, we still grant access and log it.
    try {
      const { error } = await supabase.from("she_whitepaper_leads").insert({
        full_name: result.data.full_name,
        email: result.data.email,
        company: result.data.company ?? null,
        job_title: result.data.job_title ?? null,
        org_type: result.data.org_type ?? null,
        country: result.data.country ?? null,
        intended_use: result.data.intended_use ?? null,
      });
      if (error && error.code !== "23505") {
        console.warn("Whitepaper lead not saved:", error.message);
      }
    } catch (err) {
      console.warn("Whitepaper lead insert failed:", err);
    }

    // Newsletter subscribe (non-blocking)
    api.subscribe(result.data.email, "ngo").catch(() => {});

    // Grant + persist access
    try { localStorage.setItem(WP_UNLOCK_KEY, "1"); } catch { /* ignore */ }
    toast.success("Access granted — welcome to the SHEtoken research community.");
    setUnlocked(true);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="pt-24 pb-20 container max-w-4xl">
        {/* HEADER */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-6">
            <FileText className="h-3 w-3" /> SHEtoken Whitepaper · v2.0 · May 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            The <span className="text-gradient">SHEtoken</span> Whitepaper
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            The world's first data-backed gender accountability token — methodology, tokenomics, and investment framework.
          </p>
        </div>

        {/* TEASER */}
        <div className="bg-gradient-card border border-border/40 rounded-2xl p-8 shadow-card mb-10">
          <h2 className="text-xl font-bold mb-3">Abstract</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            SHE is the world's first cryptocurrency whose supply mechanics are governed by real-world women's empowerment outcomes.
            Built on the Women's Empowerment Index (WEI) — a composite of 8 weighted pillars across 105 countries — SHE mints
            tokens when women's conditions improve globally, and burns them when they deteriorate.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <em>"She was always the currency. We just never measured it."</em>
          </p>
        </div>

        {/* GATE or CONTENT */}
        {unlocked ? (
          <WhitepaperContent />
        ) : (
          <div className="bg-gradient-card border border-border/40 rounded-2xl shadow-card overflow-hidden">
            {/* Locked preview */}
            <div className="relative">
              <div className="p-8 opacity-20 blur-sm pointer-events-none select-none">
                <h2 className="text-xl font-bold mb-3">1. The Problem</h2>
                <p className="text-muted-foreground">Despite decades of advocacy, women face profound structural disadvantages globally. Violence against women affects 1 in 3 women worldwide. Two-thirds of the world's illiterate adults are women. Women represent 70% of those in extreme poverty...</p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-background/80 to-background">
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-accent" />
                  </div>
                  <p className="font-semibold text-lg">Full whitepaper — complimentary access</p>
                  <p className="text-muted-foreground text-sm text-center max-w-sm">
                    Share a few details about yourself and we'll unlock the complete methodology, tokenomics, and investment framework.
                  </p>
                </div>
              </div>
            </div>

            {/* FORM */}
            <div className="p-8 border-t border-border/40">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" /> Request full access
              </h3>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                  <Input
                    placeholder="Jane Smith"
                    value={form.full_name ?? ""}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    className="bg-background/60 border-border/60"
                  />
                  {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Work Email *</label>
                  <Input
                    type="email"
                    placeholder="jane@organisation.org"
                    value={form.email ?? ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="bg-background/60 border-border/60"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Company */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Organisation / Company *</label>
                  <Input
                    placeholder="Impact Ventures Ltd."
                    value={form.company ?? ""}
                    onChange={(e) => handleChange("company", e.target.value)}
                    className="bg-background/60 border-border/60"
                  />
                  {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
                </div>

                {/* Job Title */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Job Title</label>
                  <Input
                    placeholder="Head of Impact Investing"
                    value={form.job_title ?? ""}
                    onChange={(e) => handleChange("job_title", e.target.value)}
                    className="bg-background/60 border-border/60"
                  />
                </div>

                {/* Org Type */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Organisation Type *</label>
                  <select
                    value={form.org_type ?? ""}
                    onChange={(e) => handleChange("org_type", e.target.value)}
                    className="w-full h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select type…</option>
                    {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.org_type && <p className="text-red-400 text-xs mt-1">{errors.org_type}</p>}
                </div>

                {/* Country */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Country *</label>
                  <Input
                    placeholder="United States"
                    value={form.country ?? ""}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className="bg-background/60 border-border/60"
                  />
                  {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
                </div>

                {/* Intended Use */}
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">How do you intend to use this information? *</label>
                  <textarea
                    placeholder="e.g. Due diligence for ESG investment, academic research, policy analysis…"
                    value={form.intended_use ?? ""}
                    onChange={(e) => handleChange("intended_use", e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                  {errors.intended_use && <p className="text-red-400 text-xs mt-1">{errors.intended_use}</p>}
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90 text-base"
                  >
                    {loading ? "Submitting…" : "Unlock Full Whitepaper →"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Your information is kept private. We may follow up to discuss partnership opportunities.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 SHE Foundation · shetoken.org</span>
          <span>Whitepaper v2.0 · Open-source methodology</span>
        </div>
      </footer>
    </div>
  );
}
