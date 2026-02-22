import { useEffect, useState } from "react";

const CACHE_KEY = "gh_followers";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

type CacheEntry = {
  count: number;
  ts: number;
};

function readCache(handle: string): number | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY}:${handle}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts < CACHE_TTL) return entry.count;
    sessionStorage.removeItem(`${CACHE_KEY}:${handle}`);
  } catch {
    /* corrupt cache — ignore */
  }
  return null;
}

function writeCache(handle: string, count: number) {
  try {
    const entry: CacheEntry = { count, ts: Date.now() };
    sessionStorage.setItem(`${CACHE_KEY}:${handle}`, JSON.stringify(entry));
  } catch {
    /* storage full — ignore */
  }
}

/**
 * Fetch GitHub followers count for a given handle.
 * Returns `null` while loading or on error (button stays usable, just no badge).
 * Uses sessionStorage to avoid hitting the 60 req/h unauthenticated rate limit.
 */
export function useGithubFollowers(handle: string): number | null {
  const cached = readCache(handle);
  const [count, setCount] = useState<number | null>(cached);

  useEffect(() => {
    if (!handle) return;

    // Cache hit — skip network
    if (readCache(handle) !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCount(readCache(handle));
      return;
    }

    let active = true;

    fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        return res.json();
      })
      .then((data: { followers?: number }) => {
        if (!active) return;
        const followers = typeof data.followers === "number" ? data.followers : null;
        if (followers !== null) {
          writeCache(handle, followers);
        }
        setCount(followers);
      })
      .catch(() => {
        // Silent degradation — button still works, just no number
      });

    return () => {
      active = false;
    };
  }, [handle]);

  return count;
}
