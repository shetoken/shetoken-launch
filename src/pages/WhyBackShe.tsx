import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { HeartHandshake, LineChart, Cog, ShieldAlert, ArrowRight } from "lucide-react";

/* Phase 3 Task 1 — investor-facing page. Three audience sections.
   Section 3 (Token Participants) is MECHANICS ONLY: no language stating or
   implying financial return, upside, profit, price appreciation, or "early"
   advantage; and none of the words invest/returns/profit/upside/opportunity. */

const RISKS: { label: string; body: string }[] = [
  { label: "Volatility", body: "Token supply — and any secondary-market value — can move sharply and unpredictably." },
  { label: "Data lag", body: "The institutional inputs to the score publish on a delay; the score reflects the most recent published data, not live conditions." },
  { label: "Regulatory", body: "Token frameworks are evolving and differ by jurisdiction; rules may change or restrict participation." },
  { label: "Early stage", body: "The protocol is pre-launch and unproven; mechanics described here are designed, not yet operating." },
  { label: "Oracle risk", body: "The score is delivered on-chain by an oracle. An oracle can fail, lag, or be manipulated, which would affect supply mechanics." },
];

export default function WhyBackShe() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Why Back SHE — Funders, ESG Investors & Token Participants"
        description="Why capital should back the SHE Score: independent, continuous, comparable measurement of women's outcomes across 105 countries, with a financial instrument attached. Three audiences — funders, impact/ESG investors, and token participants (mechanics only)."
        url="https://www.shetoken.org/why-back-she"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-4xl">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-4">
            Why Back SHE
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Back the measurement that moves capital toward women.</h1>
          <p className="text-muted-foreground md:text-lg max-w-2xl">
            The SHE Score is independent, continuous, comparable measurement of women's outcomes — across 105 countries and
            sub-nationally. Here is what it offers three different kinds of backer.
          </p>
        </div>

        {/* Section 1 — Funders & Philanthropy */}
        <section className="mb-12 rounded-2xl border border-border/40 bg-gradient-card p-6 md:p-8 shadow-card">
          <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-widest mb-3">
            <HeartHandshake className="h-4 w-4" /> Funders &amp; Philanthropy
          </div>
          <h2 className="text-2xl font-bold mb-3">One grant funds the instrument that makes every program measurable.</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Today every gender index is a periodic report. The SHE Score is the instrument underneath: independent,
              continuous, comparable measurement of women's outcomes across 105 countries — and down to Indian states, so
              individual programs are visible on the same scale as national policy.
            </p>
            <p>
              A grant here funds the measurement layer that all programs — yours and everyone else's — can be held to.
              And because the score is wired to a financial instrument, philanthropic capital recruits market capital
              behind the same outcomes: your grant doesn't just fund a study, it stands up the public good that pulls
              private money toward women's progress. That is the strategic value — you fund the ruler, and the ruler
              changes what the market measures.
            </p>
          </div>
          {/* Segmented CTA (Task 3) is placed below this section, preselecting "Fund the index". */}
        </section>

        {/* Section 2 — Impact & ESG Investors */}
        <section className="mb-12 rounded-2xl border border-border/40 bg-gradient-card p-6 md:p-8 shadow-card">
          <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-widest mb-3">
            <LineChart className="h-4 w-4" /> Impact &amp; ESG Investors
          </div>
          <h2 className="text-2xl font-bold mb-3">The measurement instrument gender-lens investing has been missing.</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Gender-lens investing never had what carbon markets gave climate: a quantified, third-party-sourced,
              continuously tracked metric with an instrument attached. The SHE Score is that metric — built from the same
              institutional data you already trust (UN Women, World Bank, WHO, UNODC), normalised 0–100, updated quarterly
              for registered governments.
            </p>
            <p>
              SHE Score Impact Bonds let capital take a position on a specific government's programs succeeding — with
              verified institutional data, not self-reported ESG claims, deciding the outcome. The result is a gender
              metric you can underwrite, benchmark and report against, with settlement determined by data rather than by
              the issuer's narrative.
            </p>
          </div>
          {/* Segmented CTA (Task 3) is placed below this section, preselecting "Register a program or government". */}
        </section>

        {/* Section 3 — Token Participants (MECHANICS ONLY) */}
        <section className="mb-12 rounded-2xl border border-border/40 bg-card/40 p-6 md:p-8 shadow-card">
          <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-widest mb-3">
            <Cog className="h-4 w-4" /> Token Participants
          </div>
          <h2 className="text-2xl font-bold mb-2">How the system works.</h2>
          <p className="text-xs text-muted-foreground mb-6">
            This section describes what the protocol does — its mechanics. It is not a description of what a holder gains.
          </p>

          <div className="space-y-5">
            <div>
              <div className="font-semibold mb-1">Supply responds to the score</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When the published SHE Score rises by one point, <strong className="text-foreground">10,000,000 SHE units are minted to the Impact Fund</strong>.
                When it falls by one point, <strong className="text-foreground">10,000,000 units are burned from the reserve</strong>. Supply tracks the score; nothing else moves it.
              </p>
            </div>
            <div>
              <div className="font-semibold mb-1">Staking</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Holders can lock SHE for a fixed term (lockup). Locked positions accrue rewards from a defined reward pool
                over the lockup period, per the published schedule. Locking is optional and unlocks at term end.
              </p>
            </div>
            <div>
              <div className="font-semibold mb-1">Governance rights</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Holders vote on Impact Fund allocations, ratification of methodology changes, and emergency protocols —
                including the crisis vote that can be triggered by a sharp adverse move in the score.
              </p>
            </div>
            <div>
              <div className="font-semibold mb-1">Impact Bond structure</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                An Impact Bond is an instrument tied to a specific registered government's program targets. Its settlement
                is determined solely by the verified change in that jurisdiction's SHE Score over the bond term.
              </p>
            </div>
          </div>

          {/* Risk disclosure */}
          <div className="mt-8 rounded-xl border border-red-400/25 bg-red-400/5 p-5">
            <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-widest mb-3">
              <ShieldAlert className="h-4 w-4" /> Risk disclosure
            </div>
            <ul className="space-y-2.5">
              {RISKS.map((r) => (
                <li key={r.label} className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">{r.label}.</span> {r.body}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground/60 mt-4">
              Informational only — not financial or legal advice. The protocol is pre-launch and no token has been issued.
            </p>
          </div>
        </section>

        {/* Page close */}
        <div className="rounded-2xl border border-accent/25 bg-accent/5 p-6 md:p-8 text-center">
          <p className="text-lg md:text-xl font-semibold text-foreground leading-relaxed max-w-2xl mx-auto">
            Right now, the only people financially exposed to women's progress are women. Everyone else participates
            morally. $SHE exists to change which side capital is on.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/methodology" className="text-accent hover:underline">Read the methodology →</Link>
            <Link to="/index-landscape" className="text-accent hover:underline">See how it compares →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
