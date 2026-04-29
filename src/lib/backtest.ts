// Historical performance + simple MA-cross backtest, computed client-side
// from the daily closes returned by /server/analyze.ts (last ~260 trading days).

const TRADING_DAYS_PER_YEAR = 252;

export type HistoricalReturns = {
  windows: { label: string; days: number; returnPct: number | null }[];
  startPrice: number | null;
  endPrice: number | null;
  observations: number;
};

export function computeHistoricalReturns(closes: number[]): HistoricalReturns {
  const n = closes.length;
  const last = n ? closes[n - 1] : null;
  const windows = [
    { label: "1M", days: 21 },
    { label: "3M", days: 63 },
    { label: "6M", days: 126 },
    { label: "1Y", days: 252 },
  ].map((w) => {
    if (last == null || n <= w.days) return { ...w, returnPct: null };
    const past = closes[n - 1 - w.days];
    if (!past) return { ...w, returnPct: null };
    return { ...w, returnPct: ((last - past) / past) * 100 };
  });
  return {
    windows,
    startPrice: n ? closes[0] : null,
    endPrice: last,
    observations: n,
  };
}

function sma(closes: number[], period: number, idx: number): number | null {
  if (idx < period - 1) return null;
  let s = 0;
  for (let i = idx - period + 1; i <= idx; i++) s += closes[i];
  return s / period;
}

export type Trade = {
  entryIdx: number;
  exitIdx: number;
  entryPrice: number;
  exitPrice: number;
  returnPct: number;
  bars: number;
};

export type BacktestResult = {
  strategy: "MA50/MA200 cross" | "Buy & Hold";
  trades: Trade[];
  totalReturnPct: number | null;
  annualizedReturnPct: number | null;
  maxDrawdownPct: number | null;
  winRatePct: number | null;
  avgTradeReturnPct: number | null;
  exposurePct: number | null; // % of bars in market
  observations: number;
  insufficientData: boolean;
  buyHoldReturnPct: number | null;
  buyHoldAnnualizedPct: number | null;
  buyHoldMaxDrawdownPct: number | null;
};

function maxDrawdown(equity: number[]): number | null {
  if (!equity.length) return null;
  let peak = equity[0];
  let maxDd = 0;
  for (const v of equity) {
    if (v > peak) peak = v;
    const dd = (v - peak) / peak;
    if (dd < maxDd) maxDd = dd;
  }
  return maxDd * 100; // negative pct
}

/** Long-only: enter when MA(short) crosses above MA(long), exit on cross-down. */
export function backtestMaCross(
  closes: number[],
  shortP = 50,
  longP = 200,
): BacktestResult {
  const n = closes.length;
  const insufficient = n < longP + 10;

  // Buy & Hold reference
  const bhReturn = n >= 2 && closes[0] > 0 ? ((closes[n - 1] - closes[0]) / closes[0]) * 100 : null;
  const bhYears = n / TRADING_DAYS_PER_YEAR;
  const bhAnn =
    bhReturn != null && bhYears > 0
      ? (Math.pow(1 + bhReturn / 100, 1 / bhYears) - 1) * 100
      : null;
  const bhEquity = closes.length ? closes.map((c) => c / closes[0]) : [];
  const bhMaxDd = maxDrawdown(bhEquity);

  if (insufficient) {
    return {
      strategy: "MA50/MA200 cross",
      trades: [],
      totalReturnPct: null,
      annualizedReturnPct: null,
      maxDrawdownPct: null,
      winRatePct: null,
      avgTradeReturnPct: null,
      exposurePct: null,
      observations: n,
      insufficientData: true,
      buyHoldReturnPct: bhReturn,
      buyHoldAnnualizedPct: bhAnn,
      buyHoldMaxDrawdownPct: bhMaxDd,
    };
  }

  const trades: Trade[] = [];
  let inPosition = false;
  let entryIdx = -1;
  let entryPrice = 0;
  let barsInMarket = 0;
  // Equity curve: $1 starting; multiply through trade returns at exit, hold flat in cash otherwise.
  let equity = 1;
  const equityCurve: number[] = [];
  let prevShort: number | null = null;
  let prevLong: number | null = null;

  for (let i = longP - 1; i < n; i++) {
    const s = sma(closes, shortP, i);
    const l = sma(closes, longP, i);
    if (s == null || l == null) {
      equityCurve.push(equity);
      continue;
    }
    // Detect cross using prior values
    if (prevShort != null && prevLong != null) {
      const crossUp = prevShort <= prevLong && s > l;
      const crossDown = prevShort >= prevLong && s < l;
      if (!inPosition && crossUp) {
        inPosition = true;
        entryIdx = i;
        entryPrice = closes[i];
      } else if (inPosition && crossDown) {
        const exitPrice = closes[i];
        const ret = ((exitPrice - entryPrice) / entryPrice) * 100;
        trades.push({
          entryIdx,
          exitIdx: i,
          entryPrice,
          exitPrice,
          returnPct: ret,
          bars: i - entryIdx,
        });
        equity *= 1 + ret / 100;
        inPosition = false;
      }
    }
    if (inPosition) {
      barsInMarket++;
      const markToMarket = equity * (closes[i] / entryPrice);
      equityCurve.push(markToMarket);
    } else {
      equityCurve.push(equity);
    }
    prevShort = s;
    prevLong = l;
  }

  // Close any open trade at last bar (for stats)
  if (inPosition) {
    const exitPrice = closes[n - 1];
    const ret = ((exitPrice - entryPrice) / entryPrice) * 100;
    trades.push({
      entryIdx,
      exitIdx: n - 1,
      entryPrice,
      exitPrice,
      returnPct: ret,
      bars: n - 1 - entryIdx,
    });
    equity *= 1 + ret / 100;
  }

  const totalReturn = (equity - 1) * 100;
  const years = (n - longP) / TRADING_DAYS_PER_YEAR;
  const annualized = years > 0 ? (Math.pow(equity, 1 / years) - 1) * 100 : null;
  const wins = trades.filter((t) => t.returnPct > 0).length;
  const winRate = trades.length ? (wins / trades.length) * 100 : null;
  const avgTrade = trades.length
    ? trades.reduce((a, t) => a + t.returnPct, 0) / trades.length
    : null;
  const dd = maxDrawdown(equityCurve);
  const exposure = ((barsInMarket / Math.max(1, n - longP + 1)) * 100);

  return {
    strategy: "MA50/MA200 cross",
    trades,
    totalReturnPct: totalReturn,
    annualizedReturnPct: annualized,
    maxDrawdownPct: dd,
    winRatePct: winRate,
    avgTradeReturnPct: avgTrade,
    exposurePct: exposure,
    observations: n,
    insufficientData: false,
    buyHoldReturnPct: bhReturn,
    buyHoldAnnualizedPct: bhAnn,
    buyHoldMaxDrawdownPct: bhMaxDd,
  };
}
