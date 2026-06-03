import { jsPDF } from "jspdf";
import type { CountryWEI } from "@/lib/api";
import { PW, PH, M, C, type RGB, hexToRgb, paintBackground, headerBand, pageFooter, panel, getLogoDataUrl, coverPage } from "@/lib/pdfTheme";

export interface ReportIndexTile { code: string; label: string; accent: string; score: number | null; }
export interface ReportPillar { label: string; code: string; description: string; score: number; globalAvg: number; improvement: string; }
export interface ReportTrendPoint { year: number; score: number; }
export interface ReportLifeStage { age_band: string; headline: string; cohort?: string; detail?: string; felt?: string; source?: string; }
export interface ReportMilestone { label: string; reached: number; }
export interface ReportViolence { score: number; label: string; context: string; }

const TIER_LABEL: Record<number, string> = { 1: "Preferred", 2: "Acceptable", 3: "Caution", 4: "Avoid" };
const CONTENT_W = PW - 2 * M;
const BOTTOM = PH - 46;
const scoreColor = (v: number): RGB => (v >= 70 ? C.emerald : v >= 40 ? C.amber : C.red);

/** Comprehensive Women's Empowerment Index country report — styled to match the website. */
export async function downloadCountryReport(opts: {
  country: CountryWEI;
  indexes: ReportIndexTile[];
  pillars: ReportPillar[];
  performanceSummary: string;
  violence: ReportViolence;
  trend: ReportTrendPoint[];
  lifepath: ReportLifeStage[];
  milestones?: ReportMilestone[];
}) {
  const { country: c, indexes, pillars, performanceSummary, violence, trend, lifepath } = opts;
  const milestones = opts.milestones ?? [];
  const logo = await getLogoDataUrl();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let page = 0;
  let y = 0;

  const startPage = () => {
    doc.addPage();
    page += 1;
    paintBackground(doc);
    headerBand(doc, "Women's Empowerment Index — Country Report", logo);
    pageFooter(
      doc,
      "Sources: UN Women, World Bank, WHO, UNODC, UNESCO, ILO, UNICEF, IPU, NCRB. Scores 0–100. Indicative — not financial advice.",
      `shetoken.org/country/${c.iso_code}  ·  WEI v3.0  ·  p.${page}`
    );
    y = 92;
  };
  const ensure = (h: number) => { if (y + h > BOTTOM) startPage(); };

  const heading = (t: string) => {
    ensure(34);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C.gold);
    doc.text(t, M, y);
    y += 16;
  };
  const para = (text: string, color: RGB = C.mut, size = 9.5, italic = false) => {
    const lh = size * 1.42;
    doc.setFont("helvetica", italic ? "italic" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.splitTextToSize(text, CONTENT_W).forEach((ln: string) => { ensure(lh); doc.text(ln, M, y + lh * 0.8); y += lh; });
    y += 6;
  };

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

  // ── Page 1 of content: header + quick stats + scorecard + summary ───────
  startPage();

  // Country headline
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...C.ink);
  doc.text(c.country, M, y + 12);
  doc.setTextColor(...C.gold);
  doc.setFontSize(32);
  doc.text(`${c.wei_score?.toFixed(1)}`, PW - M, y + 14, { align: "right" });
  doc.setTextColor(...C.mut);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("WEI Score / 100", PW - M, y + 26, { align: "right" });
  y += 26;
  doc.setFontSize(9.5);
  doc.setTextColor(...C.mut);
  doc.text(
    `${c.region}  ·  Rank #${c.rank} of 105  ·  Tier ${c.tier} (${TIER_LABEL[c.tier] ?? "—"})  ·  ${c.ticker}  ·  ${c.population_millions?.toFixed(1)}M people`,
    M, y
  );
  y += 12;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(1);
  doc.line(M, y, PW - M, y);
  y += 12;

  // Quick Stats
  heading("Quick Stats");
  {
    const rows: [string, string][] = [
      ["Rank", `#${c.rank} of 105`],
      ["Region", c.region ?? "—"],
      ["Tier", `${c.tier} — ${TIER_LABEL[c.tier] ?? "—"}`],
      ["Token", c.ticker ?? "—"],
      ["Population", `${c.population_millions?.toFixed(1)}M`],
      ["Data Year", "2025"],
    ];
    const rowH = 19, ph = 3 * rowH + 12, colW = CONTENT_W / 2;
    ensure(ph + 6);
    panel(doc, M, y, CONTENT_W, ph, C.card);
    rows.forEach(([k, v], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + 14 + col * colW, yy = y + 16 + row * rowH;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...C.mut);
      doc.text(k, x, yy);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
      doc.text(v, M + colW - 14 + col * colW, yy, { align: "right" });
    });
    y += ph + 12;
  }

  // 8-Index Scorecard (4 × 2)
  heading("8-Index Scorecard");
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...C.mut);
  doc.text("Eight separate SHEtoken indexes — not WEI sub-pillars.", M, y); y += 12;
  {
    const cols = 4, gap = 8, tW = (CONTENT_W - (cols - 1) * gap) / cols, tH = 52;
    for (let r = 0; r < 2; r++) {
      ensure(tH + 8);
      const rowY = y;
      for (let col = 0; col < cols; col++) {
        const idx = indexes[r * cols + col];
        if (!idx) continue;
        const x = M + col * (tW + gap);
        const [rr, gg, bb] = hexToRgb(idx.accent);
        doc.setFillColor(...C.card); doc.setDrawColor(rr, gg, bb); doc.setLineWidth(0.9);
        doc.roundedRect(x, rowY, tW, tH, 4, 4, "FD");
        doc.setTextColor(rr, gg, bb); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
        doc.text(idx.code, x + tW / 2, rowY + 13, { align: "center" });
        doc.setTextColor(...C.ink); doc.setFontSize(16);
        doc.text(idx.score != null ? idx.score.toFixed(1) : "—", x + tW / 2, rowY + 32, { align: "center" });
        doc.setTextColor(...C.mut); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
        doc.splitTextToSize(idx.label, tW - 10).slice(0, 2).forEach((ln: string, k: number) =>
          doc.text(ln, x + tW / 2, rowY + 42 + k * 8, { align: "center" }));
      }
      y = rowY + tH + 8;
    }
    y += 4;
  }

  // Performance Summary
  heading("Performance Summary");
  para(performanceSummary, C.mut, 9.5);
  para("Scores derived from UN Women, World Bank, WHO, UNESCO and UNODC data for 2025. Signal-backed summaries update after the weekly pipeline runs.", C.mut, 7.5, true);

  // ── 8 Pillar Breakdown ──────────────────────────────────────────────────
  heading("8 Pillar Breakdown");
  {
    const pcW = (CONTENT_W - 16) / 2, pcH = 62;
    for (let r = 0; r < Math.ceil(pillars.length / 2); r++) {
      ensure(pcH + 10);
      const rowY = y;
      for (let col = 0; col < 2; col++) {
        const p = pillars[r * 2 + col];
        if (!p) continue;
        const x = M + col * (pcW + 16);
        panel(doc, x, rowY, pcW, pcH, C.card);
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...C.gold);
        doc.text(p.label.toUpperCase(), x + 12, rowY + 15);
        doc.setTextColor(...C.ink); doc.setFontSize(18);
        doc.text(p.score.toFixed(1), x + 12, rowY + 35);
        const delta = p.score - p.globalAvg;
        doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
        doc.setTextColor(...(delta >= 0 ? C.emerald : C.red));
        doc.text(`${delta >= 0 ? "+" : ""}${delta.toFixed(0)} vs global avg`, x + pcW - 12, rowY + 16, { align: "right" });
        // bar
        const bx = x + 12, bw = pcW - 24, byy = rowY + 40;
        doc.setFillColor(...C.bg); doc.roundedRect(bx, byy, bw, 6, 2, 2, "F");
        doc.setFillColor(...scoreColor(p.score));
        doc.roundedRect(bx, byy, Math.max(2, bw * Math.min(100, p.score) / 100), 6, 2, 2, "F");
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...C.mut);
        doc.text(doc.splitTextToSize(p.description, pcW - 24)[0] ?? "", x + 12, rowY + 56);
      }
      y = rowY + pcH + 10;
    }
  }

  // ── Violence Penalty ────────────────────────────────────────────────────
  heading("Violence Penalty");
  ensure(40);
  doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(...C.red);
  doc.text(`-${violence.score.toFixed(1)} pts`, M, y + 18);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...C.red);
  doc.text(`${violence.label.toUpperCase()}  ·  subtracted from the composite WEI score`, M + 110, y + 18);
  y += 32;
  para(violence.context, C.mut, 9);
  {
    const boxes: [string, string][] = [
      ["Covers", "Rape prevalence, femicide, acid attacks, dowry violence, honour-based violence"],
      ["Impact", `Removes ${violence.score.toFixed(1)} points directly from the composite WEI score`],
      ["Data sources", "WHO, UNODC, UN Women — verified annually"],
      ["To reduce this", "Prosecution rates, survivor legal aid, DV-law enforcement"],
    ];
    const bw = (CONTENT_W - 14) / 2, bh = 46;
    for (let r = 0; r < 2; r++) {
      ensure(bh + 10);
      const rowY = y;
      for (let col = 0; col < 2; col++) {
        const b = boxes[r * 2 + col];
        const x = M + col * (bw + 14);
        panel(doc, x, rowY, bw, bh, C.card);
        doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...C.gold);
        doc.text(b[0].toUpperCase(), x + 12, rowY + 15);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...C.ink);
        doc.splitTextToSize(b[1], bw - 24).slice(0, 3).forEach((ln: string, k: number) =>
          doc.text(ln, x + 12, rowY + 27 + k * 10));
      }
      y = rowY + bh + 10;
    }
  }

  // ── The Life of 100 Girls ───────────────────────────────────────────────
  if (milestones.length || lifepath.length) {
    heading(`The Life of 100 Girls — ${c.country}`);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...C.mut);
    doc.text("How many of 100 girls born here today clear each life hurdle.", M, y); y += 14;

    milestones.forEach((m) => {
      ensure(16);
      const v = Math.max(0, Math.min(100, m.reached));
      const col = scoreColor(v);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...C.ink);
      doc.text(doc.splitTextToSize(m.label, 196)[0] ?? "", M, y + 8);
      const bx = M + 205, bw = CONTENT_W - 205 - 46, byy = y + 2;
      doc.setFillColor(...C.card); doc.roundedRect(bx, byy, bw, 7, 2, 2, "F");
      doc.setFillColor(...col); doc.roundedRect(bx, byy, Math.max(2, bw * v / 100), 7, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setTextColor(...col);
      doc.text(`${Math.round(v)}/100`, M + CONTENT_W, y + 8, { align: "right" });
      y += 15;
    });

    if (lifepath.length) {
      y += 6;
      ensure(20);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...C.gold);
      doc.text("Stage by stage", M, y); y += 4;
      lifepath.forEach((s) => {
        ensure(36);
        y += 14;
        doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...C.gold);
        doc.text(s.age_band, M, y);
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...C.ink);
        doc.text(doc.splitTextToSize(s.headline, CONTENT_W - 64)[0] ?? "", M + 56, y);
        let yy = y;
        const body = s.detail || s.cohort;
        if (body) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...C.mut);
          doc.splitTextToSize(body, CONTENT_W - 56).slice(0, 2).forEach((ln: string) => { yy += 10.5; doc.text(ln, M + 56, yy); });
        }
        if (s.felt) {
          doc.setFont("helvetica", "italic"); doc.setFontSize(7.5); doc.setTextColor(...C.gold);
          yy += 10.5; doc.text(doc.splitTextToSize(s.felt, CONTENT_W - 56)[0] ?? "", M + 56, yy);
        }
        if (s.source) {
          doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...C.mut);
          yy += 9.5; doc.text(`Source: ${s.source}`, M + 56, yy);
        }
        y = yy + 4;
      });
    }
  }

  // ── WEI Trend ───────────────────────────────────────────────────────────
  if (trend.length >= 2) {
    heading(`WEI Trend (${trend[0].year}–${trend[trend.length - 1].year})`);
    ensure(86);
    const chartH = 64, chartW = CONTENT_W, x0 = M, y0 = y;
    panel(doc, x0, y0, chartW, chartH);
    doc.setDrawColor(...C.border); doc.setLineWidth(0.5);
    const y50 = y0 + chartH - (50 / 100) * chartH;
    doc.line(x0, y50, x0 + chartW, y50);
    doc.setFontSize(6.5); doc.setTextColor(...C.mut); doc.text("50", x0 + 4, y50 - 2);
    const n = trend.length;
    const sx = (i: number) => x0 + (i / (n - 1)) * chartW;
    const sy = (v: number) => y0 + chartH - (Math.min(100, Math.max(0, v)) / 100) * chartH;
    doc.setDrawColor(...C.gold); doc.setLineWidth(1.6);
    for (let i = 1; i < n; i++) doc.line(sx(i - 1), sy(trend[i - 1].score), sx(i), sy(trend[i].score));
    doc.setFillColor(...C.gold);
    trend.forEach((pt, i) => doc.circle(sx(i), sy(pt.score), 1.6, "F"));
    doc.setFontSize(6.5); doc.setTextColor(...C.mut);
    doc.text(`${trend[0].year}`, x0 + 4, y0 + chartH - 4);
    doc.text(`${trend[trend.length - 1].year}`, x0 + chartW - 4, y0 + chartH - 4, { align: "right" });
    y += chartH + 12;
  }

  doc.save(`SHEtoken-WEI-${c.iso_code}-report.pdf`);
}
