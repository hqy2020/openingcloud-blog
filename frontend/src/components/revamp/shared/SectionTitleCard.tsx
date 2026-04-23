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
      className="mb-5 w-full rounded-claude-lg bg-claude-near-black px-6 py-7 shadow-whisper sm:px-8 sm:py-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 shrink-0">
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.5em] text-claude-warm-silver/80">
            {category}
          </span>
          <h2
            className="mt-2 font-serif text-3xl font-medium leading-[1.1] tracking-normal sm:text-4xl"
            style={{ color: accentColor }}
          >
            {title}
          </h2>
          {meta ? (
            <span className="mt-2 block font-sans text-xs font-normal text-claude-warm-silver/70">
              {meta}
            </span>
          ) : null}
        </div>

        {tagline ? (
          <p className="max-w-md font-serif text-[15px] leading-[1.6] text-claude-warm-silver sm:text-right">
            {tagline}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
