export function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPct(n: number | null | undefined, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  const s = n.toFixed(digits);
  return `${n > 0 ? "+" : ""}${s}%`;
}

export function fmtMcap(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export function fmtVol(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

export function colorFor(n: number | null | undefined): string {
  if (n == null) return "text-muted-foreground";
  if (n > 0) return "text-[color:var(--bull)]";
  if (n < 0) return "text-[color:var(--bear)]";
  return "text-foreground";
}

export function trendArrow(n: number | null | undefined): string {
  if (n == null) return "→";
  if (n > 0.5) return "↑";
  if (n < -0.5) return "↓";
  return "→";
}

export function vsMA(price: number | null, ma: number | null): { label: string; cls: string } {
  if (price == null || ma == null) return { label: "N/A", cls: "text-muted-foreground" };
  const above = price > ma;
  return { label: above ? "Above" : "Below", cls: above ? "text-[color:var(--bull)]" : "text-[color:var(--bear)]" };
}
