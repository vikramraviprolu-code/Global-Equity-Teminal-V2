import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchUniverse } from "@/server/screen.functions";
import { SiteNav, Disclaimer } from "@/components/site-nav";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events Calendar — Global Equity Terminal v2" },
      { name: "description", content: "Earnings, dividends, and corporate event calendar across the curated global universe." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const [scope, setScope] = useState<"all" | "watchlist">("all");
  const { data, isLoading } = useQuery({
    queryKey: ["universe"],
    queryFn: () => fetchUniverse({ data: {} }),
    staleTime: 5 * 60 * 1000,
  });

  // Earnings dates aren't yet in ScreenerRow — we surface "Data unavailable" honestly per PRD.
  // Future: extend fetchScreenerRow to pull earnings_date, dividend_date, ex_div_date, split_date.
  const rows = useMemo(() => data?.rows ?? [], [data]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-[1400px] mx-auto px-4 py-6 w-full">
        <h1 className="text-xl font-semibold tracking-tight">Events Calendar</h1>
        <p className="text-xs text-muted-foreground mt-1">Upcoming earnings, dividends, and corporate events from free/public sources.</p>

        <div className="mt-4 flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
          <button onClick={() => setScope("all")} className={`px-3 py-1.5 rounded border ${scope === "all" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>All Universe</button>
          <button onClick={() => setScope("watchlist")} className={`px-3 py-1.5 rounded border ${scope === "watchlist" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>Watchlist Only</button>
        </div>

        {isLoading ? (
          <div className="panel p-10 text-center mt-4 font-mono text-sm text-primary animate-pulse">LOADING…</div>
        ) : (
          <div className="panel mt-4">
            <div className="panel-header">Tracked Tickers · {rows.length}</div>
            <div className="p-6">
              <div className="border border-primary/30 bg-primary/5 rounded p-4 text-xs">
                <div className="font-mono text-primary uppercase tracking-wider mb-2">Data Unavailable</div>
                <p className="text-muted-foreground leading-relaxed">
                  No reliable free/public source for earnings, dividend, and split dates is currently wired into this build.
                  Per PRD, we never fabricate event data. The events feed will be populated once an exchange-page or company-IR
                  scraper provider is connected. In the meantime, individual stock <Link to="/terminal" className="text-primary underline">Analysis</Link> pages
                  will display an earnings date if the upstream summary endpoint returns one.
                </p>
              </div>
            </div>
          </div>
        )}
        <Disclaimer />
      </main>
    </div>
  );
}
