import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchPosts } from "../api/posts";
import type { PostSummary } from "../api/posts";
import { FadeIn } from "../components/motion/FadeIn";
import { BackgroundBeams } from "../components/ui/BackgroundBeams";
import { CardSpotlight } from "../components/ui/CardSpotlight";
import { TextGenerateEffect } from "../components/ui/TextGenerateEffect";
import { getFallbackPosts } from "../data/fallback";

type CategoryPageProps = {
  category: "tech" | "learning" | "life";
  title: string;
};

const CATEGORY_PAGE_SIZE = 10;
const AUTOLOAD_WHEEL_DELTA_THRESHOLD = 40;
const AUTOLOAD_TOUCH_DELTA_THRESHOLD = 56;
const AUTOLOAD_ARM_DELAY_MS = 360;
const AUTOLOAD_WHEEL_GESTURE_GAP_MS = 220;
const APPEND_REVEAL_INTERVAL_MS = 220;
const APPEND_REVEAL_BATCH_SIZE = 3;

const categoryDescriptions: Record<CategoryPageProps["category"], string> = {
  tech: "技术实践、系统设计与工程复盘。",
  learning: "效率系统、学习方法和个人生产力。",
  life: "旅行、日常观察与生活记录。",
};

const visuals: Record<
  CategoryPageProps["category"],
  {
    icon: string;
    beams: string[];
    accentText: string;
    glow: string;
    accentHex: string;
    badge: string;
    headerOverlay: string;
  }
> = {
  tech: {
    icon: "💻",
    beams: ["#6B917B", "#4F6AE5", "#B5D4BF"],
    accentText: "探索代码世界的边界",
    glow: "107, 145, 123",
    accentHex: "#6B917B",
    badge: "ENGINEERING",
    headerOverlay:
      "linear-gradient(130deg, rgba(107,145,123,0.34), rgba(79,106,229,0.16) 44%, rgba(255,255,255,0.7))",
  },
  learning: {
    icon: "📚",
    beams: ["#B8945E", "#D6BD8B", "#4F6AE5"],
    accentText: "把混乱的方法论变成可执行系统",
    glow: "184, 148, 94",
    accentHex: "#B8945E",
    badge: "SYSTEM",
    headerOverlay:
      "linear-gradient(130deg, rgba(184,148,94,0.36), rgba(214,189,139,0.2) 44%, rgba(255,255,255,0.68))",
  },
  life: {
    icon: "📷",
    beams: ["#9684A8", "#C2B6CF", "#4F6AE5"],
    accentText: "在日常里记录真实、温和、持续的生长",
    glow: "150, 132, 168",
    accentHex: "#9684A8",
    badge: "MOMENTS",
    headerOverlay:
      "linear-gradient(130deg, rgba(150,132,168,0.36), rgba(194,182,207,0.22) 44%, rgba(255,255,255,0.72))",
  },
};

function formatViews(value: number) {
  if (value >= 1000) {
    const short = value >= 10000 ? (value / 1000).toFixed(0) : (value / 1000).toFixed(1);
    return `${short}k`;
  }
  return String(value);
}

function estimateReadMinutes(post: PostSummary) {
  const estimatedWords = Math.max(80, Math.round((post.excerpt || "").length * 2.6));
  return Math.max(1, Math.round(estimatedWords / 280));
}

export function CategoryPage({ category, title }: CategoryPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTag, setSelectedTag] = useState<string>(() => String(searchParams.get("tag") || "").trim());
  const [sortBy, setSortBy] = useState<"latest" | "views">("latest");
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingGesture, setAwaitingGesture] = useState(false);
  const [recentlyAppendedSlugs, setRecentlyAppendedSlugs] = useState<string[]>([]);
  const [appendQueue, setAppendQueue] = useState<PostSummary[]>([]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastWheelTsRef = useRef(0);
  const wheelGestureRef = useRef(0);
  const touchGestureRef = useRef(0);
  const armedWheelGestureRef = useRef(0);
  const armedTouchGestureRef = useRef(0);
  const armedAtRef = useRef(0);
  const rearmBlockedRef = useRef(false);

  const handleSelectTag = useCallback(
    (nextTag: string) => {
      const normalized = nextTag.trim();
      setSelectedTag((prev) => (prev === normalized ? prev : normalized));

      const current = String(searchParams.get("tag") || "").trim();
      if (current === normalized || (!current && !normalized)) {
        return;
      }
      const nextParams = new URLSearchParams(searchParams);
      if (normalized) {
        nextParams.set("tag", normalized);
      } else {
        nextParams.delete("tag");
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const loadPage = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      let keepLoadingMore = false;
      if (mode === "replace") {
        setLoadingInitial(true);
        setLoadingMore(false);
        setAppendQueue([]);
        setRecentlyAppendedSlugs([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const payload = await fetchPosts({
          category,
          tag: selectedTag || undefined,
          sort: sortBy,
          page: targetPage,
          page_size: CATEGORY_PAGE_SIZE,
        });

        setTotalCount(payload.count);
        setHasMore(Boolean(payload.next));
        setPage(targetPage);
        if (mode === "replace") {
          setPosts(payload.results);
        } else {
          const deduped = payload.results.filter(
            (item, index, arr) => arr.findIndex((it) => it.slug === item.slug) === index,
          );
          if (deduped.length > 0) {
            keepLoadingMore = true;
            setAppendQueue(deduped);
          } else {
            setAppendQueue([]);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        if (mode === "replace") {
          setAppendQueue([]);
          setRecentlyAppendedSlugs([]);
          setPosts([]);
          setTotalCount(0);
          setHasMore(false);
          setPage(1);
        }
      } finally {
        if (mode === "replace") {
          setLoadingInitial(false);
        } else if (!keepLoadingMore) {
          setLoadingMore(false);
        }
      }
    },
    [category, selectedTag, sortBy],
  );

  useEffect(() => {
    void loadPage(1, "replace");
  }, [loadPage]);

  useEffect(() => {
    const queryTag = String(searchParams.get("tag") || "").trim();
    setSelectedTag((prev) => (prev === queryTag ? prev : queryTag));
  }, [searchParams]);

  const fallbackPosts = useMemo(
    () => (error && posts.length === 0 ? getFallbackPosts(category) : []),
    [category, error, posts.length],
  );
  const effectivePosts = fallbackPosts.length > 0 ? fallbackPosts : posts;

  const autoLoadNextPage = useCallback(() => {
    if (loadingInitial || loadingMore || !hasMore || fallbackPosts.length > 0) {
      return;
    }
    void loadPage(page + 1, "append");
  }, [fallbackPosts.length, hasMore, loadPage, loadingInitial, loadingMore, page]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || loadingInitial || loadingMore || !hasMore || fallbackPosts.length > 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries.some((entry) => entry.isIntersecting);
        if (!inView) {
          rearmBlockedRef.current = false;
          setAwaitingGesture(false);
          return;
        }

        if (rearmBlockedRef.current) {
          setAwaitingGesture(false);
          return;
        }

        armedAtRef.current = Date.now();
        armedWheelGestureRef.current = wheelGestureRef.current;
        armedTouchGestureRef.current = touchGestureRef.current;
        setAwaitingGesture(true);
      },
      { rootMargin: "0px", threshold: 0.98 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fallbackPosts.length, hasMore, loadingInitial, loadingMore]);

  useEffect(() => {
    if (!awaitingGesture || loadingInitial || loadingMore || !hasMore || fallbackPosts.length > 0) {
      return;
    }

    let fired = false;
    const trigger = () => {
      if (fired) {
        return;
      }
      fired = true;
      rearmBlockedRef.current = true;
      setAwaitingGesture(false);
      autoLoadNextPage();
    };

    const onWheel = (event: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelTsRef.current > AUTOLOAD_WHEEL_GESTURE_GAP_MS) {
        wheelGestureRef.current += 1;
      }
      lastWheelTsRef.current = now;
      if (
        event.deltaY > AUTOLOAD_WHEEL_DELTA_THRESHOLD &&
        now - armedAtRef.current > AUTOLOAD_ARM_DELAY_MS &&
        wheelGestureRef.current > armedWheelGestureRef.current
      ) {
        trigger();
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchGestureRef.current += 1;
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (startY == null || currentY == null) {
        return;
      }
      if (
        startY - currentY > AUTOLOAD_TOUCH_DELTA_THRESHOLD &&
        Date.now() - armedAtRef.current > AUTOLOAD_ARM_DELAY_MS &&
        touchGestureRef.current > armedTouchGestureRef.current
      ) {
        trigger();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [autoLoadNextPage, awaitingGesture, fallbackPosts.length, hasMore, loadingInitial, loadingMore]);

  useEffect(() => {
    if (loadingInitial || loadingMore || !hasMore || fallbackPosts.length > 0) {
      setAwaitingGesture(false);
      rearmBlockedRef.current = false;
    }
  }, [fallbackPosts.length, hasMore, loadingInitial, loadingMore]);

  useEffect(() => {
    if (appendQueue.length === 0) {
      return;
    }
    let cursor = 0;
    const revealBatch = () => {
      const batch = appendQueue.slice(cursor, cursor + APPEND_REVEAL_BATCH_SIZE);
      if (batch.length === 0) {
        return false;
      }
      setPosts((prev) => {
        const existing = new Set(prev.map((item) => item.slug));
        const merged = [...prev];
        batch.forEach((item) => {
          if (!existing.has(item.slug)) {
            merged.push(item);
            existing.add(item.slug);
          }
        });
        return merged;
      });
      setRecentlyAppendedSlugs((prev) => {
        const merged = new Set(prev);
        batch.forEach((item) => merged.add(item.slug));
        return Array.from(merged);
      });
      cursor += APPEND_REVEAL_BATCH_SIZE;
      return true;
    };

    revealBatch();
    const timer = window.setInterval(() => {
      const hasRemaining = revealBatch();
      if (hasRemaining) {
        return;
      }
      window.clearInterval(timer);
      setAppendQueue([]);
      window.setTimeout(() => {
        setLoadingMore(false);
      }, 90);
    }, APPEND_REVEAL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [appendQueue]);

  useEffect(() => {
    if (recentlyAppendedSlugs.length === 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setRecentlyAppendedSlugs([]);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [recentlyAppendedSlugs]);

  const tags = useMemo(() => {
    const values = new Set<string>();
    effectivePosts.forEach((post) => {
      post.tags.forEach((tag) => values.add(tag));
    });
    return Array.from(values).sort();
  }, [effectivePosts]);

  const visual = visuals[category];
  const estimatedWords = useMemo(
    () => effectivePosts.reduce((sum, post) => sum + Math.max(0, Math.round((post.excerpt || "").length * 2.6)), 0),
    [effectivePosts],
  );
  const visiblePosts = useMemo(() => {
    if (fallbackPosts.length === 0) {
      return effectivePosts;
    }
    const sorted = [...effectivePosts];
    if (sortBy === "views") {
      sorted.sort((a, b) => {
        const byViews = b.views_count - a.views_count;
        if (byViews !== 0) {
          return byViews;
        }
        const byUpdatedAsc = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        if (byUpdatedAsc !== 0) {
          return byUpdatedAsc;
        }
        return a.slug.localeCompare(b.slug);
      });
      return sorted;
    }
    sorted.sort((a, b) => {
      const byUpdated = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (byUpdated !== 0) {
        return byUpdated;
      }
      return a.slug.localeCompare(b.slug);
    });
    return sorted;
  }, [effectivePosts, fallbackPosts.length, sortBy]);

  return (
    <section
      className="space-y-8 rounded-[28px] border p-4 sm:p-6"
      style={{
        borderColor: `rgba(${visual.glow},0.18)`,
        background: `linear-gradient(180deg, rgba(${visual.glow},0.11), rgba(248,249,252,0.88) 34%, rgba(248,249,252,0.98) 100%)`,
      }}
    >
      <Helmet>
        <title>{`${title} | openingClouds`}</title>
        <meta content={categoryDescriptions[category]} name="description" />
        <meta content={`${title} | openingClouds`} property="og:title" />
        <meta content={categoryDescriptions[category]} property="og:description" />
        <link href={`https://blog.openingclouds.com/${category}`} rel="canonical" />
      </Helmet>

      <FadeIn>
        <header
          className="relative overflow-hidden rounded-3xl border bg-white/85 p-7 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur sm:p-9"
          style={{ borderColor: `rgba(${visual.glow},0.3)` }}
        >
          <BackgroundBeams colors={visual.beams} />
          <div className="pointer-events-none absolute inset-0" style={{ background: visual.headerOverlay }} />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
            style={{ background: `rgba(${visual.glow},0.28)` }}
          />

          <div className="relative">
            <p className="text-sm tracking-[0.22em] text-slate-500">{visual.badge}</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-900">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border text-xl shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                style={{ borderColor: `rgba(${visual.glow},0.32)`, background: `rgba(${visual.glow},0.15)` }}
              >
                {visual.icon}
              </span>
              <span style={{ color: visual.accentHex }}>{title}</span>
            </h1>
            <p className="mt-3 text-slate-600">
              <TextGenerateEffect text={visual.accentText} />
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {totalCount || effectivePosts.length} 篇文章 · 约 {estimatedWords.toLocaleString()} 字
              {totalCount > 0 && effectivePosts.length < totalCount ? ` · 已加载 ${effectivePosts.length} 篇` : ""}
            </p>
          </div>
        </header>
      </FadeIn>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
            {["全部", ...tags].map((tagLabel) => {
              const value = tagLabel === "全部" ? "" : tagLabel;
              const active = value === selectedTag;
              return (
                <button
                  key={tagLabel}
                  type="button"
                  onClick={() => handleSelectTag(value)}
                  className="relative whitespace-nowrap rounded-full border bg-white px-3 py-1.5 text-sm transition"
                  style={{
                    borderColor: active ? `rgba(${visual.glow},0.45)` : "rgba(148,163,184,0.3)",
                    color: active ? visual.accentHex : "#475569",
                  }}
                >
                  <span className="relative">
                    {tagLabel}
                    {tagLabel !== "全部"
                      ? `(${effectivePosts.filter((post) => post.tags.includes(tagLabel)).length})`
                      : `(${totalCount || effectivePosts.length})`}
                  </span>
                  {active ? (
                    <motion.span
                      layoutId={`tag-active-${category}`}
                      className="absolute bottom-0 left-[18%] h-[2px] w-[64%] rounded-full"
                      style={{ background: visual.accentHex }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">排序</span>
            <button
              type="button"
              className="rounded-full border px-3 py-1"
              style={{
                borderColor: sortBy === "latest" ? `rgba(${visual.glow},0.45)` : "rgba(148,163,184,0.3)",
                color: sortBy === "latest" ? visual.accentHex : "#64748b",
              }}
              onClick={() => setSortBy("latest")}
            >
              最新优先
            </button>
            <button
              type="button"
              className="rounded-full border px-3 py-1"
              style={{
                borderColor: sortBy === "views" ? `rgba(${visual.glow},0.45)` : "rgba(148,163,184,0.3)",
                color: sortBy === "views" ? visual.accentHex : "#64748b",
              }}
              onClick={() => setSortBy("views")}
            >
              阅读最多
            </button>
          </div>
        </div>
      </section>

      {loadingInitial && <p className="text-slate-500">加载中...</p>}
      {error ? <p className="text-sm text-amber-700">实时数据暂不可用，已展示静态内容。</p> : null}

      <div className="columns-2 gap-3 sm:gap-4">
        {visiblePosts.map((post) => {
          const isRecentlyAppended = recentlyAppendedSlugs.includes(post.slug);
          return (
            <motion.div
              key={post.slug}
              className="mb-3 break-inside-avoid sm:mb-4"
              initial={isRecentlyAppended ? { opacity: 0, y: 20, scale: 0.97 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={
                isRecentlyAppended
                  ? { type: "spring", stiffness: 150, damping: 24, mass: 1 }
                  : { duration: 0.24, ease: "easeOut" }
              }
            >
            <CardSpotlight
              className="rounded-2xl border bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(15,23,42,0.12)]"
              style={{
                borderColor: `rgba(${visual.glow},0.28)`,
                background: `linear-gradient(165deg, rgba(255,255,255,0.95), rgba(${visual.glow},0.08))`,
              }}
              glowColor={visual.glow}
            >
              <div
                className="pointer-events-none absolute left-0 right-0 top-0 h-1.5"
                style={{
                  background: `linear-gradient(90deg, rgba(${visual.glow},0.18), rgba(${visual.glow},0.84), rgba(${visual.glow},0.18))`,
                }}
              />

              <h2 className="text-xl font-semibold text-slate-900">
                <Link className="line-clamp-2 transition hover:opacity-80" style={{ color: visual.accentHex }} to={`/posts/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>

              <p className="mt-2 text-sm text-slate-600">{post.excerpt || "暂无摘要"}</p>

              <div className="mt-3 flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <span
                    key={`${post.slug}-${tag}`}
                    className="rounded-full px-2 py-1 text-xs"
                    style={{ background: `rgba(${visual.glow},0.14)`, color: visual.accentHex }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {new Date(post.updated_at).toLocaleDateString("zh-CN")} · 👁 {formatViews(post.views_count)} · {estimateReadMinutes(post)} min
              </p>
            </CardSpotlight>
            </motion.div>
          );
        })}
      </div>

      {!loadingInitial && !fallbackPosts.length && hasMore ? (
        <div ref={loadMoreRef} className="flex flex-col items-center gap-2 pt-1">
          {loadingMore ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              正在加载更多...
            </div>
          ) : awaitingGesture ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <motion.span
                className="inline-block text-sm"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                ↓
              </motion.span>
              再下拉一下，松手后加载下一页
            </div>
          ) : (
            <p className="text-xs text-slate-500">滑到底部后，再拖一下即可加载</p>
          )}
          <p className="text-xs text-slate-500">
            已加载 {effectivePosts.length}/{totalCount} 篇
          </p>
        </div>
      ) : null}

      {!loadingInitial && !fallbackPosts.length && !hasMore && effectivePosts.length > 0 ? (
        <p className="text-center text-xs text-slate-500">已加载全部 {effectivePosts.length} 篇</p>
      ) : null}

      {!loadingInitial && effectivePosts.length === 0 ? <p className="text-slate-500">暂无文章</p> : null}
    </section>
  );
}
