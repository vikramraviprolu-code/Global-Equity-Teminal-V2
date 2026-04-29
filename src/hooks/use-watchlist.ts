import { useEffect, useState, useCallback } from "react";

export type WatchlistName = "My Watchlist" | "Value Candidates" | "Momentum Candidates";
export const WATCHLIST_NAMES: WatchlistName[] = ["My Watchlist", "Value Candidates", "Momentum Candidates"];

const keyFor = (name: WatchlistName) => `get-v2:watchlist:${name}`;
const LEGACY_KEY = "get-v2:watchlist:My Watchlist";

function read(name: WatchlistName): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(keyFor(name)) || "[]"); } catch { return []; }
}
function write(name: WatchlistName, items: string[]) {
  if (typeof window !== "undefined") localStorage.setItem(keyFor(name), JSON.stringify(items));
}

/** Multi-watchlist hook scoped to a particular list. */
export function useWatchlistNamed(name: WatchlistName) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(read(name));
    const onStorage = (e: StorageEvent) => { if (e.key === keyFor(name)) setItems(read(name)); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [name]);

  const persist = (next: string[]) => { setItems(next); write(name, next); };

  const add = useCallback((symbols: string[]) => {
    const next = Array.from(new Set([...read(name), ...symbols]));
    persist(next);
    return next;
  }, [name]);
  const remove = useCallback((symbol: string) => {
    persist(read(name).filter((s) => s !== symbol));
  }, [name]);
  const has = useCallback((symbol: string) => items.includes(symbol), [items]);
  const clear = useCallback(() => persist([]), [name]);

  return { items, add, remove, has, clear };
}

/** Back-compat default hook → "My Watchlist". (legacy key === keyFor("My Watchlist")) */
export function useWatchlist() {
  return useWatchlistNamed("My Watchlist");
}

/** Read all watchlists (used by Compare and counters). */
export function readAllWatchlists(): Record<WatchlistName, string[]> {
  return {
    "My Watchlist": read("My Watchlist"),
    "Value Candidates": read("Value Candidates"),
    "Momentum Candidates": read("Momentum Candidates"),
  };
}
