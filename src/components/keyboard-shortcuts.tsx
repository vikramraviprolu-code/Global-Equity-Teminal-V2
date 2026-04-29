import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { fireAction } from "@/lib/action-bus";

type Shortcut = { keys: string; label: string };
const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: "Navigation",
    items: [
      { keys: "g s", label: "Go to Screener" },
      { keys: "g t", label: "Go to Analysis Terminal" },
      { keys: "g w", label: "Go to Watchlists" },
      { keys: "g c", label: "Go to Compare" },
      { keys: "g e", label: "Go to Events" },
      { keys: "g q", label: "Go to Data Quality" },
    ],
  },
  {
    group: "Actions",
    items: [
      { keys: "⌘ K", label: "Open AI co-pilot (or Ctrl+K)" },
      { keys: "/", label: "Focus search / ticker input" },
      { keys: "e", label: "Export / download current view" },
      { keys: "?", label: "Show this shortcuts overlay" },
      { keys: "Esc", label: "Close overlay" },
    ],
  },
];

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function KeyboardShortcuts() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const gPending = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Esc always closes the overlay, even from inputs
      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      if (isTypingTarget(e.target)) return;

      // "?" — show overlay (works without shift on most layouts via key=='?')
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }

      // "/" focus the first input on the page
      if (e.key === "/") {
        const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          'input[type="search"], input[type="text"], input:not([type])',
        );
        if (input) {
          e.preventDefault();
          input.focus();
          input.select?.();
        }
        return;
      }

      // "e" — fire export action if subscribed
      if (e.key === "e") {
        if (fireAction("export")) e.preventDefault();
        return;
      }

      // Two-key "g X" sequences
      if (e.key === "g") {
        if (gPending.current) window.clearTimeout(gPending.current);
        gPending.current = window.setTimeout(() => {
          gPending.current = null;
        }, 900);
        return;
      }
      if (gPending.current) {
        window.clearTimeout(gPending.current);
        gPending.current = null;
        const map: Record<string, string> = {
          s: "/",
          t: "/terminal",
          w: "/watchlist",
          c: "/compare",
          e: "/events",
          q: "/data-quality",
        };
        const dest = map[e.key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          navigate({ to: dest as any });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, navigate]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="panel w-full max-w-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-primary">Keyboard Shortcuts</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Press <Kbd>?</Kbd> any time to toggle</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
            aria-label="Close shortcuts"
          >
            ESC ✕
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SHORTCUTS.map((g) => (
            <div key={g.group}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{g.group}</div>
              <ul className="space-y-1.5">
                {g.items.map((s) => (
                  <li key={s.keys} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{s.label}</span>
                    <span className="flex gap-1">
                      {s.keys.split(" ").map((k, i) => (
                        <Kbd key={i}>{k}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[10px] text-foreground">
      {children}
    </kbd>
  );
}
