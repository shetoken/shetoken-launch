/**
 * Deploy-time guard (Track A2): fail the build if any prerendered route output
 * contains a banned string. Runs after prerender, over every dist/**.html.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");

const BANNED = [
  "most comprehensive women's empowerment index ever published",
  "the only one that prices",
  "When the index rises, $SHE rises",
  "updated weekly",
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

const files = walk(DIST);
const hits = [];
for (const f of files) {
  const html = readFileSync(f, "utf8");
  for (const b of BANNED) if (html.includes(b)) hits.push(`  ${f.replace(DIST, "dist")}  →  "${b}"`);
}

if (hits.length) {
  console.error(`\n[check-banned] BUILD FAILED — ${hits.length} banned string(s) in route output:\n${hits.join("\n")}\n`);
  process.exit(1);
}
console.log(`[check-banned] OK — scanned ${files.length} html files, no banned strings.`);
