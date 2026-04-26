import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FMP = "https://financialmodelingprep.com/api/v3";
const STABLE = "https://financialmodelingprep.com/stable";

function key() {
  const k = process.env.FMP_API_KEY;
  if (!k) throw new Error("FMP_API_KEY not configured");
  return k;
}

async function fmp<T = any>(url: string): Promise<T | null> {
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${sep}apikey=${key()}`);
  if (!res.ok) return null;
  try { return (await res.json()) as T; } catch { return null; }
}

// ---------- indicators ----------
function sma(vals: number[], period: number): number | null {
  if (vals.length < period) return null;
  const slice = vals.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgG = gains / period;
  let avgL = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
  }
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

function roc(closes: number[], period: number): number | null {
  if (closes.length < period + 1) return null;
  const cur = closes[closes.length - 1];
  const past = closes[closes.length - 1 - period];
  if (!past) return null;
  return ((cur - past) / past) * 100;
}

function pctPerf(closes: number[], days: number): number | null {
  if (closes.length < days + 1) return null;
  const cur = closes[closes.length - 1];
  const past = closes[closes.length - 1 - days];
  if (!past) return null;
  return ((cur - past) / past) * 100;
}

// ---------- types ----------
export type StockMetrics = {
  symbol: string;
  companyName: string;
  sector: string | null;
  industry: string | null;
  price: number | null;
  marketCap: number | null;
  avgVolume: number | null;
  pe: number | null;
  high52: number | null;
  low52: number | null;
  pctFromLow: number | null;
  perf5d: number | null;
  rsi14: number | null;
  roc14: number | null;
  roc21: number | null;
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
  earningsDate: string | null;
  dataMissing: string[];
};

const GLOBAL = { minPrice: 5, minVolume: 500_000, minMcap: 2_000_000_000 };

function passesGlobal(m: StockMetrics): boolean {
  return (m.price ?? 0) >= GLOBAL.minPrice
    && (m.avgVolume ?? 0) >= GLOBAL.minVolume
    && (m.marketCap ?? 0) >= GLOBAL.minMcap;
}

function passesValue(m: StockMetrics): boolean {
  if (!passesGlobal(m)) return false;
  if (m.pctFromLow == null || m.pctFromLow > 10) return false;
  if (m.pe == null || m.pe <= 0 || m.pe > 10) return false;
  return true;
}

async function fetchMetrics(symbol: string): Promise<StockMetrics | null> {
  const sym = symbol.toUpperCase();
  const [profileArr, quoteArr, historyResp] = await Promise.all([
    fmp<any[]>(`${FMP}/profile/${sym}`),
    fmp<any[]>(`${FMP}/quote/${sym}`),
    fmp<any>(`${FMP}/historical-price-full/${sym}?serietype=line&timeseries=260`),
  ]);
  const profile = profileArr?.[0];
  const quote = quoteArr?.[0];
  if (!profile && !quote) return null;

  const histRaw: { date: string; close: number }[] = historyResp?.historical ?? [];
  // FMP returns newest first → reverse to chronological
  const hist = [...histRaw].reverse();
  const closes = hist.map(h => h.close).filter(n => typeof n === "number");

  const price = quote?.price ?? profile?.price ?? null;
  const high52 = quote?.yearHigh ?? null;
  const low52 = quote?.yearLow ?? null;
  const pctFromLow = price && low52 ? ((price - low52) / low52) * 100 : null;

  const missing: string[] = [];
  if (!closes.length) missing.push("price history");
  if (price == null) missing.push("price");
  if (quote?.pe == null) missing.push("P/E");

  return {
    symbol: sym,
    companyName: profile?.companyName ?? quote?.name ?? sym,
    sector: profile?.sector ?? null,
    industry: profile?.industry ?? null,
    price,
    marketCap: quote?.marketCap ?? profile?.mktCap ?? null,
    avgVolume: quote?.avgVolume ?? profile?.volAvg ?? null,
    pe: quote?.pe ?? null,
    high52,
    low52,
    pctFromLow,
    perf5d: pctPerf(closes, 5),
    rsi14: rsi(closes, 14),
    roc14: roc(closes, 14),
    roc21: roc(closes, 21),
    ma20: sma(closes, 20),
    ma50: sma(closes, 50),
    ma200: sma(closes, 200),
    earningsDate: quote?.earningsAnnouncement ?? null,
    dataMissing: missing,
  };
}

// ---------- peers ----------
async function fetchPeers(symbol: string): Promise<string[]> {
  // try v4 stock_peers
  const res = await fetch(`https://financialmodelingprep.com/api/v4/stock_peers?symbol=${symbol}&apikey=${key()}`);
  if (res.ok) {
    try {
      const data = await res.json();
      const arr = data?.[0]?.peersList;
      if (Array.isArray(arr) && arr.length) return arr.slice(0, 25);
    } catch {}
  }
  return [];
}

async function fetchSectorPeers(sector: string | null, industry: string | null, exclude: string): Promise<string[]> {
  if (!industry && !sector) return [];
  // use stock-screener
  const params = new URLSearchParams({
    marketCapMoreThan: String(GLOBAL.minMcap),
    volumeMoreThan: String(GLOBAL.minVolume),
    priceMoreThan: String(GLOBAL.minPrice),
    isEtf: "false",
    isFund: "false",
    isActivelyTrading: "true",
    country: "US",
    limit: "40",
  });
  if (industry) params.set("industry", industry);
  else if (sector) params.set("sector", sector);
  const data = await fmp<any[]>(`${FMP}/stock-screener?${params.toString()}`);
  if (!Array.isArray(data)) return [];
  return data.map(d => d.symbol).filter(s => s && s !== exclude).slice(0, 25);
}

// ---------- scoring ----------
function classifyMomentum(m: StockMetrics): { signal: string; outlook: string; confidence: string; reason: string } {
  const above20 = m.price != null && m.ma20 != null && m.price > m.ma20;
  const above50 = m.price != null && m.ma50 != null && m.price > m.ma50;
  const above200 = m.price != null && m.ma200 != null && m.price > m.ma200;
  const r = m.rsi14 ?? 50;
  const roc14p = (m.roc14 ?? 0) > 0;
  const roc21p = (m.roc21 ?? 0) > 0;
  const perfp = (m.perf5d ?? 0) > 0;

  let signal = "Mixed signal";
  if (perfp && roc14p && roc21p && r < 70 && above20 && above50) signal = "Momentum continuation";
  else if (perfp && (r > 70 || (m.roc14 ?? 0) < (m.roc21 ?? 0))) signal = "Potential reversal";

  // outlook
  let bullScore = 0;
  if (perfp) bullScore++;
  if (roc14p) bullScore++;
  if (roc21p) bullScore++;
  if (above20) bullScore++;
  if (above50) bullScore++;
  if (above200) bullScore++;
  if (r >= 40 && r <= 70) bullScore++;
  if (r > 70) bullScore--;
  if (r < 30) bullScore--;

  let outlook = "Neutral";
  if (bullScore >= 5) outlook = "Bullish";
  else if (bullScore <= 2) outlook = "Bearish";

  let confidence = "Medium";
  const confluence = [perfp, roc14p, roc21p, above20, above50, above200].filter(Boolean).length;
  if (confluence >= 5 && r < 75) confidence = "High";
  else if (confluence <= 2) confidence = "Low";
  if (m.dataMissing.length) confidence = "Low";

  const reason = `RSI ${r.toFixed(0)}, 5D ${(m.perf5d ?? 0).toFixed(1)}%, ${[above20 ? "↑20D" : "↓20D", above50 ? "↑50D" : "↓50D", above200 ? "↑200D" : "↓200D"].join(" ")}.`;
  return { signal, outlook, confidence, reason };
}

function rsiLabel(r: number | null): string {
  if (r == null) return "N/A";
  if (r > 70) return "Overbought";
  if (r < 30) return "Oversold";
  return "Neutral";
}

function valueScore(m: StockMetrics): number {
  let s = 0;
  if (m.pctFromLow != null && m.pctFromLow <= 10) s++;
  if (m.pe != null && m.pe > 0 && m.pe <= 10) s++;
  if ((m.marketCap ?? 0) >= GLOBAL.minMcap) s++;
  return s;
}

function momentumScore(m: StockMetrics): { score: number; penalties: number } {
  let s = 0, p = 0;
  if ((m.perf5d ?? 0) > 0) s++;
  if ((m.roc14 ?? 0) > 0) s++;
  if ((m.roc21 ?? 0) > 0) s++;
  if (m.rsi14 != null && m.rsi14 >= 40 && m.rsi14 <= 70) s++;
  if (m.price != null && m.ma20 != null && m.price > m.ma20) s++;
  if (m.price != null && m.ma50 != null && m.price > m.ma50) s++;
  if (m.price != null && m.ma200 != null && m.price > m.ma200) s++;
  if ((m.rsi14 ?? 0) > 70) p++;
  if (m.price != null && m.ma200 != null && m.price < m.ma200) p++;
  if ((m.roc14 ?? 0) < 0 && (m.roc21 ?? 0) < 0) p++;
  return { score: s, penalties: p };
}

function buildRecommendation(m: StockMetrics) {
  const v = valueScore(m);
  const mom = momentumScore(m);
  const net = v + mom.score - mom.penalties;
  let rec: "Buy" | "Watch" | "Avoid" = "Watch";
  if (net >= 7 && mom.penalties <= 1) rec = "Buy";
  else if (net <= 2 || !passesGlobal(m)) rec = "Avoid";
  let confidence: "Low" | "Medium" | "High" = "Medium";
  if (m.dataMissing.length) confidence = "Low";
  else if (Math.abs(net - 5) >= 3) confidence = "High";
  const horizon = mom.score >= v ? "Short-term" : "Medium-term";
  return { rec, confidence, horizon, valueScore: v, momentumScore: mom.score, penalties: mom.penalties, net };
}

// ---------- main server fn ----------
export const analyzeTicker = createServerFn({ method: "POST" })
  .inputValidator(z.object({ ticker: z.string().min(1).max(10).regex(/^[A-Za-z.\-]+$/) }))
  .handler(async ({ data }) => {
    const symbol = data.ticker.toUpperCase().trim();
    const target = await fetchMetrics(symbol);
    if (!target) {
      return { error: "Ticker not found or no data available. Please verify it's a valid US-listed symbol." } as const;
    }

    // peers
    let peerSymbols = await fetchPeers(symbol);
    if (peerSymbols.length < 5) {
      const extra = await fetchSectorPeers(target.sector, target.industry, symbol);
      peerSymbols = Array.from(new Set([...peerSymbols, ...extra])).slice(0, 25);
    }
    peerSymbols = peerSymbols.filter(s => s !== symbol);

    const peerResults = await Promise.all(peerSymbols.map(s => fetchMetrics(s).catch(() => null)));
    const peers = peerResults.filter((x): x is StockMetrics => x !== null);

    // value screen (peers + target check)
    const valueQualifiers = peers.filter(passesValue);
    const targetPassesValue = passesValue(target);

    // momentum: rank by 5d perf among peers passing global filter
    const momentumPool = peers.filter(passesGlobal).filter(p => p.perf5d != null);
    momentumPool.sort((a, b) => (b.perf5d ?? 0) - (a.perf5d ?? 0));
    const momentumTop = momentumPool.slice(0, 10).map(m => ({
      ...m,
      ...classifyMomentum(m),
      rsiLabel: rsiLabel(m.rsi14),
    }));

    // overlap
    const valueSet = new Set(valueQualifiers.map(v => v.symbol));
    const momSet = new Set(momentumTop.map(v => v.symbol));
    const overlap = [...valueSet].filter(s => momSet.has(s));

    // target classification + recommendation
    const targetMomentum = classifyMomentum(target);
    const targetRec = buildRecommendation(target);

    return {
      target: {
        ...target,
        ...targetMomentum,
        rsiLabel: rsiLabel(target.rsi14),
        passesGlobal: passesGlobal(target),
        passesValue: targetPassesValue,
        recommendation: targetRec,
      },
      peers,
      valueQualifiers,
      momentumTop,
      overlap,
      filters: GLOBAL,
    } as const;
  });
