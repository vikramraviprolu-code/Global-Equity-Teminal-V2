import type { ScoredRow } from "@/lib/scores";

const CSV_COLUMNS: { key: string; label: string; get: (r: ScoredRow) => string | number | null | undefined }[] = [
  { key: "symbol", label: "Symbol", get: (r) => r.symbol },
  { key: "name", label: "Name", get: (r) => r.name },
  { key: "region", label: "Region", get: (r) => r.region },
  { key: "sector", label: "Sector", get: (r) => r.sector },
  { key: "currency", label: "Currency", get: (r) => r.currency },
  { key: "price", label: "Price", get: (r) => r.price },
  { key: "marketCapUsd", label: "MarketCapUSD", get: (r) => r.marketCapUsd },
  { key: "pe", label: "PE", get: (r) => r.pe },
  { key: "pb", label: "PB", get: (r) => r.pb },
  { key: "dividendYield", label: "DividendYield%", get: (r) => r.dividendYield },
  { key: "rsi14", label: "RSI14", get: (r) => r.rsi14 },
  { key: "perf5d", label: "Perf5D%", get: (r) => r.perf5d },
  { key: "roc14", label: "ROC14%", get: (r) => r.roc14 },
  { key: "roc21", label: "ROC21%", get: (r) => r.roc21 },
  { key: "ma20", label: "MA20", get: (r) => r.ma20 },
  { key: "ma50", label: "MA50", get: (r) => r.ma50 },
  { key: "ma200", label: "MA200", get: (r) => r.ma200 },
  { key: "pctFromLow", label: "PctFrom52WLow", get: (r) => r.pctFromLow },
  { key: "pctFromHigh", label: "PctFrom52WHigh", get: (r) => r.pctFromHigh },
  { key: "value", label: "ValueScore", get: (r) => r.scores.value },
  { key: "momentum", label: "MomentumScore", get: (r) => r.scores.momentum },
  { key: "quality", label: "QualityScore", get: (r) => r.scores.quality },
  { key: "risk", label: "RiskScore", get: (r) => r.scores.risk },
  { key: "confidence", label: "Confidence", get: (r) => r.scores.confidence },
  { key: "isMock", label: "IsMock", get: (r) => (r.isMock ? "true" : "false") },
];

function escape(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = typeof v === "number" ? (Number.isFinite(v) ? String(v) : "") : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: ScoredRow[]): string {
  const header = CSV_COLUMNS.map((c) => c.label).join(",");
  const lines = rows.map((r) => CSV_COLUMNS.map((c) => escape(c.get(r) as any)).join(","));
  return [header, ...lines].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportRowsCsv(rows: ScoredRow[], filename = "screener-export.csv") {
  downloadCsv(filename, rowsToCsv(rows));
}

/**
 * Capture a DOM node as PNG using SVG foreignObject. Pure-browser, no deps.
 */
export async function exportNodeAsPng(node: HTMLElement, filename = "snapshot.png") {
  const rect = node.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);

  // Inline computed styles by cloning. We rely on existing CSS variables on :root.
  const clone = node.cloneNode(true) as HTMLElement;
  // Wrap with current computed background so the snapshot looks themed.
  const bg = getComputedStyle(document.body).backgroundColor || "#0a0a0a";
  const fg = getComputedStyle(document.body).color || "#fff";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="background:${bg};color:${fg};width:${width}px;height:${height}px;font-family:ui-sans-serif,system-ui,sans-serif;">
      ${new XMLSerializer().serializeToString(clone)}
    </div>
  </foreignObject>
</svg>`.trim();

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });

    const scale = window.devicePixelRatio || 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);

    const png = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = png;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}
