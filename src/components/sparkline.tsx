/**
 * Tiny inline sparkline used across screener / watchlist / compare rows.
 * Color: bull if last >= first, bear otherwise. No axes, no tooltip.
 */
export function Sparkline({
  closes,
  width = 80,
  height = 22,
  className = "",
}: {
  closes: number[] | undefined | null;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (!closes || closes.length < 2) {
    return (
      <span
        className={`inline-block text-[9px] text-muted-foreground/60 font-mono ${className}`}
        style={{ width, height }}
        aria-hidden
      >
        —
      </span>
    );
  }
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const step = width / (closes.length - 1);
  const pts = closes
    .map((c, i) => `${(i * step).toFixed(1)},${(height - ((c - min) / range) * height).toFixed(1)}`)
    .join(" ");
  const up = closes[closes.length - 1] >= closes[0];
  const stroke = up ? "var(--bull)" : "var(--bear)";
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={`inline-block align-middle ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
