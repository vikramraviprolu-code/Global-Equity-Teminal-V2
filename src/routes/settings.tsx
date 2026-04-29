import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav, Disclaimer } from "@/components/site-nav";
import { WATCHLIST_NAMES, readAllWatchlists } from "@/hooks/use-watchlist";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Global Equity Terminal v2" },
      { name: "description", content: "Configure preferences, manage local watchlists, and view storage usage for Global Equity Terminal v2." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hideMockDefault, setHideMockDefault] = useState(false);

  useEffect(() => {
    const all = readAllWatchlists();
    setCounts(Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.length])));
    if (typeof window !== "undefined") {
      setHideMockDefault(localStorage.getItem("get-v2:hideMock") === "1");
    }
  }, []);

  const togglePref = (next: boolean) => {
    setHideMockDefault(next);
    if (typeof window !== "undefined") localStorage.setItem("get-v2:hideMock", next ? "1" : "0");
  };

  const clearList = (name: string) => {
    if (typeof window === "undefined") return;
    if (!confirm(`Clear ${name}?`)) return;
    localStorage.setItem(`get-v2:watchlist:${name}`, "[]");
    setCounts((c) => ({ ...c, [name]: 0 }));
  };

  const exportData = () => {
    const all = readAllWatchlists();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "get-v2-watchlists.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-[1400px] mx-auto px-4 py-6 w-full">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">Local preferences and data management. All settings are stored in your browser.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="panel">
            <div className="panel-header">Display Preferences</div>
            <div className="p-4 space-y-3 text-xs">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span>
                  <div className="text-foreground">Hide mock fallback by default</div>
                  <div className="text-muted-foreground text-[10px]">Excludes rows that fell back to deterministic mock data on first load.</div>
                </span>
                <input type="checkbox" checked={hideMockDefault} onChange={(e) => togglePref(e.target.checked)} />
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">Local Watchlists</div>
            <div className="p-4 space-y-2 text-xs font-mono">
              {WATCHLIST_NAMES.map((n) => (
                <div key={n} className="flex items-center justify-between gap-3">
                  <span>{n}</span>
                  <span className="text-muted-foreground">{counts[n] ?? 0} stocks</span>
                  <button onClick={() => clearList(n)} className="text-[10px] uppercase tracking-wider border border-border px-2 py-1 rounded hover:border-destructive hover:text-destructive">Clear</button>
                </div>
              ))}
              <button onClick={exportData} className="mt-2 w-full text-[10px] uppercase tracking-wider border border-primary/50 text-primary px-3 py-2 rounded hover:bg-primary/10">
                Export all watchlists (JSON)
              </button>
            </div>
          </div>

          <div className="panel md:col-span-2">
            <div className="panel-header">About</div>
            <div className="p-4 text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                <span className="font-mono text-primary">Global Equity Terminal v2</span> — a free, evidence-based stock discovery and analysis platform inspired by Bloomberg, FINVIZ, Koyfin and TradingView.
              </p>
              <p>Curated universe of ~150 global tickers across US, India, Europe, Japan, Hong Kong, Korea, Taiwan, Singapore and Australia. Powered by Finimpulse with deterministic mock fallback. No account required.</p>
            </div>
          </div>
        </div>

        <Disclaimer />
      </main>
    </div>
  );
}
