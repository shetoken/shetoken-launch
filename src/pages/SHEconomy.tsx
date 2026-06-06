import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SEO } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import {
  ASSETS, type AssetId, type Prices, type History, type Portfolio,
  newPortfolio, portfolioValue, holdingsValue, buy, sellQty, stepSHE, jitter,
  agentStep, loadState, saveState, clearState, fetchLivePrices, DEFAULT_PRICES, START_CASH,
} from "@/lib/sheconomy";
import { TrendingUp, TrendingDown, RotateCcw, Bot, Wallet, Coins, Info } from "lucide-react";

const TICK_MS = 2500;
const HIST_CAP = 80;
const fmtUsd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 4 : 0 });
const fmtBig = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/* tiny inline sparkline */
function Spark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div style={{ height: 28 }} />;
  const w = 120, h = 28;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * h}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} strokeOpacity={up ? 1 : 0.6} />
    </svg>
  );
}

export default function SHEconomy() {
  const { data: summary } = useQuery({ queryKey: ["summary"], queryFn: api.summary, staleTime: 5 * 60 * 1000 });
  const globalWEI = summary?.global_wei_score ?? 53.8;
  const weiRef = useRef(globalWEI);
  weiRef.current = globalWEI;

  const [prices, setPrices] = useState<Prices>({ ...DEFAULT_PRICES });
  const [history, setHistory] = useState<History>({ SHE: [], BTC: [], ETH: [] });
  const [user, setUser] = useState<Portfolio>(newPortfolio());
  const [bot, setBot] = useState<Portfolio>(newPortfolio());
  const [tick, setTick] = useState(0);
  const [sel, setSel] = useState<AssetId>("SHE");
  const [amount, setAmount] = useState(500);
  const cryptoBase = useRef<Prices>({ ...DEFAULT_PRICES });
  const restored = useRef(false);

  // Restore saved state + seed live crypto once
  useEffect(() => {
    const s = loadState();
    if (s) {
      setPrices(s.prices); setHistory(s.history); setUser(s.user); setBot(s.bot); setTick(s.tick);
      cryptoBase.current = { ...s.prices };
    }
    restored.current = true;
    fetchLivePrices().then((live) => {
      if (!live) return;
      cryptoBase.current = { ...cryptoBase.current, ...live };
      setPrices((p) => ({ ...p, ...(live.BTC ? { BTC: live.BTC } : {}), ...(live.ETH ? { ETH: live.ETH } : {}) }));
    });
    const sync = setInterval(() => {
      fetchLivePrices().then((live) => { if (live) cryptoBase.current = { ...cryptoBase.current, ...live }; });
    }, 120_000);
    return () => clearInterval(sync);
  }, []);

  // Price + agent tick
  useEffect(() => {
    const id = setInterval(() => {
      setPrices((prev) => {
        const next: Prices = {
          SHE: stepSHE(prev.SHE, weiRef.current),
          BTC: jitter(prev.BTC * 0.5 + cryptoBase.current.BTC * 0.5),
          ETH: jitter(prev.ETH * 0.5 + cryptoBase.current.ETH * 0.5),
        };
        setHistory((h) => {
          const nh: History = {
            SHE: [...h.SHE, next.SHE].slice(-HIST_CAP),
            BTC: [...h.BTC, next.BTC].slice(-HIST_CAP),
            ETH: [...h.ETH, next.ETH].slice(-HIST_CAP),
          };
          setTick((t) => {
            const nt = t + 1;
            if (nt % 3 === 0) setBot((b) => agentStep(b, next, nh)); // bot decides every 3 ticks
            setUser((u) => { saveState({ prices: next, history: nh, user: u, bot, tick: nt }); return u; });
            return nt;
          });
          return nh;
        });
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userVal = portfolioValue(user, prices);
  const botVal = portfolioValue(bot, prices);
  const userPnl = userVal - START_CASH;
  const botPnl = botVal - START_CASH;
  const leading = userVal >= botVal;

  const doBuy = () => setUser((u) => buy(u, sel, Math.min(amount, u.cash), prices));
  const doSellUsd = () => setUser((u) => {
    const qty = Math.min(u.holdings[sel], amount / prices[sel]);
    return sellQty(u, sel, qty, prices);
  });
  const reset = () => { clearState(); setUser(newPortfolio()); setBot(newPortfolio()); };

  const selAsset = ASSETS.find((a) => a.id === sel)!;
  const selPx = prices[sel];
  const selHoldUsd = user.holdings[sel] * selPx;

  const Pnl = ({ v }: { v: number }) => (
    <span className={v >= 0 ? "text-emerald-400" : "text-red-400"}>
      {v >= 0 ? "+" : ""}{fmtBig(v)} ({((v / START_CASH) * 100).toFixed(1)}%)
    </span>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="$SHE Simulator — Risk-Free Crypto Trading Simulator"
        description="Practice investing in crypto risk-free with the $SHE Simulator. Trade $SHE, Bitcoin and Ethereum with virtual money and compete against SHE-Bot. A financial-literacy game from SHEtoken."
        url="https://www.shetoken.org/simulator"
      />
      <Nav />
      <main className="pt-24 pb-20 container max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs mb-3">
            <Coins className="h-3 w-3" /> $SHE Simulator · Practice Trading Floor
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Learn to invest — risk-free.</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Trade $SHE, Bitcoin and Ethereum with <strong>virtual</strong> money and see if you can beat
            <strong> SHE-Bot</strong>. $SHE's price rises when the world's SHE Score improves.
            This is a learning game — <em>not financial advice</em>, no real money.
          </p>
        </div>

        {/* You vs SHE-Bot scoreboard */}
        <section className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className={`rounded-2xl border p-5 shadow-card ${leading ? "border-emerald-400/40 bg-emerald-400/5" : "border-border/40 bg-gradient-card"}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> You</span>
              {leading && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/15 px-2 py-0.5 rounded-full">LEADING</span>}
            </div>
            <div className="text-3xl font-bold">{fmtBig(userVal)}</div>
            <div className="text-sm mt-0.5"><Pnl v={userPnl} /></div>
          </div>
          <div className={`rounded-2xl border p-5 shadow-card ${!leading ? "border-cyan-400/40 bg-cyan-400/5" : "border-border/40 bg-gradient-card"}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Bot className="h-3.5 w-3.5" /> SHE-Bot</span>
              {!leading && <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/15 px-2 py-0.5 rounded-full">LEADING</span>}
            </div>
            <div className="text-3xl font-bold">{fmtBig(botVal)}</div>
            <div className="text-sm mt-0.5"><Pnl v={botPnl} /></div>
          </div>
        </section>

        {/* Markets */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Markets</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {ASSETS.map((a) => {
              const px = prices[a.id];
              const h = history[a.id];
              const chg = h.length > 1 ? (px / h[0] - 1) * 100 : 0;
              return (
                <button
                  key={a.id}
                  onClick={() => setSel(a.id)}
                  className={`text-left rounded-2xl border p-4 shadow-card transition-all hover:scale-[1.01] ${sel === a.id ? "ring-2" : ""}`}
                  style={{ borderColor: `${a.color}40`, ...(sel === a.id ? { boxShadow: `0 0 0 2px ${a.color}` } : {}) }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold" style={{ color: a.color }}>{a.ticker}</span>
                    {a.sim && <span className="text-[9px] text-muted-foreground border border-border/40 rounded px-1">SIM</span>}
                  </div>
                  <div className="text-xl font-bold tabular-nums">{fmtUsd(px)}</div>
                  <div className={`text-xs flex items-center gap-1 ${chg >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {chg >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {chg >= 0 ? "+" : ""}{chg.toFixed(2)}% this session
                  </div>
                  <div className="mt-2"><Spark data={h} color={a.color} /></div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Trade ticket + holdings */}
        <section className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
            <h3 className="text-sm font-semibold mb-3">Trade {selAsset.ticker}</h3>
            <div className="flex items-center gap-2 mb-3">
              {ASSETS.map((a) => (
                <button key={a.id} onClick={() => setSel(a.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${sel === a.id ? "text-background" : "text-muted-foreground"}`}
                  style={sel === a.id ? { background: a.color, borderColor: a.color } : { borderColor: "hsl(260 15% 25%)" }}>
                  {a.ticker}
                </button>
              ))}
            </div>
            <label className="text-xs text-muted-foreground">Amount (USD)</label>
            <div className="flex items-center gap-2 mt-1 mb-3">
              {[100, 500, 1000].map((v) => (
                <button key={v} onClick={() => setAmount(v)}
                  className={`px-2 py-1 rounded text-xs border ${amount === v ? "border-accent text-accent" : "border-border/40 text-muted-foreground"}`}>
                  ${v}
                </button>
              ))}
              <input type="number" min={0} value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="flex-1 bg-card/40 border border-border/40 rounded px-2 py-1 text-sm tabular-nums" />
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              ≈ {(amount / selPx).toLocaleString("en-US", { maximumFractionDigits: 6 })} {selAsset.ticker}
              {" · "}You hold {user.holdings[sel].toLocaleString("en-US", { maximumFractionDigits: 4 })} ({fmtBig(selHoldUsd)})
            </div>
            <div className="flex gap-2">
              <button onClick={doBuy} disabled={amount <= 0 || amount > user.cash}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
                Buy
              </button>
              <button onClick={doSellUsd} disabled={selHoldUsd < 1}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
                Sell
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-gradient-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Your portfolio</h3>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
            <div className="flex justify-between text-sm mb-2 pb-2 border-b border-border/30">
              <span className="text-muted-foreground">Cash</span><span className="tabular-nums">{fmtBig(user.cash)}</span>
            </div>
            <div className="space-y-1.5">
              {ASSETS.filter((a) => user.holdings[a.id] > 1e-6).map((a) => (
                <div key={a.id} className="flex justify-between text-sm">
                  <span style={{ color: a.color }}>{a.ticker}</span>
                  <span className="tabular-nums">
                    {user.holdings[a.id].toLocaleString("en-US", { maximumFractionDigits: 4 })}
                    <span className="text-muted-foreground"> · {fmtBig(user.holdings[a.id] * prices[a.id])}</span>
                  </span>
                </div>
              ))}
              {holdingsValue(user, prices) < 1 && <p className="text-xs text-muted-foreground/60">No positions yet — buy something above.</p>}
            </div>
            <div className="flex justify-between text-sm mt-3 pt-2 border-t border-border/30 font-semibold">
              <span>Total value</span><span className="tabular-nums">{fmtBig(userVal)}</span>
            </div>
          </div>
        </section>

        <p className="text-[11px] text-muted-foreground/50 flex items-start gap-1.5">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          SHEconomy is an educational simulation. $SHE is a simulated price anchored to the global SHE Score ({globalWEI.toFixed(1)});
          BTC/ETH start from live CoinGecko prices. No real money, no real trades, not financial advice.
        </p>
      </main>
    </div>
  );
}
