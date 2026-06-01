import { useRef, useState } from "react";

interface CountrySeries { iso_code: string; country: string; scores: (number | null)[]; }

interface Props {
  years: number[];
  countries: CountrySeries[];
  globalAvg: (number | null)[];
  selectedIso: string;
  selectedName: string;
  selectedScores: (number | null)[];
}

const VW = 720, VH = 300, pad = { l: 28, r: 14, t: 12, b: 26 };
const cw = VW - pad.l - pad.r, ch = VH - pad.t - pad.b;

interface Hover {
  iso: string; name: string; year: number; score: number; left: number; top: number; selected: boolean;
}

/** Multi-country WEI trend: faint backdrop + global average + highlighted selected, with hover-to-identify. */
export function WeiTrendChart({ years, countries, globalAvg, selectedIso, selectedName, selectedScores }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const n = years.length;

  const sx = (i: number) => pad.l + (n > 1 ? (i / (n - 1)) * cw : 0);
  const sy = (s: number) => pad.t + ch - (Math.max(0, Math.min(100, s)) / 100) * ch;
  const poly = (scores: (number | null)[]) =>
    scores.map((s, i) => (s == null ? null : `${sx(i).toFixed(1)},${sy(s).toFixed(1)}`)).filter(Boolean).join(" ");

  function onMove(e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const vx = (px / rect.width) * VW, vy = (py / rect.height) * VH;
    const i = Math.max(0, Math.min(n - 1, Math.round(((vx - pad.l) / cw) * (n - 1))));

    let best: { c: CountrySeries; d: number } | null = null;
    for (const c of countries) {
      const s = c.scores[i];
      if (s == null) continue;
      const d = Math.abs(sy(s) - vy);
      if (!best || d < best.d) best = { c, d };
    }
    if (best && best.d < 22) {
      setHover({
        iso: best.c.iso_code, name: best.c.country, year: years[i],
        score: best.c.scores[i] as number, left: px, top: py,
        selected: best.c.iso_code === selectedIso,
      });
    } else {
      setHover(null);
    }
  }

  return (
    <div ref={wrapRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: "block" }}>
        {/* y gridlines + labels */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} y1={sy(v)} x2={VW - pad.r} y2={sy(v)}
                  stroke="hsl(260 25% 22%)" strokeWidth={v === 50 ? 0.8 : 0.4}
                  strokeDasharray={v === 50 ? "4 4" : undefined} />
            <text x={pad.l - 4} y={sy(v) + 3} textAnchor="end" fontSize={9} fill="hsl(260 15% 55%)">{v}</text>
          </g>
        ))}
        {/* all countries — faint backdrop */}
        {countries.filter((c) => c.iso_code !== selectedIso).map((c) => (
          <polyline key={c.iso_code} points={poly(c.scores)} fill="none"
                    stroke="hsl(260 15% 50%)" strokeWidth={0.7}
                    strokeOpacity={hover && hover.iso === c.iso_code ? 0 : 0.12} />
        ))}
        {/* global average — dashed */}
        <polyline points={poly(globalAvg)} fill="none"
                  stroke="hsl(260 15% 72%)" strokeWidth={1.4} strokeDasharray="5 4" strokeOpacity={0.8} />
        {/* hovered country (non-selected) — highlighted cyan on top */}
        {hover && !hover.selected && (() => {
          const c = countries.find((x) => x.iso_code === hover.iso);
          return c ? (
            <polyline points={poly(c.scores)} fill="none"
                      stroke="#22d3ee" strokeWidth={2} strokeLinejoin="round" />
          ) : null;
        })()}
        {/* selected country — bold gold + dots */}
        <polyline points={poly(selectedScores)} fill="none"
                  stroke="#f59e0b" strokeWidth={2.6} strokeLinejoin="round" />
        {selectedScores.map((s, i) => (s == null ? null : (
          <circle key={i} cx={sx(i)} cy={sy(s)} r={2.8} fill="#f59e0b" />
        )))}
        {/* hover marker dot */}
        {hover && (
          <circle cx={sx(years.indexOf(hover.year))} cy={sy(hover.score)} r={3.2}
                  fill={hover.selected ? "#f59e0b" : "#22d3ee"} stroke="hsl(260 35% 9%)" strokeWidth={1} />
        )}
        {/* x-axis year labels */}
        {years.map((yr, i) => (i % 2 === 0 || i === n - 1) && (
          <text key={yr} x={sx(i)} y={VH - 8} textAnchor="middle" fontSize={9} fill="hsl(260 15% 55%)">{yr}</text>
        ))}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg px-2.5 py-1.5 text-xs shadow-xl border"
          style={{
            left: Math.min(hover.left + 12, (wrapRef.current?.clientWidth ?? 300) - 130),
            top: Math.max(hover.top - 40, 0),
            background: "hsl(260 35% 9%)",
            borderColor: hover.selected ? "#f59e0b" : "#22d3ee",
          }}
        >
          <div className="font-semibold" style={{ color: hover.selected ? "#f59e0b" : "#22d3ee" }}>
            {hover.name}{hover.selected ? " (selected)" : ""}
          </div>
          <div className="text-muted-foreground tabular-nums">
            {hover.year} · WEI {hover.score.toFixed(1)}
          </div>
        </div>
      )}
    </div>
  );
}
