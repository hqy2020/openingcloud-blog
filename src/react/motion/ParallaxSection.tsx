import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { cn } from '../ui/cn';
import type { ReactNode } from 'react';

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  /** Parallax speed multiplier (negative = opposite direction) */
  speed?: number;
  offset?: ['start end' | 'start start' | string, 'end start' | 'end end' | string];
}

export function ParallaxSection({
  children,
  className,
  speed = 0.5,
  offset = ['start end', 'end start'],
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
