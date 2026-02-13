import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { FadeIn } from '../motion/FadeIn';
import { StaggerContainer, StaggerItem } from '../motion/StaggerContainer';
import { BackgroundBeams } from '../ui/BackgroundBeams';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { cn } from '../ui/cn';
import { CoverFallbackArtwork } from '../ui/CoverFallbackArtwork';

interface StoryPost {
  title: string;
  description?: string;
  date: string;
  category: string;
  cover?: string;
  slug: string;
}

interface CategoryStat {
  key: string;
  label: string;
  icon: string;
  desc: string;
  count: number;
}

interface MotionStoryRailProps {
  posts: StoryPost[];
  categories: CategoryStat[];
}

const categoryBadgeMap: Record<string, string> = {
  journal: 'bg-primary-100/90 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200',
  tech: 'bg-grass-100/80 text-grass-700 dark:bg-grass-800/30 dark:text-grass-200',
  learning: 'bg-primary-50/90 text-primary-600 dark:bg-primary-900/25 dark:text-primary-200',
  life: 'bg-slate-100/90 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200',
};

const categoryLabelMap: Record<string, string> = {
  journal: '日记',
  tech: '技术',
  learning: '效率',
  life: '生活',
};

const categoryTileMap: Record<string, string> = {
  journal: 'from-primary-100/85 via-primary-50/80 to-white dark:from-primary-900/35 dark:via-slate-900 dark:to-slate-900',
  tech: 'from-grass-100/75 via-primary-50/70 to-white dark:from-grass-800/25 dark:via-slate-900 dark:to-slate-900',
  learning: 'from-primary-50/90 via-white to-white dark:from-primary-900/20 dark:via-slate-900 dark:to-slate-900',
  life: 'from-slate-100/85 via-primary-50/65 to-white dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900',
};

const categoryLayout = [
  'col-span-12 md:col-span-5 md:row-span-2 md:translate-y-2',
  'col-span-6 md:col-span-3 md:row-span-2',
  'col-span-6 md:col-span-4 md:row-span-1',
  'col-span-12 md:col-span-4 md:row-span-1 md:translate-y-1',
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export function MotionStoryRail({ posts, categories }: MotionStoryRailProps) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxShift, setMaxShift] = useState(0);

  const featuredPosts = useMemo(() => posts.slice(0, 8), [posts]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      const nextShift = Math.max(0, track.scrollWidth - viewport.clientWidth);
      setMaxShift(nextShift);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    window.addEventListener('load', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('load', measure);
    };
  }, [featuredPosts.length]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const trackX = useTransform(scrollYProgress, [0, 1], [0, -maxShift]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0.04, 1]);

  if (featuredPosts.length === 0) return null;

  return (
    <section className="relative max-w-[min(1440px,96vw)] mx-auto px-4 md:px-6 pb-14 md:pb-20">
      <FadeIn>
        <header className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 dark:border-slate-700/60 bg-white/65 dark:bg-slate-900/60 backdrop-blur-sm p-6 md:p-10">
          <BackgroundBeams className="opacity-45" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(58,154,255,0.12),transparent_44%),radial-gradient(circle_at_88%_78%,rgba(122,168,116,0.12),transparent_42%)]" />
          <div className="relative z-10 grid md:grid-cols-[1.35fr_1fr] gap-6 md:gap-10 items-end">
            <div>
              <p className="text-xs tracking-[0.24em] uppercase text-slate-400 dark:text-slate-500 mb-3">Motion-driven Narrative</p>
              <h2 className="font-display text-3xl md:text-5xl leading-[1.08] text-slate-800 dark:text-slate-100">
                不是列表，
                <br />
                是一条会流动的内容轨道
              </h2>
            </div>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
              首页重构为滚动驱动叙事，文章在同一视觉流里横向推进。点击任意卡片时通过
              <code className="mx-1">viewTransitionName</code>
              连续跳转到正文页，减少“页面割裂感”。
            </p>
          </div>
        </header>
      </FadeIn>

      <div className="mt-8 md:mt-10 rounded-[2rem] border border-slate-200/70 dark:border-slate-700/60 bg-white/55 dark:bg-slate-900/50 backdrop-blur-sm p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 tracking-wide">Scroll to Navigate Stories</span>
          <div className="relative h-1.5 w-28 md:w-40 rounded-full bg-slate-200/80 dark:bg-slate-700/80 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
              style={reduced ? { width: '100%' } : { scaleX: progressScale, transformOrigin: 'left' }}
            />
          </div>
        </div>

        <section ref={sectionRef} className="relative h-[170vh] md:h-[205vh]">
          <div ref={viewportRef} className="sticky top-16 md:top-20 overflow-hidden">
            <motion.div
              ref={trackRef}
              className="flex items-stretch gap-4 md:gap-6 will-change-transform pb-2"
              style={reduced ? {} : { x: trackX }}
            >
              {featuredPosts.map((post, index) => {
                const heroCard = index === 0;
                const wideCard = index % 3 === 0;
                return (
                  <motion.article
                    key={post.slug}
                    className={cn(
                      'group relative shrink-0 overflow-hidden rounded-[1.75rem] border border-slate-200/70 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800',
                      heroCard
                        ? 'w-[86vw] md:w-[56vw] lg:w-[44vw]'
                        : wideCard
                          ? 'w-[74vw] md:w-[42vw] lg:w-[33vw]'
                          : 'w-[68vw] md:w-[36vw] lg:w-[29vw]'
                    )}
                    whileHover={reduced ? undefined : { y: -5 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <a
                      href={`/posts/${post.slug}/`}
                      className="block h-[62vh] md:h-[66vh] lg:h-[70vh] relative"
                      style={{ viewTransitionName: `post-${post.slug.replace(/\//g, '-')}` }}
                    >
                      {post.cover ? (
                        <img
                          src={post.cover}
                          alt={post.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                          loading="lazy"
                        />
                      ) : (
                        <CoverFallbackArtwork category={post.category} seed={index} variant="dark" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/24 to-black/8" />

                      <div className="absolute left-4 top-4 md:left-5 md:top-5 flex items-center gap-2">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm',
                          categoryBadgeMap[post.category] || 'bg-white/70 text-slate-700'
                        )}>
                          {categoryLabelMap[post.category] || post.category}
                        </span>
                        <time className="text-xs text-white/75">{formatDate(post.date)}</time>
                      </div>

                      <div className="absolute right-4 top-4 text-xs text-white/60 tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="absolute inset-x-4 bottom-4 md:inset-x-5 md:bottom-5">
                        <h3 className={cn(
                          'font-display text-white leading-tight line-clamp-3 group-hover:text-primary-200 transition-colors',
                          heroCard ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
                        )}>
                          {post.title}
                        </h3>
                        {post.description && (
                          <p className="mt-2 text-sm text-white/80 line-clamp-2 max-w-2xl">{post.description}</p>
                        )}
                      </div>
                    </a>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>
      </div>

      <FadeIn className="mt-10 md:mt-14">
        <StaggerContainer className="grid grid-cols-12 gap-3 md:gap-4 auto-rows-[minmax(112px,auto)]" stagger={0.07}>
          {categories.map((cat, index) => (
            <StaggerItem key={cat.key} className={categoryLayout[index % categoryLayout.length]}>
              <motion.a
                href={`/${cat.key}/`}
                className={cn(
                  'group h-full rounded-[1.5rem] border border-slate-200/70 dark:border-slate-700/60 bg-gradient-to-br p-4 md:p-5 flex flex-col justify-between overflow-hidden',
                  categoryTileMap[cat.key] || 'from-slate-100 to-white dark:from-slate-800 dark:to-slate-900'
                )}
                whileHover={reduced ? undefined : { y: -2, scale: 1.004 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-2xl md:text-3xl">{cat.icon}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-700/70 text-slate-500 dark:text-slate-300">
                    {cat.count} 篇
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-xl text-slate-800 dark:text-slate-100">{cat.label}</h3>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{cat.desc}</p>
                </div>
              </motion.a>
            </StaggerItem>
          ))}

          <StaggerItem className="col-span-12 md:col-span-4 md:row-span-2 md:-translate-y-2">
            <div className="h-full rounded-[1.5rem] border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-5 md:p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Design Direction</p>
              <h3 className="mt-2 font-display text-2xl text-slate-800 dark:text-slate-100 leading-tight">
                Editorial Overlap
                <br />
                + Motion Hierarchy
              </h3>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                通过错位排版、轨道滚动和共享过渡，首页从信息堆叠变成视觉叙事。
              </p>
            </div>
          </StaggerItem>

          <StaggerItem className="col-span-12 md:col-span-8 md:translate-y-1">
            <a
              href="/timeline/"
              className="group block h-full rounded-[1.5rem] border border-slate-200/70 dark:border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800 to-primary-900 p-5 md:p-6"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-primary-200/85">Next Layer</p>
              <h3 className="mt-2 font-display text-2xl md:text-3xl text-white leading-tight">
                进入人生时间线
                <br />
                看完整成长轨迹
              </h3>
              <p className="mt-3 text-sm text-primary-100/75 max-w-2xl">
                横向叙事之外，时间线模块提供纵向阶段复盘，让“记录”与“趋势”形成双视角。
              </p>
              <span className="inline-flex mt-5 text-sm text-white/90 group-hover:text-primary-200 transition-colors">
                打开 Timeline →
              </span>
            </a>
          </StaggerItem>
        </StaggerContainer>
      </FadeIn>
    </section>
  );
}
