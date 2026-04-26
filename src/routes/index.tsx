import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { analyzeTicker } from "@/server/analyze";
import { fmtNum, fmtPct, fmtMcap, fmtVol, colorFor, trendArrow, vsMA } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Equity Terminal — Stock Analysis" },
      { name: "description", content: "Run value screening, momentum analysis, and an evidence-based recommendation on any US stock ticker." },
    ],
  }),
  component: TerminalPage,
});

type AnalysisResult = Awaited<ReturnType<typeof analyzeTicker>>;
type Success = Extract<AnalysisResult, { target: any }>;

function TerminalPage() {
  const [ticker, setTicker] = useState("");
  const [tab, setTab] = useState<"overview" | "value" | "momentum" | "cross" | "final">("overview");

  const mutation = useMutation({
    mutationFn: (t: string) => analyzeTicker({ data: { ticker: t } }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setTab("overview");
    mutation.mutate(t);
  };

  const data = mutation.data;
  const isError = data && "error" in data;
  const result = data && !("error" in data) ? data : null;

  return (
    <div className="min-h-screen">
      <Header ticker={ticker} setTicker={setTicker} onSubmit={onSubmit} loading={mutation.isPending} />

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {!data && !mutation.isPending && <EmptyState />}
        {mutation.isPending && <LoadingState ticker={ticker} />}
        {mutation.isError && <ErrorPanel message={(mutation.error as Error)?.message ?? "Request failed"} />}
        {isError && <ErrorPanel message={(data as any).error} />}

        {result && (
          <>
            <SnapshotBar r={result} />
            <Tabs tab={tab} setTab={setTab} />
            <div className="mt-4">
              {tab === "overview" && <OverviewSection r={result} />}
              {tab === "value" && <ValueSection r={result} />}
              {tab === "momentum" && <MomentumSection r={result} />}
              {tab === "cross" && <CrossSection r={result} />}
              {tab === "final" && <FinalSection r={result} />}
            </div>
            <Disclaimer />
          </>
        )}
      </main>
    </div>
  );
}

function Header({ ticker, setTicker, onSubmit, loading }: { ticker: string; setTicker: (s: string) => void; onSubmit: (e: React.FormEvent) => void; loading: boolean }) {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-sm" />
          <h1 className="font-mono text-sm tracking-widest text-primary">EQUITY&nbsp;TERMINAL</h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">v1.0 · FinImpulse</span>
        </div>
        <form onSubmit={onSubmit} className="flex items-center gap-2 flex-1 min-w-[280px] max-w-xl ml-auto">
          <div className="flex items-center gap-2 flex-1 bg-input border border-border rounded px-3 py-1.5 focus-within:border-primary">
            <span className="text-xs text-muted-foreground font-mono">{">"}</span>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="ENTER TICKER (e.g. AAPL, NVDA, XOM)"
              maxLength={10}
              className="flex-1 bg-transparent outline-none font-mono text-sm placeholder:text-muted-foreground/60 uppercase"
            />
          </div>
          <button type="submit" disabled={loading} className="bg-primary text-primary-foreground font-mono text-xs px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 uppercase tracking-wider">
            {loading ? "Running…" : "Analyze"}
          </button>
        </form>
      </div>
    </header>
  );
}

function EmptyState() {
  const examples = ["AAPL", "NVDA", "XOM", "JPM", "BAC", "PFE", "T", "F"];
  return (
    <div className="panel p-10 text-center mt-12">
      <h2 className="text-lg font-mono text-primary tracking-wider">EQUITY RESEARCH TERMINAL</h2>
      <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">
        Enter a US-listed ticker to run value screening, momentum analysis, and an evidence-based investment recommendation against its sector peer group.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {examples.map(t => <span key={t} className="ticker-tag text-muted-foreground">{t}</span>)}
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 text-left max-w-3xl mx-auto text-xs">
        {[
          ["Value Screen", "Peers within 10% of 52W low, P/E ≤ 10, mcap ≥ $2B"],
          ["Momentum", "Top 10 peers by 5D performance with RSI, ROC, MA confluence"],
          ["Recommendation", "Buy / Watch / Avoid with transparent scoring"],
        ].map(([h, d]) => (
          <div key={h} className="border border-border rounded p-3">
            <div className="text-primary font-mono uppercase tracking-wider">{h}</div>
            <div className="text-muted-foreground mt-1">{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState({ ticker }: { ticker: string }) {
  return (
    <div className="panel p-10 mt-8 text-center">
      <div className="font-mono text-sm text-primary animate-pulse">RUNNING ANALYSIS · {ticker}</div>
      <div className="text-xs text-muted-foreground mt-3">Fetching profile · peers · historicals · computing indicators…</div>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="panel mt-8 border-destructive/50">
      <div className="panel-header text-destructive">Error</div>
      <div className="p-6 text-sm">
        <p>{message}</p>
        <ul className="mt-4 text-xs text-muted-foreground list-disc pl-5 space-y-1">
          <li>Verify the ticker is a valid US-listed equity (e.g. AAPL, MSFT)</li>
          <li>Non-US, delisted, ETFs, funds, and warrants are not supported</li>
          <li>If the issue persists, the data provider may be rate-limited</li>
        </ul>
      </div>
    </div>
  );
}

function SnapshotBar({ r }: { r: Success }) {
  const t = r.target;
  return (
    <div className="panel mb-4">
      <div className="p-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-border">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{t.sector ?? "—"} · {t.industry ?? "—"}</div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-mono text-2xl text-primary font-semibold">{t.symbol}</span>
            <span className="text-sm text-muted-foreground">{t.companyName}</span>
          </div>
        </div>
        <div className="ml-auto flex items-baseline gap-6 font-mono">
          <Stat label="PRICE" value={`$${fmtNum(t.price)}`} />
          <Stat label="5D" value={fmtPct(t.perf5d)} cls={colorFor(t.perf5d)} />
          <Stat label="RSI" value={fmtNum(t.rsi14, 1)} cls={t.rsi14 == null ? "" : t.rsi14 > 70 ? "text-[color:var(--bear)]" : t.rsi14 < 30 ? "text-[color:var(--bull)]" : ""} />
          <Stat label="MCAP" value={fmtMcap(t.marketCap)} />
        </div>
      </div>
      <div className="px-4 py-2 flex flex-wrap gap-3 text-xs font-mono">
        <Pill ok={t.passesGlobal} label={`Liquidity: ${t.passesGlobal ? "PASS" : "FAIL"}`} />
        <Pill ok={t.passesValue} label={`Value Screen: ${t.passesValue ? "PASS" : "FAIL"}`} />
        <Pill ok={t.recommendation.rec === "Buy"} warn={t.recommendation.rec === "Watch"} label={`Rec: ${t.recommendation.rec}`} />
        <span className="text-muted-foreground">Outlook: <span className="text-foreground">{t.outlook}</span> · Conf: {t.confidence}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] text-muted-foreground tracking-wider">{label}</div>
      <div className={`text-sm ${cls}`}>{value}</div>
    </div>
  );
}

function Pill({ ok, warn, label }: { ok?: boolean; warn?: boolean; label: string }) {
  const cls = ok ? "border-[color:var(--bull)]/50 text-[color:var(--bull)]"
    : warn ? "border-primary/50 text-primary"
    : "border-[color:var(--bear)]/50 text-[color:var(--bear)]";
  return <span className={`px-2 py-0.5 rounded border ${cls}`}>{label}</span>;
}

function Tabs({ tab, setTab }: { tab: string; setTab: (t: any) => void }) {
  const tabs = [
    ["overview", "Overview"],
    ["value", "Value Screen"],
    ["momentum", "Momentum"],
    ["cross", "Cross-Analysis"],
    ["final", "Final Recommendation"],
  ] as const;
  return (
    <div className="flex border-b border-border overflow-x-auto">
      {tabs.map(([k, l]) => (
        <button key={k} onClick={() => setTab(k)}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

// ============== sections ==============
function OverviewSection({ r }: { r: Success }) {
  const t = r.target;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="panel lg:col-span-2">
        <div className="panel-header">Snapshot · {t.symbol}</div>
        <table className="term">
          <tbody>
            {[
              ["Company", t.companyName],
              ["Sector", t.sector ?? "—"],
              ["Industry", t.industry ?? "—"],
              ["Price", `$${fmtNum(t.price)}`],
              ["Market Cap", fmtMcap(t.marketCap)],
              ["Avg Daily Volume", fmtVol(t.avgVolume)],
              ["52W Low", `$${fmtNum(t.low52)}`],
              ["52W High", `$${fmtNum(t.high52)}`],
              ["% From 52W Low", fmtPct(t.pctFromLow)],
              ["Trailing P/E", fmtNum(t.pe)],
              ["5D Performance", fmtPct(t.perf5d)],
              ["RSI 14D", `${fmtNum(t.rsi14, 1)} (${t.rsiLabel})`],
              ["ROC 14D", fmtPct(t.roc14)],
              ["ROC 21D", fmtPct(t.roc21)],
              ["Price vs 20D MA", `${vsMA(t.price, t.ma20).label} ($${fmtNum(t.ma20)})`],
              ["Price vs 50D MA", `${vsMA(t.price, t.ma50).label} ($${fmtNum(t.ma50)})`],
              ["Price vs 200D MA", `${vsMA(t.price, t.ma200).label} ($${fmtNum(t.ma200)})`],
              ["Earnings Date", t.earningsDate ? new Date(t.earningsDate).toLocaleDateString() : "—"],
            ].map(([k, v]) => (
              <tr key={k as string}><td className="text-muted-foreground w-1/2">{k}</td><td className="num">{v as string}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-4">
        <div className="panel">
          <div className="panel-header">Visual Indicators</div>
          <div className="p-4 font-mono text-xs space-y-2">
            <Indicator label="Trend" value={`${trendArrow(t.perf5d)} ${t.perf5d != null && t.perf5d > 0 ? "Positive" : t.perf5d != null && t.perf5d < 0 ? "Negative" : "Flat"} short-term`} />
            <Indicator label="Liquidity" value={`${t.passesGlobal ? "✅" : "❌"} ${t.passesGlobal ? "Passes" : "Fails"} screen`} />
            <Indicator label="Value Screen" value={`${t.passesValue ? "✅" : "❌"} ${t.passesValue ? "Qualifies" : "Does not qualify"}`} />
            <Indicator label="RSI" value={`${t.rsi14 != null && t.rsi14 > 70 ? "⚠️" : t.rsi14 != null && t.rsi14 < 30 ? "⚠️" : "→"} ${t.rsiLabel}`} />
            <Indicator label="MA 20D" value={`${t.price && t.ma20 && t.price > t.ma20 ? "↑" : "↓"} ${vsMA(t.price, t.ma20).label}`} />
            <Indicator label="MA 50D" value={`${t.price && t.ma50 && t.price > t.ma50 ? "↑" : "↓"} ${vsMA(t.price, t.ma50).label}`} />
            <Indicator label="MA 200D" value={`${t.price && t.ma200 && t.price > t.ma200 ? "↑" : "↓"} ${vsMA(t.price, t.ma200).label}`} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">Peer Universe</div>
          <div className="p-4 text-xs space-y-1">
            <div className="text-muted-foreground">Identified <span className="text-primary font-mono">{r.peers.length}</span> peers in {t.industry || t.sector || "sector"}.</div>
            <div className="text-muted-foreground">Value qualifiers: <span className="text-[color:var(--bull)] font-mono">{r.valueQualifiers.length}</span></div>
            <div className="text-muted-foreground">Momentum top10 computed: <span className="text-primary font-mono">{r.momentumTop.length}</span></div>
            <div className="text-muted-foreground">Cross-screen overlap: <span className="text-primary font-mono">{r.overlap.length}</span></div>
          </div>
        </div>
        {t.dataMissing.length > 0 && (
          <div className="panel border-primary/30">
            <div className="panel-header text-primary">⚠ Data Unavailable</div>
            <div className="p-4 text-xs text-muted-foreground">Missing: {t.dataMissing.join(", ")}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Indicator({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}

function ValueSection({ r }: { r: Success }) {
  const rows = r.valueQualifiers;
  const includeTarget = r.target.passesValue;
  return (
    <div className="space-y-4">
      <div className="panel">
        <div className="panel-header">Value Screen · Qualifying Peers ({rows.length})</div>
        <div className="overflow-x-auto">
          <table className="term">
            <thead>
              <tr><th>Company</th><th>Ticker</th><th>Price</th><th>52W Low</th><th>% From Low</th><th>P/E</th><th>Mcap</th><th>Avg Vol</th><th>Sector</th><th>Industry</th></tr>
            </thead>
            <tbody>
              {includeTarget && <ValueRow m={r.target} highlight />}
              {rows.length === 0 && !includeTarget && (
                <tr><td colSpan={10} className="text-center text-muted-foreground py-8">No peers passed the value screen.</td></tr>
              )}
              {rows.map(m => <ValueRow key={m.symbol} m={m} />)}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">Commentary</div>
        <div className="p-5 text-sm space-y-3 max-w-4xl">
          <p><span className="text-muted-foreground">Input stock status:</span> <span className={r.target.passesValue ? "text-[color:var(--bull)]" : "text-[color:var(--bear)]"}>{r.target.passesValue ? "✅ Qualifies" : "❌ Does not qualify"}</span> for the value screen.</p>
          {rows.length > 0 ? (
            <p>Qualifying peers trade within 10% of their 52-week low with trailing P/E ≤ 10. This profile typically arises from compressed multiples on cyclical earnings, sentiment-driven sell-offs, or sector-wide derating. {rows.length >= 3 ? "Multiple peers clearing the screen suggests a sector-wide valuation reset." : "The small number of qualifiers points to a more company-specific drawdown rather than a broad sector move."}</p>
          ) : (
            <p>No peers cleared the value screen. The sector is either trading near highs, or earnings/multiples don't satisfy the strict P/E ≤ 10 + near-low constraint.</p>
          )}
          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            <strong>Caveats:</strong> low P/E can signal value traps, declining margins, secular decline, cyclical earnings peaks, leverage risk, or pending earnings revisions. Always validate with cash-flow trends, balance-sheet health, and forward estimates.
          </div>
        </div>
      </div>
    </div>
  );
}

function ValueRow({ m, highlight = false }: { m: any; highlight?: boolean }) {
  return (
    <tr className={highlight ? "bg-primary/5" : ""}>
      <td>{highlight && "▶ "}{m.companyName}</td>
      <td className="text-primary">{m.symbol}</td>
      <td className="num">${fmtNum(m.price)}</td>
      <td className="num">${fmtNum(m.low52)}</td>
      <td className={`num ${colorFor(-(m.pctFromLow ?? 0))}`}>{fmtPct(m.pctFromLow)}</td>
      <td className="num">{fmtNum(m.pe)}</td>
      <td className="num">{fmtMcap(m.marketCap)}</td>
      <td className="num">{fmtVol(m.avgVolume)}</td>
      <td className="text-muted-foreground">{m.sector ?? "—"}</td>
      <td className="text-muted-foreground">{m.industry ?? "—"}</td>
    </tr>
  );
}

function MomentumSection({ r }: { r: Success }) {
  const rows = r.momentumTop;
  return (
    <div className="space-y-4">
      <div className="panel">
        <div className="panel-header">Momentum · Top {rows.length} by 5D Performance</div>
        <div className="overflow-x-auto">
          <table className="term">
            <thead>
              <tr><th>#</th><th>Company</th><th>Ticker</th><th>5D %</th><th>ROC14</th><th>ROC21</th><th>RSI</th><th>RSI Label</th><th>20D</th><th>50D</th><th>200D</th><th>Signal</th><th>Outlook</th><th>Conf</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={14} className="text-center text-muted-foreground py-8">No peers qualified for momentum ranking.</td></tr>}
              {rows.map((m, i) => {
                const v20 = vsMA(m.price, m.ma20);
                const v50 = vsMA(m.price, m.ma50);
                const v200 = vsMA(m.price, m.ma200);
                return (
                  <tr key={m.symbol}>
                    <td className="text-muted-foreground">{i + 1}</td>
                    <td>{m.companyName}</td>
                    <td className="text-primary">{m.symbol}</td>
                    <td className={`num ${colorFor(m.perf5d)}`}>{fmtPct(m.perf5d)}</td>
                    <td className={`num ${colorFor(m.roc14)}`}>{fmtPct(m.roc14)}</td>
                    <td className={`num ${colorFor(m.roc21)}`}>{fmtPct(m.roc21)}</td>
                    <td className="num">{fmtNum(m.rsi14, 1)}</td>
                    <td className={m.rsiLabel === "Overbought" ? "text-[color:var(--bear)]" : m.rsiLabel === "Oversold" ? "text-[color:var(--bull)]" : "text-muted-foreground"}>{m.rsiLabel}</td>
                    <td className={v20.cls}>{v20.label}</td>
                    <td className={v50.cls}>{v50.label}</td>
                    <td className={v200.cls}>{v200.label}</td>
                    <td className={m.signal === "Momentum continuation" ? "text-[color:var(--bull)]" : m.signal === "Potential reversal" ? "text-primary" : "text-muted-foreground"}>{m.signal}</td>
                    <td className={m.outlook === "Bullish" ? "text-[color:var(--bull)]" : m.outlook === "Bearish" ? "text-[color:var(--bear)]" : ""}>{m.outlook}</td>
                    <td className="text-muted-foreground">{m.confidence}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">Methodology</div>
        <div className="p-5 text-xs text-muted-foreground space-y-2 max-w-3xl">
          <p>Universe filtered for price ≥ $5, avg vol ≥ 500K, mcap ≥ $2B, then ranked by 5-day price performance.</p>
          <p><span className="text-foreground">Continuation:</span> positive 5D + ROC14/21 positive + RSI &lt; 70 + price above 20D &amp; 50D MAs.</p>
          <p><span className="text-foreground">Potential reversal:</span> strong recent move but RSI &gt; 70 or weakening ROC.</p>
          <p><span className="text-foreground">Mixed:</span> indicator confluence is unclear or conflicting.</p>
        </div>
      </div>
    </div>
  );
}

function CrossSection({ r }: { r: Success }) {
  const overlap = r.overlap;
  const detail = r.valueQualifiers.filter(v => overlap.includes(v.symbol)).map(v => {
    const m = r.momentumTop.find(x => x.symbol === v.symbol);
    return { ...v, momentum: m };
  });
  return (
    <div className="panel">
      <div className="panel-header">Cross-Analysis · Value ∩ Momentum</div>
      <div className="p-5">
        {overlap.length === 0 ? (
          <p className="text-sm text-muted-foreground">No peer passed both the value screen and the momentum top-10. This is common when sectors are either deeply oversold (no momentum) or trading near highs (no value qualifiers).</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">{overlap.length} ticker{overlap.length > 1 ? "s" : ""} appear in both screens — these combine compressed valuation with improving short-term price action and may represent higher-conviction setups.</p>
            {detail.map(d => (
              <div key={d.symbol} className="border border-border rounded p-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-primary text-lg">{d.symbol}</span>
                  <span className="text-sm">{d.companyName}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{d.industry}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div><span className="text-muted-foreground">P/E </span>{fmtNum(d.pe)}</div>
                  <div><span className="text-muted-foreground">% from low </span>{fmtPct(d.pctFromLow)}</div>
                  <div><span className="text-muted-foreground">5D </span><span className={colorFor(d.perf5d)}>{fmtPct(d.perf5d)}</span></div>
                  <div><span className="text-muted-foreground">RSI </span>{fmtNum(d.rsi14, 1)}</div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Notable: undervalued by P/E and proximity to 52W low, yet exhibiting the strongest 5D performance among screened peers — a constructive setup for mean reversion. <span className="text-foreground">Risks:</span> the bounce may be a dead-cat rally; confirm with volume, earnings stability, and breakdowns below 50D/200D MAs as invalidation triggers.</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FinalSection({ r }: { r: Success }) {
  const t = r.target;
  const rec = t.recommendation;
  const recColor = rec.rec === "Buy" ? "text-[color:var(--bull)] border-[color:var(--bull)]"
    : rec.rec === "Avoid" ? "text-[color:var(--bear)] border-[color:var(--bear)]"
    : "text-primary border-primary";

  const above200 = t.price && t.ma200 && t.price > t.ma200;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className={`panel lg:col-span-1 border-2 ${recColor.split(" ")[1]}`}>
        <div className="panel-header">Final Recommendation</div>
        <div className="p-6 text-center">
          <div className={`font-mono text-5xl font-semibold ${recColor.split(" ")[0]}`}>{rec.rec.toUpperCase()}</div>
          <div className="mt-3 text-xs font-mono text-muted-foreground">CONFIDENCE: <span className="text-foreground">{rec.confidence}</span></div>
          <div className="text-xs font-mono text-muted-foreground">HORIZON: <span className="text-foreground">{rec.horizon}</span></div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-xs font-mono border-t border-border pt-4">
            <div><div className="text-muted-foreground">Value</div><div className="text-[color:var(--bull)] text-lg">{rec.valueScore}/3</div></div>
            <div><div className="text-muted-foreground">Mom.</div><div className="text-primary text-lg">{rec.momentumScore}/7</div></div>
            <div><div className="text-muted-foreground">Penalty</div><div className="text-[color:var(--bear)] text-lg">−{rec.penalties}</div></div>
          </div>
          <p className="mt-5 text-xs text-left">
            {t.companyName} ({t.symbol}) currently {t.passesGlobal ? "meets" : "fails"} liquidity/size filters and {t.passesValue ? "qualifies" : "does not qualify"} as a value candidate. Momentum profile is <span className="text-foreground">{t.outlook.toLowerCase()}</span> with {t.signal.toLowerCase()} signals. Net composite score is {rec.net}/10. {rec.rec === "Buy" ? "Setup combines favorable risk/reward across both screens." : rec.rec === "Avoid" ? "Risk indicators outweigh constructive signals at present." : "Mixed signals warrant patience for clearer confirmation."}
          </p>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="panel">
          <div className="panel-header">Investment Thesis</div>
          <div className="p-5 text-sm space-y-4">
            <Thesis title="Bull Case" cls="text-[color:var(--bull)]">
              {t.passesValue && "Trades near 52W low with single-digit P/E — pricing in significant pessimism. "}
              {(t.perf5d ?? 0) > 0 && "Recent 5D price action is positive, suggesting accumulation. "}
              {above200 && "Price above 200D MA confirms primary uptrend. "}
              Sector ({t.sector ?? "—"}) tailwinds, multiple expansion, or earnings beats could re-rate the stock.
            </Thesis>
            <Thesis title="Bear Case" cls="text-[color:var(--bear)]">
              {(t.rsi14 ?? 0) > 70 && "RSI in overbought territory raises near-term pullback risk. "}
              {!above200 && "Price below 200D MA indicates broken long-term trend. "}
              {(t.roc14 ?? 0) < 0 && (t.roc21 ?? 0) < 0 && "Negative ROC across both windows signals deteriorating momentum. "}
              Risks include margin compression, weakening guidance, sector derating, and macro headwinds.
            </Thesis>
            <Thesis title="Base Case" cls="text-primary">
              Range-bound trading as the market awaits the next catalyst. Indicator confluence is {t.confidence.toLowerCase()}, suggesting a wait-and-see posture is appropriate until valuation, momentum, or fundamentals decisively shift.
            </Thesis>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="panel">
            <div className="panel-header">Catalysts</div>
            <ul className="p-5 text-xs space-y-2 text-muted-foreground list-disc pl-8">
              <li>Next earnings release {t.earningsDate ? `(${new Date(t.earningsDate).toLocaleDateString()})` : "(date TBD)"}</li>
              <li>Forward guidance revisions</li>
              <li>{t.sector ?? "Sector"} demand and pricing trends</li>
              <li>Macro: rates, inflation, currency</li>
              <li>Regulatory developments and product launches</li>
            </ul>
          </div>
          <div className="panel">
            <div className="panel-header">Risks</div>
            <ul className="p-5 text-xs space-y-2 text-muted-foreground list-disc pl-8">
              <li><span className="text-foreground">Fundamental:</span> revenue decline, margin compression, leverage, weak earnings quality, value-trap risk</li>
              <li><span className="text-foreground">Technical:</span> {(t.rsi14 ?? 0) > 70 ? "overbought RSI" : "RSI within range"}, {above200 ? "trend intact" : "broken 200D MA"}, low-volume rallies, breakdown below {t.ma50 ? `$${fmtNum(t.ma50)} (50D)` : "key MA"}</li>
              <li>Liquidity: {t.passesGlobal ? "passes" : "FAILS"} minimum size/volume thresholds</li>
              {t.dataMissing.length > 0 && <li className="text-primary">Data quality: missing {t.dataMissing.join(", ")} — confidence reduced</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Thesis({ title, cls, children }: { title: string; cls: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={`text-xs font-mono uppercase tracking-wider ${cls}`}>{title}</div>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="mt-8 text-[11px] text-muted-foreground border-t border-border pt-4 max-w-3xl mx-auto text-center leading-relaxed">
      This analysis is for informational purposes only and is not financial advice. Investors should conduct their own research or consult a qualified financial advisor before making investment decisions. Data provided by FinImpulse.
    </p>
  );
}
