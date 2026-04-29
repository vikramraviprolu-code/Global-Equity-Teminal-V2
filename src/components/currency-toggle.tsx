import { useDisplayCurrency } from "@/hooks/use-display-currency";

export function CurrencyToggle() {
  const [mode, setMode] = useDisplayCurrency();
  const opts: { v: "local" | "USD"; label: string; title: string }[] = [
    { v: "local", label: "LOC", title: "Show prices in each stock's local currency" },
    { v: "USD", label: "USD", title: "Convert all prices to US dollars" },
  ];
  return (
    <div
      role="group"
      aria-label="Display currency"
      className="inline-flex border border-border rounded overflow-hidden font-mono text-[10px] tracking-wider"
    >
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          title={o.title}
          aria-pressed={mode === o.v}
          onClick={() => setMode(o.v)}
          className={`px-2 py-1 transition-colors ${
            mode === o.v
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
