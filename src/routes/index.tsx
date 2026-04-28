import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Global Equity Terminal — Evidence-Based Stock Research" },
      { name: "description", content: "A Bloomberg-inspired research terminal for global equities. Value screens, momentum signals, and cross-analysis across US, India, Europe, and Asia-Pacific markets." },
      { property: "og:title", content: "Global Equity Terminal — Evidence-Based Stock Research" },
      { property: "og:description", content: "Value screens, momentum signals, and region-aware peer analysis on stocks across global markets." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Hero />
        <Markets />
        <Features />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function NavBar() {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-sm" />
          <span className="font-mono text-sm tracking-widest text-primary">GLOBAL&nbsp;EQUITY&nbsp;TERMINAL</span>
        </div>
        <nav className="ml-auto flex items-center gap-6 text-xs font-mono uppercase tracking-wider">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Features</a>
          <a href="#markets" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Markets</a>
          <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">How it works</a>
          <Link to="/terminal" className="bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90">
            Launch&nbsp;Terminal
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 border border-border rounded px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--bull)] animate-pulse" />
            Live · Region-aware peer screening
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
            Evidence-based research for <span className="text-primary">global equities</span>.
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl">
            A terminal-style workbench for serious investors. Run value screens, momentum analysis, and cross-screen recommendations on stocks across the US, India, Europe, Japan, Hong Kong, Korea, Taiwan, Singapore, Australia, and Greater China — in their native currency.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/terminal" className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider px-5 py-3 rounded hover:opacity-90">
              Launch Terminal →
            </Link>
            <a href="#features" className="border border-border text-foreground font-mono text-xs uppercase tracking-wider px-5 py-3 rounded hover:bg-muted">
              See features
            </a>
          </div>
          <div className="mt-6 text-[11px] font-mono text-muted-foreground">No sign-up · Free to use · Educational use only</div>
        </div>

        <div className="panel">
          <div className="panel-header">DEMO · AAPL · NASDAQ</div>
          <div className="p-4 font-mono text-xs space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-muted-foreground text-[10px] tracking-wider">PRICE</div>
                <div className="text-2xl text-primary">$214.32</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground text-[10px] tracking-wider">5D</div>
                <div className="text-[color:var(--bull)]">+2.41%</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground text-[10px] tracking-wider">RSI</div>
                <div>58.7</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground text-[10px] tracking-wider">MCAP</div>
                <div>$3.27T</div>
              </div>
            </div>
            <div className="border-t border-border pt-3 grid grid-cols-2 gap-2">
              <Row label="Liquidity" value="✅ PASS" cls="text-[color:var(--bull)]" />
              <Row label="Value Screen" value="❌ FAIL" cls="text-[color:var(--bear)]" />
              <Row label="Momentum" value="↑ Positive" />
              <Row label="vs MA200" value="↑ Above" />
              <Row label="Recommendation" value="Watch" cls="text-primary" />
              <Row label="Confidence" value="Medium" />
            </div>
            <div className="border-t border-border pt-2 text-[10px] text-muted-foreground">
              Sample preview · live data on the terminal
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex justify-between border border-border rounded px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cls}>{value}</span>
    </div>
  );
}

function Markets() {
  const markets = [
    ["USA", "NYSE · NASDAQ"],
    ["India", "NSE · BSE"],
    ["Japan", "TSE"],
    ["Hong Kong", "HKEX"],
    ["Germany", "Xetra"],
    ["Korea", "KRX"],
    ["Taiwan", "TWSE"],
    ["Australia", "ASX"],
    ["Singapore", "SGX"],
    ["UK", "LSE"],
  ];
  return (
    <section id="markets" className="border-b border-border bg-card/40">
      <div className="max-w-[1400px] mx-auto px-4 py-14">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="font-mono text-xs uppercase tracking-widest text-primary">Markets Covered</h2>
          <span className="text-xs text-muted-foreground">10+ exchanges · region-aware filters</span>
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {markets.map(([c, e]) => (
            <div key={c} className="border border-border rounded p-3 hover:border-primary/50 transition-colors">
              <div className="font-mono text-sm text-foreground">{c}</div>
              <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{e}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: "Value Screening",
      desc: "Trailing P/E, distance from 52-week low, and peer-relative valuation against same-industry, same-region cohorts.",
    },
    {
      title: "Momentum Signals",
      desc: "RSI, ROC over 14/21 days, and price relative to 20/50/200-day moving averages — all in one snapshot.",
    },
    {
      title: "Cross-Analysis",
      desc: "Find names that pass both value and momentum screens. The overlap is your shortlist of evidence-backed ideas.",
    },
    {
      title: "Smart Peer Groups",
      desc: "Industry → country → region → global fallback ensures you're always comparing against the right cohort.",
    },
    {
      title: "Native Currency",
      desc: "Prices in local currency. Market cap normalized to USD so cross-market comparison is honest.",
    },
    {
      title: "Final Recommendation",
      desc: "Buy / Watch / Avoid with explicit confidence level, outlook, and the specific evidence that drove it.",
    },
  ];
  return (
    <section id="features" className="border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 py-16">
        <h2 className="font-mono text-xs uppercase tracking-widest text-primary">Features</h2>
        <p className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight max-w-2xl">
          Everything you need to research a stock — without the noise.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="panel p-5 hover:border-primary/50 transition-colors">
              <div className="font-mono text-xs uppercase tracking-wider text-primary">{f.title}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["01", "Search", "Enter a ticker or company name. We resolve listings across global exchanges and let you pick the right one."],
    ["02", "Analyze", "We pull price, fundamentals, peers, and indicators — then run value, momentum, and cross-screens in seconds."],
    ["03", "Decide", "Read the snapshot, dig into each tab, and take the recommendation with the evidence that backs it."],
  ];
  return (
    <section id="how" className="border-b border-border bg-card/40">
      <div className="max-w-[1400px] mx-auto px-4 py-16">
        <h2 className="font-mono text-xs uppercase tracking-widest text-primary">How it works</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map(([n, t, d]) => (
            <div key={n} className="panel p-5">
              <div className="font-mono text-3xl text-primary/80">{n}</div>
              <div className="mt-2 font-mono text-sm uppercase tracking-wider">{t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to run your first analysis?</h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Open the terminal and type a ticker — AAPL, RELIANCE.NS, 7203.T, BMW.DE, or anything else. No account required.
        </p>
        <div className="mt-8">
          <Link to="/terminal" className="inline-block bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider px-6 py-3 rounded hover:opacity-90">
            Launch Terminal →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-[1400px] mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-sm" />
          <span>GLOBAL&nbsp;EQUITY&nbsp;TERMINAL · v2.0</span>
        </div>
        <div className="text-[11px]">For research and educational use only. Not investment advice.</div>
      </div>
    </footer>
  );
}
