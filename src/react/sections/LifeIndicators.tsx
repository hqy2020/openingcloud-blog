import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { CardSpotlight } from '../ui/CardSpotlight';
import { StaggerContainer, StaggerItem } from '../motion/StaggerContainer';
import { cn } from '../ui/cn';

interface LifeIndicatorsProps {
  stats?: {
    steps: number;
    sleep: number;
    focus: number;
    exercise: number;
  };
}

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const count = useMotionValue(0);
  const display = useTransform(count, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()
  );

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [value, count]);

  return <motion.span>{display}</motion.span>;
}

export function LifeIndicators({ stats }: LifeIndicatorsProps) {
  const data = stats ?? { steps: 7520, sleep: 7.2, focus: 4.5, exercise: 35 };

  const indicators = [
    { icon: '👟', label: '步数', value: data.steps, decimals: 0, unit: '步', color: 'text-primary-500' },
    { icon: '😴', label: '睡眠', value: data.sleep, decimals: 1, unit: 'h', color: 'text-grass-500' },
    { icon: '🎯', label: '专注', value: data.focus, decimals: 1, unit: 'h', color: 'text-sun-400' },
    { icon: '🏃', label: '运动', value: data.exercise, decimals: 0, unit: 'min', color: 'text-primary-400' },
  ];

  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">
        本周生活
      </h2>
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3" stagger={0.08}>
        {indicators.map((item) => (
          <StaggerItem key={item.label}>
            <CardSpotlight className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn('text-xl font-bold', item.color)}>
                  <AnimatedNumber value={item.value} decimals={item.decimals} />
                </span>
                <span className="text-xs text-slate-400">{item.unit}</span>
              </div>
              {/* 迷你趋势线 */}
              <div className="mt-2 h-4">
                <svg className="w-full h-4 text-slate-200 dark:text-slate-700" viewBox="0 0 60 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <polyline points="0,12 10,8 20,10 30,6 40,9 50,4 60,7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </CardSpotlight>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
