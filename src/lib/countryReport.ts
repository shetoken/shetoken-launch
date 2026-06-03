import { jsPDF } from "jspdf";
import type { CountryWEI } from "@/lib/api";
import { METHODOLOGY, computeScore } from "@/lib/methodology";
import { getCountryMapPng } from "@/lib/worldGeo";
import { PW, PH, M, C, type RGB, hexToRgb, paintBackground, headerBand, pageFooter, panel, getLogoDataUrl, coverPage } from "@/lib/pdfTheme";

type ProvByCode = Record<string, Record<string, { year?: string; status?: string }>>;

export interface ReportIndexTile { code: string; label: string; accent: string; score: number | null; }
export interface ReportPillar { label: string; code: string; description: string; score: number; globalAvg: number; improvement: string; }
export interface ReportTrendPoint { year: number; score: number; }
export interface ReportLifeStage { age_band: string; headline: string; cohort?: string; detail?: string; felt?: string; source?: string; }
export interface ReportMilestone { label: string; reached: number; }
export interface ReportViolence { score: number; label: string; context: string; }
export interface ReportState { state: string; safety_justice_score: number; wei_score?: number; }
export interface ReportGlobal {
  weiAvg: number;
  countriesScored: number;
  highest: { country: string; score: number };
  lowest: { country: string; score: number };
  tiers: [number, number, number, number];
  indexAvgs: Record<string, number | undefined>;
}

const TIER_LABEL: Record<number, string> = { 1: "Preferred", 2: "Acceptable", 3: "Caution", 4: "Avoid" };
const CONTENT_W = PW - 2 * M;
const BOTTOM = PH - 46;
const scoreColor = (v: number): RGB => (v >= 70 ? C.emerald : v >= 40 ? C.amber : C.red);
/** Women's travel-safety advisory tier from a Safety & Justice score (matches the Safety page). */
const ADVISORY = (s: number): { label: string; color: string } =>
  s >= 65 ? { label: "Generally safe", color: "#10b981" } :
  s >= 48 ? { label: "Don't walk alone after dark", color: "#eab308" } :
  s >= 35 ? { label: "Avoid travelling alone", color: "#f97316" } :
            { label: "Reconsider non-essential travel", color: "#ef4444" };
const percentileTier = (v: number) => (v >= 70 ? "Top tier" : v >= 40 ? "Mid tier" : "Bottom tier");

/** Comprehensive Women's Empowerment Index country report — styled to match the website. */
export async function downloadCountryReport(opts: {
  country: CountryWEI;
  indexes: ReportIndexTile[];
  pillars: ReportPillar[];
  performanceSummary: string;
  violence: ReportViolence;
  lifepath: ReportLifeStage[];
  milestones?: ReportMilestone[];
  states?: ReportState[];
  global?: ReportGlobal;
  allCountries?: { iso_code: string; wei_score: number }[];
  methodRows?: Record<string, Record<string, unknown> | undefined>;
  provenance?: ProvByCode;
}) {
  const { country: c, indexes, pillars, performanceSummary, violence, lifepath } = opts;
  const milestones = opts.milestones ?? [];
  const states = opts.states ?? [];
  const global = opts.global;
  const methodRows = opts.methodRows;
  const provenance = opts.provenance;
  const distribution = (opts.allCountries ?? []).map((x) => x.wei_score).filter((v) => typeof v === "number");
  const logo = await getLogoDataUrl();
  const mapPng = opts.allCountries?.length
    ? await getCountryMapPng({
        scoreByIso: Object.fromEntries(opts.allCountries.map((x) => [x.iso_code, x.wei_score])),
        selectedIso: c.iso_code,
      })
    : null;
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
    ensure(44);
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C.gold);
    doc.text(t, M, y);
    y += 17;
  };
  // Sub-section label within a section, with consistent breathing room above/below.
  const subHeading = (t: string) => {
    ensure(26);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.ink);
    doc.text(t, M, y);
    y += 6;
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
    const rowH = 19, ph = 3 * rowH + rowH + 14, colW = CONTENT_W / 2;
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
    // Full-width safety-status row
    const adv = ADVISORY(c.safety_justice_score ?? 0);
    const syy = y + 16 + 3 * rowH;
    doc.setDrawColor(...C.border); doc.setLineWidth(0.4); doc.line(M + 14, syy - 13, M + CONTENT_W - 14, syy - 13);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...C.mut);
    doc.text("Women's safety status", M + 14, syy);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...hexToRgb(adv.color));
    doc.text(`${adv.label}  ·  Safety ${(c.safety_justice_score ?? 0).toFixed(0)}/100`, M + CONTENT_W - 14, syy, { align: "right" });
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

  // ── Global Context ──────────────────────────────────────────────────────
  if (global) {
    heading("Global Context");
    para(`Where ${c.country} sits among ${global.countriesScored} countries, with the global index averages for reference.`, C.mut, 8.5);

    // World map — WEI choropleth with this country in gold
    if (mapPng) {
      const mh = CONTENT_W * 0.46;
      ensure(mh + 28);
      doc.setFillColor(...C.card); doc.setDrawColor(...C.border); doc.setLineWidth(0.7);
      doc.roundedRect(M, y, CONTENT_W, mh, 6, 6, "FD");
      try { doc.addImage(mapPng, "PNG", M + 4, y + 4, CONTENT_W - 8, mh - 8); } catch { /* ignore */ }
      y += mh + 6;
      // legend
      const legend: [string, RGB][] = [
        [`${c.country} (selected)`, hexToRgb("#f59e0b")], ["75+", C.emerald], ["60–74", hexToRgb("#22c55e")],
        ["45–59", C.amber], ["30–44", hexToRgb("#f97316")], ["<30", C.red], ["No data", hexToRgb("#283143")],
      ];
      let lx = M;
      doc.setFont("helvetica", "normal"); doc.setFontSize(6.8);
      legend.forEach(([lab, col]) => {
        doc.setFillColor(...col); doc.roundedRect(lx, y - 5, 7, 7, 1.5, 1.5, "F");
        doc.setTextColor(...C.mut); doc.text(lab, lx + 10, y + 1);
        lx += 12 + doc.getTextWidth(lab) + 14;
      });
      y += 12;
    }

    // WEI distribution across all countries, with this country marked
    if (distribution.length >= 8) {
      subHeading(`WEI distribution — ${distribution.length} countries`);
      ensure(94);
      const ch = 78, x0 = M, y0 = y;
      panel(doc, x0, y0, CONTENT_W, ch, C.card);
      const bw = 6;
      const dens: number[] = [];
      let maxD = 0;
      for (let xx = 0; xx <= 100; xx++) {
        let s = 0;
        for (const v of distribution) { const t = (xx - v) / bw; s += Math.exp(-0.5 * t * t); }
        dens.push(s); if (s > maxD) maxD = s;
      }
      const px = (xx: number) => x0 + (xx / 100) * CONTENT_W;
      const py = (d: number) => y0 + ch - 6 - (maxD ? d / maxD : 0) * (ch - 18);
      // 50 mid gridline
      doc.setDrawColor(...C.border); doc.setLineWidth(0.4); doc.line(px(50), y0 + 4, px(50), y0 + ch - 6);
      // density curve
      doc.setDrawColor(...C.gold); doc.setLineWidth(1.5);
      for (let xx = 1; xx <= 100; xx++) doc.line(px(xx - 1), py(dens[xx - 1]), px(xx), py(dens[xx]));
      // global average marker
      const ga = global.weiAvg;
      doc.setDrawColor(...C.mut); doc.setLineWidth(0.7); doc.line(px(ga), y0 + 4, px(ga), y0 + ch - 6);
      doc.setFontSize(6.5); doc.setTextColor(...C.mut); doc.text(`global avg ${ga.toFixed(1)}`, px(ga) + 3, y0 + 12);
      // this country marker (gold dashed)
      const cs = c.wei_score ?? 0;
      doc.setDrawColor(...C.gold); doc.setLineWidth(1); doc.setLineDashPattern([2, 2], 0);
      doc.line(px(cs), y0 + 4, px(cs), y0 + ch - 6);
      doc.setLineDashPattern([], 0);
      doc.setFontSize(7); doc.setTextColor(...C.gold);
      doc.text(`${c.iso_code} ${cs.toFixed(1)}`, px(cs), y0 + 10, { align: cs > 60 ? "right" : "left" });
      // x-axis labels
      doc.setFontSize(6); doc.setTextColor(...C.mut);
      [0, 25, 50, 75, 100].forEach((t) => doc.text(`${t}`, px(t), y0 + ch + 7, { align: t === 0 ? "left" : t === 100 ? "right" : "center" }));
      y += ch + 14;
    }

    // Snapshot — 4 cells (2 × 2)
    const cells: [string, string, RGB][] = [
      ["Global WEI average", `${global.weiAvg.toFixed(1)} / 100`, C.gold],
      [`${c.country} · rank #${c.rank} of ${global.countriesScored}`, `${(c.wei_score ?? 0).toFixed(1)} / 100`, C.ink],
      ["Highest", `${global.highest.country} · ${global.highest.score.toFixed(1)}`, C.emerald],
      ["Lowest", `${global.lowest.country} · ${global.lowest.score.toFixed(1)}`, C.red],
    ];
    const cellW = (CONTENT_W - 8) / 2, cellH = 36;
    ensure(2 * cellH + 18);
    cells.forEach(([label, val, col], i) => {
      const x = M + (i % 2) * (cellW + 8), yy = y + Math.floor(i / 2) * (cellH + 8);
      panel(doc, x, yy, cellW, cellH, C.card);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...C.mut);
      doc.text(doc.splitTextToSize(label, cellW - 20)[0] ?? label, x + 10, yy + 14);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...col);
      doc.text(val, x + 10, yy + 30);
    });
    y += 2 * cellH + 8 + 14;

    // Country distribution by tier
    subHeading("Country Distribution by Tier");
    const tierMeta: [string, string][] = [
      ["Tier 1 · Preferred", "#10b981"], ["Tier 2 · Acceptable", "#eab308"],
      ["Tier 3 · Caution", "#f97316"], ["Tier 4 · Avoid", "#ef4444"],
    ];
    const totalC = global.tiers.reduce((a, b) => a + b, 0) || 1;
    tierMeta.forEach(([label, color], i) => {
      const count = global.tiers[i], pct = (count / totalC) * 100, mine = c.tier === i + 1;
      ensure(16);
      y += 14;
      doc.setFont("helvetica", mine ? "bold" : "normal"); doc.setFontSize(8);
      doc.setTextColor(...(mine ? hexToRgb(color) : C.mut));
      doc.text(`${label}${mine ? `   (${c.country})` : ""}`, M, y);
      const bx = M + 190, bw = CONTENT_W - 190 - 70, byy = y - 7;
      doc.setFillColor(...C.card); doc.roundedRect(bx, byy, bw, 8, 2, 2, "F");
      doc.setFillColor(...hexToRgb(color)); doc.roundedRect(bx, byy, Math.max(2, bw * pct / 100), 8, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setTextColor(...C.ink);
      doc.text(`${count} (${pct.toFixed(1)}%)`, M + CONTENT_W, y, { align: "right" });
    });
    y += 8;

    // 8 indexes — country vs global average
    subHeading(`8 Indexes — ${c.country} vs Global Average`);
    const vX = M + 320, gX = M + 420, dX = M + CONTENT_W;
    ensure(15);
    doc.setFillColor(...C.cardTop); doc.setDrawColor(...C.border); doc.setLineWidth(0.6);
    doc.rect(M, y, CONTENT_W, 15, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.6); doc.setTextColor(...C.gold);
    doc.text("INDEX", M + 6, y + 10);
    doc.text(c.country.toUpperCase(), vX, y + 10, { align: "right" });
    doc.text("GLOBAL AVG", gX, y + 10, { align: "right" });
    doc.text("VS GLOBAL", dX, y + 10, { align: "right" });
    y += 15;
    indexes.forEach((idx, i) => {
      const v = idx.score ?? 0, g = global.indexAvgs[idx.code];
      const rowH = 13;
      ensure(rowH);
      if (i % 2 === 1) { doc.setFillColor(...C.card); doc.rect(M, y, CONTENT_W, rowH, "F"); }
      const [rr, gg, bb] = hexToRgb(idx.accent);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(rr, gg, bb);
      doc.text(idx.code, M + 6, y + 9);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mut); doc.setFontSize(7.5);
      doc.text(doc.splitTextToSize(idx.label, 200)[0] ?? idx.label, M + 6 + doc.getTextWidth(idx.code) + 8, y + 9);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...C.ink);
      doc.text(idx.score != null ? v.toFixed(1) : "—", vX, y + 9, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mut);
      doc.text(g != null ? g.toFixed(1) : "—", gX, y + 9, { align: "right" });
      if (g != null && idx.score != null) {
        const d = v - g;
        doc.setFont("helvetica", "bold"); doc.setTextColor(...(d >= 0 ? C.emerald : C.red));
        doc.text(`${d >= 0 ? "+" : ""}${d.toFixed(1)}`, dX, y + 9, { align: "right" });
      }
      doc.setDrawColor(...C.border); doc.setLineWidth(0.3); doc.line(M, y + rowH, M + CONTENT_W, y + rowH);
      y += rowH;
    });
    y += 8;
  }

  // ── 8 Pillar Breakdown ──────────────────────────────────────────────────
  heading("8 Pillar Breakdown");
  para("Each pillar vs. the global average, its percentile tier, and the lever that would most improve it.", C.mut, 8.5);
  pillars.forEach((p) => {
    const delta = p.score - p.globalAvg;
    const leverLines = doc.splitTextToSize(`Lever: ${p.improvement}`, CONTENT_W - 24);
    const cardH = 52 + leverLines.length * 9 + 6;
    ensure(cardH + 8);
    panel(doc, M, y, CONTENT_W, cardH, C.card);
    // label + score
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...C.gold);
    doc.text(p.label.toUpperCase(), M + 12, y + 15);
    doc.setTextColor(...C.ink); doc.setFontSize(13);
    doc.text(`${p.score.toFixed(1)}/100`, M + CONTENT_W - 12, y + 15, { align: "right" });
    // bar
    const bx = M + 12, bw = CONTENT_W - 24, byy = y + 22;
    doc.setFillColor(...C.bg); doc.roundedRect(bx, byy, bw, 6, 2, 2, "F");
    doc.setFillColor(...scoreColor(p.score));
    doc.roundedRect(bx, byy, Math.max(2, bw * Math.min(100, p.score) / 100), 6, 2, 2, "F");
    // delta · tier · global avg
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...(delta >= 0 ? C.emerald : C.red));
    const deltaStr = `${delta >= 0 ? "+" : ""}${delta.toFixed(0)} vs global avg`;
    doc.text(deltaStr, M + 12, y + 40);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mut);
    doc.text(`   ·   ${percentileTier(p.score)}   ·   global avg ${p.globalAvg.toFixed(0)}/100`, M + 12 + doc.getTextWidth(deltaStr), y + 40);
    // description
    doc.setFontSize(7.5); doc.setTextColor(...C.mut);
    doc.text(doc.splitTextToSize(p.description, CONTENT_W - 24)[0] ?? "", M + 12, y + 50);
    // improvement lever
    doc.setFont("helvetica", "italic"); doc.setTextColor(...C.gold);
    leverLines.forEach((ln: string, k: number) => doc.text(ln, M + 12, y + 60 + k * 9));
    y += cardH + 8;
  });

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

  // ── State-Level Safety (countries with sub-national data) ───────────────
  if (states.length) {
    const sorted = [...states].sort((a, b) => (a.safety_justice_score ?? 0) - (b.safety_justice_score ?? 0));
    heading(`State-Level Safety — ${c.country}`);
    para("Safety varies widely within a country. States/regions ranked least safe first, by Safety & Justice score.", C.mut, 8.5);
    // header row
    ensure(16);
    doc.setFillColor(...C.cardTop); doc.setDrawColor(...C.border); doc.setLineWidth(0.6);
    doc.rect(M, y, CONTENT_W, 15, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.6); doc.setTextColor(...C.gold);
    doc.text("STATE / REGION", M + 6, y + 10);
    doc.text("SAFETY /100", M + 300, y + 10, { align: "right" });
    doc.text("ADVISORY", M + CONTENT_W - 6, y + 10, { align: "right" });
    y += 15;
    sorted.forEach((st, i) => {
      const sc = st.safety_justice_score ?? 0;
      const adv = ADVISORY(sc);
      const rowH = 13;
      ensure(rowH);
      if (i % 2 === 1) { doc.setFillColor(...C.card); doc.rect(M, y, CONTENT_W, rowH, "F"); }
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...C.ink);
      doc.text(doc.splitTextToSize(st.state, 250)[0] ?? st.state, M + 6, y + 9);
      doc.setTextColor(...C.mut); doc.text(sc.toFixed(0), M + 300, y + 9, { align: "right" });
      doc.setFont("helvetica", "bold"); doc.setTextColor(...hexToRgb(adv.color));
      doc.text(adv.label, M + CONTENT_W - 6, y + 9, { align: "right" });
      doc.setDrawColor(...C.border); doc.setLineWidth(0.3); doc.line(M, y + rowH, M + CONTENT_W, y + rowH);
      y += rowH;
    });
    y += 8;
  }

  // ── How Each Score Is Calculated (per-index methodology) ────────────────
  if (methodRows) {
    const fmt = (n: number) => (isNaN(n) ? "—" : Number.isInteger(n) ? String(n) : n.toFixed(1));
    // jsPDF's built-in fonts are WinAnsi — map math/arrow glyphs to ASCII so
    // formulas don't render as garbage (and don't break text width/wrapping).
    const tx = (s: unknown) => String(s ?? "")
      .replace(/→/g, "->")   // →
      .replace(/×/g, "x")    // ×
      .replace(/÷/g, "/")    // ÷
      .replace(/−/g, "-")    // −
      .replace(/≥/g, ">=")   // ≥
      .replace(/≤/g, "<=")   // ≤
      .replace(/Σ/g, "Sum"); // Σ
    const dataAsOf = (vintage: string, prov?: Record<string, { year?: string; status?: string }>) => {
      const ys = prov ? Object.values(prov).map((p) => parseInt(p.year ?? "", 10)).filter((v) => !isNaN(v)) : [];
      if (!ys.length) return `Data as of: ${vintage}`;
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const nV = Object.values(prov!).filter((p) => p.status === "verified").length;
      const nM = Object.values(prov!).filter((p) => p.status === "modeled").length;
      const range = minY === maxY ? `${minY}` : `${minY}–${maxY}`;
      const mix = nV || nM ? ` · ${nV} verified · ${nM} modelled` : "";
      return `Data as of: collection years ${range}${mix}`;
    };

    heading("How Each Score Is Calculated");
    para("The formula, this country's actual inputs, and the source documents behind each of the eight SHEtoken indexes.", C.mut, 8.5);

    ["WEI", "GPI", "SVI", "WADI", "WEVI", "WHI", "WVI", "Compliance"].forEach((code) => {
      const m = METHODOLOGY[code];
      const row = methodRows[code];
      if (!m || !row) return;
      const acc = hexToRgb(m.accent);
      const weighted = m.kind === "weighted";

      // Index header (badge + title + DERIVED) — keep with at least the formula row
      ensure(60);
      y += 10;
      doc.setFont("helvetica", "bold"); doc.setFontSize(8);
      const bw = doc.getTextWidth(m.code) + 10;
      doc.setFillColor(...C.card); doc.setDrawColor(...acc); doc.setLineWidth(0.7);
      doc.roundedRect(M, y - 9, bw, 14, 3, 3, "FD");
      doc.setTextColor(...acc); doc.text(m.code, M + 5, y + 1);
      doc.setTextColor(...C.ink); doc.setFontSize(11);
      doc.text(m.title, M + bw + 8, y + 1);
      if (m.derived) {
        doc.setFontSize(6.5); doc.setTextColor(...acc);
        doc.text("DERIVED", M + bw + 12 + doc.getTextWidth(m.title), y);
      }
      y += 12;
      doc.setFont("courier", "normal"); doc.setFontSize(8); doc.setTextColor(...C.mut);
      doc.splitTextToSize(tx(m.formula), CONTENT_W).forEach((ln: string) => { ensure(11); doc.text(ln, M, y + 8); y += 11; });
      doc.setFont("helvetica", "italic"); doc.setFontSize(7.5); doc.setTextColor(...acc);
      ensure(12); doc.text(dataAsOf(m.vintage, provenance?.[code]), M, y + 8); y += 14;

      // Breakdown table
      const { contributions, total } = computeScore(m, row);
      const valX = weighted ? M + 300 : M + 330;
      const wX = M + 392, conX = M + CONTENT_W;
      const compW = weighted ? 230 : 250;
      const lineH = 10.5, pad = 4;

      ensure(18);
      doc.setFillColor(...C.cardTop); doc.setDrawColor(...C.border); doc.setLineWidth(0.6);
      doc.rect(M, y, CONTENT_W, 15, "FD");
      doc.setFont("helvetica", "bold"); doc.setFontSize(6.6); doc.setTextColor(...C.gold);
      doc.text("COMPONENT", M + 6, y + 10);
      doc.text(c.country.toUpperCase(), valX, y + 10, { align: "right" });
      if (weighted) { doc.text("WEIGHT", wX, y + 10, { align: "right" }); doc.text("CONTRIBUTION", conX, y + 10, { align: "right" }); }
      else doc.text("SOURCE", conX, y + 10, { align: "right" });
      y += 15;

      contributions.forEach((cc, i) => {
        const comp = m.components[i];
        const isPen = comp.label.trim().startsWith("−");
        const compLines = doc.splitTextToSize(tx(comp.label), compW);
        const rowH = compLines.length * lineH + pad;
        ensure(rowH + 1);
        if (i % 2 === 1) { doc.setFillColor(...C.card); doc.rect(M, y, CONTENT_W, rowH, "F"); }
        const baseY = y + pad + lineH * 0.55;
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...(isPen ? C.red : C.ink));
        compLines.forEach((ln: string, k: number) => doc.text(ln, M + 6, y + pad + lineH * (k + 0.55)));
        const valStr = `${fmt(cc.raw)}${comp.unit && comp.unit !== "0/1" ? comp.unit : ""}${comp.invert && !isNaN(cc.raw) ? ` → ${fmt(cc.used)}` : ""}`;
        doc.setTextColor(...(isPen ? C.red : C.mut)); doc.text(valStr, valX, baseY, { align: "right" });
        if (weighted) {
          doc.setTextColor(...C.mut); doc.text(`×${comp.weight}`, wX, baseY, { align: "right" });
          doc.setFont("helvetica", "bold"); doc.setTextColor(...(isPen ? C.red : acc));
          doc.text(cc.contribution != null ? `${cc.contribution >= 0 ? "+" : ""}${cc.contribution.toFixed(2)}` : "—", conX, baseY, { align: "right" });
        } else {
          doc.setFontSize(7); doc.setTextColor(...C.mut);
          const yr = provenance?.[code]?.[comp.field]?.year;
          doc.text(`${tx(comp.source ?? "")}${yr ? ` · ${yr}` : ""}`, conX, baseY, { align: "right" });
        }
        doc.setDrawColor(...C.border); doc.setLineWidth(0.3); doc.line(M, y + rowH, M + CONTENT_W, y + rowH);
        y += rowH;
      });

      if ((weighted || m.kind === "average") && total != null) {
        ensure(18);
        doc.setDrawColor(...acc); doc.setLineWidth(1); doc.line(M, y, M + CONTENT_W, y);
        doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...C.ink);
        doc.text(`${m.kind === "average" ? "Average" : "Total"} = ${m.code} score`, M + 6, y + 13);
        doc.setTextColor(...acc); doc.text(fmt(total), conX, y + 13, { align: "right" });
        y += 18;
      }
      y += 4;

      para(tx(m.note), C.mut, 7.5);
      ensure(12);
      doc.setFont("helvetica", "bold"); doc.setFontSize(6.8); doc.setTextColor(...C.mut);
      doc.text(`DATA SOURCES:  ${m.sources.map((s) => s.name).join("   ·   ")}`, M, y + 6);
      y += 16;
    });
  }

  // ── About the Data ──────────────────────────────────────────────────────
  ensure(232);
  heading("About the Data");
  {
    const colGap = 16;
    const colW = (CONTENT_W - 2 * colGap) / 3;
    const colX = [M, M + colW + colGap, M + 2 * (colW + colGap)];
    const top = y;

    const colTitle = (x: number, cy: number, title: string) => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...C.ink);
      let yy = cy;
      doc.splitTextToSize(title, colW).forEach((ln: string) => { yy += 12; doc.text(ln, x, yy); });
      return yy + 4;
    };
    const colBody = (x: number, cy: number, paras: string[]) => {
      let yy = cy;
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...C.mut);
      paras.forEach((p) => {
        doc.splitTextToSize(p, colW).forEach((ln: string) => { yy += 10; doc.text(ln, x, yy); });
        yy += 6;
      });
      return yy;
    };

    // Col 1 — WEI
    let c1 = colTitle(colX[0], top, "Women's Empowerment Index (WEI)");
    c1 = colBody(colX[0], c1, [
      "SHEtoken's native composite index. Scores 105 countries across 8 pillars — Empowerment, Bodily Autonomy, Safety & Justice, Education, Economic, Health, Dignity & Welfare, and Digital & Social — weighted and adjusted by a Violence Penalty. Updated weekly by the SHEtoken AI agent from 100+ multilingual news sources, arXiv, PubMed, and GDELT.",
    ]);

    // Col 2 — Comparison Indexes (coloured codes)
    let c2 = colTitle(colX[1], top, "Comparison Indexes");
    const META: [string, string, string][] = [
      ["GPI", "#a855f7", "— Gender Poverty Index: female poverty rates & resource access"],
      ["SVI", "#ef4444", "— Sexual Violence Index: prevalence & legal protection"],
      ["WADI", "#3b82f6", "— Women & AI Displacement Index: automation risk by gender"],
      ["WEVI", "#f97316", "— Widow Vulnerability Index: legal & economic widow status"],
      ["WHI", "#ec4899", "— Women's Health Index: maternal, reproductive & mental health"],
      ["WVI", "#06b6d4", "— Women's Voice Index: political representation & civic freedom"],
      ["Compliance", "#10b981", "— Rights Compliance: CEDAW, SDG 5 & treaty adherence"],
    ];
    doc.setFontSize(7.5);
    META.forEach(([code, hex, desc]) => {
      const lines = doc.splitTextToSize(`${code} ${desc}`, colW);
      doc.setFont("helvetica", "normal"); doc.setTextColor(...C.mut);
      lines.forEach((ln: string, i: number) => doc.text(ln, colX[1], c2 + 10 + i * 10));
      doc.setTextColor(...hexToRgb(hex)); doc.text(code, colX[1], c2 + 10);
      c2 += lines.length * 10 + 4;
    });

    // Col 3 — Sources & Methodology
    let c3 = colTitle(colX[2], top, "Sources & Methodology");
    c3 = colBody(colX[2], c3, [
      "Baseline data is derived from UN Women, World Bank Gender Data Portal, WHO, UNICEF, OECD, ILO, and Amnesty International reports (2023–2025).",
      "Weekly signals are extracted by a local AI classifier (Phi-3.5 Mini + Qwen2.5) from 100+ news sources across 15 languages and supplemented by academic research from arXiv and PubMed.",
      "All scores are normalised 0–100. Higher = better for women. Scores are indicative and intended for research & awareness, not as financial advice.",
    ]);

    y = Math.max(c1, c2, c3) + 10;
    doc.setDrawColor(...C.border); doc.setLineWidth(0.5); doc.line(M, y, PW - M, y); y += 12;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...C.mut);
    doc.text(
      `Data last updated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}  ·  WEI v3.0  ·  105 countries scored  ·  Full methodology at shetoken.org/whitepaper`,
      M, y
    );
  }

  doc.save(`SHEtoken-WEI-${c.iso_code}-report.pdf`);
}
