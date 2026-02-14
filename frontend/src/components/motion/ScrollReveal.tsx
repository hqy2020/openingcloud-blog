import { motion, useReducedMotion } from "motion/react";
import type { PropsWithChildren } from "react";

type ScrollRevealProps = PropsWithChildren<{
  className?: string;
  once?: boolean;
}>;

export function ScrollReveal({ children, className, once = true }: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.985 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
