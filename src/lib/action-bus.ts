/**
 * Tiny pub/sub for global keyboard-driven actions (e.g. press "e" to export
 * the current view). Components subscribe to a named action while mounted;
 * shortcut handler fires it.
 */
type Handler = () => void;
const bus = new Map<string, Set<Handler>>();

export function onAction(name: string, handler: Handler): () => void {
  let set = bus.get(name);
  if (!set) {
    set = new Set();
    bus.set(name, set);
  }
  set.add(handler);
  return () => {
    set!.delete(handler);
    if (set!.size === 0) bus.delete(name);
  };
}

export function fireAction(name: string): boolean {
  const set = bus.get(name);
  if (!set || set.size === 0) return false;
  // Latest subscriber wins (most recently mounted view)
  const handlers = Array.from(set);
  handlers[handlers.length - 1]();
  return true;
}

export function hasAction(name: string): boolean {
  const set = bus.get(name);
  return !!set && set.size > 0;
}
