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

/**
 * Rasterise the SHE TOKEN coin (public/favicon.svg) to a PNG data URL so it can
 * be embedded in jsPDF (which can't draw SVG natively). Cached after first call.
 * Returns null if rasterisation isn't possible (e.g. SSR) — the header then
 * falls back to the text wordmark alone.
 */
let _logoCache: string | null | undefined;
export async function getLogoDataUrl(size = 256): Promise<string | null> {
  if (_logoCache !== undefined) return _logoCache;
  try {
    const res = await fetch("/favicon.svg");
    let svg = await res.text();
    // give the SVG an explicit square intrinsic size so it rasterises crisply
    svg = svg.replace("<svg ", `<svg width="${size}" height="${size}" `);
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new Image();
    img.width = size; img.height = size;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("logo load failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d ctx");
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(url);
    _logoCache = canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("SHEtoken logo rasterisation failed:", e);
    _logoCache = null;
  }
  return _logoCache;
}

/** Branded header band with a gold underline. Returns the y below it. */
export function headerBand(doc: jsPDF, subtitle: string, logo?: string | null): number {
  doc.setFillColor(...C.cardTop);
  doc.rect(0, 0, PW, 64, "F");
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(1.4);
  doc.line(0, 64, PW, 64);

  let tx = M;
  if (logo) {
    try { doc.addImage(logo, "PNG", M, 14, 36, 36); tx = M + 46; } catch { /* ignore */ }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...C.gold);
  doc.text("SHE", tx, 32);
  const w = doc.getTextWidth("SHE");
  doc.setTextColor(...C.ink);
  doc.text("token", tx + w, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.mut);
  doc.text(subtitle, tx, 48);

  doc.setFontSize(8);
  doc.setTextColor(...C.mut);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    PW - M, 30, { align: "right" }
  );
  doc.setTextColor(...C.gold);
  doc.text("shetoken.org  ·  contact@shetoken.org", PW - M, 47, { align: "right" });

  return 64;
}

/**
 * Full-page branded cover sheet: big coin, eyebrow, title, subtitle, a short
 * "what SHEtoken is" hero paragraph, and a partnering / contact card.
 * Drawn on the document's current page; the caller adds the next page after.
 */
export function coverPage(
  doc: jsPDF,
  opts: { logo?: string | null; eyebrow: string; title: string; subtitle: string; about: string[] }
) {
  paintBackground(doc);
  const cx = PW / 2;

  // big centered coin
  const L = 150;
  if (opts.logo) { try { doc.addImage(opts.logo, "PNG", cx - L / 2, 96, L, L); } catch { /* ignore */ } }

  // eyebrow pill — echoes the site's gold-bordered chips
  let y = 96 + L + 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const cs = 1.3;
  // width including letter-spacing applied after every glyph (+ a small safety margin)
  const ebW = doc.getTextWidth(opts.eyebrow) + cs * opts.eyebrow.length;
  const chipH = 21, padX = 18;
  const chipW = ebW + padX * 2;
  doc.setDrawColor(...C.gold);
  doc.setFillColor(...C.card);
  doc.setLineWidth(0.8);
  doc.roundedRect(cx - chipW / 2, y, chipW, chipH, chipH / 2, chipH / 2, "FD");
  doc.setTextColor(...C.gold);
  // position manually (align:center ignores charSpace, which would shift text right)
  doc.text(opts.eyebrow, cx - ebW / 2, y + 14, { charSpace: cs });

  // title — "SHE" in gold, the remainder in cream, centered as a unit
  y += chipH + 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  const head = opts.title.slice(0, 3);
  const tail = opts.title.slice(3);
  const wHead = doc.getTextWidth(head);
  const wTail = doc.getTextWidth(tail);
  const startX = cx - (wHead + wTail) / 2;
  doc.setTextColor(...C.gold);
  doc.text(head, startX, y);
  doc.setTextColor(...C.ink);
  doc.text(tail, startX + wHead, y);

  // subtitle
  y += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(...C.gold);
  doc.text(opts.subtitle, cx, y, { align: "center" });

  // divider
  y += 32;
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(1);
  doc.line(cx - 55, y, cx + 55, y);

  y += 36;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.mut);
  const wrapW = PW - 220;
  opts.about.forEach((p) => {
    const lines = doc.splitTextToSize(p, wrapW);
    lines.forEach((ln: string) => { doc.text(ln, cx, y, { align: "center" }); y += 16.5; });
    y += 9;
  });

  // partnering / contact card near the bottom
  const cardW = PW - 2 * (M + 50);
  const by = PH - 150;
  panel(doc, M + 50, by, cardW, 66, C.card);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...C.gold);
  doc.text("Interested in partnering?", cx, by + 22, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.mut);
  doc.text("We welcome impact investors, NGOs, government partners, and Web3 infrastructure providers.", cx, by + 39, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.ink);
  doc.text("contact@shetoken.org", cx, by + 56, { align: "center" });

  pageFooter(doc, "© 2026 SHE Foundation · Informational only — not financial advice.", "shetoken.org");
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
