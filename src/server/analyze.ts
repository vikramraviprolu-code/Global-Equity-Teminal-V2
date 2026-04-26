import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FI_BASE = "https://api.finimpulse.com/v1";

function key() {
  const k = process.env.FINIMPULSE_API_KEY;
  if (!k) throw new Error("FINIMPULSE_API_KEY not configured");
  return k;
}

async function fi<T = any>(path: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${FI_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key()}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    // FinImpulse wraps payload in `result` (and uses status_code 20000 for success)
    if (json && typeof json === "object" && "result" in json) return json.result as T;
    return json as T;
  } catch {
    return null;
  }
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

function isoDateBack(daysBack: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

async function fetchHistoryCloses(symbol: string): Promise<number[]> {
  // pull ~400 calendar days to reliably get 200+ trading days
  const result = await fi<any>("/histories", {
    symbol,
    types: ["historical_price"],
    interval: "1d",
    start_date: isoDateBack(400),
    end_date: isoDateBack(0),
    sort_by: [{ selector: "date", desc: false }],
  });
  const items: any[] = result?.items ?? [];
  // Filter to historical_price rows; some feeds embed type per-row
  const prices = items.filter((r) => !r.type || r.type === "historical_price");
  // Ensure chronological ascending
  prices.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return prices.map((r) => r.adj_close ?? r.close).filter((n) => typeof n === "number");
}

async function fetchSummary(symbol: string): Promise<any | null> {
  return fi<any>("/summary", { symbol });
}

async function fetchMetrics(symbol: string): Promise<StockMetrics | null> {
  const sym = symbol.toUpperCase();
  const [summary, closes] = await Promise.all([
    fetchSummary(sym),
    fetchHistoryCloses(sym).catch(() => [] as number[]),
  ]);
  if (!summary && !closes.length) return null;

  const price =
    summary?.current_price ??
    summary?.regular_market_price ??
    (closes.length ? closes[closes.length - 1] : null);
  const high52 = summary?.fifty_two_week_high ?? null;
  const low52 = summary?.fifty_two_week_low ?? null;
  const pctFromLow = price && low52 ? ((price - low52) / low52) * 100 : null;

  const ma50 = summary?.fifty_day_average ?? sma(closes, 50);
  const ma200 = summary?.two_hundred_day_average ?? sma(closes, 200);
  const ma20 = sma(closes, 20);

  const missing: string[] = [];
  if (!closes.length) missing.push("price history");
  if (price == null) missing.push("price");
  if (summary?.trailing_pe == null) missing.push("P/E");

  const longName: string | undefined =
    summary?.long_name ?? summary?.short_name ?? summary?.display_name;

  return {
    symbol: sym,
    companyName: longName ?? sym,
    sector: summary?.sector ?? null,
    industry: summary?.industry ?? null,
    price,
    marketCap: summary?.market_cap ?? null,
    avgVolume:
      summary?.average_volume ??
      summary?.average_volume_10days ??
      summary?.average_daily_volume_10_day ??
      null,
    pe: summary?.trailing_pe ?? null,
    high52,
    low52,
    pctFromLow,
    perf5d: pctPerf(closes, 5),
    rsi14: rsi(closes, 14),
    roc14: roc(closes, 14),
    roc21: roc(closes, 21),
    ma20,
    ma50,
    ma200,
    earningsDate: summary?.earnings_date ?? null,
    dataMissing: missing,
  };
}

// ---------- peers (via Search endpoint, filtered by industry/sector) ----------
async function fetchSectorPeers(
  sector: string | null,
  industry: string | null,
  exclude: string,
): Promise<string[]> {
  if (!industry && !sector) return [];
  const filters: any[] = ["quote_type", "eq", "stock"];
  // FinImpulse search supports filter expressions: [field, op, value] combined with and/or
  const targetField = industry ? "industry" : "sector";
  const targetVal = industry ?? sector;
  const combined = ["and", filters, [targetField, "eq", targetVal]];

  const result = await fi<any>("/search", {
    quote_types: ["stock"],
    filters: combined,
    sort_by: [{ selector: "amount_usd", desc: true }],
    limit: 40,
  });
  const items: any[] = result?.items ?? [];
  return items
    .map((d) => d.symbol)
    .filter((s: string) => s && s !== exclude)
    .slice(0, 25);
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

    const peerSymbols = (await fetchSectorPeers(target.sector, target.industry, symbol))
      .filter((s) => s !== symbol);

    const peerResults = await Promise.all(peerSymbols.map((s) => fetchMetrics(s).catch(() => null)));
    const peers = peerResults.filter((x): x is StockMetrics => x !== null);

    const valueQualifiers = peers.filter(passesValue);
    const targetPassesValue = passesValue(target);

    const momentumPool = peers.filter(passesGlobal).filter((p) => p.perf5d != null);
    momentumPool.sort((a, b) => (b.perf5d ?? 0) - (a.perf5d ?? 0));
    const momentumTop = momentumPool.slice(0, 10).map((m) => ({
      ...m,
      ...classifyMomentum(m),
      rsiLabel: rsiLabel(m.rsi14),
    }));

    const valueSet = new Set(valueQualifiers.map((v) => v.symbol));
    const momSet = new Set(momentumTop.map((v) => v.symbol));
    const overlap = [...valueSet].filter((s) => momSet.has(s));

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
