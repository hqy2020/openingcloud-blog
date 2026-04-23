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
  const ease = [0.25, 0.46, 0.45, 0.94] as const;

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease }}
      className="mb-5 flex w-full items-start gap-5 rounded-claude-lg border border-claude-border-cream bg-claude-ivory px-6 py-7 shadow-whisper sm:px-8 sm:py-8"
    >
      <motion.div
        aria-hidden="true"
        className="mt-1 h-14 w-[3px] flex-shrink-0 origin-top rounded-full sm:h-16"
        style={{ background: accentColor }}
        initial={prefersReducedMotion ? false : { scaleY: 0 }}
        animate={shouldAnimate ? { scaleY: 1 } : undefined}
        transition={{ duration: 0.6, ease, delay: 0.05 }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 shrink-0">
          <motion.span
            className="block font-sans text-[10px] font-medium uppercase tracking-[0.5em] text-claude-stone-gray"
            initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.5, ease, delay: 0.15 }}
          >
            {category}
          </motion.span>
          <motion.h2
            className="mt-2 font-serif text-3xl font-medium leading-[1.1] tracking-normal sm:text-4xl"
            style={{ color: accentColor }}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.55, ease, delay: 0.22 }}
          >
            {title}
          </motion.h2>
          {meta ? (
            <motion.span
              className="mt-2 block font-sans text-xs font-normal text-claude-stone-gray"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={shouldAnimate ? { opacity: 1 } : undefined}
              transition={{ duration: 0.5, ease, delay: 0.32 }}
            >
              {meta}
            </motion.span>
          ) : null}
        </div>

        {tagline ? (
          <motion.p
            className="max-w-md font-serif text-[15px] leading-[1.6] text-claude-olive-gray sm:text-right"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            transition={{ duration: 0.6, ease, delay: 0.35 }}
          >
            {tagline}
          </motion.p>
        ) : null}
      </div>
    </motion.div>
  );
}
