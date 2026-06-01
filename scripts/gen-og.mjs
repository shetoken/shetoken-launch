/**
 * One-off generator for public/og-image.png (1200×630 social card).
 * Run locally: `node scripts/gen-og.mjs` (needs @resvg/resvg-js as a devDep).
 * The PNG is committed, so the build itself does not depend on this.
 * Spec 4 (the "SHE Note") will replace the artwork later.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#15101f"/>
      <stop offset="1" stop-color="#241634"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f59e0b"/>
      <stop offset="1" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="8" fill="url(#gold)"/>
  <circle cx="1040" cy="150" r="220" fill="#f59e0b" opacity="0.06"/>
  <circle cx="160" cy="520" r="180" fill="#a855f7" opacity="0.06"/>

  <text x="80" y="170" font-family="Georgia, serif" font-size="34" fill="#cbb9e8">SHEtoken</text>
  <text x="80" y="280" font-family="Helvetica, Arial, sans-serif" font-size="78" font-weight="700" fill="#f6f1fb">Women's Empowerment</text>
  <text x="80" y="362" font-family="Helvetica, Arial, sans-serif" font-size="78" font-weight="700" fill="url(#gold)">Index</text>

  <text x="80" y="442" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#b6a9cf">A data-backed score for women in 105 countries.</text>
  <text x="80" y="486" font-family="Georgia, serif" font-size="26" font-style="italic" fill="#8a7da8">“She was always the currency. We just never measured it.”</text>

  <g font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#9b8fbb">
    <text x="80" y="566">UN Women · World Bank · WHO · UNODC · UNESCO · ILO</text>
  </g>
  <text x="1120" y="566" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#f59e0b">shetoken.org</text>
</svg>`;

const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
const out = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "og-image.png");
writeFileSync(out, png);
console.log(`[og] wrote ${png.length} bytes → public/og-image.png`);
