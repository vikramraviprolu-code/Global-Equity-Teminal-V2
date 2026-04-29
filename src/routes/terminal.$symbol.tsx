import { createFileRoute, notFound } from "@tanstack/react-router";
import { TerminalPage } from "@/components/terminal/terminal-page";
import { analyzeTicker } from "@/server/analyze";
import { fmtPrice, fmtMcapUsd, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/terminal/$symbol")({
  loader: async ({ params }) => {
    const sym = params.symbol.toUpperCase();
    const result = await analyzeTicker({ data: { ticker: sym } });
    if ("error" in result) throw notFound();
    const t = result.target;
    return {
      symbol: sym,
      companyName: t.companyName,
      sector: t.sector,
      industry: t.industry,
      exchange: t.fullExchange ?? t.exchange ?? null,
      country: t.country,
      currency: t.currency,
      price: t.price,
      marketCapUsd: t.marketCapUsd,
      perf5d: t.perf5d,
      rec: t.recommendation.rec,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Stock Analysis — Global Equity Terminal" }] };
    }
    const d = loaderData;
    const priceStr = fmtPrice(d.price, d.currency);
    const mcapStr = fmtMcapUsd(d.marketCapUsd);
    const perfStr = fmtPct(d.perf5d);
    const title = `${d.symbol} · ${d.companyName} — Stock Analysis · ${d.rec}`;
    const description = `${d.companyName} (${d.symbol}) on ${d.exchange ?? d.country ?? "global markets"}. Price ${priceStr}, market cap ${mcapStr}, 5D ${perfStr}. Sector: ${d.sector ?? "—"}. Evidence-based Buy/Hold/Avoid recommendation: ${d.rec}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [
        { rel: "canonical", href: `https://rankaisolutions.tech/terminal/${d.symbol}` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialProduct",
            name: `${d.companyName} (${d.symbol})`,
            url: `https://rankaisolutions.tech/terminal/${d.symbol}`,
            category: d.sector ?? undefined,
            description,
          }),
        },
      ],
    };
  },
  component: SymbolTerminalPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center font-mono text-sm text-destructive">
      Failed to analyze: {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center font-mono text-sm text-muted-foreground">
      Symbol not found. Try a different ticker (e.g. AAPL, RELIANCE.NS, 7203.T).
    </div>
  ),
});

function SymbolTerminalPage() {
  const { symbol } = Route.useParams();
  // Reuse the existing terminal UI — pass the symbol via a stable key so it
  // remounts and auto-analyzes when the URL ticker changes.
  return <TerminalPage key={symbol} initialTicker={symbol} />;
}
