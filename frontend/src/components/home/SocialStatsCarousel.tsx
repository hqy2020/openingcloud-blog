import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSocialStats, type PlatformStat } from "../../api/social";
import { useAsync } from "../../hooks/useAsync";
import { SectionCard } from "../revamp/shared/SectionCard";

const PLATFORM_CONFIG: Record<string, { icon: string; label: string }> = {
  bilibili: { icon: "📺", label: "B站" },
  zhihu: { icon: "💡", label: "知乎" },
  xiaohongshu: { icon: "📕", label: "小红书" },
  wechat_oa: { icon: "📱", label: "公众号" },
  blog: { icon: "🌐", label: "博客" },
  douyin: { icon: "🎵", label: "抖音" },
  kuaishou: { icon: "📱", label: "快手" },
  shipinhao: { icon: "📹", label: "视频号" },
  nowcoder: { icon: "💻", label: "牛客" },
  weibo: { icon: "📢", label: "微博" },
  douban: { icon: "📚", label: "豆瓣" },
};

function PlatformMiniCard({ stat, index }: { stat: PlatformStat; index: number }) {
  const cfg = PLATFORM_CONFIG[stat.platform] ?? { icon: "🌍", label: stat.platform };
  return (
    <div
      className="flex-shrink-0 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.67rem)] lg:w-[calc(25%-0.75rem)]"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="group h-full rounded-xl border border-theme-border/20 bg-theme-surface/60 p-4 backdrop-blur-sm transition hover:border-theme-accent/30 hover:shadow-md hover:bg-theme-surface/80">
        {/* 头部：图标 + 名称 */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{cfg.icon}</span>
          <span className="text-sm font-semibold text-theme-ink truncate">{cfg.label}</span>
        </div>

        {/* 三围数据 */}
        <div className="mt-3 grid grid-cols-3 gap-1">
          <div className="text-center">
            <div className="text-xs text-theme-muted">粉丝</div>
            <div className="text-base font-bold text-theme-ink leading-tight">
              {stat.followers.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-theme-muted">浏览</div>
            <div className="text-base font-bold text-theme-ink leading-tight">
              {stat.total_views.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-theme-muted">获赞</div>
            <div className="text-base font-bold text-theme-ink leading-tight">
              {stat.total_likes.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SocialStatsCarousel() {
  const { data, loading } = useAsync(fetchSocialStats, []);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardsPerPage, setCardsPerPage] = useState(4);

  // 响应式：计算每页显示几个卡片
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setCardsPerPage(2);
      else if (w < 1024) setCardsPerPage(3);
      else setCardsPerPage(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const platforms = data?.platforms ?? [];
  const totalPages = Math.max(1, Math.ceil(platforms.length / cardsPerPage));

  const goTo = useCallback(
    (p: number) => {
      setPage(Math.max(0, Math.min(p, totalPages - 1)));
    },
    [totalPages],
  );

  // 自动轮播
  useEffect(() => {
    if (paused || platforms.length === 0) return;
    timerRef.current = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, totalPages, platforms.length]);

  if (loading) return null;
  if (platforms.length === 0) return null;

  // 按当前页裁切数据
  const start = page * cardsPerPage;
  const visibleCards = platforms.slice(start, start + cardsPerPage);

  return (
    <SectionCard
      id="social-stats-carousel"
      className="overflow-hidden"
    >
      <div
        ref={containerRef}
        className="select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* 标题栏 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <h2 className="text-lg font-bold text-theme-ink">自媒体影响力</h2>
            <span className="text-xs text-theme-muted">
              {data?.platform_count ?? 0} 个平台 ·{" "}
              {data?.updated_at
                ? new Date(data.updated_at).toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                  })
                : "暂无数据"}
            </span>
          </div>
          {/* 汇总 */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-theme-muted">
            <span>总粉丝 <strong className="text-theme-ink">{data?.total_followers?.toLocaleString() ?? 0}</strong></span>
            <span>总浏览 <strong className="text-theme-ink">{data?.total_views?.toLocaleString() ?? 0}</strong></span>
            <span>总获赞 <strong className="text-theme-ink">{data?.total_likes?.toLocaleString() ?? 0}</strong></span>
          </div>
        </div>

        {/* 轮播卡片 */}
        <div className="flex flex-wrap gap-4 transition-opacity duration-300">
          {visibleCards.map((stat, i) => (
            <PlatformMiniCard key={stat.platform} stat={stat} index={start + i} />
          ))}
        </div>

        {/* 分页指示器 */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === page
                    ? "w-6 bg-theme-accent"
                    : "w-2 bg-theme-border/40 hover:bg-theme-border/70"
                }`}
                aria-label={`第 ${i + 1} 页`}
              />
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
