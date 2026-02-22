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
};

type MagicDockProps = {
  items: DockItem[];
  pathname: string;
  className?: string;
};

function isItemActive(item: DockItem, pathname: string) {
  if (!item.matchPaths || item.matchPaths.length === 0) {
    return false;
  }
  return item.matchPaths.some((path) => path === pathname);
}

function ItemContent({ item, active }: { item: DockItem; active: boolean }) {
  return (
    <motion.span
      className={`group relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-lg transition sm:h-[3.25rem] sm:w-[3.25rem] ${
        active
          ? "border-slate-300 bg-white text-slate-900 shadow-[0_10px_20px_rgba(15,23,42,0.16)]"
          : "border-slate-200/90 bg-white/84 text-slate-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
      }`}
      whileHover={{ scale: 1.14, y: -3 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <span aria-hidden="true">{item.icon}</span>
      <span className="sr-only">{item.label}</span>
    </motion.span>
  );
}

export function MagicDock({ items, pathname, className }: MagicDockProps) {
  return (
    <nav
      aria-label="Dock 导航"
      className={`fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 pb-[max(0px,env(safe-area-inset-bottom))] ${className ?? ""}`}
    >
      <div className="rounded-3xl border border-slate-200/85 bg-white/82 p-2 backdrop-blur-xl shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
        <ul className="flex items-center gap-2">
          {items.map((item) => {
            const active = isItemActive(item, pathname);
            const sharedClassName = "inline-flex items-center justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400";
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
