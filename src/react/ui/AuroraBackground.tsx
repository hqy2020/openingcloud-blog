import { motion } from 'motion/react';
import { cn } from './cn';
import type { ReactNode } from 'react';

interface AuroraBackgroundProps {
  children?: ReactNode;
  className?: string;
}

export function AuroraBackground({ children, className }: AuroraBackgroundProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Aurora blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/4 w-[80%] h-[80%] rounded-full opacity-20 dark:opacity-10 blur-[100px]"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-primary-500))',
          }}
          animate={{
            x: [0, 45, -20, 0],
            y: [0, -28, 14, 0],
            scale: [1, 1.04, 0.98, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-1/3 -right-1/4 w-[70%] h-[70%] rounded-full opacity-15 dark:opacity-8 blur-[100px]"
          style={{
            background: 'linear-gradient(225deg, rgba(139, 92, 246, 0.5), var(--color-primary-400))',
          }}
          animate={{
            x: [0, -35, 20, 0],
            y: [0, 20, -14, 0],
            scale: [1, 0.96, 1.03, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/3 left-1/3 w-[50%] h-[50%] rounded-full opacity-10 dark:opacity-5 blur-[80px]"
          style={{
            background: 'linear-gradient(180deg, var(--color-sun-300), var(--color-primary-300))',
          }}
          animate={{
            x: [0, 28, -14, 0],
            y: [0, -22, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-light dark:to-bg-dark" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
