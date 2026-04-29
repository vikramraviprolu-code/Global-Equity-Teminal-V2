import { useMemo, useState } from "react";

type Props = {
  closes: number[];
  ma20?: number | null;
  ma50?: number | null;
  ma200?: number | null;
  high52?: number | null;
  low52?: number | null;
  rsi?: number | null;
  currency?: string | null;
  height?: number;
};

/**
 * Lightweight SVG line chart with overlays for MAs and 52w bands, plus a small RSI gauge.
 * Designed for the Stock Analysis "Chart" tab without adding a charting dependency.
 */
export function PriceChart({ closes, ma20, ma50, ma200, high52, low52, rsi, height = 280 }: Props) {
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);
  const [showMA200, setShowMA200] = useState(true);
  const [showBands, setShowBands] = useState(true);

  const W = 800, H = height, P = 28;
  const data = useMemo(() => closes.filter((n) => typeof n === "number"), [closes]);

  if (!data.length) {
    return (
      <div className="panel p-10 text-center">
        <div className="font-mono text-xs text-muted-foreground">No historical price data available.</div>
      </div>
    );
  }

  const min = Math.min(...data, ...(showBands && low52 ? [low52] : []));
  const max = Math.max(...data, ...(showBands && high52 ? [high52] : []));
  const pad = (max - min) * 0.05 || 1;
  const yMin = min - pad, yMax = max + pad;
  const x = (i: number) => P + (i / (data.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - yMin) / (yMax - yMin)) * (H - 2 * P);
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const areaPath = `${path} L${x(data.length - 1).toFixed(1)},${(H - P).toFixed(1)} L${x(0).toFixed(1)},${(H - P).toFixed(1)} Z`;

  const yTicks = 5;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / yTicks);

  const rsiVal = rsi ?? null;
  const rsiColor = rsiVal == null ? "var(--muted-foreground)" : rsiVal > 70 ? "var(--bear)" : rsiVal < 30 ? "var(--bull)" : "var(--primary)";

  return (
    <div className="panel">
      <div className="panel-header flex items-center gap-3 flex-wrap">
        <span>Price Chart · {data.length} sessions</span>
        <div className="ml-auto flex items-center gap-3 text-[10px] font-mono">
          <Toggle on={showMA20} setOn={setShowMA20} color="var(--cyan)" label="MA20" />
          <Toggle on={showMA50} setOn={setShowMA50} color="var(--primary)" label="MA50" />
          <Toggle on={showMA200} setOn={setShowMA200} color="var(--bear)" label="MA200" />
          <Toggle on={showBands} setOn={setShowBands} color="var(--bull)" label="52W Range" />
        </div>
      </div>
      <div className="p-3 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block">
          {/* y-axis grid + labels */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={P} x2={W - P} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="2 4" strokeWidth={0.5} />
              <text x={4} y={y(t) + 3} fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted-foreground)">
                {t >= 1000 ? t.toFixed(0) : t.toFixed(2)}
              </text>
            </g>
          ))}

          {/* 52W bands */}
          {showBands && high52 != null && (
            <line x1={P} x2={W - P} y1={y(high52)} y2={y(high52)} stroke="var(--bull)" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
          )}
          {showBands && low52 != null && (
            <line x1={P} x2={W - P} y1={y(low52)} y2={y(low52)} stroke="var(--bear)" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
          )}

          {/* MA lines (flat overlays since we only have last value) */}
          {showMA20 && ma20 != null && <line x1={P} x2={W - P} y1={y(ma20)} y2={y(ma20)} stroke="var(--cyan)" strokeWidth={1.2} opacity={0.7} />}
          {showMA50 && ma50 != null && <line x1={P} x2={W - P} y1={y(ma50)} y2={y(ma50)} stroke="var(--primary)" strokeWidth={1.2} opacity={0.7} />}
          {showMA200 && ma200 != null && <line x1={P} x2={W - P} y1={y(ma200)} y2={y(ma200)} stroke="var(--bear)" strokeWidth={1.2} opacity={0.7} />}

          {/* Price area + line */}
          <path d={areaPath} fill="var(--primary)" opacity={0.08} />
          <path d={path} fill="none" stroke="var(--primary)" strokeWidth={1.6} />
        </svg>

        {/* RSI gauge */}
        <div className="mt-4 flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span>RSI 14:</span>
          <div className="flex-1 h-2 bg-muted rounded relative overflow-hidden">
            <div className="absolute inset-y-0" style={{ left: "30%", width: "40%", background: "color-mix(in oklab, var(--primary) 20%, transparent)" }} />
            {rsiVal != null && (
              <div
                className="absolute top-0 bottom-0 w-1 rounded"
                style={{ left: `${Math.max(0, Math.min(100, rsiVal))}%`, background: rsiColor }}
              />
            )}
          </div>
          <span style={{ color: rsiColor }}>{rsiVal != null ? rsiVal.toFixed(1) : "—"}</span>
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, setOn, color, label }: { on: boolean; setOn: (b: boolean) => void; color: string; label: string }) {
  return (
    <button
      onClick={() => setOn(!on)}
      className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
        on ? "border-border text-foreground" : "border-border/50 text-muted-foreground/60 line-through"
      }`}
    >
      <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
      {label}
    </button>
  );
}
