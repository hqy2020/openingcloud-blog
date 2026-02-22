import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../../lib/utils";

type SlidingEmphasisTextProps = {
  leadText: string;
  emphasisText: string;
  className?: string;
};

const HIGHLIGHT_STYLE = {
  backgroundPosition: "left center",
  backgroundRepeat: "no-repeat",
  display: "inline",
} as const;

const HIGHLIGHT_CLASSNAME =
  "relative ml-1 inline-block rounded-lg bg-gradient-to-r from-indigo-300 to-purple-300 px-1 pb-1 dark:from-indigo-500 dark:to-purple-500";

export function SlidingEmphasisText({ leadText, emphasisText, className }: SlidingEmphasisTextProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  if (prefersReducedMotion) {
    return (
      <p className={className}>
        <span>{leadText}</span>
        <span
          className={cn(HIGHLIGHT_CLASSNAME, "font-extrabold")}
          style={{ ...HIGHLIGHT_STYLE, backgroundSize: "100% 100%" }}
        >
          {emphasisText}
        </span>
      </p>
    );
  }

  return (
    <motion.p
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <span>{leadText}</span>
      <motion.span
        className={cn(HIGHLIGHT_CLASSNAME, "font-extrabold")}
        style={{ ...HIGHLIGHT_STYLE, backgroundSize: "0% 100%" }}
        initial={{ opacity: 0, x: 18, backgroundSize: "0% 100%" }}
        whileInView={{ opacity: 1, x: 0, backgroundSize: "100% 100%" }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 2, ease: "linear", delay: 0.5 }}
      >
        {emphasisText}
      </motion.span>
    </motion.p>
  );
}
