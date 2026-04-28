import { useEffect, useState, useCallback } from "react";

const KEY = "get-v2:watchlist:My Watchlist";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function useWatchlist() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(read());
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setItems(read()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = (next: string[]) => {
    setItems(next);
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = useCallback((symbols: string[]) => {
    const next = Array.from(new Set([...read(), ...symbols]));
    persist(next);
    return next;
  }, []);
  const remove = useCallback((symbol: string) => {
    persist(read().filter((s) => s !== symbol));
  }, []);
  const has = useCallback((symbol: string) => items.includes(symbol), [items]);

  return { items, add, remove, has };
}
