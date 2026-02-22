import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { MouseEvent } from "react";

export type DirectionAwareTabItem = {
  id: string;
  label: string;
};

type HoverDirection = "left" | "right" | "top" | "bottom";

type DirectionAwareTabsProps = {
  items: DirectionAwareTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
};

function resolveHoverDirection(event: MouseEvent<HTMLButtonElement>): HoverDirection {
  const rect = event.currentTarget.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;
  const fromLeft = offsetX;
  const fromRight = rect.width - offsetX;
  const fromTop = offsetY;
  const fromBottom = rect.height - offsetY;
  const min = Math.min(fromLeft, fromRight, fromTop, fromBottom);
  if (min === fromLeft) return "left";
  if (min === fromRight) return "right";
  if (min === fromTop) return "top";
  return "bottom";
}

function hoverMotion(direction: HoverDirection) {
  if (direction === "left") {
    return { initial: { x: -18, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 18, opacity: 0 } };
  }
  if (direction === "right") {
    return { initial: { x: 18, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -18, opacity: 0 } };
  }
  if (direction === "top") {
    return { initial: { y: -14, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 14, opacity: 0 } };
  }
  return { initial: { y: 14, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -14, opacity: 0 } };
}

export function DirectionAwareTabs({ items, activeId, onSelect, className }: DirectionAwareTabsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverDirection, setHoverDirection] = useState<HoverDirection>("left");

  const activeSet = useMemo(() => new Set([activeId]), [activeId]);

  return (
    <div className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/88 p-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${className ?? ""}`}>
      {items.map((item) => {
        const active = activeSet.has(item.id);
        const hoverState = hoverMotion(hoverDirection);
        const showHover = hoveredId === item.id && !active;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            onMouseEnter={(event) => {
              setHoveredId(item.id);
              setHoverDirection(resolveHoverDirection(event));
            }}
            onMouseLeave={() => setHoveredId((prev) => (prev === item.id ? null : prev))}
            className="relative overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-pressed={active}
          >
            <AnimatePresence>
              {showHover ? (
                <motion.span
                  key={`${item.id}-${hoverDirection}`}
                  className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(135deg,rgba(79,106,229,0.14),rgba(79,106,229,0.06))]"
                  initial={hoverState.initial}
                  animate={hoverState.animate}
                  exit={hoverState.exit}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                />
              ) : null}
            </AnimatePresence>

            {active ? (
              <motion.span
                layoutId="direction-tabs-active-pill"
                className="absolute inset-0 rounded-xl border border-slate-300/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(79,106,229,0.16))] shadow-[0_8px_14px_rgba(15,23,42,0.12)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className={`relative ${active ? "text-[#4F6AE5]" : ""}`}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
