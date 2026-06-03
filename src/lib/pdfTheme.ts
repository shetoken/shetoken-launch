import { jsPDF } from "jspdf";

/**
 * Shared PDF theme so every SHEtoken download matches the website's
 * look-and-feel: deep-purple background, warm-cream text, gold accents.
 *
 * The colours below are the RGB equivalents of the site's CSS tokens
 * (see src/index.css):
 *   --background     hsl(260 40% 6%)   → page background
 *   --card           hsl(260 35% 9%)   → panels
 *   --foreground     hsl(40 30% 96%)   → body text (cream)
 *   --muted-fg       hsl(260 15% 70%)  → secondary text
 *   --accent (gold)  hsl(45 95% 60%)   → highlights
 *   --primary        hsl(280 75% 60%)  → purple
 *   --border         hsl(260 30% 20%)  → hairlines
 */

export type RGB = [number, number, number];

export const PW = 595.28; // A4 width  (pt)
export const PH = 841.89; // A4 height (pt)
export const M = 40; // page margin (pt)

export const C: Record<string, RGB> = {
  bg: [13, 9, 21],
  card: [22, 16, 34],
  cardTop: [29, 21, 45],
  border: [60, 50, 84],
  ink: [248, 246, 242],
  mut: [176, 168, 191],
  gold: [250, 201, 56],
  purple: [179, 76, 230],
  emerald: [16, 185, 129],
  red: [239, 68, 68],
  amber: [234, 179, 8],
};

export const hexToRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

/** Paint the full page with the dark background. Call on every new page. */
export function paintBackground(doc: jsPDF) {
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PW, PH, "F");
}

/** Branded header band with a gold underline. Returns the y below it. */
export function headerBand(doc: jsPDF, subtitle: string): number {
  doc.setFillColor(...C.cardTop);
  doc.rect(0, 0, PW, 64, "F");
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(1.4);
  doc.line(0, 64, PW, 64);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...C.gold);
  doc.text("SHE", M, 30);
  const w = doc.getTextWidth("SHE");
  doc.setTextColor(...C.ink);
  doc.text("token", M + w, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.mut);
  doc.text(subtitle, M, 47);

  doc.setFontSize(8);
  doc.setTextColor(...C.mut);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    PW - M, 30, { align: "right" }
  );
  doc.setTextColor(...C.gold);
  doc.text("shetoken.org", PW - M, 47, { align: "right" });

  return 64;
}

/** Hairline footer at the bottom of the page. */
export function pageFooter(doc: jsPDF, left: string, right: string) {
  const fy = PH - 28;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.5);
  doc.line(M, fy - 10, PW - M, fy - 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...C.mut);
  doc.text(left, M, fy, { maxWidth: PW - 2 * M - 130 });
  doc.text(right, PW - M, fy, { align: "right" });
}

/** A rounded panel in the "card" colour with a subtle border. */
export function panel(doc: jsPDF, x: number, y: number, w: number, h: number, fill: RGB = C.card) {
  doc.setFillColor(...fill);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.7);
  doc.roundedRect(x, y, w, h, 5, 5, "FD");
}

/**
 * Render a dark-themed table with automatic row wrapping and page breaks.
 * `onBreak` is called after a new page is started so the caller can repaint
 * the background / header and tell us the y to continue from.
 *
 * Returns the y position just below the table.
 */
export function drawTable(
  doc: jsPDF,
  opts: {
    x: number;
    width: number;
    startY: number;
    headers: string[];
    rows: string[][];
    weights?: number[]; // relative column widths; defaults to equal
    bottomLimit: number; // y beyond which we must break
    onBreak: () => number; // returns new startY after a page break
    fontSize?: number;
  }
): number {
  const { x, width, headers, rows, bottomLimit, onBreak } = opts;
  const fs = opts.fontSize ?? 8.5;
  const pad = 6;
  const lineH = fs * 1.28;
  const nCols = headers.length;
  const weights = opts.weights ?? headers.map(() => 1);
  const wsum = weights.reduce((a, b) => a + b, 0);
  const colW = weights.map((w) => (w / wsum) * width);
  const colX = colW.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? x : acc[i - 1] + colW[i - 1]);
    return acc;
  }, []);

  let y = opts.startY;

  const drawHeader = () => {
    const hH = lineH + pad * 1.4;
    doc.setFillColor(...C.cardTop);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.7);
    doc.rect(x, y, width, hH, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fs - 0.5);
    doc.setTextColor(...C.gold);
    headers.forEach((h, i) => doc.text(h.toUpperCase(), colX[i] + pad, y + lineH));
    y += hH;
  };

  drawHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fs);

  rows.forEach((row, ri) => {
    const wrapped = row.map((cell, i) =>
      doc.splitTextToSize(String(cell ?? ""), colW[i] - pad * 2)
    );
    const lines = Math.max(1, ...wrapped.map((w) => w.length));
    const rowH = lines * lineH + pad;

    if (y + rowH > bottomLimit) {
      y = onBreak();
      drawHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fs);
    }

    // zebra striping
    if (ri % 2 === 1) {
      doc.setFillColor(...C.card);
      doc.rect(x, y, width, rowH, "F");
    }
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(x, y + rowH, x + width, y + rowH);

    wrapped.forEach((cellLines, i) => {
      // first column slightly brighter to read as a row label
      doc.setTextColor(...(i === 0 ? C.ink : C.mut));
      cellLines.forEach((ln: string, li: number) =>
        doc.text(ln, colX[i] + pad, y + pad + lineH * (li + 0.75))
      );
    });
    y += rowH;
  });

  // outer border
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.7);
  doc.line(x, opts.startY, x, y);
  doc.line(x + width, opts.startY, x + width, y);

  return y;
}
