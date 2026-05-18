import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type DockItem = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  external?: boolean;
  matchPaths?: string[];
  matchHashes?: string[];
};

type MagicDockProps = {
  items: DockItem[];
  pathname: string;
  hash?: string;
  className?: string;
};

function normalizeHash(hash?: string) {
  return hash?.replace(/^#/, "") ?? "";
}

function isItemActive(item: DockItem, pathname: string, hash?: string) {
  const currentHash = normalizeHash(hash);

  if (pathname === "/" && currentHash) {
    return Array.isArray(item.matchHashes) ? item.matchHashes.includes(currentHash) : false;
  }

  if (Array.isArray(item.matchHashes) && item.matchHashes.includes(currentHash) && pathname === "/") {
    return true;
  }

  if (!Array.isArray(item.matchPaths) || item.matchPaths.length === 0) {
    return false;
  }
  return item.matchPaths.some((path) => path === pathname);
}

function ItemContent({ item, active }: { item: DockItem; active: boolean }) {
  return (
    <motion.span
      className={`group relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-lg transition sm:h-[3.25rem] sm:w-[3.25rem] ${
        active
          ? "border-theme-line-strong bg-theme-surface-raised text-theme-ink"
          : "border-theme-line/90 bg-theme-surface text-theme-muted"
      }`}
      style={{
        boxShadow: active ? "var(--theme-shadow-lifted)" : "var(--theme-shadow-whisper)",
      }}
      whileHover={{ scale: 1.14, y: -3 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <span aria-hidden="true">{item.icon}</span>
      <span className="sr-only">{item.label}</span>
    </motion.span>
  );
}

export function MagicDock({ items, pathname, hash, className }: MagicDockProps) {
  return (
    <nav
      aria-label="Dock 导航"
      className={`fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 pb-[max(0px,env(safe-area-inset-bottom))] ${className ?? ""}`}
    >
      <div
        className="rounded-3xl border border-theme-line/85 bg-theme-surface p-2"
        style={{ boxShadow: "var(--theme-shadow-lifted)" }}
      >
        <ul className="flex items-center gap-2">
          {items.map((item) => {
            const active = isItemActive(item, pathname, hash);
            const sharedClassName = "inline-flex items-center justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-line";
            return (
              <li key={item.id}>
                {item.external ? (
                  <a
                    className={sharedClassName}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    title={item.label}
                  >
                    <ItemContent item={item} active={active} />
                  </a>
                ) : (
                  <Link className={sharedClassName} to={item.href} aria-label={item.label} title={item.label}>
                    <ItemContent item={item} active={active} />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
