import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { fetchUniverse } from "@/server/screen.functions";
import { scoreAll } from "@/lib/scores";
import { fmtNum, fmtPct, fmtMcapUsd, fmtPriceDisplay, fmtVol, colorFor } from "@/lib/format";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { SiteNav, Disclaimer } from "@/components/site-nav";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip as RTooltip } from "recharts";

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>) => z.object({ s: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Compare Stocks — Global Equity Terminal v2" },
      { name: "description", content: "Side-by-side comparison of global stocks: valuation, momentum, quality, risk, and data confidence." },
      { property: "og:title", content: "Compare Stocks — Global Equity Terminal v2" },
      { property: "og:description", content: "Side-by-side comparison of global stocks: valuation, momentum, quality, risk, and data confidence." },
    ],
    links: [{ rel: "canonical", href: "https://rankaisolutions.tech/compare" }],
  }),
  component: ComparePage,
});

function ComparePage() {
  const navigate = useNavigate();
  const [ccyMode] = useDisplayCurrency();
  const { s: initial } = Route.useSearch();
  const initialSyms = useMemo(() => (initial ? initial.split(",").map((x: string) => x.trim()).filter(Boolean) : []), [initial]);

  const [picked, setPicked] = useState<string[]>(initialSyms);
  const [add, setAdd] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["universe"],
    queryFn: () => fetchUniverse({ data: {} }),
    staleTime: 5 * 60 * 1000,
  });

  const scored = useMemo(() => (data?.rows ? scoreAll(data.rows) : []), [data]);
  const symbolMap = useMemo(() => new Map(scored.map((r) => [r.symbol.toUpperCase(), r])), [scored]);
  const rows = useMemo(() => picked.map((s) => symbolMap.get(s.toUpperCase())).filter(Boolean) as ReturnType<typeof scoreAll>, [picked, symbolMap]);

  const updateUrl = (next: string[]) => {
    setPicked(next);
    navigate({ to: "/compare", search: { s: next.join(",") || undefined } as any, replace: true });
  };

  const onAdd = (sym: string) => {
    const u = sym.toUpperCase().trim();
    if (!u || picked.map((p) => p.toUpperCase()).includes(u)) return;
    if (!symbolMap.has(u)) return;
    if (picked.length >= 6) return;
    updateUrl([...picked, u]);
    setAdd("");
  };
  const onRemove = (sym: string) => updateUrl(picked.filter((p) => p.toUpperCase() !== sym.toUpperCase()));

  // best/worst highlight for numeric metrics (higher better unless noted)
  const winners = useMemo(() => {
    const m: Record<string, { best?: string; worst?: string }> = {};
    if (rows.length < 2) return m;
    const numeric: Array<[string, (r: any) => number | null, "high" | "low"]> = [
      ["pe", (r) => (r.pe ?? null), "low"],
      ["perf5d", (r) => r.perf5d, "high"],
      ["rsi14", (r) => r.rsi14, "high"],
      ["pctFromLow", (r) => r.pctFromLow, "low"],
      ["marketCapUsd", (r) => r.marketCapUsd, "high"],
      ["value", (r) => r.scores.value, "high"],
      ["momentum", (r) => r.scores.momentum, "high"],
      ["quality", (r) => r.scores.quality, "high"],
      ["risk", (r) => r.scores.risk, "low"],
      ["confidence", (r) => r.scores.confidence, "high"],
    ];
    for (const [k, get, dir] of numeric) {
      let best: string | undefined, worst: string | undefined, bv = -Infinity, wv = Infinity;
      for (const r of rows) {
        const v = get(r);
        if (v == null || !isFinite(v)) continue;
        const score = dir === "high" ? v : -v;
        if (score > bv) { bv = score; best = r.symbol; }
        if (score < wv) { wv = score; worst = r.symbol; }
      }
      m[k] = { best, worst };
    }
    return m;
  }, [rows]);

  const hl = (k: string, sym: string) => {
    const w = winners[k];
    if (!w) return "";
    if (w.best === sym) return "text-[color:var(--bull)] font-semibold";
    if (w.worst === sym && rows.length > 2) return "text-[color:var(--bear)]";
    return "";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-[1400px] mx-auto px-4 py-6 w-full">
        <h1 className="text-xl font-semibold tracking-tight">Compare Stocks</h1>
        <p className="text-xs text-muted-foreground mt-1">Side-by-side metric and score comparison. Add up to 6 tickers from the curated universe.</p>

        <div className="panel mt-4 p-3 flex flex-wrap items-center gap-2">
          <input
            value={add}
            onChange={(e) => setAdd(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onAdd(add); }}
            placeholder="Add ticker (e.g. AAPL, RELIANCE.NS, 7203.T)"
            className="bg-input border border-border rounded px-2 py-1 text-xs font-mono w-72 focus:border-primary outline-none"
          />
          <button onClick={() => onAdd(add)} className="font-mono text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90">
            Add
          </button>
          <span className="text-[10px] font-mono text-muted-foreground ml-2">
            {picked.length}/6 selected · symbols must be in the curated universe
          </span>
          {picked.length > 0 && (
            <button onClick={() => updateUrl([])} className="ml-auto font-mono text-[10px] uppercase tracking-wider border border-border px-3 py-1.5 rounded hover:border-destructive hover:text-destructive">
              Clear all
            </button>
          )}
        </div>

        {isLoading && <div className="panel p-10 text-center mt-4 font-mono text-sm text-primary animate-pulse">LOADING UNIVERSE…</div>}

        {!isLoading && rows.length === 0 && (
          <div className="panel p-10 text-center mt-4">
            <div className="font-mono text-sm text-muted-foreground">Pick stocks from the screener or watchlists to compare.</div>
            <Link to="/" className="inline-block mt-4 font-mono text-[10px] uppercase tracking-wider border border-primary/50 text-primary px-4 py-2 rounded hover:bg-primary/10">
              Open Screener
            </Link>
          </div>
        )}

        {rows.length > 0 && <RadarPanel rows={rows} />}

        {rows.length > 0 && (
          <div className="panel overflow-x-auto mt-4">
            <table className="term">
              <thead>
                <tr>
                  <th className="text-left">Metric</th>
                  {rows.map((r) => (
                    <th key={r.symbol} className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to="/terminal/$symbol" params={{ symbol: r.symbol }} className="text-primary hover:underline">{r.symbol}</Link>
                        <button onClick={() => onRemove(r.symbol)} className="text-muted-foreground hover:text-destructive font-mono text-[10px]">✕</button>
                      </div>
                      <div className="font-normal text-[10px] text-muted-foreground normal-case tracking-normal mt-0.5">{r.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Section label="Identity" />
                <Row label="Region">{rows.map((r) => <Cell key={r.symbol}>{r.region}</Cell>)}</Row>
                <Row label="Sector">{rows.map((r) => <Cell key={r.symbol} muted>{r.sector}</Cell>)}</Row>
                <Row label="Industry">{rows.map((r) => <Cell key={r.symbol} muted>{r.industry}</Cell>)}</Row>
                <Row label="Currency">{rows.map((r) => <Cell key={r.symbol}>{r.currency}</Cell>)}</Row>

                <Section label="Valuation & Size" />
                <Row label="Price">{rows.map((r) => <Cell key={r.symbol} num>{fmtPriceDisplay(r.price, r.currency, r.marketCap, r.marketCapUsd, ccyMode)}</Cell>)}</Row>
                <Row label="Mcap (USD)">{rows.map((r) => <Cell key={r.symbol} num cls={hl("marketCapUsd", r.symbol)}>{fmtMcapUsd(r.marketCapUsd)}</Cell>)}</Row>
                <Row label="P/E (lower better)">{rows.map((r) => <Cell key={r.symbol} num cls={hl("pe", r.symbol)}>{fmtNum(r.pe, 1)}</Cell>)}</Row>
                <Row label="% from 52W low">{rows.map((r) => <Cell key={r.symbol} num cls={hl("pctFromLow", r.symbol)}>{fmtPct(r.pctFromLow)}</Cell>)}</Row>
                <Row label="Avg Daily Volume">{rows.map((r) => <Cell key={r.symbol} num>{fmtVol(r.avgVolume)}</Cell>)}</Row>

                <Section label="Momentum" />
                <Row label="5D %">{rows.map((r) => <Cell key={r.symbol} num cls={`${colorFor(r.perf5d)} ${hl("perf5d", r.symbol)}`}>{fmtPct(r.perf5d)}</Cell>)}</Row>
                <Row label="ROC 14">{rows.map((r) => <Cell key={r.symbol} num cls={colorFor(r.roc14)}>{fmtPct(r.roc14)}</Cell>)}</Row>
                <Row label="ROC 21">{rows.map((r) => <Cell key={r.symbol} num cls={colorFor(r.roc21)}>{fmtPct(r.roc21)}</Cell>)}</Row>
                <Row label="RSI 14">{rows.map((r) => <Cell key={r.symbol} num>{fmtNum(r.rsi14, 0)}</Cell>)}</Row>
                <Row label="vs 200D MA">{rows.map((r) => (
                  <Cell key={r.symbol} num cls={r.price && r.ma200 ? (r.price > r.ma200 ? "text-[color:var(--bull)]" : "text-[color:var(--bear)]") : ""}>
                    {r.price && r.ma200 ? (r.price > r.ma200 ? "Above" : "Below") : "—"}
                  </Cell>
                ))}</Row>

                <Section label="Composite Scores" />
                <Row label="Value">{rows.map((r) => <Cell key={r.symbol} num cls={hl("value", r.symbol)}>{r.scores.value}</Cell>)}</Row>
                <Row label="Momentum">{rows.map((r) => <Cell key={r.symbol} num cls={hl("momentum", r.symbol)}>{r.scores.momentum}</Cell>)}</Row>
                <Row label="Quality">{rows.map((r) => <Cell key={r.symbol} num cls={hl("quality", r.symbol)}>{r.scores.quality}</Cell>)}</Row>
                <Row label="Risk (lower better)">{rows.map((r) => <Cell key={r.symbol} num cls={hl("risk", r.symbol)}>{r.scores.risk}</Cell>)}</Row>
                <Row label="Data Confidence">{rows.map((r) => (
                  <Cell key={r.symbol} num cls={hl("confidence", r.symbol)}>
                    {r.scores.confidence}{r.isMock && <span className="text-[9px] text-primary ml-1">mock</span>}
                  </Cell>
                ))}</Row>

                <Section label="Source" />
                <Row label="Data Source">{rows.map((r) => <Cell key={r.symbol} muted>{r.source}</Cell>)}</Row>
                <Row label="Retrieved">{rows.map((r) => <Cell key={r.symbol} muted>{new Date(r.retrievedAt).toLocaleTimeString()}</Cell>)}</Row>
              </tbody>
            </table>
          </div>
        )}

        <Disclaimer />
      </main>
    </div>
  );
}

function Section({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={20} className="bg-muted/40 text-[10px] font-mono uppercase tracking-widest text-primary py-1.5">{label}</td>
    </tr>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="text-muted-foreground">{label}</td>
      {children}
    </tr>
  );
}
function Cell({ children, num = false, muted = false, cls = "" }: { children: React.ReactNode; num?: boolean; muted?: boolean; cls?: string }) {
  return (
    <td className={`${num ? "num text-right" : ""} ${muted ? "text-muted-foreground" : ""} ${cls}`}>{children}</td>
  );
}

// Distinct hues from the design tokens — cycled for up to 6 series.
const SERIES_COLORS = [
  "hsl(var(--primary))",
  "var(--bull)",
  "var(--bear)",
  "#a855f7",
  "#06b6d4",
  "#f59e0b",
];

function RadarPanel({ rows }: { rows: ReturnType<typeof scoreAll> }) {
  // Normalize all 5 axes to 0-100. "Risk" is inverted so "outer = better" everywhere.
  const data = [
    { axis: "Value", ...Object.fromEntries(rows.map((r) => [r.symbol, r.scores.value])) },
    { axis: "Momentum", ...Object.fromEntries(rows.map((r) => [r.symbol, r.scores.momentum])) },
    { axis: "Quality", ...Object.fromEntries(rows.map((r) => [r.symbol, r.scores.quality])) },
    { axis: "Safety", ...Object.fromEntries(rows.map((r) => [r.symbol, 100 - r.scores.risk])) },
    { axis: "Confidence", ...Object.fromEntries(rows.map((r) => [r.symbol, r.scores.confidence])) },
  ];
  return (
    <div className="panel mt-4">
      <div className="panel-header flex items-center justify-between">
        <span>Score Radar · Normalized 0–100</span>
        <span className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
          Larger area = stronger overall profile · Risk is shown as Safety (100 − Risk)
        </span>
      </div>
      <div className="p-4" style={{ height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="78%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "monospace" }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} stroke="hsl(var(--border))" />
            {rows.map((r, i) => (
              <Radar
                key={r.symbol}
                name={r.symbol}
                dataKey={r.symbol}
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            ))}
            <RTooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "monospace",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
