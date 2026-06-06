import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type VitalStats } from "@/lib/api";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Clock, Info } from "lucide-react";

const WEEK_SECONDS = 7 * 24 * 3600;

interface Metric { key: keyof VitalStats; label: string; icon: string; tone: "hope" | "harm"; }
const METRICS: Metric[] = [
  { key: "girls_born_per_week_est",                    label: "A girl is born",                   icon: "👶", tone: "hope" },
  { key: "girls_not_born_per_week_est",                label: "A girl is lost to female feticide",icon: "🚫", tone: "harm" },
  { key: "girls_drop_out_school_per_week_est",         label: "A girl drops out of school",       icon: "🎒", tone: "harm" },
  { key: "girls_married_under18_per_week_est",         label: "A girl is married before 18",      icon: "💍", tone: "harm" },
  { key: "women_facing_sexual_violence_per_week_est",  label: "A woman faces sexual violence",    icon: "🆘", tone: "harm" },
  { key: "women_killed_by_partner_per_week_est",       label: "A woman is killed by her partner", icon: "🕯️", tone: "harm" },
  { key: "maternal_deaths_per_week_est",               label: "A mother dies in childbirth",      icon: "⚰️", tone: "harm" },
];

const SLOTS = [
  { key: "A", default: "IND", color: "#f59e0b" },
  { key: "B", default: "USA", color: "#a855f7" },
  { key: "C", default: "NOR", color: "#22d3ee" },
] as const;

const toneColor = (t: "hope" | "harm") => (t === "hope" ? "#10b981" : "#ef4444");
const ratePerSec = (v: VitalStats | undefined, key: keyof VitalStats) => (Number(v?.[key] ?? 0) || 0) / WEEK_SECONDS;

/** seconds elapsed since local midnight ("today, so far"). */
function secondsToday(): number {
  const now = new Date();
  const mid = new Date(now); mid.setHours(0, 0, 0, 0);
  return (now.getTime() - mid.getTime()) / 1000;
}

function cadence(r: number): string {
  if (!r || r <= 0) return "none recorded";
  const s = 1 / r;
  if (s < 1)     return `${(1 / s).toFixed(1)} every second`;
  if (s < 60)    return `one every ${s.toFixed(0)}s`;
  if (s < 3600)  return `one every ${(s / 60).toFixed(0)} min`;
  if (s < 86400) return `one every ${(s / 3600).toFixed(1)} hr`;
  return `one every ${(s / 86400).toFixed(1)} days`;
}
// Always whole people — never a fractional girl/woman.
const fmtTally = (n: number) => Math.floor(n).toLocaleString("en-US");
const pulsing = (rate: number, elapsed: number) =>
  rate > 0 && Math.floor(rate * elapsed) > Math.floor(rate * (elapsed - 0.25));

/* ── ECG pulse-line: a scrolling "lifeline" whose blip density = the rate ── */
function PulseLine({ rate, elapsed, color, w = 130, h = 30 }: {
  rate: number; elapsed: number; color: string; w?: number; h?: number;
}) {
  const mid = h / 2, amp = h * 0.42, T = 18; // seconds of history shown
  const px = w / T;
  if (rate <= 0) {
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <line x1={0} y1={mid} x2={w} y2={mid} stroke={color} strokeOpacity={0.22} strokeWidth={1.2} />
      </svg>
    );
  }
  const period = 1 / rate;
  const kEnd = Math.floor(elapsed / period);
  const kStart = Math.max(0, Math.ceil((elapsed - T) / period));
  const spikes: number[] = [];
  for (let k = kStart; k <= kEnd; k++) spikes.push(w - (elapsed - k * period) * px);
  spikes.sort((a, b) => a - b);

  const pts: string[] = [`0,${mid}`];
  for (const x of spikes) pts.push(`${(x - 4).toFixed(1)},${mid}`, `${(x - 1.5).toFixed(1)},${mid}`,
    `${x.toFixed(1)},${(mid - amp).toFixed(1)}`, `${(x + 1.5).toFixed(1)},${mid}`, `${(x + 4).toFixed(1)},${mid}`);
  pts.push(`${w},${mid}`);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={w - 1} cy={mid} r={1.8} fill={color} />
    </svg>
  );
}

/* ── Hero clock-dial for country A's most frequent harm ── */
function HeroDial({ name, label, icon, rate, elapsed }: {
  name: string; label: string; icon: string; rate: number; elapsed: number;
}) {
  const period = rate > 0 ? 1 / rate : 0;
  const events = Math.floor(rate * elapsed);
  const frac = period > 0 ? (elapsed % period) / period : 0;
  const rad = (frac * 360 - 90) * (Math.PI / 180);
  const cx = 90, cy = 90, R = 76;
  const hx = cx + Math.cos(rad) * R * 0.8, hy = cy + Math.sin(rad) * R * 0.8;
  const flash = period > 0 && (elapsed % period) < 0.3;
  return (
    <div className="flex flex-col items-center text-center">
      <svg width={180} height={180}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="hsl(260 25% 22%)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ef4444" strokeWidth={3}
                strokeOpacity={flash ? 0.9 : 0.18} style={{ transition: "stroke-opacity .15s" }} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
          return <line key={i} x1={cx + Math.cos(a) * R} y1={cy + Math.sin(a) * R}
            x2={cx + Math.cos(a) * (R - 7)} y2={cy + Math.sin(a) * (R - 7)} stroke="hsl(260 15% 45%)" strokeWidth={1.5} />;
        })}
        <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#ef4444" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="#ef4444" />
        <text x={cx} y={cy - 22} textAnchor="middle" fontSize={22}>{icon}</text>
        <text x={cx} y={cy + 34} textAnchor="middle" fontSize={26} fontWeight={700} fill="#ef4444">
          {events.toLocaleString("en-US")}
        </text>
      </svg>
      <div className="text-sm font-semibold mt-1">{label}</div>
      <div className="text-xs text-muted-foreground">in {name} · {cadence(rate)}</div>
      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{events.toLocaleString("en-US")} today so far</div>
    </div>
  );
}

function Picker({ value, onChange, list, color }: {
  value: string; onChange: (iso: string) => void;
  list: { iso_code: string; country: string }[]; color: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="bg-card/60 border rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none w-full"
      style={{ borderColor: `${color}55`, color }}>
      {list.map((c) => <option key={c.iso_code} value={c.iso_code} className="bg-card text-foreground">{c.country}</option>)}
    </select>
  );
}

export default function SheClock() {
  const [isos, setIsos] = useState<string[]>(SLOTS.map((s) => s.default));
  const [elapsed, setElapsed] = useState(secondsToday());

  useEffect(() => {
    const id = setInterval(() => setElapsed(secondsToday()), 200);
    return () => clearInterval(id);
  }, []);

  const { data: countriesRes } = useQuery({ queryKey: ["she-countries"], queryFn: () => api.wei.countries(105), staleTime: 30 * 60 * 1000 });
  const list = useMemo(() => (countriesRes?.data ?? []).map((c) => ({ iso_code: c.iso_code, country: c.country }))
    .sort((a, b) => a.country.localeCompare(b.country)), [countriesRes]);

  const q0 = useQuery({ queryKey: ["vital", isos[0]], queryFn: () => api.vital.country(isos[0]), staleTime: 30 * 60 * 1000 });
  const q1 = useQuery({ queryKey: ["vital", isos[1]], queryFn: () => api.vital.country(isos[1]), staleTime: 30 * 60 * 1000 });
  const q2 = useQuery({ queryKey: ["vital", isos[2]], queryFn: () => api.vital.country(isos[2]), staleTime: 30 * 60 * 1000 });
  const data: (VitalStats | undefined)[] = [q0.data, q1.data, q2.data];
  const setIso = (i: number, iso: string) => setIsos((p) => p.map((v, j) => (j === i ? iso : v)));

  const hero = useMemo(() => {
    const A = data[0];
    let best: { m: Metric; rate: number } | null = null;
    for (const m of METRICS) {
      if (m.tone !== "harm") continue;
      const r = ratePerSec(A, m.key);
      if (!best || r > best.rate) best = { m, rate: r };
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data[0]]);

  const clock = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="The She-Clock — What Happens to Girls, in Real Time"
        description="A live clock of what happens to girls and women today — born, lost to female feticide, married before 18, facing violence, dying in childbirth. Compare three countries side by side."
        url="https://www.shetoken.org/she-clock"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-5xl">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-3">
            <Clock className="h-3 w-3" /> The She-Clock · live
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">What happens to girls — today</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
            Counts so far <strong>today</strong> (since local midnight), ticking by the second from real annual rates.
            Compare three countries.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">Today, as of <span className="font-mono text-accent">{clock}</span></p>
        </div>

        {hero && hero.rate > 0 && (
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-card border border-red-400/30 rounded-2xl px-8 py-6 shadow-card">
              <HeroDial name={data[0]?.country ?? isos[0]} label={hero.m.label} icon={hero.m.icon} rate={hero.rate} elapsed={elapsed} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-3">
          {SLOTS.map((s, i) => <Picker key={s.key} value={isos[i]} onChange={(iso) => setIso(i, iso)} list={list} color={s.color} />)}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          {SLOTS.map((s, i) => <div key={s.key} className="font-bold text-sm" style={{ color: s.color }}>{data[i]?.country ?? isos[i]}</div>)}
        </div>

        <div className="space-y-3">
          {METRICS.map((m) => {
            const col = toneColor(m.tone);
            return (
              <div key={String(m.key)} className="bg-gradient-card border border-border/40 rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-lg leading-none">{m.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {data.map((d, i) => {
                    const r = ratePerSec(d, m.key);
                    const pulse = pulsing(r, elapsed);
                    return (
                      <div key={i} className="text-center">
                        <div className="text-2xl font-bold tabular-nums"
                          style={{ color: col, transform: pulse ? "scale(1.16)" : "scale(1)",
                                   textShadow: pulse ? `0 0 12px ${col}` : "none", transition: "transform .15s, text-shadow .15s" }}>
                          {fmtTally(r * elapsed)}
                        </div>
                        <div className="text-[9px] text-muted-foreground/70 leading-tight mb-1">{cadence(r)}</div>
                        <PulseLine rate={r} elapsed={elapsed} color={col} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground/50 mt-6 flex items-start gap-1.5">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          A narrative device, not a live feed: counts are today's accumulation (since local midnight) from each
          country's latest annual rates (UN Population Division, WHO, UNICEF, UNODC, UN Women, NCRB). "Female
          feticide" = sex-selective abortion of female fetuses, estimated via the missing-girls method from sex
          ratio at birth; sexual violence includes WHO-estimated unreported cases. "None recorded" means the
          annual figure rounds to zero — not that it never happens.
        </p>
      </main>
    </div>
  );
}
