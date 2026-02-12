import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { CardSpotlight } from '../ui/CardSpotlight';
import { FadeIn } from '../motion/FadeIn';
import { StaggerContainer, StaggerItem } from '../motion/StaggerContainer';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { cn } from '../ui/cn';

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
  journal: '📓 日记',
  tech: '💻 技术',
  learning: '📚 效率',
  life: '📷 生活',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function ParallaxCard({ post, index, reversed }: { post: Post; index: number; reversed: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const speed = index % 2 === 0 ? 30 : -30;
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  return (
    <motion.div
      ref={ref}
      style={reduced ? {} : { y, scale }}
    >
      <CardSpotlight className="overflow-hidden">
        <a
          href={`/posts/${post.slug}/`}
          className={cn(
            'group flex flex-col md:flex-row items-stretch',
            reversed && 'md:flex-row-reverse'
          )}
          style={{ viewTransitionName: `post-${post.slug.replace(/\//g, '-')}` }}
        >
          {post.cover && (
            <div className="md:w-2/5 overflow-hidden shrink-0">
              <img
                src={post.cover}
                alt={post.title}
                className="w-full h-40 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          )}
          <div className="p-5 md:p-6 flex flex-col justify-center flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-grass-50 text-grass-600 dark:bg-grass-700/20 dark:text-grass-300">
                {categoryLabels[post.category] || post.category}
              </span>
              <time className="text-xs text-slate-400">{formatDate(post.date)}</time>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-500 transition-colors line-clamp-2 mb-1">
              {post.title}
            </h3>
            {post.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                {post.description}
              </p>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </a>
      </CardSpotlight>
    </motion.div>
  );
}

export function MagazineLayout({ posts, title, subtitle }: MagazineLayoutProps) {
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div>
      {/* 页面标题 */}
      <FadeIn>
        <header className="mb-10">
          <h1 className="text-editorial-xl text-slate-800 dark:text-slate-100">{title}</h1>
          {subtitle && <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">{subtitle}</p>}
          <div className="mt-4 h-1 w-16 bg-gradient-to-r from-primary-400 to-primary-300 rounded-full" />
        </header>
      </FadeIn>

      {posts.length === 0 ? (
        <p className="text-slate-400 text-center py-16">暂无文章，快去写作吧！</p>
      ) : (
        <StaggerContainer stagger={0.1}>
          {/* 封面故事 — 首篇大卡 */}
          {featured && (
            <StaggerItem className="mb-8">
              <CardSpotlight className="overflow-hidden">
                <a
                  href={`/posts/${featured.slug}/`}
                  className="group block"
                  style={{ viewTransitionName: `post-${featured.slug.replace(/\//g, '-')}` }}
                >
                  <div className="md:flex">
                    {featured.cover && (
                      <div className="md:w-1/2 overflow-hidden">
                        <img
                          src={featured.cover}
                          alt={featured.title}
                          className="w-full h-56 md:h-72 object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className={cn('p-6 md:p-8 flex flex-col justify-center', featured.cover ? 'md:w-1/2' : 'w-full')}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-grass-50 text-grass-600 dark:bg-grass-700/20 dark:text-grass-300">
                          {categoryLabels[featured.category] || featured.category}
                        </span>
                        <time className="text-xs text-slate-400">{formatDate(featured.date)}</time>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-500 transition-colors mb-3 leading-tight line-clamp-2 font-display">
                        {featured.title}
                      </h2>
                      {featured.description && (
                        <p className="text-slate-500 dark:text-slate-400 line-clamp-3">{featured.description}</p>
                      )}
                      {featured.tags && featured.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {featured.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </CardSpotlight>
            </StaggerItem>
          )}

          {/* 其余文章 — 交替排版 + 视差 */}
          <div className="space-y-4">
            {rest.map((post, i) => (
              <StaggerItem key={post.slug}>
                <ParallaxCard post={post} index={i} reversed={i % 2 === 1} />
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      )}
    </div>
  );
}
