import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HEADER_OFFSET = 112;
const MAX_SCROLL_ATTEMPTS = 24;
const RETRY_INTERVAL_MS = 120;

function decodeHash(hash: string) {
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

function scrollToAnchor(anchorId: string, behavior: ScrollBehavior) {
  const target = document.getElementById(anchorId);
  if (!target) {
    return false;
  }

  const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top: Math.max(top, 0), behavior });
  return true;
}

export function useRouteHashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined" || location.pathname !== "/") {
      return;
    }

    const rawHash = location.hash.replace(/^#/, "");
    if (!rawHash) {
      return;
    }

    const anchorId = decodeHash(rawHash);
    let cancelled = false;
    let attempt = 0;

    const tryScroll = (behavior: ScrollBehavior) => {
      if (cancelled) {
        return;
      }
      if (scrollToAnchor(anchorId, behavior)) {
        return;
      }
      if (attempt >= MAX_SCROLL_ATTEMPTS) {
        return;
      }

      attempt += 1;
      window.setTimeout(() => tryScroll("smooth"), RETRY_INTERVAL_MS);
    };

    const frameId = window.requestAnimationFrame(() => tryScroll("auto"));
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [location.hash, location.pathname]);
}
