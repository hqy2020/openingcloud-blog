import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../ui/cn';

interface CategoryTabsProps {
  categories: Array<{
    key: string;
    label: string;
    icon: string;
  }>;
  activeCategory: string;
  onCategoryChange?: (category: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  const [active, setActive] = useState(activeCategory);

  const handleClick = (key: string) => {
    setActive(key);
    onCategoryChange?.(key);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => handleClick(cat.key)}
          className={cn(
            'relative px-4 py-2 text-sm rounded-full font-medium transition-colors cursor-pointer',
            active === cat.key
              ? 'text-primary-700 dark:text-primary-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          )}
        >
          {active === cat.key && (
            <motion.span
              layoutId="category-tab-indicator"
              className="absolute inset-0 rounded-full bg-primary-100/80 dark:bg-primary-900/30 border border-primary-200/50 dark:border-primary-700/30"
              style={{ zIndex: -1 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          )}
          {cat.icon} {cat.label}
        </button>
      ))}
    </div>
  );
}
