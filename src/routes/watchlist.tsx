import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchUniverse } from "@/server/screen.functions";
import { scoreAll } from "@/lib/scores";
import { fmtNum, fmtPct, fmtMcapUsd, fmtPrice, colorFor } from "@/lib/format";
import { useWatchlist } from "@/hooks/use-watchlist";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "My Watchlist — Global Equity Terminal v2" },
      { name: "description", content: "Track your shortlisted global stocks with live scores, momentum, and value signals." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const navigate = useNavigate();
  const { items, remove } = useWatchlist();
  const { data, isLoading } = useQuery({
    queryKey: ["universe"],
    queryFn: () => fetchUniverse({ data: {} }),
    staleTime: 5 * 60 * 1000,
  });

  const rows = useMemo(() => {
    if (!data?.rows) return [];
    return scoreAll(data.rows).filter((r) => items.includes(r.symbol));
  }, [data, items]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-sm" />
            <span className="font-mono text-sm tracking-widest text-primary">GLOBAL&nbsp;EQUITY&nbsp;TERMINAL</span>
            <span className="font-mono text-[10px] text-muted-foreground">v2</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-xs font-mono uppercase tracking-wider">
            <Link to="/" className="px-3 py-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">Screener</Link>
            <Link to="/terminal" className="px-3 py-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">Stock Analysis</Link>
            <Link to="/watchlist" className="px-3 py-1.5 rounded text-primary">Watchlist</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto px-4 py-6 w-full">
        <h1 className="text-xl font-semibold tracking-tight">My Watchlist</h1>
        <p className="text-xs text-muted-foreground mt-1">Stored locally in your browser. {items.length} stock{items.length === 1 ? "" : "s"}.</p>

        {items.length === 0 ? (
          <div className="panel p-10 text-center mt-6">
            <div className="font-mono text-sm text-muted-foreground">Your watchlist is empty.</div>
            <Link to="/" className="inline-block mt-4 font-mono text-[10px] uppercase tracking-wider border border-primary/50 text-primary px-4 py-2 rounded hover:bg-primary/10">
              Browse the screener
            </Link>
          </div>
        ) : isLoading ? (
          <div className="panel p-10 text-center mt-6 font-mono text-sm text-primary animate-pulse">LOADING…</div>
        ) : (
          <div className="panel overflow-x-auto mt-4">
            <table className="term">
              <thead>
                <tr>
                  <th>Ticker</th><th>Company</th><th>Region</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Mcap (USD)</th>
                  <th className="text-right">P/E</th>
                  <th className="text-right">5D %</th>
                  <th className="text-right">RSI</th>
                  <th className="text-right">Value</th>
                  <th className="text-right">Mom</th>
                  <th className="text-right">Conf</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.symbol} className="hover:bg-primary/5 cursor-pointer" onClick={() => navigate({ to: "/terminal", search: { t: r.symbol } as any })}>
                    <td className="text-primary font-mono">{r.symbol}</td>
                    <td>{r.name}</td>
                    <td className="text-muted-foreground">{r.region}</td>
                    <td className="num">{fmtPrice(r.price, r.currency)}</td>
                    <td className="num">{fmtMcapUsd(r.marketCapUsd)}</td>
                    <td className="num">{fmtNum(r.pe, 1)}</td>
                    <td className={`num ${colorFor(r.perf5d)}`}>{fmtPct(r.perf5d)}</td>
                    <td className="num">{fmtNum(r.rsi14, 0)}</td>
                    <td className="num font-mono">{r.scores.value}</td>
                    <td className="num font-mono">{r.scores.momentum}</td>
                    <td className="num font-mono">{r.scores.confidence}{r.isMock && <span className="text-[9px] text-primary ml-1">mock</span>}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => remove(r.symbol)} className="font-mono text-[10px] border border-border px-2 py-1 rounded hover:border-destructive hover:text-destructive">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
