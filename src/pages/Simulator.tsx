import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { PHASE_LABEL } from "@/config/site";
import { BackSheCTA } from "@/components/BackSheCTA";
import { AlertTriangle, RotateCcw, Sparkles, Flame } from "lucide-react";

/* ── Published v2 formula + documented constants ──────────────────────────
   SHE Score = (E×0.25)+(Ed×0.20)+(Ec×0.20)+(H×0.15)−(C×0.20)
   Supply: ±10,000,000 SHE units per point of score change, from 1,000,000,000.
   Crisis: Crime Penalty raised >15% above baseline fires the DAO emergency vote. */
type Pillars = { E: number; Ed: number; Ec: number; H: number; C: number };
const BASELINE: Pillars = { E: 52, Ed: 67, Ec: 52, H: 71, C: 42 };
const W = { E: 0.25, Ed: 0.20, Ec: 0.20, H: 0.15, C: 0.20 };
const START_SUPPLY = 1_000_000_000;
const UNITS_PER_POINT = 10_000_000;
const CRISIS_THRESHOLD = BASELINE.C * 1.15; // 48.3

const computeRaw = (p: Pillars) => p.E * W.E + p.Ed * W.Ed + p.Ec * W.Ec + p.H * W.H - p.C * W.C;
const round1 = (n: number) => Math.round((n + 1e-6) * 10) / 10; // 39.05 -> 39.1
const BASE_RAW = computeRaw(BASELINE);            // 39.05
const BASE_SCORE = round1(BASE_RAW);              // 39.1

const SLIDERS: { key: keyof Pillars; label: string; weight: string; penalty?: boolean }[] = [
  { key: "E", label: "Empowerment", weight: "×0.25" },
  { key: "Ed", label: "Education & Literacy", weight: "×0.20" },
  { key: "Ec", label: "Economic Inclusion", weight: "×0.20" },
  { key: "H", label: "Health & Survival", weight: "×0.15" },
  { key: "C", label: "Safety (Crime Penalty)", weight: "−0.20", penalty: true },
];

const fmtUnits = (n: number) => Math.round(Math.abs(n)).toLocaleString("en-US");

export default function Simulator() {
  const [p, setP] = useState<Pillars>({ ...BASELINE });

  const scoreRaw = useMemo(() => computeRaw(p), [p]);
  const score = round1(scoreRaw);
  const deltaPts = round1(scoreRaw - BASE_RAW);
  const supplyDelta = Math.round((scoreRaw - BASE_RAW) * UNITS_PER_POINT);
  const supply = START_SUPPLY + supplyDelta;
  const crisis = p.C > CRISIS_THRESHOLD;

  const set = (key: keyof Pillars, v: number) => setP((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SHE Score Simulator — How It Will Work"
        description="An interactive, illustrative simulation of how the SHE Score (v2) will drive $SHE token-supply mechanics. Move the five LIVE pillar sliders and watch the documented mint/burn rules execute. Simulation only — no real token exists."
        url="https://www.shetoken.org/simulator"
      />

      <Nav />

      {/* Persistent compliance banner — fixed below the nav, visible at all scroll positions */}
      <div className="fixed top-16 inset-x-0 z-40 bg-amber-500 text-black text-xs md:text-sm font-medium text-center px-3 py-2 shadow">
        SIMULATION — illustrative data only. No real token exists. Nothing on this page is an offer to sell or a solicitation to buy any asset.
      </div>

      <main className="pt-32 pb-20 container max-w-5xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-3">
            {PHASE_LABEL}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">How It Will Work</h1>
          <p className="text-muted-foreground md:text-lg max-w-2xl">
            Move the five LIVE pillar sliders below. The SHE Score will recompute from the published v2 formula, and the
            token-supply rules will execute exactly as documented. Everything here is illustrative — there is no live protocol.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setP({ ...BASELINE, Ed: 76 })}
            className="inline-flex items-center gap-1.5 text-sm rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 px-3 py-1.5 hover:bg-emerald-400/20 transition-colors">
            <Sparkles className="h-3.5 w-3.5" /> Kanyashree succeeds (Education 67→76)
          </button>
          <button onClick={() => setP({ ...BASELINE, C: 60 })}
            className="inline-flex items-center gap-1.5 text-sm rounded-full border border-red-400/40 bg-red-400/10 text-red-300 px-3 py-1.5 hover:bg-red-400/20 transition-colors">
            <Flame className="h-3.5 w-3.5" /> Crime spike
          </button>
          <button onClick={() => setP({ ...BASELINE })}
            className="inline-flex items-center gap-1.5 text-sm rounded-full border border-border/60 bg-card/40 text-muted-foreground px-3 py-1.5 hover:text-foreground transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Reset to baseline
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Sliders */}
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-6 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">Five LIVE pillars (0–100)</h2>
            <div className="space-y-5">
              {SLIDERS.map((s) => (
                <div key={s.key}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <label className="text-sm font-medium flex items-center gap-2">
                      {s.label}
                      <span className={`text-[10px] ${s.penalty ? "text-red-400" : "text-muted-foreground"}`}>{s.weight}</span>
                    </label>
                    <span className="text-sm font-bold tabular-nums">{p[s.key]}</span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={1} value={p[s.key]}
                    onChange={(e) => set(s.key, Number(e.target.value))}
                    className={`w-full ${s.penalty ? "accent-red-400" : "accent-amber-400"}`}
                    aria-label={s.label}
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-5">
              Crime Penalty is subtracted: a higher value lowers the score. Baseline is the West Bengal worked example
              from the published methodology.
            </p>
          </div>

          {/* Live consequences */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/40 bg-gradient-card p-6 shadow-card text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">SHE Score (v2)</div>
              <div className="text-6xl font-bold text-gradient leading-none">{score.toFixed(1)}</div>
              <div className={`text-sm mt-2 font-medium ${deltaPts > 0 ? "text-emerald-400" : deltaPts < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                {deltaPts > 0 ? "+" : ""}{deltaPts.toFixed(1)} points vs. baseline ({BASE_SCORE.toFixed(1)})
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-gradient-card p-6 shadow-card">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Token supply (illustrative)</div>
              <div className="text-2xl font-bold tabular-nums">{supply.toLocaleString("en-US")} <span className="text-sm text-muted-foreground font-normal">SHE</span></div>
              <div className="text-[11px] text-muted-foreground mt-0.5">from a starting supply of 1,000,000,000 SHE · ±10,000,000 SHE per point</div>
              {supplyDelta !== 0 && (
                <div className={`mt-3 text-sm font-semibold ${supplyDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {supplyDelta > 0
                    ? `${fmtUnits(supplyDelta)} SHE will be minted to the Impact Fund`
                    : `${fmtUnits(supplyDelta)} SHE will be burned from the Reserve`}
                </div>
              )}
            </div>

            {/* Crisis trigger */}
            {crisis && (
              <div className="rounded-2xl border-2 border-red-500 bg-red-500/10 p-6 shadow-card animate-glow-pulse">
                <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest mb-2">
                  <AlertTriangle className="h-5 w-5" /> Crisis Trigger
                </div>
                <p className="text-sm text-foreground/90 mb-3">
                  The Crime Penalty has risen more than 15% above baseline. This will open a <strong>DAO emergency vote</strong> with
                  a <strong>72-hour window</strong>. Holders will choose one of:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li><span className="font-semibold text-foreground">A.</span> Pause minting until the score stabilizes.</li>
                  <li><span className="font-semibold text-foreground">B.</span> Redirect the Impact Fund to emergency grants in the affected jurisdiction.</li>
                  <li><span className="font-semibold text-foreground">C.</span> Commission an expedited review of the crime indicators and data sources.</li>
                  <li><span className="font-semibold text-foreground">D.</span> Take no protocol action; record the event for the next governance cycle.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-8 max-w-3xl">
          This page is a client-side simulation. There is no wallet connection and no live protocol. Token quantities are
          shown in SHE units only and do not represent any price or monetary value. Informational only — not financial or legal advice.
        </p>

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link to="/methodology" className="text-accent hover:underline">Read the methodology →</Link>
          <Link to="/why-back-she" className="text-accent hover:underline">Why back the SHE Score →</Link>
        </div>

        {/* Segmented CTA (Phase 3 Task 3) */}
        <div className="mt-10">
          <BackSheCTA source="simulator" />
        </div>
      </main>
    </div>
  );
}
