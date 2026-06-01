import { METHODOLOGY, computeScore } from "@/lib/methodology";
import { ExternalLink, X } from "lucide-react";

interface Props {
  code: string;
  row: Record<string, unknown> | null | undefined;
  country: string;
  onClose: () => void;
}

/**
 * "How this score is calculated" breakdown for one index on a country profile.
 * Shows the formula, that country's actual sub-component inputs, the reproduced
 * total (for weighted/average indexes), and the source documents.
 */
export function MethodologyPanel({ code, row, country, onClose }: Props) {
  const m = METHODOLOGY[code];
  if (!m) return null;

  if (!row) {
    return (
      <div className="bg-gradient-card border rounded-2xl p-5 shadow-card mt-3"
           style={{ borderColor: `${m.accent}40` }}>
        <p className="text-sm text-muted-foreground">
          {country} is not included in the {m.title} dataset.
        </p>
      </div>
    );
  }

  const { contributions, total } = computeScore(m, row);
  const finalScore = Number(row[m.scoreField] ?? NaN);
  const fmt = (n: number) => (isNaN(n) ? "—" : (Number.isInteger(n) ? String(n) : n.toFixed(1)));

  return (
    <div className="bg-gradient-card border rounded-2xl p-5 shadow-card mt-3 relative"
         style={{ borderColor: `${m.accent}40` }}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted/20 text-muted-foreground"
        aria-label="Close methodology"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="mb-3 pr-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold font-mono rounded px-1.5 py-0.5 border"
                style={{ color: m.accent, backgroundColor: `${m.accent}18`, borderColor: `${m.accent}40` }}>
            {m.code}
          </span>
          <h3 className="text-base font-bold">{m.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground font-mono">{m.formula}</p>
      </div>

      {/* Breakdown table */}
      <div className="rounded-xl border border-border/40 overflow-hidden mb-3">
        <table className="w-full text-xs">
          <thead className="bg-card/60 text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Component</th>
              <th className="text-right px-3 py-2 font-medium">{country}</th>
              {m.kind === "weighted" && <th className="text-right px-3 py-2 font-medium">Weight</th>}
              {m.kind === "weighted" && <th className="text-right px-3 py-2 font-medium">Contribution</th>}
              {m.kind === "indicators" && <th className="text-right px-3 py-2 font-medium">Source</th>}
            </tr>
          </thead>
          <tbody>
            {contributions.map((c, i) => {
              const comp = m.components[i];
              const isPenalty = comp.label.trim().startsWith("−");
              return (
                <tr key={comp.label} className={`border-t border-border/20 ${isPenalty ? "text-red-400" : ""}`}>
                  <td className="px-3 py-1.5">{comp.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {fmt(c.raw)}{comp.unit && comp.unit !== "0/1" ? <span className="text-muted-foreground/60 ml-0.5">{comp.unit}</span> : null}
                    {comp.invert && !isNaN(c.raw) && (
                      <span className="text-muted-foreground/60"> → {fmt(c.used)}</span>
                    )}
                  </td>
                  {m.kind === "weighted" && (
                    <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                      ×{comp.weight}
                    </td>
                  )}
                  {m.kind === "weighted" && (
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium"
                        style={{ color: isPenalty ? undefined : m.accent }}>
                      {c.contribution != null ? (c.contribution >= 0 ? "+" : "") + c.contribution.toFixed(2) : "—"}
                    </td>
                  )}
                  {m.kind === "indicators" && (
                    <td className="px-3 py-1.5 text-right text-muted-foreground/70">{comp.source}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {(m.kind === "weighted" || m.kind === "average") && total != null && (
            <tfoot>
              <tr className="border-t-2 font-bold" style={{ borderColor: `${m.accent}40` }}>
                <td className="px-3 py-2">
                  {m.kind === "average" ? "Average" : "Total"} = {m.code} score
                </td>
                <td className="px-3 py-2 text-right tabular-nums" colSpan={m.kind === "weighted" ? 3 : 1}
                    style={{ color: m.accent }}>
                  {fmt(total)}
                  {!isNaN(finalScore) && Math.abs(total - finalScore) > 0.2 && (
                    <span className="text-muted-foreground/60 font-normal"> (API: {fmt(finalScore)})</span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {m.kind === "indicators" && (
        <p className="text-[11px] text-muted-foreground mb-3">
          These raw indicators are each normalised 0–100 and combined into the {m.code} score.
          The exact sub-weights are published in the methodology specification.
        </p>
      )}

      <p className="text-[11px] text-muted-foreground/80 mb-3">{m.note}</p>

      {/* Sources */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Data sources:</span>
        {m.sources.map((s) => (
          <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
             className="text-[11px] inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border border-border/40 hover:border-border bg-card/40 hover:bg-card/70 transition-colors">
            {s.name}<ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
        ))}
        <a href="https://www.shetoken.org/whitepaper" target="_blank" rel="noopener noreferrer"
           className="text-[11px] inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border ml-auto transition-colors"
           style={{ borderColor: `${m.accent}50`, color: m.accent }}>
          Full methodology<ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
