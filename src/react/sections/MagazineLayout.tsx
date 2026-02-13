import { motion } from 'motion/react';
import { FadeIn } from '../motion/FadeIn';
import { StaggerContainer, StaggerItem } from '../motion/StaggerContainer';
import { BackgroundBeams } from '../ui/BackgroundBeams';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { cn } from '../ui/cn';
import { CoverFallbackArtwork } from '../ui/CoverFallbackArtwork';

interface Post {
  title: string;
  description?: string;
  date: string;
  category: string;
  tags?: string[];
  cover?: string;
  slug: string;
}

interface MagazineLayoutProps {
  posts: Post[];
  title: string;
  subtitle?: string;
}

const categoryLabels: Record<string, string> = {
  journal: '日记',
  tech: '技术',
  learning: '效率',
  life: '生活',
};

const categoryPillMap: Record<string, string> = {
  journal: 'bg-primary-100/85 text-primary-700 dark:bg-primary-900/35 dark:text-primary-200',
  tech: 'bg-grass-100/85 text-grass-700 dark:bg-grass-700/30 dark:text-grass-200',
  learning: 'bg-sun-100/85 text-sun-600 dark:bg-sun-700/30 dark:text-sun-200',
  life: 'bg-violet-100/85 text-violet-700 dark:bg-violet-800/30 dark:text-violet-200',
};

const mosaicLayout = [
  'col-span-12 md:col-span-6 md:row-span-2',
  'col-span-6 md:col-span-3 md:row-span-1 md:translate-y-2',
  'col-span-6 md:col-span-3 md:row-span-1',
  'col-span-12 md:col-span-4 md:row-span-1',
  'col-span-6 md:col-span-4 md:row-span-1 md:-translate-y-1',
  'col-span-6 md:col-span-4 md:row-span-1 md:translate-y-1',
];

const streamShift = ['lg:translate-y-2', 'lg:-translate-y-2', '', ''];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function categoryLabel(category: string) {
  return categoryLabels[category] || category;
}

export function MagazineLayout({ posts, title, subtitle }: MagazineLayoutProps) {
  const reduced = useReducedMotion();
  const featured = posts[0];
  const mosaicPosts = posts.slice(1, 7);
  const streamPosts = posts.slice(7);

  return (
    <div className="relative">
      <FadeIn>
        <header className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/55 p-6 md:p-9 backdrop-blur-sm">
          <BackgroundBeams className="opacity-75" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(58,154,255,0.16),transparent_44%),radial-gradient(circle_at_88%_78%,rgba(255,184,107,0.2),transparent_38%)]" />
          <div className="relative z-10 grid gap-5 md:gap-7 md:grid-cols-[1.3fr_auto] items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500 mb-3">Editorial Stream</p>
              <h1 className="text-editorial-xl text-slate-800 dark:text-slate-100">{title}</h1>
            </div>
            <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              {subtitle && <p>{subtitle}</p>}
              <p>{posts.length} 篇内容 · 非线性阅读流</p>
            </div>
          </div>
        </header>
      </FadeIn>

      {posts.length === 0 ? (
        <p className="text-slate-400 text-center py-16">暂无文章，快去写作吧！</p>
      ) : (
        <>
          {featured && (
            <FadeIn className="relative z-10 mt-6 md:mt-8">
              <motion.article
                whileHover={reduced ? undefined : { y: -6 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 dark:border-slate-700/60 shadow-soft-md"
              >
                <a
                  href={`/posts/${featured.slug}/`}
                  className="block relative min-h-[60vh] md:min-h-[64vh]"
                  style={{ viewTransitionName: `post-${featured.slug.replace(/\//g, '-')}` }}
                >
                  {featured.cover ? (
                    <img
                      src={featured.cover}
                      alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <CoverFallbackArtwork category={featured.category} seed={0} variant="dark" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                  <div className="absolute inset-0 md:grid md:grid-cols-12">
                    <div className="md:col-span-7" />
                    <div className="md:col-span-5 mt-auto md:mt-0 bg-white/86 dark:bg-slate-900/84 backdrop-blur-xl p-5 md:p-8 flex flex-col justify-end">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={cn(
                          'text-xs font-medium px-2.5 py-1 rounded-full',
                          categoryPillMap[featured.category] || 'bg-white/70 text-slate-700'
                        )}>
                          {categoryLabel(featured.category)}
                        </span>
                        <time className="text-xs text-slate-500 dark:text-slate-400">{formatDate(featured.date)}</time>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display text-slate-900 dark:text-slate-100 leading-tight line-clamp-3">
                        {featured.title}
                      </h2>
                      {featured.description && (
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-4">{featured.description}</p>
                      )}
                      {featured.tags && featured.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {featured.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-md bg-slate-100/90 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </motion.article>
            </FadeIn>
          )}

          {mosaicPosts.length > 0 && (
            <section className="mt-8 md:mt-10">
              <StaggerContainer className="grid grid-cols-12 gap-3 md:gap-4 auto-rows-[minmax(156px,auto)]" stagger={0.07}>
                {mosaicPosts.map((post, index) => (
                  <StaggerItem key={post.slug} className={mosaicLayout[index % mosaicLayout.length]}>
                    <motion.a
                      href={`/posts/${post.slug}/`}
                      className="group relative block h-full rounded-[1.5rem] overflow-hidden border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-900"
                      style={{ viewTransitionName: `post-${post.slug.replace(/\//g, '-')}` }}
                      whileHover={reduced ? undefined : { y: -5, rotate: index % 2 === 0 ? -0.25 : 0.25 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {post.cover ? (
                        <>
                          <img
                            src={post.cover}
                            alt={post.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        </>
                      ) : (
                        <CoverFallbackArtwork category={post.category} seed={index + 1} variant="light" />
                      )}

                      <div className="relative z-10 h-full min-h-[208px] md:min-h-[230px] p-4 md:p-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-3">
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            post.cover
                              ? 'bg-white/80 text-slate-700'
                              : categoryPillMap[post.category] || 'bg-white/70 text-slate-700'
                          )}>
                            {categoryLabel(post.category)}
                          </span>
                          <time className={cn('text-xs', post.cover ? 'text-white/80' : 'text-slate-400 dark:text-slate-500')}>
                            {formatDate(post.date)}
                          </time>
                        </div>
                        <h3 className={cn(
                          'font-display leading-tight line-clamp-3 transition-colors',
                          post.cover
                            ? 'text-xl text-white group-hover:text-primary-200'
                            : 'text-lg text-slate-800 dark:text-slate-100 group-hover:text-primary-500'
                        )}>
                          {post.title}
                        </h3>
                      </div>
                    </motion.a>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          )}

          {streamPosts.length > 0 && (
            <section className="mt-10 md:mt-12">
              <FadeIn>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="font-display text-2xl text-slate-800 dark:text-slate-100">更多故事</h2>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Continuous Reading</span>
                </div>
              </FadeIn>

              <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5" stagger={0.06}>
                {streamPosts.map((post, index) => (
                  <StaggerItem key={post.slug} className={streamShift[index % streamShift.length]}>
                    <motion.a
                      href={`/posts/${post.slug}/`}
                      className="group block rounded-[1.5rem] border border-slate-200/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/75 backdrop-blur-sm overflow-hidden"
                      style={{ viewTransitionName: `post-${post.slug.replace(/\//g, '-')}` }}
                      whileHover={reduced ? undefined : { y: -4, scale: 1.006 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className={cn('h-full', post.cover ? 'grid grid-cols-[120px_1fr] md:grid-cols-[150px_1fr]' : 'p-5 md:p-6')}>
                        {post.cover && (
                          <div className="overflow-hidden">
                            <img
                              src={post.cover}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="p-4 md:p-5 flex flex-col justify-between min-h-[156px]">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              categoryPillMap[post.category] || 'bg-white/70 text-slate-700'
                            )}>
                              {categoryLabel(post.category)}
                            </span>
                            <time className="text-xs text-slate-400 dark:text-slate-500">{formatDate(post.date)}</time>
                          </div>

                          <h3 className="text-lg font-display text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 group-hover:text-primary-500 transition-colors">
                            {post.title}
                          </h3>

                          {post.description && (
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{post.description}</p>
                          )}
                        </div>
                      </div>
                    </motion.a>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          )}
        </>
      )}
    </div>
  );
}
