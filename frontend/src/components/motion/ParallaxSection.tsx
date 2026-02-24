import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import type { PropsWithChildren } from "react";

type ParallaxSectionProps = PropsWithChildren<{
  className?: string;
  strength?: number;
  /** Apply opacity fade at scroll edges (default false) */
  fadeEdges?: boolean;
  /** Apply subtle scale effect during scroll (default false) */
  scaleEffect?: boolean;
}>;

export function ParallaxSection({
  children,
  className,
  strength = 28,
  fadeEdges = false,
  scaleEffect = false,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rawY = useTransform(scrollYProgress, [0, 1], [strength, -strength]);
  const y = useSpring(rawY, { stiffness: 120, damping: 28, mass: 0.6 });

  const rawOpacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0.5, 1, 1, 0.5]);
  const opacity = useSpring(rawOpacity, { stiffness: 160, damping: 30 });

  const rawScale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.97, 1, 1, 0.97]);
  const scale = useSpring(rawScale, { stiffness: 160, damping: 30 });

  if (prefersReducedMotion) {
    return (
      <section ref={ref} className={className}>
        {children}
      </section>
    );
  }

  const style: Record<string, unknown> = { y };
  if (fadeEdges) style.opacity = opacity;
  if (scaleEffect) style.scale = scale;

  return (
    <section ref={ref} className={className}>
      <motion.div style={style}>{children}</motion.div>
    </section>
  );
}
