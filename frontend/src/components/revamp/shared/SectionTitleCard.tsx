import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

type SectionTitleCardProps = {
  category: string;
  title: string;
  /** Ignored — kept for backwards compatibility; the theme's accent is used instead. */
  accentColor?: string;
  tagline?: string;
  meta?: string;
};

export function SectionTitleCard({ category, title, tagline, meta }: SectionTitleCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();

  const shouldAnimate = !prefersReducedMotion && inView;
  const ease = [0.25, 0.46, 0.45, 0.94] as const;

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease }}
      className="group relative mb-5 overflow-hidden rounded-[calc(var(--theme-radius)+10px)] border border-theme-line/80 bg-theme-surface shadow-[0_18px_42px_rgba(15,23,42,0.08)] sm:shadow-[0_24px_60px_rgba(15,23,42,0.1)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.88),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.18),transparent_54%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-theme-accent/40 to-transparent" />

      <div className="relative flex min-w-0 flex-col gap-4 px-6 py-6 sm:px-8 sm:py-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border border-theme-line bg-theme-surface-raised/90 px-3 py-1 font-theme-sans text-[10px] font-semibold uppercase tracking-[0.32em] text-theme-soft"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.45, ease, delay: 0.1 }}
          >
            <span className="h-2 w-2 rounded-full bg-theme-accent" />
            {category}
          </motion.span>
          <motion.h2
            className="mt-4 font-theme-display text-3xl font-semibold leading-[1.02] tracking-[-0.03em] text-theme-ink sm:text-4xl xl:text-[3.2rem]"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.55, ease, delay: 0.18 }}
          >
            {title}
          </motion.h2>
          {tagline ? (
            <motion.p
              className="mt-3 max-w-2xl font-theme-body text-[15px] leading-7 text-theme-muted sm:text-base"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={shouldAnimate ? { opacity: 1 } : undefined}
              transition={{ duration: 0.6, ease, delay: 0.28 }}
            >
              {tagline}
            </motion.p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-3 lg:items-end">
          {meta ? (
            <motion.span
              className="inline-flex rounded-full border border-theme-line bg-theme-surface-raised/90 px-4 py-2 font-theme-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-theme-soft"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={shouldAnimate ? { opacity: 1 } : undefined}
              transition={{ duration: 0.5, ease, delay: 0.34 }}
            >
              {meta}
            </motion.span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
