import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

type SectionTitleCardProps = {
  category: string;
  title: string;
  accentColor: string;
  tagline?: string;
  meta?: string;
};

export function SectionTitleCard({ category, title, accentColor, tagline, meta }: SectionTitleCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();

  const shouldAnimate = !prefersReducedMotion && inView;

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-5 w-full rounded-[1.25rem] bg-slate-800 px-6 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.25)] sm:px-8 sm:py-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {/* Left: category + title */}
        <div className="min-w-0 shrink-0">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            {category}
          </span>
          <h2
            className="mt-1 text-3xl font-bold leading-tight sm:text-4xl"
            style={{ color: accentColor }}
          >
            {title}
          </h2>
          {meta ? (
            <span className="mt-1 block text-xs font-medium text-slate-400">{meta}</span>
          ) : null}
        </div>

        {/* Right: tagline fills remaining space */}
        {tagline ? (
          <p className="max-w-md text-sm leading-relaxed text-slate-400/90 sm:text-right">
            {tagline}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
