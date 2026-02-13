import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { cn } from '../ui/cn';
import type { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Scale range: [start, end] */
  scale?: [number, number];
  /** Opacity range */
  opacity?: [number, number];
  /** Y offset range in px */
  y?: [number, number];
}

export function ScrollReveal({
  children,
  className,
  scale = [0.985, 1],
  opacity = [0, 1],
  y = [24, 0],
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end 0.8'],
  });

  const scaleVal = useTransform(scrollYProgress, [0, 1], scale);
  const opacityVal = useTransform(scrollYProgress, [0, 1], opacity);
  const yVal = useTransform(scrollYProgress, [0, 1], y);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      style={{ scale: scaleVal, opacity: opacityVal, y: yVal }}
    >
      {children}
    </motion.div>
  );
}
