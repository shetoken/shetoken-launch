import { jsPDF } from "jspdf";
import type { CountryWEI } from "@/lib/api";
import { PW, M, C, hexToRgb, paintBackground, headerBand, pageFooter, panel, getLogoDataUrl, coverPage } from "@/lib/pdfTheme";

export interface ReportIndexTile { code: string; label: string; accent: string; score: number | null; }
export interface ReportTrendPoint { year: number; score: number; }
export interface ReportLifeStage { age_band: string; headline: string; cohort: string; }

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

/** Generate and download a one-page Women's Empowerment Index report — styled to match the website. */
export async function downloadCountryReport(opts: {
  country: CountryWEI;
  indexes: ReportIndexTile[];
  trend: ReportTrendPoint[];
  lifepath: ReportLifeStage[];
}) {
  const { country: c, indexes, trend, lifepath } = opts;
  const logo = await getLogoDataUrl();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 0;

  // ── Cover sheet ─────────────────────────────────────────────────────────
  coverPage(doc, {
    logo,
    eyebrow: "WOMEN'S EMPOWERMENT INDEX · COUNTRY REPORT",
    title: "SHEtoken",
    subtitle: "The world's first data-backed gender-accountability token",
    about: [
      "SHEtoken ($SHE) ties the value of a cryptocurrency to real-world progress for women, governed by the Women's Empowerment Index (WEI) — a composite 0–100 score across 8 weighted pillars for 105 countries, built from UN Women, World Bank, WHO, UNODC, UNESCO and ILO data.",
      `This report summarises the WEI profile for ${c.country}: pillar breakdown, the eight sub-indices, trend and life-path outlook.`,
    ],
  });
  doc.addPage();

  // ── Dark page + branded header band ─────────────────────────────────────
  paintBackground(doc);
  headerBand(doc, "Women's Empowerment Index — Country Report", logo);

  // ── Country header ──────────────────────────────────────────────────────
  y = 100;
  doc.setTextColor(...C.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);
  doc.text(c.country, M, y);
  // WEI score (right)
  doc.setTextColor(...C.gold);
  doc.setFontSize(36);
  doc.text(`${c.wei_score?.toFixed(1)}`, PW - M, y, { align: "right" });
  doc.setTextColor(...C.mut);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("WEI Score / 100", PW - M, y + 14, { align: "right" });

  y += 18;
  doc.setTextColor(...C.mut);
  doc.setFontSize(9.5);
  doc.text(
    `${c.region}  ·  Rank #${c.rank} of 105  ·  Tier ${c.tier} (${TIER_LABEL[c.tier] ?? "—"})  ·  ${c.ticker}  ·  ${c.population_millions?.toFixed(1)}M people`,
    M, y
  );

  // divider
  y += 14;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(1);
  doc.line(M, y, PW - M, y);

  // ── 8 Pillar bars (two columns) ─────────────────────────────────────────
  y += 24;
  doc.setTextColor(...C.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("WEI Pillar Breakdown", M, y);
  y += 16;

  const colW = (PW - 2 * M - 24) / 2;
  const barW = colW - 96;
  PILLARS.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (colW + 24);
    const yy = y + row * 24;
    const val = (c[p.key] as number) ?? 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.ink);
    doc.text(p.label, x, yy + 8);
    // track (dark card)
    const bx = x + 96;
    doc.setFillColor(...C.card);
    doc.roundedRect(bx, yy + 1, barW, 8, 2, 2, "F");
    // fill (emerald / amber / red by value)
    const fill = val >= 70 ? C.emerald : val >= 40 ? C.amber : C.red;
    doc.setFillColor(...fill);
    doc.roundedRect(bx, yy + 1, Math.max(2, (barW * Math.min(100, val)) / 100), 8, 2, 2, "F");
    doc.setTextColor(...C.mut);
    doc.text(val.toFixed(1), bx + barW + 6, yy + 8);
  });
  y += 4 * 24 + 6;

  // Violence penalty note
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.red);
  doc.text(
    `Violence Penalty: -${(c.violence_penalty_score ?? 0).toFixed(1)} pts subtracted from the composite (WHO/UNODC/UN Women).`,
    M, y
  );

  // ── 8-Index Scorecard ───────────────────────────────────────────────────
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.ink);
  doc.text("8-Index Scorecard", M, y);
  y += 12;
  const tileW = (PW - 2 * M - 7 * 6) / 8;
  indexes.slice(0, 8).forEach((idx, i) => {
    const x = M + i * (tileW + 6);
    const [r, g, b] = hexToRgb(idx.accent);
    // dark tile with coloured border
    doc.setFillColor(...C.card);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.9);
    doc.roundedRect(x, y, tileW, 42, 3, 3, "FD");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(idx.code, x + tileW / 2, y + 13, { align: "center" });
    doc.setTextColor(...C.ink);
    doc.setFontSize(13);
    doc.text(idx.score != null ? idx.score.toFixed(1) : "—", x + tileW / 2, y + 30, { align: "center" });
  });
  y += 42;

  // ── WEI Trend sparkline ─────────────────────────────────────────────────
  if (trend.length >= 2) {
    y += 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...C.ink);
    doc.text(`WEI Trend (${trend[0].year}–${trend[trend.length - 1].year})`, M, y);
    y += 10;
    const chartH = 64, chartW = PW - 2 * M;
    const x0 = M, y0 = y;
    panel(doc, x0, y0, chartW, chartH);
    // 50 reference line
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.5);
    const y50 = y0 + chartH - (50 / 100) * chartH;
    doc.line(x0, y50, x0 + chartW, y50);
    doc.setFontSize(6.5);
    doc.setTextColor(...C.mut);
    doc.text("50", x0 + 4, y50 - 2);
    // polyline
    const n = trend.length;
    const sx = (i: number) => x0 + (i / (n - 1)) * chartW;
    const sy = (v: number) => y0 + chartH - (Math.min(100, Math.max(0, v)) / 100) * chartH;
    doc.setDrawColor(...C.gold);
    doc.setLineWidth(1.6);
    for (let i = 1; i < n; i++) {
      doc.line(sx(i - 1), sy(trend[i - 1].score), sx(i), sy(trend[i].score));
    }
    doc.setFillColor(...C.gold);
    trend.forEach((pt, i) => doc.circle(sx(i), sy(pt.score), 1.6, "F"));
    // year labels
    doc.setFontSize(6.5);
    doc.setTextColor(...C.mut);
    doc.text(`${trend[0].year}`, x0 + 4, y0 + chartH - 4);
    doc.text(`${trend[trend.length - 1].year}`, x0 + chartW - 4, y0 + chartH - 4, { align: "right" });
    y += chartH + 12;
  }

  // ── Life Path ───────────────────────────────────────────────────────────
  if (lifepath.length) {
    y += 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...C.ink);
    doc.text("Life Path: 100 Girls", M, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    lifepath.slice(0, 4).forEach((st) => {
      y += 13;
      doc.setTextColor(...C.gold);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(st.age_band, M, y);
      doc.setTextColor(...C.ink);
      doc.setFontSize(8.5);
      doc.text(st.headline, M + 48, y);
      doc.setTextColor(...C.mut);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const wrapped = doc.splitTextToSize(st.cohort, PW - 2 * M - 48);
      doc.text(wrapped[0] ?? "", M + 48, y + 9);
      y += 9;
    });
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  pageFooter(
    doc,
    "Sources: UN Women, World Bank, WHO, UNODC, UNESCO, ILO, UNICEF, IPU, NCRB. Scores normalised 0–100. Indicative — not financial advice.",
    `shetoken.org/country/${c.iso_code}  ·  WEI v3.0`
  );

  doc.save(`SHEtoken-WEI-${c.iso_code}-report.pdf`);
}
