import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HEADER_OFFSET = 112;
const MAX_LOOKUP_ATTEMPTS = 24;
const MAX_ALIGNMENT_PASSES = 18;
const REQUIRED_STABLE_PASSES = 3;
const POSITION_TOLERANCE = 3;
const RETRY_INTERVAL_MS = 120;

function decodeHash(hash: string) {
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

function getElementDocumentTop(target: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = target;

  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }

  return top;
}

function getAnchorTop(anchorId: string) {
  const target = document.getElementById(anchorId);
  if (!target) {
    return null;
  }

  return Math.max(getElementDocumentTop(target) - HEADER_OFFSET, 0);
}

function scrollToAnchor(anchorId: string, behavior: ScrollBehavior) {
  const top = getAnchorTop(anchorId);
  if (top === null) {
    return null;
  }

  window.scrollTo({ top, behavior });
  return top;
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
    let lookupAttempt = 0;
    let alignmentPass = 0;
    let stablePasses = 0;

    const tryScroll = (behavior: ScrollBehavior) => {
      if (cancelled) {
        return;
      }

      const nextTop = scrollToAnchor(anchorId, behavior);
      if (nextTop === null) {
        if (lookupAttempt >= MAX_LOOKUP_ATTEMPTS) {
          return;
        }

        lookupAttempt += 1;
        window.setTimeout(() => tryScroll("auto"), RETRY_INTERVAL_MS);
        return;
      }

      const delta = Math.abs(window.scrollY - nextTop);
      stablePasses = delta <= POSITION_TOLERANCE ? stablePasses + 1 : 0;

      // Home content keeps settling after async data and media render, so keep
      // nudging the anchor into place for a short window instead of stopping on
      // the first successful hit.
      if (stablePasses >= REQUIRED_STABLE_PASSES || alignmentPass >= MAX_ALIGNMENT_PASSES) {
        return;
      }

      alignmentPass += 1;
      window.setTimeout(() => tryScroll("auto"), RETRY_INTERVAL_MS);
    };

    const frameId = window.requestAnimationFrame(() => tryScroll("auto"));
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [location.hash, location.pathname]);
}
