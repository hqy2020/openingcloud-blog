import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BackgroundBeams } from '@/react/ui/BackgroundBeams';
import { FadeIn } from '@/react/motion/FadeIn';
import { CoverFallbackArtwork } from '@/react/ui/CoverFallbackArtwork';
import { cn } from '@/react/ui/cn';

interface CategoryPost {
  title: string;
  description?: string;
  date: string;
  category: string;
  tags?: string[];
  cover?: string;
  slug: string;
  words: number;
  views: number;
}

interface CategoryMasonryProps {
  posts: CategoryPost[];
  title: string;
  subtitle: string;
  categoryKey: string;
}

interface CategoryConfig {
  icon: string;
  iconSvg: string;
  accent: string;
  accentSoft: string;
  accentRing: string;
  beamClass: string;
  defaultCover: string;
}

const categoryConfig: Record<string, CategoryConfig> = {
  tech: {
    icon: '技术',
    iconSvg: '/icons/categories/tech.svg',
    accent: 'text-sage-700 dark:text-sage-200',
    accentSoft: 'from-sage-100/90 via-white/80 to-sage-50/70 dark:from-sage-900/35 dark:via-ink-900 dark:to-ink-900',
    accentRing: 'border-sage-200/80 dark:border-sage-700/65',
    beamClass: '[--beam-color:rgba(107,145,123,0.42)]',
    defaultCover: '/media/default-covers/tech-default.svg',
  },
  learning: {
    icon: '效率',
    iconSvg: '/icons/categories/learning.svg',
    accent: 'text-amber-700 dark:text-amber-200',
    accentSoft: 'from-amber-100/90 via-white/80 to-amber-50/70 dark:from-amber-900/32 dark:via-ink-900 dark:to-ink-900',
    accentRing: 'border-amber-200/80 dark:border-amber-700/65',
    beamClass: '[--beam-color:rgba(184,148,94,0.4)]',
    defaultCover: '/media/default-covers/learning-default.svg',
  },
  life: {
    icon: '生活',
    iconSvg: '/icons/categories/life.svg',
    accent: 'text-mauve-700 dark:text-mauve-200',
    accentSoft: 'from-mauve-100/90 via-white/80 to-mauve-50/70 dark:from-mauve-900/30 dark:via-ink-900 dark:to-ink-900',
    accentRing: 'border-mauve-200/80 dark:border-mauve-700/65',
    beamClass: '[--beam-color:rgba(150,132,168,0.4)]',
    defaultCover: '/media/default-covers/life-default.svg',
  },
  journal: {
    icon: '日记',
    iconSvg: '/icons/stats/posts.svg',
    accent: 'text-primary-700 dark:text-primary-200',
    accentSoft: 'from-primary-100/90 via-white/80 to-primary-50/70 dark:from-primary-900/33 dark:via-ink-900 dark:to-ink-900',
    accentRing: 'border-primary-200/80 dark:border-primary-700/65',
    beamClass: '[--beam-color:rgba(79,106,229,0.42)]',
    defaultCover: '/media/default-covers/tech-default.svg',
  },
};

const masonryRatios = [16 / 10, 4 / 5, 3 / 2, 1, 4 / 3, 3 / 4, 16 / 9, 5 / 4];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatViews(views: number) {
  if (views < 1000) return String(views);
  return `${(views / 1000).toFixed(1)}k`;
}

function readMinutes(words: number) {
  return Math.max(1, Math.ceil(words / 420));
}

function sortPosts(posts: CategoryPost[], sortBy: 'latest' | 'popular') {
  if (sortBy === 'popular') {
    return [...posts].sort((a, b) => b.views - a.views || b.date.localeCompare(a.date));
  }
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

function categoryTone(key: string) {
  if (key === 'tech') return 'bg-sage-100/80 text-sage-700 dark:bg-sage-900/30 dark:text-sage-200';
  if (key === 'learning') return 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200';
  if (key === 'life') return 'bg-mauve-100/80 text-mauve-700 dark:bg-mauve-900/30 dark:text-mauve-200';
  return 'bg-primary-100/80 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200';
}

export function CategoryMasonry({ posts, title, subtitle, categoryKey }: CategoryMasonryProps) {
  const [activeTag, setActiveTag] = useState('全部');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [visibleCount, setVisibleCount] = useState(10);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const config = categoryConfig[categoryKey] || categoryConfig.tech;

  const tagStats = useMemo(() => {
    const counter = new Map<string, number>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => {
        counter.set(tag, (counter.get(tag) || 0) + 1);
      });
    });

    const sorted = [...counter.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));

    return [{ tag: '全部', count: posts.length }, ...sorted];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const selected = activeTag === '全部' ? posts : posts.filter((post) => post.tags?.includes(activeTag));
    return sortPosts(selected, sortBy);
  }, [activeTag, sortBy, posts]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(10);
  }, [activeTag, sortBy]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;
        setVisibleCount((count) => Math.min(count + 6, filteredPosts.length));
      },
      { rootMargin: '0px 0px 160px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [filteredPosts.length]);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-14 md:pb-16">
      <FadeIn>
        <header className={cn('relative overflow-hidden rounded-[1.8rem] border bg-gradient-to-br p-6 md:p-8', config.accentRing, config.accentSoft, config.beamClass)}>
          <BackgroundBeams className="opacity-55" />
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/75 dark:bg-ink-900/70 border border-ink-200/80 dark:border-ink-700/70 text-xs text-ink-500 dark:text-ink-300">
                <img src={config.iconSvg} alt="" className="w-4 h-4" />
                {config.icon}
              </div>
              <h1 className="text-3xl md:text-4xl mt-3 text-ink-900 dark:text-ink-100">{title}</h1>
              <p className="mt-2 text-sm md:text-base text-ink-500 dark:text-ink-300">{subtitle}</p>
            </div>
            <p className={cn('text-sm font-medium', config.accent)}>
              {posts.length} 篇文章 · {posts.reduce((sum, post) => sum + post.words, 0).toLocaleString('zh-CN')} 字
            </p>
          </div>
        </header>
      </FadeIn>

      <div className="mt-5 rounded-2xl border border-ink-200/80 dark:border-ink-700/70 bg-white/72 dark:bg-ink-900/68 backdrop-blur px-3 md:px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="overflow-x-auto whitespace-nowrap flex-1 no-scrollbar">
            <div className="inline-flex items-center gap-1.5 md:gap-2 min-w-max pr-2">
              {tagStats.map((item) => {
                const active = activeTag === item.tag;
                return (
                  <button
                    key={item.tag}
                    className={cn(
                      'relative px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors',
                      active
                        ? cn(config.accent, 'font-medium')
                        : 'text-ink-500 hover:text-ink-700 dark:text-ink-300 dark:hover:text-ink-100'
                    )}
                    onClick={() => setActiveTag(item.tag)}
                  >
                    {active && (
                      <motion.span
                        layoutId={`tag-indicator-${categoryKey}`}
                        className={cn('absolute inset-0 rounded-full border bg-white/90 dark:bg-ink-800/80', config.accentRing)}
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                      />
                    )}
                    {item.tag}({item.count})
                  </button>
                );
              })}
            </div>
          </div>

          <label className="text-sm text-ink-500 dark:text-ink-300 flex items-center gap-2 shrink-0">
            排序
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value === 'popular' ? 'popular' : 'latest')}
              className="rounded-lg border border-ink-200/80 dark:border-ink-700/70 bg-white dark:bg-ink-900 px-2.5 py-1.5 text-sm"
            >
              <option value="latest">最新优先</option>
              <option value="popular">阅读最多</option>
            </select>
          </label>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={`${activeTag}-${sortBy}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5"
        >
          {visiblePosts.length === 0 ? (
            <div className="rounded-2xl border border-ink-200/80 dark:border-ink-700/70 bg-white/74 dark:bg-ink-900/68 py-14 text-center text-ink-500 dark:text-ink-300">
              当前标签下暂无文章。
            </div>
          ) : (
            <div className="columns-2 gap-3 md:gap-4 [column-fill:_balance]">
              {visiblePosts.map((post, index) => {
                const ratio = masonryRatios[index % masonryRatios.length];
                return (
                  <article
                    key={post.slug}
                    className="break-inside-avoid mb-3 md:mb-4 overflow-hidden rounded-2xl border border-ink-200/80 dark:border-ink-700/70 bg-white/85 dark:bg-ink-900/72 shadow-soft transition-transform duration-200 hover:-translate-y-1 hover:shadow-soft-md"
                  >
                    <a href={`/posts/${post.slug}/`} className="block">
                      {post.cover ? (
                        <div className="blur-reveal-frame" style={{ aspectRatio: ratio }}>
                          <img
                            src={post.cover}
                            alt={post.title}
                            loading="lazy"
                            className="w-full h-full object-cover blur-reveal"
                            style={{ viewTransitionName: `post-${post.slug.replace(/\//g, '-')}` }}
                          />
                        </div>
                      ) : (
                        <div className="relative" style={{ aspectRatio: ratio }}>
                          <img src={config.defaultCover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />
                          <CoverFallbackArtwork category={post.category} seed={index + 3} variant="light" />
                        </div>
                      )}

                      <div className="p-3.5 md:p-4">
                        <h2 className="font-display text-lg leading-tight line-clamp-2 text-ink-900 dark:text-ink-100">{post.title}</h2>
                        <div className="mt-3 text-xs text-ink-500 dark:text-ink-300 space-y-1">
                          <p>{formatDate(post.date)}</p>
                          <p>👁 {formatViews(post.views)} · {readMinutes(post.words)} min</p>
                        </div>
                        {post.tags && post.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {post.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className={cn('text-[11px] px-2 py-0.5 rounded-full', categoryTone(categoryKey))}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <div ref={sentinelRef} className="h-8" />

      {visibleCount < filteredPosts.length && (
        <div className="text-center mt-3">
          <button
            onClick={() => setVisibleCount((count) => Math.min(count + 6, filteredPosts.length))}
            className="text-sm px-4 py-2 rounded-full border border-ink-200/80 dark:border-ink-700/70 text-ink-600 dark:text-ink-200 hover:border-primary-300 hover:text-primary-500 transition-colors cursor-pointer"
          >
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}
