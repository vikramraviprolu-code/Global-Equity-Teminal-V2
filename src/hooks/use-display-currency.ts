import { useEffect, useState } from "react";

export type DisplayMode = "local" | "USD";
const KEY = "get.displayCurrency";

function read(): DisplayMode {
  if (typeof window === "undefined") return "local";
  const v = window.localStorage.getItem(KEY);
  return v === "USD" ? "USD" : "local";
}

const listeners = new Set<(m: DisplayMode) => void>();
function emit(m: DisplayMode) {
  for (const l of listeners) l(m);
}

export function setDisplayCurrency(m: DisplayMode) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, m);
  emit(m);
}

export function useDisplayCurrency(): [DisplayMode, (m: DisplayMode) => void] {
  const [mode, setMode] = useState<DisplayMode>(() => read());
  useEffect(() => {
    setMode(read());
    const fn = (m: DisplayMode) => setMode(m);
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setMode(read());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return [mode, setDisplayCurrency];
}

/**
 * Compute the FX rate from a row's local market cap to USD.
 * Returns null if either is missing or zero.
 */
export function fxToUsd(marketCap: number | null | undefined, marketCapUsd: number | null | undefined): number | null {
  if (!marketCap || !marketCapUsd || marketCap <= 0) return null;
  return marketCapUsd / marketCap;
}

/** Convert a local-currency value to USD using the row's implicit FX. */
export function toUsd(value: number | null | undefined, fx: number | null): number | null {
  if (value == null || fx == null) return null;
  return value * fx;
}
