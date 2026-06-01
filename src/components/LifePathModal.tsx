import { useEffect } from "react";
import type { Lifepath } from "@/lib/api";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  lifepath: Lifepath;
  benchmark?: Lifepath | null;
  benchmarkLabel?: string;
}

const barColor = (v: number) => (v >= 70 ? "#10b981" : v >= 45 ? "#eab308" : "#ef4444");

/**
 * Full "Life of 100 Girls" modal: a cohort-milestone funnel (share of 100 who
 * clear each life hurdle) with a benchmark-country overlay, plus the full
 * stage-by-stage narrative.
 */
export function LifePathModal({ open, onClose, lifepath, benchmark, benchmarkLabel }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  const milestones = lifepath.milestones ?? [];
  const benchMap = new Map((benchmark?.milestones ?? []).map((m) => [m.label, m.reached]));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
         onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-amber-400/30 rounded-2xl shadow-2xl w-full max-w-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/40 rounded-t-2xl px-6 py-4 flex items-start justify-between z-10">
          <div>
            <h2 className="text-lg font-bold">The Life of 100 Girls — {lifepath.country}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              How many of 100 girls born here today clear each life hurdle.
              {benchmark && benchmarkLabel && (
                <> Diamonds <span className="text-cyan-400">◆</span> mark {benchmarkLabel} for comparison.</>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted/20 text-muted-foreground shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* ── Cohort funnel ── */}
          {milestones.length > 0 && (
            <div className="space-y-2.5 mb-6">
              {milestones.map((m) => {
                const bench = benchMap.get(m.label);
                return (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-bold tabular-nums" style={{ color: barColor(m.reached) }}>
                        {m.reached}<span className="text-muted-foreground/50 font-normal"> / 100</span>
                      </span>
                    </div>
                    <div className="relative h-5 rounded-md overflow-hidden" style={{ background: "hsl(260 15% 14%)" }}>
                      <div className="h-full rounded-md transition-all duration-700"
                           style={{ width: `${m.reached}%`, backgroundColor: barColor(m.reached), opacity: 0.85 }} />
                      {bench != null && (
                        <div className="absolute top-0 h-full flex items-center -translate-x-1/2"
                             style={{ left: `${bench}%` }}
                             title={`${benchmarkLabel}: ${bench}`}>
                          <span className="text-cyan-400 text-[11px] leading-none drop-shadow">◆</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Full stage narrative ── */}
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            Stage by stage
          </h3>
          <div className="space-y-3">
            {lifepath.stages.map((s) => (
              <div key={s.stage} className="flex items-start gap-3 border-l-2 border-accent/30 pl-3">
                <div className="shrink-0 w-16 text-[11px] font-mono text-accent leading-tight pt-0.5">
                  {s.age_band}
                  <div className="text-[9px] text-muted-foreground/60 mt-0.5">{s.stage}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-snug">{s.headline}</div>
                  {s.cohort && <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.cohort}</div>}
                  {s.felt && <div className="text-xs text-muted-foreground/80 mt-0.5 italic leading-relaxed">{s.felt}</div>}
                  {s.detail && <div className="text-[11px] text-muted-foreground/60 mt-1">{s.detail}</div>}
                  {s.note && <div className="text-[11px] text-amber-400/70 mt-1">{s.note}</div>}
                  {s.source && <div className="text-[10px] text-muted-foreground/40 mt-1">Source: {s.source}</div>}
                </div>
              </div>
            ))}
          </div>

          {lifepath.disclaimer && (
            <p className="text-[10px] text-muted-foreground/50 mt-5 pt-4 border-t border-border/20 leading-relaxed">
              {lifepath.disclaimer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
