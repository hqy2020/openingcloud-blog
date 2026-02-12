import { useRef, type ReactNode } from 'react';
import { motion, useAnimationFrame } from 'motion/react';
import { cn } from './cn';

interface MovingBorderProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  borderRadius?: string;
  duration?: number;
  borderColor?: string;
}

export function MovingBorder({
  children,
  className,
  containerClassName,
  borderRadius = '1rem',
  duration = 3000,
  borderColor = 'var(--color-primary-400)',
}: MovingBorderProps) {
  const pathRef = useRef<SVGRectElement>(null);
  const progressRef = useRef(0);
  const circleRef = useRef<SVGCircleElement>(null);

  useAnimationFrame((time) => {
    if (!pathRef.current || !circleRef.current) return;

    const pathLength = pathRef.current.getTotalLength();
    progressRef.current = (time / duration) % 1;

    const point = pathRef.current.getPointAtLength(progressRef.current * pathLength);
    circleRef.current.setAttribute('cx', String(point.x));
    circleRef.current.setAttribute('cy', String(point.y));
  });

  return (
    <div
      className={cn('relative p-[1px] overflow-hidden', containerClassName)}
      style={{ borderRadius }}
    >
      {/* SVG border animation */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          ref={pathRef}
          x="0.5"
          y="0.5"
          width="calc(100% - 1px)"
          height="calc(100% - 1px)"
          rx={borderRadius}
          fill="none"
          stroke="transparent"
          strokeWidth="0"
          pathLength="1"
        />
        <circle
          ref={circleRef}
          r="80"
          fill={`radial-gradient(circle, ${borderColor}, transparent 60%)`}
          opacity="0.6"
        >
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Actual border glow */}
      <motion.div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${borderColor} 10%, transparent 20%)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: duration / 1000, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner content */}
      <div
        className={cn(
          'relative bg-white dark:bg-slate-800 backdrop-blur-xl',
          className
        )}
        style={{ borderRadius: `calc(${borderRadius} - 1px)` }}
      >
        {children}
      </div>
    </div>
  );
}
