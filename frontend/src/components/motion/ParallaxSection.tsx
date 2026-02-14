import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { PropsWithChildren } from "react";

type ParallaxSectionProps = PropsWithChildren<{
  className?: string;
  strength?: number;
}>;

export function ParallaxSection({ children, className, strength = 28 }: ParallaxSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [strength, -strength]);

  if (prefersReducedMotion) {
    return (
      <section ref={ref} className={className}>
        {children}
      </section>
    );
  }

  return (
    <section ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </section>
  );
}
