import { motion, type Variants } from 'motion/react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { cn } from '../ui/cn';
import type { ReactNode, ElementType } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  once?: boolean;
  as?: ElementType;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 18,
  once = true,
  as = 'div',
}: FadeInProps) {
  const reduced = useReducedMotion();

  const offsets: Record<string, { x: number; y: number }> = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };

  const offset = offsets[direction];

  const variants: Variants = {
    hidden: { opacity: 0, x: offset.x, y: offset.y },
    visible: { opacity: 1, x: 0, y: 0 },
  };

  const MotionComponent = motion.create(as);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <MotionComponent
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-60px' }}
      variants={variants}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionComponent>
  );
}
