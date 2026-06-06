import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackSheCTA } from "@/components/BackSheCTA";
import { toast } from "sonner";
import { PenLine, CheckCircle, Users } from "lucide-react";

interface Sig { display_name: string; country: string }
const inputCls = "bg-background/60 border-border/60";

export default function Petition() {
  const [count, setCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<Sig[]>([]);
  const [f, setF] = useState({ name: "", email: "", country: "", reason: "" });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    fetch("/api/petition").then((r) => r.json()).then((d) => {
      setCount(d.count ?? 0); setRecent(d.recent ?? []);
    }).catch(() => setCount(0));
  }, []);

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) { toast.error("Please enter your name."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) { toast.error("Please enter a valid email."); return; }
    if (!f.country.trim()) { toast.error("Please enter your country."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/petition", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, consent }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "failed");
      setSigned(true);
      setCount(d.count ?? count); setRecent(d.recent ?? recent);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Sign the Petition — Demand the World Measure Women's Progress"
        description="Every major gender index is a report nobody is accountable to. Sign to support a public, auditable, continuously updated SHE Score — and a financial instrument that makes the number matter."
        url="https://www.shetoken.org/petition"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-4">
          <PenLine className="h-3 w-3" /> Petition
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-5">Demand the world measure women's progress.</h1>
        <p className="text-muted-foreground md:text-lg leading-relaxed mb-8">
          Every major gender index is a report nobody is accountable to — published occasionally, read by a few, with no
          consequence attached to the number moving. Sign to support a <strong className="text-foreground">public, auditable,
          continuously updated SHE Score</strong>: the same institutional data, scored sub-nationally, updated quarterly for
          registered governments, and wired to an instrument so that progress and regression both carry weight.
        </p>

        {/* Counter */}
        <div className="flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent/5 p-5 mb-8">
          <Users className="h-6 w-6 text-accent shrink-0" />
          <div>
            <div className="text-3xl font-bold tabular-nums">{count === null ? "…" : count.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{count === 1 ? "person has" : "people have"} signed so far</div>
          </div>
        </div>

        {/* Sign form */}
        {signed ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-6 mb-10 flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Thank you for signing.</div>
              <p className="text-sm text-muted-foreground mt-0.5">Your name and country will appear on the wall below. We'll keep you posted on the campaign.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={sign} className="rounded-2xl border border-border/40 bg-gradient-card p-6 shadow-card mb-10 grid gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Your name *" className={inputCls} />
              <Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="Country *" className={inputCls} />
            </div>
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@email.com *" className={inputCls} />
            <textarea value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} rows={2}
              placeholder="Why I'm signing (optional — reviewed before it's shown)"
              className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-current" />
              <span>Email me updates about the SHE Score and $SHE launch.</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={loading} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
                {loading ? "Signing…" : "Sign the petition"}
              </Button>
              <span className="text-[11px] text-muted-foreground max-w-md">
                Privacy: we publish only your <strong className="text-foreground">first name, last initial and country</strong> — never your
                full surname or email. See our <Link to="/privacy" className="text-accent hover:underline">privacy policy</Link>.
              </span>
            </div>
          </form>
        )}

        {/* Signature wall */}
        <h2 className="text-xl font-bold mb-4">Recent signatures</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-10">Be the first to sign.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-10">
            {recent.map((s, i) => (
              <div key={i} className="rounded-lg border border-border/40 bg-card/40 px-3 py-2 text-sm">
                <span className="font-medium">{s.display_name}</span>
                <span className="text-muted-foreground"> · {s.country}</span>
              </div>
            ))}
          </div>
        )}

        {/* Do more than sign → segmented CTA */}
        <h2 className="text-xl font-bold mb-3">Want to do more than sign?</h2>
        <BackSheCTA source="petition" />
      </main>
    </div>
  );
}
