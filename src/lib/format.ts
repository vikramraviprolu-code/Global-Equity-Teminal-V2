export function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPct(n: number | null | undefined, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  const s = n.toFixed(digits);
  return `${n > 0 ? "+" : ""}${s}%`;
}

const CCY_SYMBOL: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", HKD: "HK$",
  INR: "₹", KRW: "₩", TWD: "NT$", AUD: "A$", SGD: "S$", CHF: "CHF ",
  SEK: "kr ", NOK: "kr ", DKK: "kr ",
};

export function ccySym(c?: string | null): string {
  if (!c) return "$";
  return CCY_SYMBOL[c.toUpperCase()] ?? `${c} `;
}

export function fmtPrice(n: number | null | undefined, currency?: string | null, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  // JPY/KRW typically have no fractional digits
  const c = (currency ?? "").toUpperCase();
  const d = c === "JPY" || c === "KRW" ? 0 : digits;
  return `${ccySym(currency)}${n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

export function fmtMcap(n: number | null | undefined, currency?: string | null): string {
  if (n == null) return "—";
  const sym = ccySym(currency);
  if (n >= 1e12) return `${sym}${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${sym}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${sym}${(n / 1e6).toFixed(2)}M`;
  return `${sym}${n.toLocaleString()}`;
}

export function fmtMcapUsd(n: number | null | undefined): string {
  return fmtMcap(n, "USD");
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
