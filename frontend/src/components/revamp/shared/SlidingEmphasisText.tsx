import { motion, useReducedMotion } from "motion/react";

type SlidingEmphasisTextProps = {
  leadText: string;
  emphasisText: string;
  className?: string;
};

const EMPHASIS_STYLE = {
  backgroundImage: "linear-gradient(90deg, #F4B56A, #F4B56A)",
  backgroundPosition: "left center",
  backgroundRepeat: "no-repeat",
  color: "#111827",
} as const;

export function SlidingEmphasisText({ leadText, emphasisText, className }: SlidingEmphasisTextProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  if (prefersReducedMotion) {
    return (
      <p className={className}>
        <span>{leadText}</span>
        <span
          className="ml-1 inline box-decoration-clone rounded-[12px] px-[0.32em] py-[0.12em] font-extrabold"
          style={{ ...EMPHASIS_STYLE, backgroundSize: "100% 100%" }}
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
        className="ml-1 inline box-decoration-clone rounded-[12px] px-[0.32em] py-[0.12em]"
        style={{ ...EMPHASIS_STYLE, backgroundSize: "0% 100%" }}
        initial={{ opacity: 0, x: 18, fontWeight: 500, backgroundSize: "0% 100%" }}
        whileInView={{ opacity: 1, x: 0, fontWeight: 800, backgroundSize: "100% 100%" }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.52, ease: "easeOut", delay: 0.08 }}
      >
        {emphasisText}
      </motion.span>
    </motion.p>
  );
}
