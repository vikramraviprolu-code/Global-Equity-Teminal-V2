import type { ScreenerRow } from "@/server/finimpulse.server";

export type Scores = {
  value: number;        // 0–100
  momentum: number;     // 0–100
  quality: number;      // 0–100
  risk: number;         // 0–100 (higher = riskier)
  confidence: number;   // 0–100
  valueLabel: string;
  momentumLabel: string;
  qualityLabel: string;
  riskLabel: string;
  confidenceLabel: string;
  valueReasons: string[];
  momentumReasons: string[];
  qualityReasons: string[];
  riskReasons: string[];
  confidenceReasons: string[];
};

function bucket(n: number): string {
  if (n >= 80) return "Excellent";
  if (n >= 65) return "Good";
  if (n >= 45) return "Mixed";
  if (n >= 30) return "Weak";
  return "Poor";
}
function confBucket(n: number): string {
  if (n >= 85) return "High";
  if (n >= 60) return "Medium";
  return "Low";
}
function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

export function scoreRow(r: ScreenerRow): Scores {
  // ---- value ----
  let v = 50;
  const vReasons: string[] = [];
  if (r.pe != null && r.pe > 0) {
    if (r.pe <= 10) { v += 18; vReasons.push(`P/E ${r.pe.toFixed(1)} ≤ 10 (cheap)`); }
    else if (r.pe <= 20) { v += 6; vReasons.push(`P/E ${r.pe.toFixed(1)} reasonable`); }
    else if (r.pe > 40) { v -= 12; vReasons.push(`P/E ${r.pe.toFixed(1)} elevated`); }
  } else {
    v -= 8; vReasons.push("P/E unavailable");
  }
  if (r.pctFromLow != null) {
    if (r.pctFromLow <= 10) { v += 18; vReasons.push(`Within ${r.pctFromLow.toFixed(1)}% of 52W low`); }
    else if (r.pctFromLow <= 25) { v += 6; vReasons.push(`Near 52W low (${r.pctFromLow.toFixed(0)}%)`); }
    else if (r.pctFromLow >= 80) { v -= 8; vReasons.push(`Far from 52W low (${r.pctFromLow.toFixed(0)}%)`); }
  }
  if ((r.marketCapUsd ?? 0) >= 10e9) { v += 4; vReasons.push("Large-cap liquidity"); }
  if (r.pb != null && r.pb > 0) {
    if (r.pb <= 1) { v += 10; vReasons.push(`P/B ${r.pb.toFixed(2)} ≤ 1 (book bargain)`); }
    else if (r.pb <= 3) { v += 4; vReasons.push(`P/B ${r.pb.toFixed(2)} reasonable`); }
    else if (r.pb > 8) { v -= 6; vReasons.push(`P/B ${r.pb.toFixed(2)} rich`); }
  }
  if (r.dividendYield != null && r.dividendYield > 0) {
    if (r.dividendYield >= 4) { v += 6; vReasons.push(`Dividend yield ${r.dividendYield.toFixed(2)}% (high)`); }
    else if (r.dividendYield >= 2) { v += 3; vReasons.push(`Dividend yield ${r.dividendYield.toFixed(2)}%`); }
  }

  // ---- momentum ----
  let m = 50;
  const mReasons: string[] = [];
  if ((r.perf5d ?? 0) > 0) { m += 8; mReasons.push(`5D +${r.perf5d!.toFixed(1)}%`); }
  else if ((r.perf5d ?? 0) < 0) { m -= 6; mReasons.push(`5D ${r.perf5d!.toFixed(1)}%`); }
  if ((r.roc14 ?? 0) > 0) { m += 7; mReasons.push("ROC14 positive"); }
  if ((r.roc21 ?? 0) > 0) { m += 7; mReasons.push("ROC21 positive"); }
  if ((r.roc14 ?? 0) < 0 && (r.roc21 ?? 0) < 0) { m -= 10; mReasons.push("Both ROC negative"); }
  if (r.rsi14 != null) {
    if (r.rsi14 >= 40 && r.rsi14 <= 70) { m += 8; mReasons.push(`RSI ${r.rsi14.toFixed(0)} healthy`); }
    else if (r.rsi14 > 70) { m -= 8; mReasons.push(`RSI ${r.rsi14.toFixed(0)} overbought`); }
    else if (r.rsi14 < 30) { m -= 4; mReasons.push(`RSI ${r.rsi14.toFixed(0)} oversold`); }
  }
  if (r.price != null && r.ma20 != null) {
    if (r.price > r.ma20) { m += 4; mReasons.push("Above 20D MA"); } else { m -= 3; }
  }
  if (r.price != null && r.ma50 != null) {
    if (r.price > r.ma50) { m += 5; mReasons.push("Above 50D MA"); } else { m -= 4; }
  }
  if (r.price != null && r.ma200 != null) {
    if (r.price > r.ma200) { m += 7; mReasons.push("Above 200D MA"); } else { m -= 8; mReasons.push("Below 200D MA"); }
  }
  // MA cross signals
  if (r.ma50 != null && r.ma200 != null) {
    if (r.ma50 > r.ma200) { m += 5; mReasons.push("Golden cross (50D > 200D MA)"); }
    else if (r.ma50 < r.ma200) { m -= 5; mReasons.push("Death cross (50D < 200D MA)"); }
  }
  if (r.ma20 != null && r.ma50 != null) {
    if (r.ma20 > r.ma50) { m += 3; mReasons.push("20D MA above 50D MA"); }
  }

  // ---- quality (verified-data only) ----
  let q = 50;
  const qReasons: string[] = [];
  if (r.pe != null && r.pe > 0) { q += 10; qReasons.push("Positive earnings"); }
  else { q -= 12; qReasons.push("No positive earnings disclosed"); }
  if ((r.marketCapUsd ?? 0) >= 50e9) { q += 18; qReasons.push("Mega-cap (>$50B)"); }
  else if ((r.marketCapUsd ?? 0) >= 10e9) { q += 10; qReasons.push("Large-cap (>$10B)"); }
  else if ((r.marketCapUsd ?? 0) >= 2e9) { q += 4; qReasons.push("Mid-cap"); }
  if ((r.avgVolume ?? 0) >= 1_000_000) { q += 6; qReasons.push("Liquid"); }
  if (r.sector && r.industry) { q += 4; qReasons.push("Stable sector classification"); }

  // ---- risk (higher = worse) ----
  let risk = 30;
  const riskReasons: string[] = [];
  if ((r.rsi14 ?? 0) > 75) { risk += 18; riskReasons.push("Overbought RSI"); }
  if (r.price != null && r.ma200 != null && r.price < r.ma200) { risk += 14; riskReasons.push("Below 200D MA"); }
  if ((r.avgVolume ?? 0) < 100_000) { risk += 12; riskReasons.push("Low liquidity"); }
  if (r.pe == null || r.pe <= 0) { risk += 10; riskReasons.push("Earnings unavailable"); }
  if (r.isMock) { risk += 10; riskReasons.push("Mock demo data"); }
  if (r.region !== "US") { risk += 4; riskReasons.push(`Currency risk (${r.currency})`); }

  // ---- confidence ----
  let c = r.isMock ? 30 : 80;
  const cReasons: string[] = [];
  cReasons.push(r.isMock ? "Mock demo data — not live" : `Source: ${r.source}`);
  let missing = 0;
  if (r.pe == null) missing++;
  if (r.high52 == null || r.low52 == null) missing++;
  if (r.ma200 == null) missing++;
  if (r.rsi14 == null) missing++;
  if (missing > 0) { c -= missing * 5; cReasons.push(`${missing} metric(s) unavailable`); }
  if (!r.isMock && r.closes.length >= 20) { c += 5; cReasons.push("Historical data available"); }

  v = clamp(v); m = clamp(m); q = clamp(q); risk = clamp(risk); c = clamp(c);
  return {
    value: v, momentum: m, quality: q, risk, confidence: c,
    valueLabel: bucket(v), momentumLabel: bucket(m), qualityLabel: bucket(q),
    riskLabel: risk >= 65 ? "High" : risk >= 40 ? "Medium" : "Low",
    confidenceLabel: confBucket(c),
    valueReasons: vReasons, momentumReasons: mReasons, qualityReasons: qReasons,
    riskReasons, confidenceReasons: cReasons,
  };
}

export type ScoredRow = ScreenerRow & { scores: Scores };
export function scoreAll(rows: ScreenerRow[]): ScoredRow[] {
  return rows.map((r) => ({ ...r, scores: scoreRow(r) }));
}
