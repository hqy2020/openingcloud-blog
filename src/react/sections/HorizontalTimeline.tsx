import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { cn } from '../ui/cn';

interface TimelineNode {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  type: string;
  impact: string;
  phase: string | null;
  tags: string[];
  cover: string | null;
}

interface HorizontalTimelineProps {
  nodes: TimelineNode[];
}

const typeConfig: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  career:   { icon: '💼', label: '职业', color: 'border-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  learning: { icon: '📚', label: '求学', color: 'border-grass-400', bg: 'bg-grass-50 dark:bg-grass-900/20' },
  health:   { icon: '💪', label: '健康', color: 'border-sun-400', bg: 'bg-sun-50 dark:bg-sun-900/20' },
  family:   { icon: '🏠', label: '家庭', color: 'border-primary-300', bg: 'bg-primary-50 dark:bg-primary-900/10' },
  reflection: { icon: '🌧️', label: '沉淀', color: 'border-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/70' },
};

export function HorizontalTimeline({ nodes }: HorizontalTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const totalPanels = nodes.length;

  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', `-${(totalPanels - 1) * 100}%`]
  );

  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  if (nodes.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg mb-2">暂无时间线数据</p>
      </div>
    );
  }

  // For reduced motion, use simple vertical layout
  if (reduced) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto px-4">
        {nodes.map((node) => {
          const config = typeConfig[node.type] || typeConfig.career;
          return (
            <div
              key={node.id}
              className={cn(
                'rounded-xl p-6 border-l-4 bg-white dark:bg-slate-800',
                config.color
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{config.icon}</span>
                <h3 className="font-bold text-lg">{node.title}</h3>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {node.start_date}{node.end_date ? ` ~ ${node.end_date}` : ' ~ 至今'}
              </p>
              {node.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{node.description}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="fixed top-14 left-0 right-0 h-1 z-40 bg-slate-200/50 dark:bg-slate-700/50">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
          style={{ width: progressWidth }}
        />
      </div>

      {/* Scroll container */}
      <div
        ref={containerRef}
        style={{ height: `${totalPanels * 100}vh` }}
      >
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden">
          <motion.div
            className="flex h-full"
            style={{ x }}
          >
            {nodes.map((node, i) => {
              const config = typeConfig[node.type] || typeConfig.career;
              return (
                <div
                  key={node.id}
                  className="w-screen h-full shrink-0 flex items-center justify-center px-8 md:px-16"
                >
                  <motion.div
                    className={cn(
                      'max-w-2xl w-full rounded-2xl p-8 md:p-12 border-l-4 bg-white dark:bg-slate-800 shadow-soft-md',
                      config.color
                    )}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ amount: 0.5 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Year badge */}
                    <div className="mb-4">
                      <span className="inline-block bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {node.start_date.slice(0, 4)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{config.icon}</span>
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 font-display">
                        {node.title}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-400 mb-4">
                      {node.start_date}{node.end_date ? ` ~ ${node.end_date}` : ' ~ 至今'}
                      {node.phase && (
                        <span className="ml-2 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5">
                          {node.phase}
                        </span>
                      )}
                    </p>

                    {node.cover && (
                      <img
                        src={node.cover}
                        alt={node.title}
                        className="w-full h-48 object-cover rounded-xl mb-4"
                        loading="lazy"
                      />
                    )}

                    {node.description && (
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {node.description}
                      </p>
                    )}

                    {node.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {node.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full px-3 py-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Progress indicator */}
                    <div className="mt-6 text-xs text-slate-400">
                      {i + 1} / {totalPanels}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
