import { motion } from 'motion/react';

interface TagCloudProps {
  tags: Array<{ tag: string; count: number }>;
}

export function TagCloud({ tags }: TagCloudProps) {
  if (tags.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">🏷️ 标签</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map(({ tag, count }) => (
          <motion.a
            key={tag}
            href={`/tags/${tag}/`}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-grass-50 hover:text-grass-600 dark:hover:bg-grass-700/20 dark:hover:text-grass-300 transition-colors"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            #{tag}
            <span className="ml-0.5 text-slate-400 dark:text-slate-500">({count})</span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
