import { useEffect } from 'react';
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

const tileLayout = [
  'col-span-12 md:col-span-6 md:row-span-2',
  'col-span-6 md:col-span-3 md:translate-y-6',
  'col-span-6 md:col-span-3',
  'col-span-12 md:col-span-6 md:-translate-y-4',
];

export function LifeIndicators({ stats }: LifeIndicatorsProps) {
  const data = stats ?? { steps: 7520, sleep: 7.2, focus: 4.5, exercise: 35 };

  const indicators = [
    { icon: '👟', label: '步数', value: data.steps, decimals: 0, unit: '步', color: 'text-primary-500', accent: 'from-primary-100/85 to-primary-50/75 dark:from-primary-900/35 dark:to-slate-900' },
    { icon: '😴', label: '睡眠', value: data.sleep, decimals: 1, unit: 'h', color: 'text-grass-500', accent: 'from-grass-100/85 to-grass-50/75 dark:from-grass-800/30 dark:to-slate-900' },
    { icon: '🎯', label: '专注', value: data.focus, decimals: 1, unit: 'h', color: 'text-sun-400', accent: 'from-sun-100/85 to-sun-50/75 dark:from-sun-800/30 dark:to-slate-900' },
    { icon: '🏃', label: '运动', value: data.exercise, decimals: 0, unit: 'min', color: 'text-primary-400', accent: 'from-violet-100/80 to-primary-50/75 dark:from-violet-900/25 dark:to-slate-900' },
  ];

  return (
    <section className="mb-0">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
          本周生活
        </h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">Behavior Snapshot</span>
      </div>

      <StaggerContainer className="grid grid-cols-12 gap-3 md:gap-4 auto-rows-[minmax(104px,auto)]" stagger={0.08}>
        {indicators.map((item, index) => (
          <StaggerItem key={item.label} className={tileLayout[index % tileLayout.length]}>
            <CardSpotlight className={cn('h-full p-4 md:p-5 bg-gradient-to-br', item.accent)}>
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/75 dark:bg-slate-800/75 text-slate-500 dark:text-slate-300">
                    LIVE
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn(index === 0 ? 'text-3xl md:text-4xl font-display' : 'text-2xl font-bold', item.color)}>
                      <AnimatedNumber value={item.value} decimals={item.decimals} />
                    </span>
                    <span className="text-xs text-slate-400">{item.unit}</span>
                  </div>
                </div>

                <div className="mt-3 h-5">
                  <svg className="w-full h-5 text-slate-300 dark:text-slate-600" viewBox="0 0 76 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
                    <polyline points="0,15 10,10 20,11 30,7 40,10 50,5 60,8 70,4 76,6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </CardSpotlight>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
