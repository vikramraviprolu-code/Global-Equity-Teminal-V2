// Lightweight provenance wrapper. Avoids invasive type rewrite by treating
// SourcedValue as derivable metadata for any ScreenerRow/AnalyzedTarget field.

import type { ScreenerRow } from "@/server/finimpulse.server";

export type Provenance = {
  source: string;
  retrievedAt: string;
  confidence: "high" | "medium" | "low";
  note?: string;
};

export type SourcedValue<T> = {
  value: T | null;
  provenance: Provenance;
};

/**
 * Field-level provenance map. Keys correspond to ScreenerRow numeric fields.
 * Different fields have different upstream origins and confidence levels.
 */
type FieldKey =
  | "price" | "marketCap" | "marketCapUsd" | "avgVolume"
  | "pe" | "pb" | "dividendYield"
  | "high52" | "low52" | "pctFromLow" | "pctFromHigh"
  | "perf5d" | "rsi14" | "roc14" | "roc21"
  | "ma20" | "ma50" | "ma200";

const FIELD_ORIGIN: Record<FieldKey, { upstream: string; derived?: boolean; confidence: "high" | "medium" | "low" }> = {
  price:         { upstream: "Finimpulse /search · regular_market_price", confidence: "high" },
  marketCap:     { upstream: "Finimpulse /search · amount", confidence: "high" },
  marketCapUsd:  { upstream: "Finimpulse /search · amount_usd (FX-normalized)", confidence: "high" },
  avgVolume:     { upstream: "Finimpulse /search · avg_daily_volume_3m", confidence: "high" },
  pe:            { upstream: "Finimpulse /summary · trailing_pe", confidence: "medium" },
  pb:            { upstream: "Finimpulse /summary · price_to_book", confidence: "medium" },
  dividendYield: { upstream: "Finimpulse /summary · dividend_yield", confidence: "medium" },
  high52:        { upstream: "Finimpulse /search · fifty_two_week_high", confidence: "high" },
  low52:         { upstream: "Finimpulse /search · fifty_two_week_low", confidence: "high" },
  pctFromLow:    { upstream: "Derived from price & 52W low", derived: true, confidence: "high" },
  pctFromHigh:   { upstream: "Derived from price & 52W high", derived: true, confidence: "high" },
  perf5d:        { upstream: "Derived: ROC(5) on /histories closes", derived: true, confidence: "high" },
  rsi14:         { upstream: "Derived: RSI(14) on /histories closes", derived: true, confidence: "high" },
  roc14:         { upstream: "Derived: ROC(14) on /histories closes", derived: true, confidence: "high" },
  roc21:         { upstream: "Derived: ROC(21) on /histories closes", derived: true, confidence: "high" },
  ma20:          { upstream: "Derived: SMA(20) on /histories closes", derived: true, confidence: "high" },
  ma50:          { upstream: "Finimpulse fifty_day_average (or derived SMA50)", confidence: "high" },
  ma200:         { upstream: "Finimpulse two_hundred_day_average (or derived SMA200)", confidence: "high" },
};

export function provenanceFor(row: { isMock: boolean; source: string; retrievedAt: string; closes?: number[] }, field: FieldKey, value: number | null): Provenance {
  const meta = FIELD_ORIGIN[field];
  if (row.isMock) {
    return {
      source: "Mock demo data (deterministic per-symbol)",
      retrievedAt: row.retrievedAt,
      confidence: "low",
      note: "Live API unavailable — pseudo-random values shown for demo.",
    };
  }
  if (value == null) {
    return {
      source: meta.upstream,
      retrievedAt: row.retrievedAt,
      confidence: "low",
      note: "Field unavailable from upstream provider.",
    };
  }
  // Derived metrics need enough history to be trustworthy.
  if (meta.derived && row.closes && row.closes.length < 30) {
    return {
      source: meta.upstream,
      retrievedAt: row.retrievedAt,
      confidence: "medium",
      note: `Computed from only ${row.closes.length} closes — limited history.`,
    };
  }
  return {
    source: meta.upstream,
    retrievedAt: row.retrievedAt,
    confidence: meta.confidence,
  };
}

export function sourced<T extends number | null>(row: ScreenerRow, field: FieldKey): SourcedValue<T> {
  const value = (row as any)[field] as T;
  return { value, provenance: provenanceFor(row, field, value as number | null) };
}

export function confidenceColor(c: Provenance["confidence"]): string {
  if (c === "high") return "text-[color:var(--bull)]";
  if (c === "medium") return "text-primary";
  return "text-[color:var(--bear)]";
}

export function confidenceDot(c: Provenance["confidence"]): string {
  if (c === "high") return "bg-[color:var(--bull)]";
  if (c === "medium") return "bg-primary";
  return "bg-[color:var(--bear)]";
}
