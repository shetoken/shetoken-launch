import { jsPDF } from "jspdf";
import type { CountryWEI } from "@/lib/api";

export interface ReportIndexTile { code: string; label: string; accent: string; score: number | null; }
export interface ReportTrendPoint { year: number; score: number; }
export interface ReportLifeStage { age_band: string; headline: string; cohort: string; }

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const TIER_LABEL: Record<number, string> = {
  1: "Preferred", 2: "Acceptable", 3: "Caution", 4: "Avoid",
};

const PILLARS: { key: keyof CountryWEI; label: string }[] = [
  { key: "empowerment_score", label: "Empowerment" },
  { key: "bodily_autonomy_score", label: "Bodily Autonomy" },
  { key: "safety_justice_score", label: "Safety & Justice" },
  { key: "education_score", label: "Education" },
  { key: "economic_score", label: "Economic" },
  { key: "health_score", label: "Health" },
  { key: "dignity_welfare_score", label: "Dignity & Welfare" },
  { key: "digital_social_score", label: "Digital & Social" },
];

/** Generate and download a one-page Women's Empowerment Index report for a country. */
export function downloadCountryReport(opts: {
  country: CountryWEI;
  indexes: ReportIndexTile[];
  trend: ReportTrendPoint[];
  lifepath: ReportLifeStage[];
}) {
  const { country: c, indexes, trend, lifepath } = opts;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const PW = 595.28;
  const M = 40;
  const GOLD: [number, number, number] = [245, 158, 11];
  const INK: [number, number, number] = [30, 27, 38];
  const MUT: [number, number, number] = [120, 116, 130];
  let y = 0;

  // ── Header band ─────────────────────────────────────────────────────────
  doc.setFillColor(...INK);
  doc.rect(0, 0, PW, 64, "F");
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("SHEtoken", M, 30);
  doc.setTextColor(235, 232, 240);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Women's Empowerment Index — Country Report", M, 47);
  doc.setTextColor(170, 165, 180);
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    PW - M, 30, { align: "right" });
  doc.text("shetoken.org", PW - M, 47, { align: "right" });

  // ── Country header ──────────────────────────────────────────────────────
  y = 96;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(c.country, M, y);
  // WEI score (right)
  doc.setTextColor(...GOLD);
  doc.setFontSize(34);
  doc.text(`${c.wei_score?.toFixed(1)}`, PW - M, y, { align: "right" });
  doc.setTextColor(...MUT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("WEI Score / 100", PW - M, y + 13, { align: "right" });

  y += 18;
  doc.setTextColor(...MUT);
  doc.setFontSize(9.5);
  doc.text(
    `${c.region}  ·  Rank #${c.rank} of 105  ·  Tier ${c.tier} (${TIER_LABEL[c.tier] ?? "—"})  ·  ${c.ticker}  ·  ${c.population_millions?.toFixed(1)}M people`,
    M, y
  );

  // divider
  y += 14;
  doc.setDrawColor(225, 222, 230);
  doc.setLineWidth(1);
  doc.line(M, y, PW - M, y);

  // ── 8 Pillar bars (two columns) ─────────────────────────────────────────
  y += 22;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("WEI Pillar Breakdown", M, y);
  y += 14;

  const colW = (PW - 2 * M - 24) / 2;
  const barW = colW - 92;
  PILLARS.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (colW + 24);
    const yy = y + row * 24;
    const val = (c[p.key] as number) ?? 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(p.label, x, yy + 8);
    // track
    const bx = x + 92;
    doc.setFillColor(232, 230, 236);
    doc.roundedRect(bx, yy + 1, barW, 8, 2, 2, "F");
    // fill (green/amber/red by value)
    const fill: [number, number, number] = val >= 70 ? [16, 185, 129] : val >= 40 ? [234, 179, 8] : [239, 68, 68];
    doc.setFillColor(...fill);
    doc.roundedRect(bx, yy + 1, Math.max(2, (barW * Math.min(100, val)) / 100), 8, 2, 2, "F");
    doc.setTextColor(...MUT);
    doc.text(val.toFixed(1), bx + barW + 6, yy + 8);
  });
  y += 4 * 24 + 4;

  // Violence penalty
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(220, 70, 70);
  doc.text(
    `Violence Penalty: −${(c.violence_penalty_score ?? 0).toFixed(1)} pts subtracted from the composite (WHO/UNODC/UN Women).`,
    M, y
  );

  // ── 8-Index Scorecard ───────────────────────────────────────────────────
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text("8-Index Scorecard", M, y);
  y += 12;
  const tileW = (PW - 2 * M - 7 * 6) / 8;
  indexes.slice(0, 8).forEach((idx, i) => {
    const x = M + i * (tileW + 6);
    const [r, g, b] = hexToRgb(idx.accent);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, tileW, 40, 3, 3, "S");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(idx.code, x + tileW / 2, y + 12, { align: "center" });
    doc.setFontSize(13);
    doc.text(idx.score != null ? idx.score.toFixed(1) : "—", x + tileW / 2, y + 28, { align: "center" });
  });
  y += 40;

  // ── WEI Trend sparkline ─────────────────────────────────────────────────
  if (trend.length >= 2) {
    y += 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(`WEI Trend (${trend[0].year}–${trend[trend.length - 1].year})`, M, y);
    y += 10;
    const chartH = 64, chartW = PW - 2 * M;
    const x0 = M, y0 = y;
    // frame baseline + 50 line
    doc.setDrawColor(225, 222, 230);
    doc.setLineWidth(0.5);
    doc.line(x0, y0 + chartH, x0 + chartW, y0 + chartH);
    doc.setDrawColor(210, 206, 218);
    const y50 = y0 + chartH - (50 / 100) * chartH;
    doc.line(x0, y50, x0 + chartW, y50);
    doc.setFontSize(6.5);
    doc.setTextColor(...MUT);
    doc.text("50", x0 - 2, y50 + 2, { align: "right" });
    // polyline
    const n = trend.length;
    const sx = (i: number) => x0 + (i / (n - 1)) * chartW;
    const sy = (v: number) => y0 + chartH - (Math.min(100, Math.max(0, v)) / 100) * chartH;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.6);
    for (let i = 1; i < n; i++) {
      doc.line(sx(i - 1), sy(trend[i - 1].score), sx(i), sy(trend[i].score));
    }
    doc.setFillColor(...GOLD);
    trend.forEach((pt, i) => doc.circle(sx(i), sy(pt.score), 1.6, "F"));
    // year labels
    doc.setFontSize(6.5);
    doc.setTextColor(...MUT);
    doc.text(`${trend[0].year}`, x0, y0 + chartH + 10);
    doc.text(`${trend[trend.length - 1].year}`, x0 + chartW, y0 + chartH + 10, { align: "right" });
    y += chartH + 12;
  }

  // ── Life Path ───────────────────────────────────────────────────────────
  if (lifepath.length) {
    y += 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text("Life Path: 100 Girls", M, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    lifepath.slice(0, 4).forEach((st) => {
      y += 13;
      doc.setTextColor(...GOLD);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(st.age_band, M, y);
      doc.setTextColor(...INK);
      doc.setFontSize(8.5);
      doc.text(st.headline, M + 48, y);
      doc.setTextColor(...MUT);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const wrapped = doc.splitTextToSize(st.cohort, PW - 2 * M - 48);
      doc.text(wrapped[0] ?? "", M + 48, y + 9);
      y += 9;
    });
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  const fy = 812;
  doc.setDrawColor(225, 222, 230);
  doc.setLineWidth(0.5);
  doc.line(M, fy - 10, PW - M, fy - 10);
  doc.setTextColor(...MUT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.text(
    "Sources: UN Women, World Bank, WHO, UNODC, UNESCO, ILO, UNICEF, IPU, NCRB. Scores normalised 0–100. Indicative — not financial advice.",
    M, fy
  );
  doc.text(`shetoken.org/country/${c.iso_code}  ·  WEI v3.0`, PW - M, fy, { align: "right" });

  doc.save(`SHEtoken-WEI-${c.iso_code}-report.pdf`);
}
