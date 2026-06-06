/**
 * SHEconomy — risk-free paper-trading simulator.
 * Pure logic: assets, price engine, portfolio ops, the SHE-Bot agent, persistence.
 * No real money. $SHE price is simulated (anchored to the global SHE Score); BTC/ETH are
 * seeded from live CoinGecko prices then random-walk for a live feel.
 */

export type AssetId = "SHE" | "BTC" | "ETH";

export interface Asset { id: AssetId; name: string; ticker: string; color: string; sim: boolean; }

export const ASSETS: Asset[] = [
  { id: "SHE", name: "SHEcoin",  ticker: "$SHE", color: "#f59e0b", sim: true },
  { id: "BTC", name: "Bitcoin",  ticker: "BTC",  color: "#f7931a", sim: false },
  { id: "ETH", name: "Ethereum", ticker: "ETH",  color: "#627eea", sim: false },
];

export type Prices = Record<AssetId, number>;
export type History = Record<AssetId, number[]>;

export interface Portfolio { cash: number; holdings: Record<AssetId, number>; }

export const START_CASH = 10_000;
export const newPortfolio = (): Portfolio => ({ cash: START_CASH, holdings: { SHE: 0, BTC: 0, ETH: 0 } });

export const holdingsValue = (p: Portfolio, prices: Prices) =>
  ASSETS.reduce((s, a) => s + p.holdings[a.id] * (prices[a.id] || 0), 0);

export const portfolioValue = (p: Portfolio, prices: Prices) => p.cash + holdingsValue(p, prices);

export function buy(p: Portfolio, id: AssetId, usd: number, prices: Prices): Portfolio {
  const px = prices[id];
  if (!px || usd <= 0 || usd > p.cash + 1e-9) return p;
  return { cash: p.cash - usd, holdings: { ...p.holdings, [id]: p.holdings[id] + usd / px } };
}

export function sellQty(p: Portfolio, id: AssetId, qty: number, prices: Prices): Portfolio {
  const px = prices[id];
  if (!px || qty <= 0 || qty > p.holdings[id] + 1e-9) return p;
  return { cash: p.cash + qty * px, holdings: { ...p.holdings, [id]: Math.max(0, p.holdings[id] - qty) } };
}

// ── Price engine ────────────────────────────────────────────────────────────
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** $SHE: random walk with a small upward drift when the world's SHE Score is above 50. */
export function stepSHE(price: number, globalWEI: number): number {
  const drift = 0.0006 * ((globalWEI - 50) / 10);
  return Math.max(0.01, price * (1 + drift + randn() * 0.013));
}

/** BTC/ETH between live syncs: gentle random walk so the tape moves. */
export function jitter(price: number, vol = 0.0035): number {
  return Math.max(0.01, price * (1 + randn() * vol));
}

export const DEFAULT_PRICES: Prices = { SHE: 1.0, BTC: 70000, ETH: 2000 };

// ── SHE-Bot — transparent, beatable momentum agent with a women-empowerment tilt ─
const LOOKBACK = 8;

function momentum(id: AssetId, hist: History): number {
  const h = hist[id];
  if (!h || h.length < LOOKBACK + 1) return 0;
  return h[h.length - 1] / h[h.length - 1 - LOOKBACK] - 1;
}

/**
 * Each decision the bot nudges 25% toward a target allocation: weight ∝ positive
 * recent momentum (+ a small $SHE bias = "the women's-empowerment thesis"); if
 * nothing has momentum it sits in cash. Deterministic given prices — and beatable.
 */
export function agentStep(bot: Portfolio, prices: Prices, hist: History): Portfolio {
  const bias: Record<AssetId, number> = { SHE: 0.02, BTC: 0, ETH: 0 };
  const raw = ASSETS.map((a) => Math.max(0, momentum(a.id, hist) + bias[a.id]));
  const sum = raw.reduce((s, x) => s + x, 0);
  const total = portfolioValue(bot, prices);
  const invest = sum > 0 ? 0.85 : 0; // keep 15% cash buffer when invested

  let np: Portfolio = { cash: bot.cash, holdings: { ...bot.holdings } };
  ASSETS.forEach((a, i) => {
    const targetUsd = sum > 0 ? (raw[i] / sum) * invest * total : 0;
    const curUsd = np.holdings[a.id] * prices[a.id];
    const deltaUsd = (targetUsd - curUsd) * 0.25;
    if (deltaUsd > 1) np = buy(np, a.id, Math.min(deltaUsd, np.cash), prices);
    else if (deltaUsd < -1) np = sellQty(np, a.id, Math.min(np.holdings[a.id], -deltaUsd / prices[a.id]), prices);
  });
  return np;
}

// ── Persistence ──────────────────────────────────────────────────────────────
const KEY = "sheconomy_v1";

export interface SavedState {
  prices: Prices;
  history: History;
  user: Portfolio;
  bot: Portfolio;
  tick: number;
}

export function loadState(): SavedState | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
export function saveState(s: SavedState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ }
}
export function clearState() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

/** Fetch live BTC/ETH from CoinGecko (best-effort; returns null on failure). */
export async function fetchLivePrices(): Promise<Partial<Prices> | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      { signal: AbortSignal.timeout(8000) }
    );
    const j = await res.json();
    const out: Partial<Prices> = {};
    if (j.bitcoin?.usd) out.BTC = j.bitcoin.usd;
    if (j.ethereum?.usd) out.ETH = j.ethereum.usd;
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
