import { motion } from 'motion/react';
import { CardSpotlight } from '../ui/CardSpotlight';
import { useTilt } from '../hooks/useTilt';
import { cn } from '../ui/cn';

interface PostCardProps {
  title: string;
  description?: string;
  date: string;
  category: string;
  tags?: string[];
  cover?: string;
  slug: string;
}

const categoryLabels: Record<string, string> = {
  journal: '📓 日记',
  tech: '💻 技术',
  learning: '📚 效率',
  life: '📷 生活',
};

export function PostCard({ title, description, date, category, tags = [], cover, slug }: PostCardProps) {
  const tiltRef = useTilt<HTMLElement>({ max: 5, speed: 400, scale: 1.01 });

  const formattedDate = new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.article
      ref={tiltRef}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <CardSpotlight className="overflow-hidden">
        {cover && (
          <a href={`/posts/${slug}/`} className="block overflow-hidden">
            <img
              src={cover}
              alt={title}
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </a>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <a
              href={`/${category}/`}
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-grass-50 text-grass-600 dark:bg-grass-700/20 dark:text-grass-300 hover:bg-grass-100 dark:hover:bg-grass-700/30 transition-colors"
            >
              {categoryLabels[category] || category}
            </a>
            <time className="text-xs text-slate-400 dark:text-slate-500" dateTime={new Date(date).toISOString()}>
              {formattedDate}
            </time>
          </div>

          <h2 className="text-lg font-semibold mb-2">
            <a
              href={`/posts/${slug}/`}
              className="text-slate-800 dark:text-slate-100 hover:text-primary-500 dark:hover:text-primary-400 transition-colors line-clamp-2"
            >
              {title}
            </a>
          </h2>

          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <a
                  key={tag}
                  href={`/tags/${tag}/`}
                  className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-grass-50 hover:text-grass-600 dark:hover:bg-grass-700/20 dark:hover:text-grass-300 transition-colors"
                >
                  #{tag}
                </a>
              ))}
            </div>
          )}
        </div>
      </CardSpotlight>
    </motion.article>
  );
}
