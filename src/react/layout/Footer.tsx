import { FadeIn } from '../motion/FadeIn';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <FadeIn direction="up" distance={16}>
      <footer className="mt-auto border-t border-ink-200/70 dark:border-ink-700/70 bg-white/60 dark:bg-ink-900/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left flex items-center gap-2.5">
              <img src="/brand/logo-icon.svg" alt="logo" className="w-7 h-7 rounded-md" />
              <p className="text-sm text-ink-500 dark:text-ink-300">
                &copy; {year}{' '}
                <span className="font-medium text-ink-700 dark:text-ink-100">openingClouds</span>
                {' '}&middot; Built with{' '}
                <a href="https://astro.build" className="text-primary-500 hover:underline" target="_blank" rel="noopener">
                  Astro
                </a>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/hqy2020"
                className="text-ink-400 hover:text-primary-500 transition-colors"
                target="_blank"
                rel="noopener"
                aria-label="GitHub"
              >
                <img src="/icons/contact/github.svg" alt="" className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </FadeIn>
  );
}
