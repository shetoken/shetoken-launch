import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type VitalStats } from "@/lib/api";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Clock, Info } from "lucide-react";

const WEEK_SECONDS = 7 * 24 * 3600;

interface Metric { key: keyof VitalStats; label: string; icon: string; tone: "hope" | "harm"; }
const METRICS: Metric[] = [
  { key: "girls_born_per_week_est",             label: "A girl is born",                 icon: "👶", tone: "hope" },
  { key: "girls_drop_out_school_per_week_est",  label: "A girl drops out of school",     icon: "🎒", tone: "harm" },
  { key: "girls_married_under18_per_week_est",  label: "A girl is married before 18",    icon: "💍", tone: "harm" },
  { key: "women_killed_by_partner_per_week_est",label: "A woman is killed by her partner", icon: "🕯️", tone: "harm" },
  { key: "maternal_deaths_per_week_est",        label: "A mother dies in childbirth",    icon: "⚰️", tone: "harm" },
];

const toneColor = (t: "hope" | "harm") => (t === "hope" ? "#10b981" : "#ef4444");

function cadence(ratePerSec: number): string {
  if (!ratePerSec || ratePerSec <= 0) return "none recorded";
  const s = 1 / ratePerSec;
  if (s < 1)    return `${(1 / s).toFixed(1)} every second`;
  if (s < 60)   return `one every ${s.toFixed(0)}s`;
  if (s < 3600) return `one every ${(s / 60).toFixed(0)} min`;
  if (s < 86400)return `one every ${(s / 3600).toFixed(1)} hr`;
  return `one every ${(s / 86400).toFixed(1)} days`;
}

function fmtTally(n: number): string {
  if (n >= 100) return Math.floor(n).toLocaleString("en-US");
  return n.toFixed(1);
}

function CountryPicker({ value, onChange, list, accent }: {
  value: string; onChange: (iso: string) => void;
  list: { iso_code: string; country: string }[]; accent: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-card/60 border rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none"
      style={{ borderColor: `${accent}55`, color: accent }}
    >
      {list.map((c) => <option key={c.iso_code} value={c.iso_code} className="bg-card text-foreground">{c.country}</option>)}
    </select>
  );
}

export default function SheClock() {
  const [isoA, setIsoA] = useState("IND");
  const [isoB, setIsoB] = useState("NOR");
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => setElapsed((Date.now() - start.current) / 1000), 200);
    return () => clearInterval(id);
  }, []);

  const { data: countriesRes } = useQuery({
    queryKey: ["wei-countries"], queryFn: () => api.wei.countries(105), staleTime: 30 * 60 * 1000,
  });
  const list = (countriesRes?.data ?? []).map((c) => ({ iso_code: c.iso_code, country: c.country }))
    .sort((a, b) => a.country.localeCompare(b.country));

  const qA = useQuery({ queryKey: ["vital", isoA], queryFn: () => api.vital.country(isoA), staleTime: 30 * 60 * 1000 });
  const qB = useQuery({ queryKey: ["vital", isoB], queryFn: () => api.vital.country(isoB), staleTime: 30 * 60 * 1000 });
  const A = qA.data; const B = qB.data;

  const rate = (v: VitalStats | undefined, key: keyof VitalStats) =>
    (Number(v?.[key] ?? 0) || 0) / WEEK_SECONDS;

  const accentA = "#f59e0b", accentB = "#22d3ee";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="The She-Clock — What Happens to Girls, in Real Time"
        description="A live clock of what happens to girls and women, ticking by the second — girls born, married before 18, killed by a partner, dying in childbirth. Compare any two countries side by side."
        url="https://www.shetoken.org/she-clock"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-4xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-3">
            <Clock className="h-3 w-3" /> The She-Clock · live
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">What happens to girls, in real time</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
            A living clock of a girl's life — ticking by the second from real annual rates.
            Watch two countries side by side.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            Since you opened this page: <span className="font-mono text-accent">{elapsed.toFixed(0)}s</span>
          </p>
        </div>

        {/* Country pickers */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <CountryPicker value={isoA} onChange={setIsoA} list={list} accent={accentA} />
          <span className="text-muted-foreground text-sm">vs</span>
          <CountryPicker value={isoB} onChange={setIsoB} list={list} accent={accentB} />
        </div>

        {/* Lanes */}
        <div className="space-y-4">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-1">
            <div className="text-right font-bold" style={{ color: accentA }}>{A?.country ?? isoA}</div>
            <div className="w-32" />
            <div className="text-left font-bold" style={{ color: accentB }}>{B?.country ?? isoB}</div>
          </div>

          {METRICS.map((m) => {
            const rA = rate(A, m.key), rB = rate(B, m.key);
            const tallyA = rA * elapsed, tallyB = rB * elapsed;
            const max = Math.max(rA, rB, 1e-9);
            const barA = Math.max(rA > 0 ? 4 : 0, (rA / max) * 100);
            const barB = Math.max(rB > 0 ? 4 : 0, (rB / max) * 100);
            const col = toneColor(m.tone);
            return (
              <div key={String(m.key)} className="bg-gradient-card border border-border/40 rounded-2xl p-4 shadow-card">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  {/* Country A value */}
                  <div className="text-right">
                    <div className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: col }}>{fmtTally(tallyA)}</div>
                    <div className="text-[10px] text-muted-foreground/70">{cadence(rA)}</div>
                  </div>
                  {/* Metric label */}
                  <div className="w-32 text-center">
                    <div className="text-xl leading-none mb-1">{m.icon}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">{m.label}</div>
                  </div>
                  {/* Country B value */}
                  <div className="text-left">
                    <div className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: col }}>{fmtTally(tallyB)}</div>
                    <div className="text-[10px] text-muted-foreground/70">{cadence(rB)}</div>
                  </div>
                </div>
                {/* Diverging swim-lane bars */}
                <div className="grid grid-cols-2 gap-px mt-3 h-2">
                  <div className="flex justify-end">
                    <div className="h-full rounded-l" style={{ width: `${barA}%`, background: accentA, opacity: 0.7 }} />
                  </div>
                  <div className="flex justify-start">
                    <div className="h-full rounded-r" style={{ width: `${barB}%`, background: accentB, opacity: 0.7 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground/50 mt-6 flex items-start gap-1.5">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          A narrative device, not a live feed: counts accumulate in your browser from each country's
          latest annual rates (UN Population Division, WHO, UNICEF, UNODC, UN Women). "None recorded"
          means the annual figure rounds to zero — not that it never happens.
        </p>
      </main>
    </div>
  );
}
