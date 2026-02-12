import { motion } from 'motion/react';
import { CardSpotlight } from '../ui/CardSpotlight';
import { StaggerContainer, StaggerItem } from '../motion/StaggerContainer';
import { FadeIn } from '../motion/FadeIn';
import { cn } from '../ui/cn';

interface Post {
  title: string;
  description?: string;
  date: string;
  category: string;
  cover?: string;
  slug: string;
}

interface Category {
  key: string;
  label: string;
  icon: string;
  desc: string;
  gradient: string;
  count: number;
}

interface BentoGridProps {
  featured: Post | null;
  categories: Category[];
  restPosts: Post[];
}

const categoryLabels: Record<string, string> = {
  journal: '📓 日记',
  tech: '💻 技术',
  learning: '📚 效率',
  life: '📷 生活',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function BentoGrid({ featured, categories, restPosts }: BentoGridProps) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <FadeIn>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display mb-8">
          探索内容
        </h2>
      </FadeIn>

      <StaggerContainer
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
        stagger={0.08}
      >
        {/* 首篇大卡: 2x2 */}
        {featured && (
          <StaggerItem className="col-span-2 row-span-2">
            <CardSpotlight className="h-full min-h-[280px] md:min-h-[360px]">
              <a
                href={`/posts/${featured.slug}/`}
                className="group relative flex flex-col justify-end h-full"
                style={{ viewTransitionName: 'post-featured' }}
              >
                {featured.cover ? (
                  <img
                    src={featured.cover}
                    alt={featured.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 rounded-2xl"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-2xl" />
                <div className="relative z-10 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                      {categoryLabels[featured.category] || featured.category}
                    </span>
                    <time className="text-xs text-white/70">{formatDate(featured.date)}</time>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white leading-tight line-clamp-2 group-hover:text-primary-200 transition-colors">
                    {featured.title}
                  </h3>
                  {featured.description && (
                    <p className="text-sm text-white/70 mt-2 line-clamp-2 hidden md:block">
                      {featured.description}
                    </p>
                  )}
                </div>
              </a>
            </CardSpotlight>
          </StaggerItem>
        )}

        {/* 分类磁贴 */}
        {categories.map((cat) => (
          <StaggerItem key={cat.key}>
            <motion.a
              href={`/${cat.key}/`}
              className={cn(
                'group block rounded-2xl p-4 md:p-5 bg-gradient-to-br transition-all duration-300 flex flex-col justify-between min-h-[120px] border border-slate-200/60 dark:border-slate-700/40',
                cat.gradient
              )}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{cat.label}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cat.desc}</p>
                <span className="inline-block mt-2 text-xs bg-white/60 dark:bg-slate-700/60 rounded-full px-2 py-0.5 text-slate-500 dark:text-slate-400">
                  {cat.count} 篇
                </span>
              </div>
            </motion.a>
          </StaggerItem>
        ))}

        {/* 更多文章卡片 */}
        {restPosts.map((post) => (
          <StaggerItem key={post.slug}>
            <CardSpotlight className="h-full min-h-[120px]">
              <a
                href={`/posts/${post.slug}/`}
                className="group block p-4 flex flex-col justify-between h-full"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-grass-50 text-grass-600 dark:bg-grass-700/20 dark:text-grass-300">
                    {categoryLabels[post.category] || post.category}
                  </span>
                  <time className="text-xs text-slate-400">{formatDate(post.date)}</time>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary-500 transition-colors line-clamp-2 text-sm">
                  {post.title}
                </h3>
              </a>
            </CardSpotlight>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
