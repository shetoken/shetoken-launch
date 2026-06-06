import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, HeartHandshake, Bell, Building2 } from "lucide-react";

/* Segmented "Back the SHE Score" CTA (Phase 3 Task 3).
   Three lists, each a tagged email capture. No payment, no token entitlement,
   no allocation/reservation language. Writes to /api/signup -> she_signups. */

type ListKey = "funders" | "token_interest" | "registrants";

const LISTS: Record<ListKey, { label: string; copy: string; icon: typeof Bell }> = {
  funders: {
    label: "Fund the index",
    copy: "Be first to know when the index crowdfund opens.",
    icon: HeartHandshake,
  },
  token_interest: {
    label: "Get notified at token launch",
    // Brief copy was "No commitment, no reservation, nothing to buy today." — but the hard
    // wording rule bans "reserve"/allocation language in this button, so "no reservation" is
    // dropped while keeping the same disclaimer intent. (Flagged in the Task 3 report.)
    copy: "We'll email you when $SHE goes live. No commitment, and nothing to buy today.",
    icon: Bell,
  },
  registrants: {
    label: "Register a program or government",
    copy: "For NGOs and government bodies interested in verified scoring.",
    icon: Building2,
  },
};

const PROGRAM_TYPES = ["Government / public body", "NGO / nonprofit", "Multilateral / development agency", "Research / academic", "Other"];
const inputCls = "bg-background/60 border-border/60";
const selectCls = "w-full h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

export function BackSheCTA({ source, preselect }: { source: string; preselect?: ListKey }) {
  const [open, setOpen] = useState<ListKey | null>(preselect ?? null);
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [region, setRegion] = useState("");
  const [programType, setProgramType] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<ListKey | null>(null);

  async function submit(e: React.FormEvent, list: ListKey) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error("Please enter a valid email."); return; }
    if (list === "registrants" && (!orgName.trim() || !region.trim())) { toast.error("Please add your organization and country/state."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list, email: email.trim(), source_page: source,
          org_name: list === "registrants" ? orgName.trim() : undefined,
          region: list === "registrants" ? region.trim() : undefined,
          program_type: list === "registrants" ? programType : undefined,
          consent,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "failed");
      setDone(list);
      setEmail(""); setOrgName(""); setRegion(""); setProgramType(""); setConsent(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <section className="rounded-2xl border border-accent/25 bg-accent/5 p-6 md:p-8 shadow-card">
      <h2 className="text-2xl font-bold mb-1">Back the SHE Score</h2>
      <p className="text-sm text-muted-foreground mb-5">Choose how you'd like to be involved. No payment, no tokens, nothing to buy.</p>

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {(Object.keys(LISTS) as ListKey[]).map((k) => {
          const L = LISTS[k];
          const active = open === k;
          return (
            <button key={k} onClick={() => { setOpen(k); setDone(null); }}
              className={`text-left rounded-xl border p-4 transition-smooth ${active ? "border-accent bg-accent/10 shadow-glow" : "border-border/40 bg-card/40 hover:border-accent/40"}`}>
              <L.icon className={`h-5 w-5 mb-2 ${active ? "text-accent" : "text-muted-foreground"}`} />
              <div className="font-semibold text-sm leading-tight mb-1">{L.label}</div>
              <div className="text-[11px] text-muted-foreground leading-snug">{L.copy}</div>
            </button>
          );
        })}
      </div>

      {open && done === open ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 flex items-start gap-2.5">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-foreground">You're on the “{LISTS[open].label}” list.</div>
            <p className="text-muted-foreground mt-0.5">
              Signing up creates <strong className="text-foreground">no entitlement of any kind</strong> — nothing has been purchased, reserved or allocated. We'll only email you what you asked for.
            </p>
          </div>
        </div>
      ) : open ? (
        <form onSubmit={(e) => submit(e, open)} className="grid gap-3">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={inputCls} />
          {open === "registrants" && (
            <div className="grid sm:grid-cols-3 gap-3">
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name *" className={inputCls} />
              <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Country / state *" className={inputCls} />
              <select value={programType} onChange={(e) => setProgramType(e.target.value)} className={selectCls}>
                <option value="">Program type…</option>
                {PROGRAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-current" />
            <span>Email me updates about the SHE Score and $SHE launch.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
              {loading ? "Submitting…" : LISTS[open].label}
            </Button>
            <span className="text-[11px] text-muted-foreground">
              No payment, no tokens. Signing up creates no entitlement. See our <Link to="/privacy" className="text-accent hover:underline">privacy policy</Link>.
            </span>
          </div>
        </form>
      ) : null}
    </section>
  );
}
