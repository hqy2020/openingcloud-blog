import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './cn';

interface SparklesTextProps {
  text: string;
  className?: string;
  sparkleColors?: string[];
}

interface Sparkle {
  id: number;
  x: string;
  y: string;
  size: number;
  color: string;
  delay: number;
}

export function SparklesText({
  text,
  className,
  sparkleColors = ['#3A9AFF', '#8B5CF6', '#FFB86B'],
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const sparkle: Sparkle = {
        id: Date.now() + Math.random(),
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        size: Math.random() * 6 + 4,
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        delay: 0,
      };
      setSparkles((prev) => [...prev.slice(-8), sparkle]);
    }, 400);

    return () => clearInterval(interval);
  }, [sparkleColors]);

  return (
    <span className={cn('relative inline-block', className)}>
      <span className="relative z-10">{text}</span>
      <span className="absolute inset-0 pointer-events-none" aria-hidden>
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.svg
              key={sparkle.id}
              className="absolute"
              style={{
                left: sparkle.x,
                top: sparkle.y,
                width: sparkle.size,
                height: sparkle.size,
              }}
              viewBox="0 0 24 24"
              fill={sparkle.color}
              initial={{ scale: 0, rotate: 0, opacity: 1 }}
              animate={{ scale: 1, rotate: 90, opacity: 0.8 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
            </motion.svg>
          ))}
        </AnimatePresence>
      </span>
    </span>
  );
}
