import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import type { PropsWithChildren } from "react";

type SectionParallaxTransitionProps = PropsWithChildren<{
  className?: string;
  /** Parallax strength in pixels (default 20) */
  strength?: number;
  /** Whether to apply opacity fade at edges (default true) */
  fade?: boolean;
}>;

export function SectionParallaxTransition({
  children,
  className,
  strength = 20,
  fade = true,
}: SectionParallaxTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rawY = useTransform(scrollYProgress, [0, 1], [strength, -strength]);
  const y = useSpring(rawY, { stiffness: 120, damping: 28, mass: 0.6 });

  const rawOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.4]);
  const opacity = useSpring(rawOpacity, { stiffness: 160, damping: 30 });

  if (prefersReducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, ...(fade ? { opacity } : undefined) }}>
        {children}
      </motion.div>
    </div>
  );
}
