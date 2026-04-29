import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { fetchUniverse } from "@/server/screen.functions";
import { scoreAll, scoreRow, type ScoredRow } from "@/lib/scores";
import { fmtNum, fmtPct, fmtMcapUsd, fmtPrice, fmtVol, colorFor } from "@/lib/format";
import { useWatchlist } from "@/hooks/use-watchlist";
import { SiteNav } from "@/components/site-nav";

const SORTABLE_KEYS = ["symbol", "name", "sector", "price", "marketCapUsd", "pe", "pb", "dividendYield", "pctFromLow", "perf5d", "rsi14", "value", "momentum", "quality", "risk", "confidence"] as const;
type SortKey = (typeof SORTABLE_KEYS)[number];

const MA_CROSS_OPTIONS = ["any", "golden", "death", "above50", "above200"] as const;
type MaCross = (typeof MA_CROSS_OPTIONS)[number];

const searchSchema = z.object({
  preset: fallback(z.enum(["all", "valueLow", "momentum", "quality", "oversold", "breakout", "reliable"]), "all").default("all"),
  region: fallback(z.string(), "").default(""),
  sector: fallback(z.string(), "").default(""),
  q: fallback(z.string(), "").default(""),
  minMcap: fallback(z.number(), 0).default(0),
  minPrice: fallback(z.number(), 0).default(0),
  minVolume: fallback(z.number(), 0).default(0),
  peMax: fallback(z.number().nullable(), null).default(null),
  pbMax: fallback(z.number().nullable(), null).default(null),
  dyMin: fallback(z.number().nullable(), null).default(null),
  rsiMin: fallback(z.number(), 0).default(0),
  rsiMax: fallback(z.number(), 100).default(100),
  near52wLowPct: fallback(z.number().nullable(), null).default(null),
  rocMin: fallback(z.number().nullable(), null).default(null),
  maCross: fallback(z.enum(MA_CROSS_OPTIONS), "any").default("any"),
  minConfidence: fallback(z.number(), 0).default(0),
  excludeMock: fallback(z.boolean(), false).default(false),
  sortBy: fallback(z.enum(SORTABLE_KEYS), "marketCapUsd").default("marketCapUsd"),
  sortDir: fallback(z.enum(["asc", "desc"]), "desc").default("desc"),
  page: fallback(z.number().int().min(1), 1).default(1),
  pageSize: fallback(z.number().int().min(10).max(200), 50).default(50),
  view: fallback(z.enum(["table", "chart"]), "table").default("table"),
});

type Filters = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Global Equity Terminal v2 — Stock Screener & Discovery" },
      { name: "description", content: "Discover global stocks across US, India, Europe, Japan, Hong Kong, Korea, Taiwan, Singapore and Australia. Run value, momentum, and quality screens with transparent scoring." },
      { property: "og:title", content: "Global Equity Terminal v2 — Stock Screener" },
      { property: "og:description", content: "A professional stock discovery and analysis platform. Screen, score, and analyse global equities with evidence-based research." },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context }) => {
    context.queryClient.prefetchQuery({
      queryKey: ["universe"],
      queryFn: () => fetchUniverse({ data: {} }),
      staleTime: 5 * 60 * 1000,
    });
  },
  component: ScreenerPage,
});

// ---------------- presets ----------------
type PresetId = Filters["preset"];
const PRESETS: { id: PresetId; label: string; desc: string }[] = [
  { id: "all", label: "All Stocks", desc: "Entire curated universe with no extra filters" },
  { id: "valueLow", label: "Value Near Lows", desc: "P/E ≤ 10, within 10% of 52W low, large cap, medium+ confidence" },
  { id: "momentum", label: "Momentum Leaders", desc: "Positive 5D, ROC14 & ROC21 positive, RSI 40–70, above 20D & 50D MA" },
  { id: "quality", label: "Quality Large Caps", desc: "Mcap ≥ $10B USD, positive earnings, medium+ confidence" },
  { id: "oversold", label: "Oversold Watchlist", desc: "RSI < 35 and within 20% of 52W low" },
  { id: "breakout", label: "Breakout Candidates", desc: "Above 20D & 50D MA, ROC14 positive, near 52W high" },
  { id: "reliable", label: "Data Reliable Only", desc: "High data confidence (≥85)" },
];

const DEFAULT_FILTERS: Filters = searchSchema.parse({});

function applyPreset(p: PresetId): Filters {
  const base: Filters = { ...DEFAULT_FILTERS, preset: p };
  switch (p) {
    case "valueLow": return { ...base, peMax: 10, near52wLowPct: 10, minMcap: 2e9, minConfidence: 60 };
    case "momentum": return { ...base, rsiMin: 40, rsiMax: 70, rocMin: 0, maCross: "above50" };
    case "quality":  return { ...base, minMcap: 10e9, minConfidence: 60 };
    case "oversold": return { ...base, rsiMin: 0, rsiMax: 35, near52wLowPct: 20 };
    case "breakout": return { ...base, rsiMin: 50, rsiMax: 75, maCross: "above50", rocMin: 0 };
    case "reliable": return { ...base, minConfidence: 85, excludeMock: true };
    default:         return base;
  }
}

function passes(r: ScoredRow, f: Filters): boolean {
  if (f.region && r.region !== f.region) return false;
  if (f.sector && r.sector !== f.sector) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    if (!r.symbol.toLowerCase().includes(q) && !r.name.toLowerCase().includes(q)) return false;
  }
  if (f.minMcap > 0 && (r.marketCapUsd ?? 0) < f.minMcap) return false;
  if (f.minPrice > 0 && (r.price ?? 0) < f.minPrice) return false;
  if (f.minVolume > 0 && (r.avgVolume ?? 0) < f.minVolume) return false;
  if (f.peMax != null && (r.pe == null || r.pe <= 0 || r.pe > f.peMax)) return false;
  if (r.rsi14 != null && (r.rsi14 < f.rsiMin || r.rsi14 > f.rsiMax)) return false;
  if (f.near52wLowPct != null && (r.pctFromLow == null || r.pctFromLow > f.near52wLowPct)) return false;
  if (f.minConfidence > 0 && r.scores.confidence < f.minConfidence) return false;
  if (f.excludeMock && r.isMock) return false;

  // preset-specific extras the simple filters don't capture
  switch (f.preset) {
    case "momentum":
      if ((r.perf5d ?? 0) <= 0 || (r.roc14 ?? 0) <= 0 || (r.roc21 ?? 0) <= 0) return false;
      if (!(r.price && r.ma20 && r.price > r.ma20)) return false;
      if (!(r.price && r.ma50 && r.price > r.ma50)) return false;
      break;
    case "quality":
      if (r.pe == null || r.pe <= 0) return false;
      break;
    case "breakout":
      if (!(r.price && r.ma20 && r.price > r.ma20)) return false;
      if (!(r.price && r.ma50 && r.price > r.ma50)) return false;
      if ((r.roc14 ?? 0) <= 0 || (r.perf5d ?? 0) <= 0) return false;
      if ((r.pctFromHigh ?? -100) < -15) return false;
      break;
  }
  return true;
}

// ---------------- COMPONENT ----------------
function ScreenerPage() {
  const navigate = useNavigate();
  const { items: watchlist, add: addWatch, remove: removeWatch } = useWatchlist();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"table" | "chart">("table");
  const [sortBy, setSortBy] = useState<keyof ScoredRow | "value" | "momentum" | "quality" | "risk" | "confidence">("marketCapUsd");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["universe"],
    queryFn: () => fetchUniverse({ data: {} }),
    staleTime: 5 * 60 * 1000,
  });

  const scored = useMemo(() => (data?.rows ? scoreAll(data.rows) : []), [data]);
  const filtered = useMemo(() => scored.filter((r) => passes(r, filters)), [scored, filters]);
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const key = sortBy as string;
    arr.sort((a, b) => {
      const av = key in a.scores ? (a.scores as any)[key] : (a as any)[key];
      const bv = key in b.scores ? (b.scores as any)[key] : (b as any)[key];
      const an = av == null ? -Infinity : av;
      const bn = bv == null ? -Infinity : bv;
      if (typeof an === "string" || typeof bn === "string") {
        return sortDir === "asc" ? String(an).localeCompare(String(bn)) : String(bn).localeCompare(String(an));
      }
      return sortDir === "asc" ? an - bn : bn - an;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (k: typeof sortBy) => {
    if (sortBy === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(k); setSortDir("desc"); }
  };

  const toggleSelect = (sym: string) => {
    const next = new Set(selected);
    if (next.has(sym)) next.delete(sym); else next.add(sym);
    setSelected(next);
  };

  const onPickPreset = (p: PresetId) => setFilters((f) => applyPreset(p, DEFAULT_FILTERS));

  const sectors = useMemo(() => Array.from(new Set(scored.map((r) => r.sector))).sort(), [scored]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav right={<button onClick={() => refetch()} disabled={isFetching} className="bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50">{isFetching ? "Refreshing…" : "Refresh"}</button>} />
      <main className="flex-1">
        <Hero meta={data?.meta} />
        <PresetBar current={filters.preset} onPick={onPickPreset} />
        <FilterBar filters={filters} setFilters={setFilters} sectors={sectors} />

        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-border">
          <div className="text-xs font-mono text-muted-foreground">
            <span className="text-foreground">{sorted.length}</span> of <span className="text-foreground">{scored.length}</span> stocks ·
            <span className="ml-2">Mock: <span className="text-primary">{data?.meta.mockCount ?? 0}</span></span> ·
            <span className="ml-2">Live: <span className="text-[color:var(--bull)]">{data?.meta.liveCount ?? 0}</span></span>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button
                onClick={() => { addWatch([...selected]); setSelected(new Set()); }}
                className="font-mono text-[10px] uppercase tracking-wider border border-primary/50 text-primary px-3 py-1.5 rounded hover:bg-primary/10"
              >
                + Add {selected.size} to watchlist
              </button>
            )}
            <ViewToggle view={view} setView={setView} />
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 py-4">
          {isLoading && <LoadingState />}
          {isError && <ErrorState onRetry={refetch} />}
          {!isLoading && !isError && sorted.length === 0 && <EmptyState onReset={() => setFilters(DEFAULT_FILTERS)} />}
          {!isLoading && !isError && sorted.length > 0 && view === "table" && (
            <ResultsTable
              rows={sorted}
              sortBy={sortBy} sortDir={sortDir} onSort={toggleSort}
              selected={selected} toggleSelect={toggleSelect}
              watchlist={watchlist} onAddOne={(s) => addWatch([s])} onRemoveOne={removeWatch}
              onOpen={(s) => navigate({ to: "/terminal", search: { t: s } as any })}
            />
          )}
          {!isLoading && !isError && sorted.length > 0 && view === "chart" && (
            <ResultsCards
              rows={sorted}
              watchlist={watchlist} onAddOne={(s) => addWatch([s])} onRemoveOne={removeWatch}
              onOpen={(s) => navigate({ to: "/terminal", search: { t: s } as any })}
            />
          )}
        </div>

        <Disclaimer />
      </main>
      <Footer />
    </div>
  );
}

function Hero({ meta }: { meta?: { retrievedAt: string; total: number; mockCount: number; liveCount: number } }) {
  return (
    <section className="border-b border-border bg-card/30">
      <div className="max-w-[1400px] mx-auto px-4 py-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Global Stock Screener</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Discover stocks across US, India, Europe, Japan, Hong Kong, Korea, Taiwan, Singapore and Australia. Filter, score, and shortlist — then deep-dive on any name in the analysis terminal.
          </p>
        </div>
        {meta && (
          <div className="text-[11px] font-mono text-muted-foreground text-right">
            <div>Last refresh: <span className="text-foreground">{new Date(meta.retrievedAt).toLocaleTimeString()}</span></div>
            <div>{meta.liveCount} live · {meta.mockCount} mock fallback</div>
          </div>
        )}
      </div>
    </section>
  );
}

function PresetBar({ current, onPick }: { current: PresetId; onPick: (p: PresetId) => void }) {
  return (
    <div className="border-b border-border bg-background">
      <div className="max-w-[1400px] mx-auto px-4 py-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">Presets:</span>
          {PRESETS.map((p) => (
            <button
              key={p.id} onClick={() => onPick(p.id)} title={p.desc}
              className={`whitespace-nowrap font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded border transition-colors ${
                current === p.id
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterBar({ filters, setFilters, sectors }: {
  filters: Filters; setFilters: (f: Filters) => void; sectors: string[];
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters({ ...filters, [k]: v });
  return (
    <div className="border-b border-border bg-card/30">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-end gap-3">
        <Field label="Search">
          <input value={filters.search} onChange={(e) => set("search", e.target.value)} placeholder="Ticker or company"
            className="bg-input border border-border rounded px-2 py-1 text-xs font-mono w-44 focus:border-primary outline-none" />
        </Field>
        <Field label="Region">
          <select value={filters.region} onChange={(e) => set("region", e.target.value)}
            className="bg-input border border-border rounded px-2 py-1 text-xs font-mono w-28 focus:border-primary outline-none">
            <option value="">All</option>
            {["US", "IN", "EU", "JP", "HK", "KR", "TW", "AU", "SG", "CN"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Sector">
          <select value={filters.sector} onChange={(e) => set("sector", e.target.value)}
            className="bg-input border border-border rounded px-2 py-1 text-xs font-mono w-44 focus:border-primary outline-none">
            <option value="">All</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Min Mcap (USD)">
          <select value={filters.minMcap} onChange={(e) => set("minMcap", Number(e.target.value))}
            className="bg-input border border-border rounded px-2 py-1 text-xs font-mono w-28 focus:border-primary outline-none">
            <option value={0}>Any</option>
            <option value={2e9}>$2B+</option>
            <option value={10e9}>$10B+</option>
            <option value={50e9}>$50B+</option>
            <option value={2e11}>$200B+</option>
          </select>
        </Field>
        <Field label="P/E max">
          <input type="number" value={filters.peMax ?? ""} onChange={(e) => set("peMax", e.target.value === "" ? null : Number(e.target.value))} placeholder="—"
            className="bg-input border border-border rounded px-2 py-1 text-xs font-mono w-20 focus:border-primary outline-none" />
        </Field>
        <Field label={`RSI ${filters.rsiMin}-${filters.rsiMax}`}>
          <div className="flex items-center gap-1">
            <input type="number" min={0} max={100} value={filters.rsiMin} onChange={(e) => set("rsiMin", Math.max(0, Math.min(100, Number(e.target.value))))}
              className="bg-input border border-border rounded px-2 py-1 text-xs font-mono w-14 focus:border-primary outline-none" />
            <span className="text-muted-foreground text-xs">–</span>
            <input type="number" min={0} max={100} value={filters.rsiMax} onChange={(e) => set("rsiMax", Math.max(0, Math.min(100, Number(e.target.value))))}
              className="bg-input border border-border rounded px-2 py-1 text-xs font-mono w-14 focus:border-primary outline-none" />
          </div>
        </Field>
        <Field label="≤ % from 52W low">
          <input type="number" value={filters.near52wLowPct ?? ""} onChange={(e) => set("near52wLowPct", e.target.value === "" ? null : Number(e.target.value))} placeholder="—"
            className="bg-input border border-border rounded px-2 py-1 text-xs font-mono w-20 focus:border-primary outline-none" />
        </Field>
        <Field label="Min confidence">
          <select value={filters.minConfidence} onChange={(e) => set("minConfidence", Number(e.target.value))}
            className="bg-input border border-border rounded px-2 py-1 text-xs font-mono w-24 focus:border-primary outline-none">
            <option value={0}>Any</option>
            <option value={60}>Med+</option>
            <option value={85}>High</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={filters.excludeMock} onChange={(e) => set("excludeMock", e.target.checked)} />
          Exclude mock
        </label>
        <button onClick={() => setFilters(DEFAULT_FILTERS)}
          className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded">
          Reset
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ViewToggle({ view, setView }: { view: "table" | "chart"; setView: (v: "table" | "chart") => void }) {
  return (
    <div className="flex border border-border rounded overflow-hidden">
      {(["table", "chart"] as const).map((v) => (
        <button key={v} onClick={() => setView(v)}
          className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {v}
        </button>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="panel p-10 text-center">
      <div className="font-mono text-sm text-primary animate-pulse">LOADING UNIVERSE…</div>
      <div className="text-xs text-muted-foreground mt-2">Fetching ~150 tickers across global markets. This can take 15–30s on first load.</div>
    </div>
  );
}
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="panel p-10 text-center border-destructive/50">
      <div className="font-mono text-sm text-destructive">FAILED TO LOAD UNIVERSE</div>
      <button onClick={onRetry} className="mt-4 font-mono text-xs border border-border px-4 py-2 rounded hover:bg-muted">Retry</button>
    </div>
  );
}
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="panel p-10 text-center">
      <div className="font-mono text-sm text-muted-foreground">No stocks match your filters.</div>
      <button onClick={onReset} className="mt-4 font-mono text-[10px] uppercase tracking-wider border border-primary/50 text-primary px-4 py-2 rounded hover:bg-primary/10">
        Reset filters
      </button>
    </div>
  );
}

// ---------------- table view ----------------
function ResultsTable({ rows, sortBy, sortDir, onSort, selected, toggleSelect, watchlist, onAddOne, onRemoveOne, onOpen }: {
  rows: ScoredRow[];
  sortBy: any; sortDir: "asc" | "desc"; onSort: (k: any) => void;
  selected: Set<string>; toggleSelect: (s: string) => void;
  watchlist: string[]; onAddOne: (s: string) => void; onRemoveOne: (s: string) => void;
  onOpen: (s: string) => void;
}) {
  const Th = ({ k, label, num }: { k: string; label: string; num?: boolean }) => (
    <th className={num ? "text-right" : "text-left"}>
      <button onClick={() => onSort(k)} className="font-medium hover:text-primary inline-flex items-center gap-1">
        {label}
        {sortBy === k && <span className="text-primary">{sortDir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
  return (
    <div className="panel overflow-x-auto">
      <table className="term">
        <thead>
          <tr>
            <th></th>
            <Th k="symbol" label="Ticker" />
            <Th k="name" label="Company" />
            <th>Region</th>
            <Th k="sector" label="Sector" />
            <Th k="price" label="Price" num />
            <Th k="marketCapUsd" label="Mcap (USD)" num />
            <Th k="pe" label="P/E" num />
            <Th k="pctFromLow" label="From 52W Low" num />
            <Th k="perf5d" label="5D %" num />
            <Th k="rsi14" label="RSI" num />
            <Th k="value" label="Value" num />
            <Th k="momentum" label="Mom" num />
            <Th k="quality" label="Qual" num />
            <Th k="risk" label="Risk" num />
            <Th k="confidence" label="Conf" num />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const inWl = watchlist.includes(r.symbol);
            return (
              <tr key={r.symbol} className="hover:bg-primary/5 cursor-pointer" onClick={() => onOpen(r.symbol)}>
                <td onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(r.symbol)} onChange={() => toggleSelect(r.symbol)} />
                </td>
                <td className="text-primary font-mono">{r.symbol}</td>
                <td className="max-w-[160px] truncate" title={r.name}>{r.name}</td>
                <td className="text-muted-foreground">{r.region}</td>
                <td className="text-muted-foreground max-w-[140px] truncate" title={r.sector}>{r.sector}</td>
                <td className="num">{fmtPrice(r.price, r.currency)}</td>
                <td className="num">{fmtMcapUsd(r.marketCapUsd)}</td>
                <td className="num">{fmtNum(r.pe, 1)}</td>
                <td className={`num ${(r.pctFromLow ?? 99) <= 15 ? "text-[color:var(--bull)]" : ""}`}>
                  {r.pctFromLow == null ? "—" : `+${r.pctFromLow.toFixed(1)}%`}
                </td>
                <td className={`num ${colorFor(r.perf5d)}`}>{fmtPct(r.perf5d)}</td>
                <td className={`num ${r.rsi14 == null ? "" : r.rsi14 > 70 ? "text-[color:var(--bear)]" : r.rsi14 < 30 ? "text-[color:var(--bull)]" : ""}`}>
                  {fmtNum(r.rsi14, 0)}
                </td>
                <td className="num"><ScoreCell n={r.scores.value} /></td>
                <td className="num"><ScoreCell n={r.scores.momentum} /></td>
                <td className="num"><ScoreCell n={r.scores.quality} /></td>
                <td className="num"><ScoreCell n={r.scores.risk} invert /></td>
                <td className="num">
                  <span className={`font-mono ${r.scores.confidence >= 85 ? "text-[color:var(--bull)]" : r.scores.confidence >= 60 ? "text-primary" : "text-[color:var(--bear)]"}`}>
                    {r.scores.confidence}
                  </span>
                  {r.isMock && <div className="text-[9px] text-primary uppercase">mock</div>}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => inWl ? onRemoveOne(r.symbol) : onAddOne(r.symbol)}
                    className={`font-mono text-[10px] px-2 py-1 rounded border ${inWl ? "border-[color:var(--bull)]/50 text-[color:var(--bull)]" : "border-border text-muted-foreground hover:text-primary hover:border-primary/40"}`}>
                    {inWl ? "★" : "+ Watch"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScoreCell({ n, invert }: { n: number; invert?: boolean }) {
  const good = invert ? n < 40 : n >= 65;
  const bad = invert ? n >= 65 : n < 40;
  const cls = good ? "text-[color:var(--bull)]" : bad ? "text-[color:var(--bear)]" : "text-foreground";
  return <span className={`font-mono ${cls}`}>{n}</span>;
}

// ---------------- card view ----------------
function ResultsCards({ rows, watchlist, onAddOne, onRemoveOne, onOpen }: {
  rows: ScoredRow[]; watchlist: string[]; onAddOne: (s: string) => void; onRemoveOne: (s: string) => void; onOpen: (s: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {rows.map((r) => {
        const inWl = watchlist.includes(r.symbol);
        return (
          <div key={r.symbol} className="panel p-3 hover:border-primary/40 transition-colors cursor-pointer flex flex-col gap-2"
            onClick={() => onOpen(r.symbol)}>
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-primary text-sm">{r.symbol}</div>
                <div className="text-xs text-muted-foreground truncate" title={r.name}>{r.name}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{fmtPrice(r.price, r.currency)}</div>
                <div className={`font-mono text-[10px] ${colorFor(r.perf5d)}`}>{fmtPct(r.perf5d)}</div>
              </div>
            </div>
            <Sparkline closes={r.closes} />
            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
              <Mini label="P/E" v={fmtNum(r.pe, 1)} />
              <Mini label="RSI" v={fmtNum(r.rsi14, 0)} />
              <Mini label="Mcap" v={fmtMcapUsd(r.marketCapUsd)} />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <Badge label={`V ${r.scores.value}`} tone={r.scores.value >= 65 ? "good" : r.scores.value < 40 ? "bad" : "n"} />
              <Badge label={`M ${r.scores.momentum}`} tone={r.scores.momentum >= 65 ? "good" : r.scores.momentum < 40 ? "bad" : "n"} />
              <Badge label={`Q ${r.scores.quality}`} tone={r.scores.quality >= 65 ? "good" : r.scores.quality < 40 ? "bad" : "n"} />
              <Badge label={r.isMock ? "MOCK" : `C ${r.scores.confidence}`} tone={r.isMock ? "warn" : r.scores.confidence >= 85 ? "good" : "n"} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-2">
              <span>{r.region} · {r.exchange}</span>
              <button onClick={(e) => { e.stopPropagation(); inWl ? onRemoveOne(r.symbol) : onAddOne(r.symbol); }}
                className={`font-mono px-2 py-0.5 rounded border ${inWl ? "border-[color:var(--bull)]/50 text-[color:var(--bull)]" : "border-border hover:text-primary hover:border-primary/40"}`}>
                {inWl ? "★ Watching" : "+ Watch"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Mini({ label, v }: { label: string; v: string }) {
  return (
    <div className="border border-border rounded px-1.5 py-1">
      <div className="text-muted-foreground text-[9px]">{label}</div>
      <div>{v}</div>
    </div>
  );
}
function Badge({ label, tone }: { label: string; tone: "good" | "bad" | "warn" | "n" }) {
  const cls = tone === "good" ? "border-[color:var(--bull)]/50 text-[color:var(--bull)]"
    : tone === "bad" ? "border-[color:var(--bear)]/50 text-[color:var(--bear)]"
    : tone === "warn" ? "border-primary/50 text-primary"
    : "border-border text-muted-foreground";
  return <span className={`px-1.5 py-0.5 rounded border ${cls}`}>{label}</span>;
}

function Sparkline({ closes }: { closes: number[] }) {
  if (!closes || closes.length < 2) {
    return <div className="h-10 flex items-center justify-center text-[10px] text-muted-foreground border border-dashed border-border rounded">No price history</div>;
  }
  const w = 240, h = 40;
  const min = Math.min(...closes), max = Math.max(...closes);
  const range = max - min || 1;
  const step = w / (closes.length - 1);
  const pts = closes.map((c, i) => `${(i * step).toFixed(1)},${(h - ((c - min) / range) * h).toFixed(1)}`).join(" ");
  const up = closes[closes.length - 1] >= closes[0];
  const stroke = up ? "var(--bull)" : "var(--bear)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
}

function Disclaimer() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 text-[11px] text-muted-foreground">
      This analysis is for informational purposes only and is not financial advice. Free-source market data may be delayed, incomplete, adjusted, stale, or unavailable. Mock demo data is clearly labeled and is not live market data. Verify all data independently or consult a qualified financial advisor before making investment decisions.
    </div>
  );
}
function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-[1400px] mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-sm" />
          <span>GLOBAL EQUITY TERMINAL · v2</span>
        </div>
        <div>For research and educational use only.</div>
      </div>
    </footer>
  );
}
