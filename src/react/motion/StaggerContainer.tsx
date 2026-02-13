import { motion, type Variants } from 'motion/react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { cn } from '../ui/cn';
import type { ReactNode } from 'react';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
}

const containerVariants: Variants = {
  hidden: {},
  visible: (custom: { stagger: number; delay: number }) => ({
    transition: {
      staggerChildren: custom.stagger,
      delayChildren: custom.delay,
    },
  }),
};

export function StaggerContainer({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  once = true,
}: StaggerContainerProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-60px' }}
      variants={containerVariants}
      custom={{ stagger, delay }}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerItem ──

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

const itemVariants: Variants = {
  hidden: (custom: { x: number; y: number }) => ({
    opacity: 0,
    x: custom.x,
    y: custom.y,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export function StaggerItem({
  children,
  className,
  direction = 'up',
  distance = 20,
}: StaggerItemProps) {
  const offsets: Record<string, { x: number; y: number }> = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  };

  return (
    <motion.div
      className={cn(className)}
      variants={itemVariants}
      custom={offsets[direction]}
    >
      {children}
    </motion.div>
  );
}
