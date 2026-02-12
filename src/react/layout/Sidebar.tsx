import { CardSpotlight } from '../ui/CardSpotlight';
import { FadeIn } from '../motion/FadeIn';
import { TagCloud } from './TagCloud';

interface SidebarProps {
  totalPosts: number;
  totalTags: number;
  tags: Array<{ tag: string; count: number }>;
}

export function Sidebar({ totalPosts, totalTags, tags }: SidebarProps) {
  return (
    <aside className="space-y-6">
      {/* 作者卡片 */}
      <FadeIn delay={0.1}>
        <CardSpotlight className="p-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-3xl text-white mb-3">
            ☁️
          </div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">openingClouds</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Java 后端 · AI 探索者</p>

          <div className="flex justify-center gap-6 mt-4 text-center">
            <div>
              <div className="text-lg font-bold text-sun-400">{totalPosts}</div>
              <div className="text-xs text-slate-400">文章</div>
            </div>
            <div>
              <div className="text-lg font-bold text-sun-400">4</div>
              <div className="text-xs text-slate-400">分类</div>
            </div>
            <div>
              <div className="text-lg font-bold text-sun-400">{totalTags}</div>
              <div className="text-xs text-slate-400">标签</div>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-4">
            <a
              href="https://github.com/hqy2020"
              target="_blank"
              rel="noopener"
              className="text-slate-400 hover:text-primary-500 transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </CardSpotlight>
      </FadeIn>

      {/* 标签云 */}
      <FadeIn delay={0.2}>
        <TagCloud tags={tags} />
      </FadeIn>
    </aside>
  );
}
