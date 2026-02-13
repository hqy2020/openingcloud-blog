import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../ui/cn';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: '首页', href: '/' },
  { label: '技术', href: '/tech/' },
  { label: '效率', href: '/learning/' },
  { label: '生活', href: '/life/' },
];

function isActive(href: string, currentPath: string) {
  if (href === '/') return currentPath === '/';
  return currentPath.startsWith(href);
}

interface NavbarProps {
  currentPath: string;
}

export default function Navbar({ currentPath }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-50 border-b border-ink-200/70 dark:border-ink-700/70 bg-white/82 dark:bg-ink-900/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="inline-flex items-center gap-2.5 group">
          <img src="/brand/logo-icon.svg" alt="openingClouds" className="w-8 h-8 rounded-lg" />
          <span className="font-display text-lg text-ink-900 dark:text-ink-100 group-hover:text-primary-500 transition-colors">
            openingClouds
          </span>
        </a>

        <div className="hidden md:flex items-center gap-1 relative">
          {navItems.map((item) => {
            const active = isActive(item.href, currentPath);
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'relative z-10 px-3.5 py-2 rounded-full text-sm font-medium transition-colors',
                  active
                    ? 'text-primary-700 dark:text-primary-200'
                    : 'text-ink-500 hover:text-primary-600 dark:text-ink-300 dark:hover:text-primary-200'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-primary-100/90 dark:bg-primary-900/35"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                  />
                )}
                {item.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <a
            href="https://github.com/hqy2020"
            target="_blank"
            rel="noopener"
            className="p-2 rounded-lg text-ink-500 hover:text-primary-600 dark:text-ink-300 dark:hover:text-primary-200 transition-colors"
            aria-label="GitHub"
          >
            <img src="/icons/contact/github.svg" alt="" className="w-5 h-5" />
          </a>

          <button
            onClick={toggle}
            className="p-2 rounded-lg text-ink-500 hover:text-primary-600 dark:text-ink-300 dark:hover:text-primary-200 transition-colors relative w-9 h-9 flex items-center justify-center cursor-pointer"
            aria-label="切换深色模式"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.svg
                  key="sun"
                  className="w-5 h-5 absolute"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36-.7-.7M6.34 6.34l-.7-.7m12.72 0-.7.7M6.34 17.66l-.7.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="moon"
                  className="w-5 h-5 absolute"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.36 15.35A9 9 0 0 1 8.65 3.64 9 9 0 1 0 20.35 15.35Z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="md:hidden p-2 rounded-lg text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800 transition-colors cursor-pointer"
            aria-label="菜单"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-ink-200/70 dark:border-ink-700/70 bg-white/95 dark:bg-ink-900/95 backdrop-blur"
          >
            <div className="px-4 py-3 space-y-1.5">
              {navItems.map((item) => {
                const active = isActive(item.href, currentPath);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                        : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
                    )}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
