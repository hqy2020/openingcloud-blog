import type { WikiQuoteItem } from "../api/home";

const CACHE_KEY = "quotes_pool_v1";
const CACHE_TTL_MS = 60 * 60 * 1000;

type CacheShape = { pool: WikiQuoteItem[]; savedAt: number };

export function saveQuotesPool(pool: WikiQuoteItem[]): void {
  if (typeof window === "undefined") return;
  if (!pool || pool.length === 0) return;
  try {
    const payload: CacheShape = { pool, savedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // storage quota / disabled — ignore
  }
}

export function loadCachedQuotesPool(): WikiQuoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed?.pool) return [];
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return parsed.pool;
    return parsed.pool;
  } catch {
    return [];
  }
}

export function pickRandomQuote(
  pool: WikiQuoteItem[] | undefined,
  tier?: WikiQuoteItem["tier"],
): WikiQuoteItem | null {
  if (!pool || pool.length === 0) return null;
  const candidates = tier ? pool.filter((q) => q.tier === tier) : pool;
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function pickRandomQuotes(
  pool: WikiQuoteItem[] | undefined,
  n: number,
  tier?: WikiQuoteItem["tier"],
): WikiQuoteItem[] {
  if (!pool || pool.length === 0) return [];
  const candidates = tier ? pool.filter((q) => q.tier === tier) : [...pool];
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, Math.min(n, candidates.length));
}
