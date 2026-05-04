import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { fetchSocialStats, type PlatformStat } from "../../api/social";
import { useAsync } from "../../hooks/useAsync";
import { useCountUp } from "../../hooks/useCountUp";
import { SectionCard } from "../revamp/shared/SectionCard";
import { cn } from "../../lib/utils";

const PLATFORM_CONFIG: Record<string, { icon: string; label: string; viewLabel: string }> = {
  bilibili: { icon: "📺", label: "B站", viewLabel: "播放" },
  zhihu: { icon: "💡", label: "知乎", viewLabel: "收藏" },
  xiaohongshu: { icon: "📕", label: "小红书", viewLabel: "阅读" },
  wechat_oa: { icon: "📱", label: "公众号", viewLabel: "昨日阅读" },
  blog: { icon: "🌐", label: "博客", viewLabel: "阅读" },
  douyin: { icon: "🎵", label: "抖音", viewLabel: "播放" },
  kuaishou: { icon: "📱", label: "快手", viewLabel: "播放" },
  shipinhao: { icon: "📹", label: "视频号", viewLabel: "昨日播放" },
  nowcoder: { icon: "💻", label: "牛客", viewLabel: "阅读" },
  weibo: { icon: "📢", label: "微博", viewLabel: "阅读" },
  douban: { icon: "📚", label: "豆瓣", viewLabel: "评分" },
};

const CARDS_DESKTOP = 4;
const CARDS_TABLET = 3;
const CARDS_MOBILE = 2;
const AUTO_PLAY_MS = 5000;

const hoverSpring = { type: "spring" as const, stiffness: 300, damping: 26 };

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
};

function SummaryCounter({ target, label }: { target: number; label: string }) {
  const { value, nodeRef } = useCountUp(target, { duration: 1600, startWhenVisible: true });
  return (
    <span className="whitespace-nowrap">
      {label}{" "}
      <strong ref={nodeRef as React.Ref<HTMLElement>} className="tabular-nums text-theme-ink">
        {value.toLocaleString()}
      </strong>
    </span>
  );
}

function PlatformMiniCard({ stat }: { stat: PlatformStat }) {
  const cfg = PLATFORM_CONFIG[stat.platform] ?? { icon: "🌍", label: stat.platform, viewLabel: "阅读" };
  const prefersReducedMotion = useReducedMotion();

  const cardLift = useMemo(() => {
    if (typeof document === "undefined") return -4;
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--theme-card-lift").trim();
    return parseFloat(raw) || -4;
  }, []);

  return (
    <motion.div
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: cardLift, scale: 1.03 }
      }
      transition={hoverSpring}
      className="group relative h-full overflow-hidden rounded-2xl border border-theme-line/30 bg-theme-surface/70 p-4 shadow-[var(--theme-shadow-whisper)] backdrop-blur-sm transition-[border-color,box-shadow]
        hover:border-theme-accent/40 hover:shadow-[var(--theme-shadow-lifted)]"
      style={{ transitionDuration: "var(--theme-transition-ms)" }}
    >
      {/* Accent glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgb(var(--theme-accent) / 0.25), 0 0 24px rgb(var(--theme-accent) / 0.06)",
          transitionDuration: "var(--theme-transition-ms)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="text-xl">{cfg.icon}</span>
        <span className="font-theme-display text-sm font-semibold text-theme-ink truncate">
          {cfg.label}
        </span>
        {stat.yesterday_followers > 0 && (
          <span className="ml-auto rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-theme-sans text-[10px] font-medium text-emerald-600">
            +{stat.yesterday_followers}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="relative z-10 mt-3 grid grid-cols-3 gap-1">
        <div className="text-center">
          <div className="font-theme-sans text-[10px] text-theme-muted">粉丝</div>
          <div className="font-theme-sans text-base font-bold tabular-nums leading-tight text-theme-ink">
            {stat.followers.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="font-theme-sans text-[10px] text-theme-muted">
            {stat.yesterday_views > 0 ? cfg.viewLabel : `总${cfg.viewLabel}`}
          </div>
          <div className="font-theme-sans text-base font-bold tabular-nums leading-tight text-theme-ink">
            {(stat.yesterday_views > 0 ? stat.yesterday_views : stat.total_views).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="font-theme-sans text-[10px] text-theme-muted">获赞</div>
          <div className="font-theme-sans text-base font-bold tabular-nums leading-tight text-theme-ink">
            {stat.total_likes.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Best post hint on hover */}
      {stat.best_post_title && (
        <div className="relative z-10 mt-2 overflow-hidden">
          <div
            className="border-t border-theme-line/20 pt-1.5 opacity-0 transition-opacity group-hover:opacity-100"
            style={{ transitionDuration: "var(--theme-transition-ms)" }}
          >
            <a
              href={stat.best_post_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-1 font-theme-sans text-[11px] text-theme-accent transition hover:underline"
            >
              {stat.best_post_title}
            </a>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function SocialStatsCarousel() {
  const { data, loading } = useAsync(fetchSocialStats, []);
  const prefersReducedMotion = useReducedMotion();
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState(CARDS_DESKTOP);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setCardsPerPage(CARDS_MOBILE);
      else if (w < 1024) setCardsPerPage(CARDS_TABLET);
      else setCardsPerPage(CARDS_DESKTOP);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const platforms = data?.platforms ?? [];
  const totalPages = Math.max(1, Math.ceil(platforms.length / cardsPerPage));

  const goTo = useCallback(
    (target: number, dir: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setDirection(dir);
      setPage(Math.max(0, Math.min(target, totalPages - 1)));
    },
    [totalPages],
  );

  const goPrev = useCallback(() => {
    goTo(page === 0 ? totalPages - 1 : page - 1, -1);
  }, [page, totalPages, goTo]);

  const goNext = useCallback(() => {
    goTo((page + 1) % totalPages, 1);
  }, [page, totalPages, goTo]);

  useEffect(() => {
    if (paused || platforms.length === 0) return;
    timerRef.current = setInterval(() => {
      setDirection(1);
      setPage((p) => (p + 1) % totalPages);
    }, AUTO_PLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, totalPages, platforms.length, page]);

  if (loading) return null;
  if (platforms.length === 0) return null;

  const start = page * cardsPerPage;
  const visibleCards = platforms.slice(start, start + cardsPerPage);

  const gridCols =
    cardsPerPage === CARDS_DESKTOP
      ? "grid-cols-4"
      : cardsPerPage === CARDS_TABLET
        ? "grid-cols-3"
        : "grid-cols-2";

  return (
    <SectionCard id="social-stats-carousel" className="overflow-hidden">
      <div
        className="select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <h2 className="font-theme-display text-lg font-bold text-theme-ink">
              自媒体影响力
            </h2>
            <span className="font-theme-sans text-xs text-theme-muted">
              {data?.platform_count ?? 0} 个平台
              {data?.updated_at
                ? ` · ${new Date(data.updated_at).toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                  })}`
                : ""}
            </span>
          </div>

          {/* Summary counters */}
          <div className="hidden items-center gap-4 font-theme-sans text-xs text-theme-muted sm:flex">
            <SummaryCounter target={data?.total_followers ?? 0} label="总粉丝" />
            <SummaryCounter target={data?.total_views ?? 0} label="总浏览" />
            <SummaryCounter target={data?.total_likes ?? 0} label="总获赞" />
          </div>
        </div>

        {/* Carousel area */}
        <div className="relative">
          {/* Arrow buttons */}
          {totalPages > 1 && (
            <>
              <button
                onClick={goPrev}
                aria-label="上一页"
                className="absolute -left-3 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-theme-line bg-theme-surface-raised shadow-[var(--theme-shadow-whisper)] text-theme-muted transition hover:border-theme-accent hover:text-theme-accent hover:shadow-[var(--theme-shadow-lifted)]"
                style={{ transitionDuration: "var(--theme-transition-ms)" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goNext}
                aria-label="下一页"
                className="absolute -right-3 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-theme-line bg-theme-surface-raised shadow-[var(--theme-shadow-whisper)] text-theme-muted transition hover:border-theme-accent hover:text-theme-accent hover:shadow-[var(--theme-shadow-lifted)]"
                style={{ transitionDuration: "var(--theme-transition-ms)" }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Sliding cards */}
          <div className="overflow-hidden px-1">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={page}
                custom={direction}
                variants={prefersReducedMotion ? undefined : slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
                }
                className={cn("grid gap-3", gridCols)}
              >
                {visibleCards.map((stat) => (
                  <PlatformMiniCard key={stat.platform} stat={stat} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dot indicators */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > page ? 1 : -1)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === page
                    ? "w-6 bg-theme-accent"
                    : "w-2 bg-theme-line hover:bg-theme-muted",
                )}
                style={{ transitionDuration: "var(--theme-transition-ms)" }}
                aria-label={`第 ${i + 1} 页`}
              />
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
