import { useMemo } from "react";
import type { ScoredRow } from "@/lib/scores";
import { fmtMcapUsd, fmtPct } from "@/lib/format";
import { Link } from "@tanstack/react-router";

type Metric = "perf5d" | "roc14" | "rsi14" | "value" | "momentum" | "quality";

const METRIC_LABEL: Record<Metric, string> = {
  perf5d: "5D %",
  roc14: "ROC14 %",
  rsi14: "RSI",
  value: "Value Score",
  momentum: "Momentum Score",
  quality: "Quality Score",
};

function getMetric(r: ScoredRow, m: Metric): number | null {
  switch (m) {
    case "perf5d": return r.perf5d ?? null;
    case "roc14": return r.roc14 ?? null;
    case "rsi14": return r.rsi14 ?? null;
    case "value": return r.scores.value;
    case "momentum": return r.scores.momentum;
    case "quality": return r.scores.quality;
  }
}

// Diverging color scale: red → neutral → green
function colorFor(v: number | null, m: Metric): string {
  if (v == null) return "hsl(var(--muted) / 0.3)";
  let pct = 0; // -1..1
  if (m === "rsi14") {
    // 50 = neutral; >70 overbought (red), <30 oversold (green-ish? we treat as opportunity = green)
    pct = (50 - v) / 50; // <30 -> +0.4 (greenish), >70 -> -0.4 (red)
  } else if (m === "value" || m === "momentum" || m === "quality") {
    pct = (v - 50) / 50; // 0..100 → -1..1
  } else {
    // perf %: clamp at ±10%
    pct = Math.max(-1, Math.min(1, v / 10));
  }
  if (pct >= 0) {
    const a = 0.15 + Math.min(0.65, pct * 0.65);
    return `color-mix(in oklab, var(--bull) ${Math.round(a * 100)}%, transparent)`;
  } else {
    const a = 0.15 + Math.min(0.65, -pct * 0.65);
    return `color-mix(in oklab, var(--bear) ${Math.round(a * 100)}%, transparent)`;
  }
}

export function SectorHeatmap({
  rows,
  metric,
  onMetric,
}: {
  rows: ScoredRow[];
  metric: Metric;
  onMetric: (m: Metric) => void;
}) {
  const groups = useMemo(() => {
    const bySector = new Map<string, ScoredRow[]>();
    for (const r of rows) {
      const k = r.sector || "Unknown";
      if (!bySector.has(k)) bySector.set(k, []);
      bySector.get(k)!.push(r);
    }
    // sort sectors by total mcap; within sector by mcap desc
    const arr = [...bySector.entries()].map(([sector, list]) => {
      const total = list.reduce((s, r) => s + (r.marketCapUsd ?? 0), 0);
      list.sort((a, b) => (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0));
      return { sector, list, total };
    });
    arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Color by:</span>
        {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => onMetric(m)}
            className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded border ${
              metric === m
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {METRIC_LABEL[m]}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span>Bear</span>
          <div className="h-2 w-32 rounded" style={{ background: "linear-gradient(90deg, var(--bear), transparent 50%, var(--bull))" }} />
          <span>Bull</span>
        </div>
      </div>
      {groups.map(({ sector, list, total }) => (
        <div key={sector} className="panel p-3">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-mono text-xs uppercase tracking-wider text-foreground">{sector}</h3>
            <div className="text-[10px] font-mono text-muted-foreground">
              {list.length} stocks · {fmtMcapUsd(total)}
            </div>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
            {list.map((r) => {
              const v = getMetric(r, metric);
              return (
                <Link
                  key={r.symbol}
                  to="/terminal/$symbol"
                  params={{ symbol: r.symbol }}
                  className="block rounded p-2 border border-border/50 hover:border-primary transition-colors"
                  style={{ backgroundColor: colorFor(v, metric) }}
                  title={`${r.name} · ${METRIC_LABEL[metric]}: ${v == null ? "—" : v.toFixed(2)}`}
                >
                  <div className="font-mono text-xs text-foreground truncate">{r.symbol}</div>
                  <div className="font-mono text-[10px] text-muted-foreground truncate">{r.name}</div>
                  <div className="font-mono text-[11px] mt-1 text-foreground">
                    {v == null ? "—" : metric === "perf5d" || metric === "roc14" ? fmtPct(v) : v.toFixed(0)}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      {groups.length === 0 && (
        <div className="panel p-10 text-center font-mono text-sm text-muted-foreground">No data to display.</div>
      )}
    </div>
  );
}
