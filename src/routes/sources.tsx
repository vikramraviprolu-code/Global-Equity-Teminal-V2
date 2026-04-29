import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, Disclaimer } from "@/components/site-nav";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Data Sources — Global Equity Terminal v2" },
      { name: "description", content: "Free and public data sources powering price, fundamentals, and corporate events in Global Equity Terminal v2." },
    ],
  }),
  component: SourcesPage,
});

const SOURCES = [
  {
    name: "Finimpulse API",
    role: "Primary provider",
    metrics: ["Quote / price", "Trailing P/E", "Market cap (local + USD)", "Avg volume", "52W high / low", "MA50 / MA200", "Sector / industry", "Earnings date"],
    freshness: "Delayed (15–20 min) on most exchanges",
    reliability: "High",
    notes: "Used as the canonical metadata + summary source. Falls back to mock when unavailable.",
    url: "https://api.finimpulse.com/",
  },
  {
    name: "Stooq CSV",
    role: "Historical OHLCV (planned)",
    metrics: ["Daily close history", "Volume"],
    freshness: "Previous-close",
    reliability: "Medium — best-effort, may rate-limit",
    notes: "Free historical close data for indicator calculation when Finimpulse history is sparse.",
    url: "https://stooq.com/",
  },
  {
    name: "Curated Universe",
    role: "Discovery seed",
    metrics: ["Ticker", "Exchange", "Region", "Country", "Currency", "Sector", "Industry"],
    freshness: "Static — curated by Lovable",
    reliability: "High",
    notes: "~150 hand-picked liquid global names across US, India, EU, JP, HK, KR, TW, AU, SG.",
  },
  {
    name: "Mock demo provider",
    role: "Fallback only",
    metrics: ["All metrics deterministically derived from ticker hash"],
    freshness: "Mock",
    reliability: "Demo / not live",
    notes: "Activated per-row when upstream sources fail. Always badged as 'mock' in the UI.",
  },
] as const;

function SourcesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-[1400px] mx-auto px-4 py-6 w-full">
        <h1 className="text-xl font-semibold tracking-tight">Data Sources</h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
          The terminal blends free / public sources with deterministic mock fallback for resilience. We never silently mix mock and real data — when mock is used,
          rows are badged accordingly and confidence is reduced.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {SOURCES.map((s) => (
            <div key={s.name} className="panel p-4">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="font-mono text-primary text-sm">{s.name}</div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border rounded px-2 py-0.5">{s.role}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="text-muted-foreground">Freshness</div><div>{s.freshness}</div>
                <div className="text-muted-foreground">Reliability</div><div>{s.reliability}</div>
              </div>
              <div className="mt-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Provides</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.metrics.map((m) => (
                    <span key={m} className="text-[10px] font-mono border border-border rounded px-1.5 py-0.5 text-muted-foreground">{m}</span>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{s.notes}</p>
              {"url" in s && s.url && (
                <a href={s.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[10px] font-mono text-primary hover:underline">
                  {s.url} ↗
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="panel mt-6 p-5 text-xs text-muted-foreground leading-relaxed">
          <div className="font-mono text-primary uppercase tracking-widest mb-2">Source priority (PRD)</div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Official exchange data</li>
            <li>Company investor relations</li>
            <li>Recognized financial data providers (Finimpulse)</li>
            <li>Major finance websites</li>
            <li>Public knowledge sources for basic metadata</li>
          </ol>
        </div>

        <Disclaimer />
      </main>
    </div>
  );
}
