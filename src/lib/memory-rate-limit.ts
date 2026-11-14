// Used when Redis cannot answer: each server counts requests itself, so the site stays
// up and the LLM budget is still protected. The count is per server, not shared.
type Window = { count: number; resetAt: number };

export function createMemoryLimiter(limit: number, windowMs: number, maxKeys = 10_000) {
  const windows = new Map<string, Window>();

  return function allow(key: string, now = Date.now()): boolean {
    if (windows.size >= maxKeys) {
      for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
      if (windows.size >= maxKeys) windows.clear();
    }

    const current = windows.get(key);
    if (!current || current.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  };
}
