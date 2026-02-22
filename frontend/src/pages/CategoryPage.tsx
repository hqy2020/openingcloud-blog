import { stagger } from "motion";
import { AnimatePresence, motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchPosts } from "../api/posts";
import type { PostSummary } from "../api/posts";
import { FadeIn } from "../components/motion/FadeIn";
import { DirectionAwareTabs } from "../components/revamp/list/DirectionAwareTabs";
import { BackgroundBeams } from "../components/ui/BackgroundBeams";
import { BlurRevealImage } from "../components/ui/BlurRevealImage";
import { CardSpotlight } from "../components/ui/CardSpotlight";
import { GenerativeCover } from "../components/ui/GenerativeCover";
import { TextGenerateEffect } from "../components/ui/TextGenerateEffect";
import { ToolbarExpandable } from "../components/ui/ToolbarExpandable";
import { CardContainer, CardBody, CardItem } from "../components/ui/ThreeDCard";
import { TracingBeam } from "../components/ui/TracingBeam";
import { getFallbackPosts } from "../data/fallback";
import { categoryVisuals } from "../theme/categoryVisuals";

type CategoryPageProps = {
  category: "tech" | "learning" | "life";
  title: string;
};

const CATEGORY_PAGE_SIZE = 10;
const APPEND_STAGGER_SECONDS = 0.12;

const categoryDescriptions: Record<CategoryPageProps["category"], string> = {
  tech: "技术实践、系统设计与工程复盘。",
  learning: "效率系统、学习方法和个人生产力。",
  life: "旅行、日常观察与生活记录。",
};

const categoryTabs = [
  { id: "tech", label: "技术", path: "/tech" },
  { id: "learning", label: "效率", path: "/learning" },
  { id: "life", label: "生活", path: "/life" },
];

const visuals: Record<
  CategoryPageProps["category"],
  {
    icon: string;
    beams: string[];
    accentText: string;
    badge: string;
    accentHex: string;
    glowRgb: string;
    headerTintLight: string;
  }
> = {
  tech: {
    ...categoryVisuals.tech,
    icon: "💻",
    beams: ["#6B917B", "#4F6AE5", "#B5D4BF"],
    accentText: "探索代码世界的边界",
    badge: "ENGINEERING",
  },
  learning: {
    ...categoryVisuals.learning,
    icon: "📚",
    beams: ["#B8945E", "#D6BD8B", "#4F6AE5"],
    accentText: "把混乱的方法论变成可执行系统",
    badge: "SYSTEM",
  },
  life: {
    ...categoryVisuals.life,
    icon: "📷",
    beams: ["#9684A8", "#C2B6CF", "#4F6AE5"],
    accentText: "在日常里记录真实、温和、持续的生长",
    badge: "MOMENTS",
  },
};

function resolvePostCover(post: PostSummary): string | null {
  const normalizedCover = String(post.cover || "").trim();
  return normalizedCover || null;
}

function formatViews(value: number) {
  if (value >= 1000) {
    const short = value >= 10000 ? (value / 1000).toFixed(0) : (value / 1000).toFixed(1);
    return `${short}k`;
  }
  return String(value);
}

function estimateReadMinutes(post: PostSummary) {
  const words = post.word_count || 0;
  return Math.max(1, Math.round(words / 280));
}

export function CategoryPage({ category, title }: CategoryPageProps) {
  const navigate = useNavigate();
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
  const [recentlyAppendedSlugs, setRecentlyAppendedSlugs] = useState<string[]>([]);
  const appendInFlightRef = useRef(false);
  const postsRef = useRef<PostSummary[]>([]);

  const handleTabSelect = useCallback(
    (nextCategory: string) => {
      const tab = categoryTabs.find((item) => item.id === nextCategory);
      if (!tab || tab.id === category) {
        return;
      }
      const qs = searchParams.toString();
      navigate(qs ? `${tab.path}?${qs}` : tab.path);
    },
    [category, navigate, searchParams],
  );

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
      if (mode === "append" && appendInFlightRef.current) {
        return;
      }

      if (mode === "replace") {
        appendInFlightRef.current = false;
        setLoadingInitial(true);
        setLoadingMore(false);
        setRecentlyAppendedSlugs([]);
      } else {
        appendInFlightRef.current = true;
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
          const dedupedWithinPayload = payload.results.filter(
            (item, index, arr) => arr.findIndex((it) => it.slug === item.slug) === index,
          );
          const existingSlugs = new Set(postsRef.current.map((item) => item.slug));
          const appended = dedupedWithinPayload.filter((item) => !existingSlugs.has(item.slug));
          if (appended.length > 0) {
            setPosts((prev) => {
              const merged = [...prev];
              const mergedSlugs = new Set(prev.map((item) => item.slug));
              appended.forEach((item) => {
                if (!mergedSlugs.has(item.slug)) {
                  merged.push(item);
                  mergedSlugs.add(item.slug);
                }
              });
              return merged;
            });
          }
          setRecentlyAppendedSlugs(appended.map((item) => item.slug));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        if (mode === "replace") {
          setRecentlyAppendedSlugs([]);
          setPosts([]);
          setTotalCount(0);
          setHasMore(false);
          setPage(1);
        }
      } finally {
        if (mode === "replace") {
          setLoadingInitial(false);
        } else {
          appendInFlightRef.current = false;
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

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const fallbackPosts = useMemo(
    () => (error && posts.length === 0 ? getFallbackPosts(category) : []),
    [category, error, posts.length],
  );
  const effectivePosts = fallbackPosts.length > 0 ? fallbackPosts : posts;

  const autoLoadNextPage = useCallback(() => {
    if (appendInFlightRef.current || loadingInitial || loadingMore || !hasMore || fallbackPosts.length > 0) {
      return;
    }
    void loadPage(page + 1, "append");
  }, [fallbackPosts.length, hasMore, loadPage, loadingInitial, loadingMore, page]);

  const handleLoadMoreInView = useCallback(() => {
    autoLoadNextPage();
  }, [autoLoadNextPage]);

  useEffect(() => {
    if (recentlyAppendedSlugs.length === 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setRecentlyAppendedSlugs([]);
    }, 1400);
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
    () => effectivePosts.reduce((sum, post) => sum + (post.word_count || 0), 0),
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

  const sectionBorderColor = `rgba(${visual.glowRgb},0.18)`;
  const sectionBackground = `linear-gradient(180deg, rgba(${visual.glowRgb},0.11), rgba(248,249,252,0.88) 34%, rgba(248,249,252,0.98) 100%)`;
  const headerOverlay = visual.headerTintLight;
  const cardBackground = `linear-gradient(165deg, rgba(255,255,255,0.95), rgba(${visual.glowRgb},0.08))`;
  const chipBackground = `rgba(${visual.glowRgb},0.14)`;

  const leadStory = visiblePosts[0];
  const secondaryStories = visiblePosts.slice(1, 5);
  const feedStories = visiblePosts.slice(5);
  const storyListVariants = useMemo(
    () => ({
      hidden: {},
      visible: {
        transition: {
          delayChildren: stagger(APPEND_STAGGER_SECONDS),
        },
      },
    }),
    [],
  );
  const storyItemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }),
    [],
  );
  const appendDelayBySlug = useMemo(() => {
    if (recentlyAppendedSlugs.length === 0) {
      return new Map<string, number>();
    }
    const resolveDelay = stagger(APPEND_STAGGER_SECONDS);
    const total = recentlyAppendedSlugs.length;
    return new Map(recentlyAppendedSlugs.map((slug, index) => [slug, resolveDelay(index, total)]));
  }, [recentlyAppendedSlugs]);
  const leadAppendDelay = leadStory ? appendDelayBySlug.get(leadStory.slug) : undefined;

  // Cult UI ToolbarExpandable steps
  const toolbarSteps = useMemo(
    () => [
      {
        id: "tags",
        label: "标签",
        icon: <span>🏷️</span>,
        content: (
          <div className="flex flex-wrap gap-2">
            {["全部", ...tags].map((tagLabel) => {
              const value = tagLabel === "全部" ? "" : tagLabel;
              const active = value === selectedTag;
              return (
                <button
                  key={tagLabel}
                  type="button"
                  onClick={() => handleSelectTag(value)}
                  className={`relative whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-[#4f6ae5]/40 bg-[#4f6ae5]/10 text-[#4f6ae5]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                >
                  {tagLabel}
                  {tagLabel !== "全部"
                    ? `(${effectivePosts.filter((post) => post.tags.includes(tagLabel)).length})`
                    : `(${totalCount || effectivePosts.length})`}
                  {active ? (
                    <motion.span
                      layoutId={`tag-active-${category}`}
                      className="absolute bottom-0 left-[18%] h-[2px] w-[64%] rounded-full bg-[#4f6ae5]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ),
      },
      {
        id: "sort",
        label: "排序",
        icon: <span>📊</span>,
        content: (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-full border px-3 py-1.5 text-sm transition ${sortBy === "latest" ? "border-[#4f6ae5]/40 bg-[#4f6ae5]/10 text-[#4f6ae5]" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
              onClick={() => setSortBy("latest")}
            >
              最新优先
            </button>
            <button
              type="button"
              className={`rounded-full border px-3 py-1.5 text-sm transition ${sortBy === "views" ? "border-[#4f6ae5]/40 bg-[#4f6ae5]/10 text-[#4f6ae5]" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
              onClick={() => setSortBy("views")}
            >
              阅读最多
            </button>
          </div>
        ),
      },
    ],
    [tags, selectedTag, handleSelectTag, effectivePosts, totalCount, category, sortBy],
  );

  return (
    <section
      className="space-y-8 rounded-[28px] border p-4 sm:p-6"
      style={{
        borderColor: sectionBorderColor,
        background: sectionBackground,
      }}
    >
      <Helmet>
        <title>{`${title} | Keyon Blog ｜ 云际漫游者`}</title>
        <meta content={categoryDescriptions[category]} name="description" />
        <meta content={`${title} | Keyon Blog ｜ 云际漫游者`} property="og:title" />
        <meta content={categoryDescriptions[category]} property="og:description" />
        <link href={`https://blog.oc.slgneon.cn/${category}`} rel="canonical" />
      </Helmet>

      <FadeIn>
        <header
          className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/85 p-7 shadow-sm backdrop-blur sm:p-9"
        >
          <BackgroundBeams colors={visual.beams} />
          <div className="pointer-events-none absolute inset-0" style={{ background: headerOverlay }} />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
            style={{ background: `rgba(${visual.glowRgb},0.28)` }}
          />

          <div className="relative">
            <p className="text-sm tracking-[0.22em] text-slate-500">{visual.badge}</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-800">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border text-xl shadow-sm"
                style={{
                  borderColor: `rgba(${visual.glowRgb},0.32)`,
                  background: `rgba(${visual.glowRgb},0.15)`,
                }}
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

      <section className="flex justify-center sm:justify-start">
        <DirectionAwareTabs
          items={categoryTabs.map((item) => ({ id: item.id, label: item.label }))}
          activeId={category}
          onSelect={handleTabSelect}
        />
      </section>

      {/* Cult UI ToolbarExpandable for tags/sort */}
      <ToolbarExpandable steps={toolbarSteps} />

      {loadingInitial && <p className="text-slate-500">加载中...</p>}

      <AnimatePresence mode="wait">
        {leadStory ? (
          <motion.section
            key={`${category}-${selectedTag}-${sortBy}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Lead story */}
            <motion.article
              key={leadStory.slug}
              variants={storyItemVariants}
              initial={leadAppendDelay == null ? false : "hidden"}
              animate={{ opacity: 1, y: 0 }}
              transition={
                leadAppendDelay == null
                  ? { type: "spring", stiffness: 150, damping: 24, mass: 1 }
                  : { duration: 0.4, ease: "easeOut", delay: leadAppendDelay }
              }
            >
              <CardSpotlight
                className="group rounded-3xl border border-slate-200/60 bg-white/92 p-5 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-md"
                style={{ background: cardBackground }}
                glowColor={visual.glowRgb}
              >
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/70">
                  {(() => {
                    const leadCover = resolvePostCover(leadStory);
                    if (leadCover) {
                      return (
                        <BlurRevealImage
                          alt={`${leadStory.title} 封面图`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={leadCover}
                          wrapperClassName="aspect-[16/7]"
                        />
                      );
                    }
                    return <GenerativeCover category={category} className="aspect-[16/7]" seed={leadStory.slug} />;
                  })()}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800">
                  <Link className="line-clamp-2 transition hover:opacity-80" style={{ color: visual.accentHex }} to={`/posts/${leadStory.slug}`}>
                    {leadStory.title}
                  </Link>
                </h2>
                <p className="mt-2 max-w-4xl text-base leading-7 text-slate-600">
                  {leadStory.excerpt || "暂无摘要"}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  {new Date(leadStory.updated_at).toLocaleDateString("zh-CN")} · 👁 {formatViews(leadStory.views_count)} · {estimateReadMinutes(leadStory)} min
                </p>
              </CardSpotlight>
            </motion.article>

            {/* Secondary stories with ThreeDCard */}
            {secondaryStories.length > 0 ? (
              <motion.div className="grid gap-4 md:grid-cols-2" variants={storyListVariants} initial="hidden" animate="visible">
                {secondaryStories.map((post) => {
                  const appendDelay = appendDelayBySlug.get(post.slug);
                  const coverSrc = resolvePostCover(post);
                  return (
                    <motion.article
                      key={post.slug}
                      variants={storyItemVariants}
                      transition={
                        appendDelay == null
                          ? { duration: 0.4, ease: "easeOut" }
                          : { duration: 0.4, ease: "easeOut", delay: appendDelay }
                      }
                    >
                      <CardContainer containerClassName="w-full">
                        <CardBody className="w-full rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-sm backdrop-blur">
                          <CardItem translateZ={50} className="w-full">
                            <div className="relative overflow-hidden rounded-xl border border-slate-200/70">
                              {coverSrc ? (
                                <BlurRevealImage
                                  alt={`${post.title} 封面图`}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  src={coverSrc}
                                  wrapperClassName="aspect-[4/3]"
                                />
                              ) : (
                                <GenerativeCover category={category} className="aspect-[4/3]" seed={post.slug} />
                              )}
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
                            </div>
                          </CardItem>

                          <CardItem translateZ={30} className="mt-4 w-full">
                            <h3 className="text-xl font-semibold text-slate-800">
                              <Link className="line-clamp-2 transition hover:opacity-80" style={{ color: visual.accentHex }} to={`/posts/${post.slug}`}>
                                {post.title}
                              </Link>
                            </h3>
                          </CardItem>

                          <CardItem translateZ={20} className="mt-2 w-full">
                            <p className="text-sm text-slate-600">{post.excerpt || "暂无摘要"}</p>
                          </CardItem>

                          <CardItem translateZ={10} className="mt-3 w-full">
                            <p className="text-xs text-slate-500">
                              {new Date(post.updated_at).toLocaleDateString("zh-CN")} · 👁 {formatViews(post.views_count)} · {estimateReadMinutes(post)} min
                            </p>
                          </CardItem>
                        </CardBody>
                      </CardContainer>
                    </motion.article>
                  );
                })}
              </motion.div>
            ) : null}

            {/* Feed stories with TracingBeam */}
            {feedStories.length > 0 ? (
              <TracingBeam>
                <motion.div className="space-y-4 pl-6 md:pl-12" variants={storyListVariants} initial="hidden" animate="visible">
                  {feedStories.map((post) => {
                    const appendDelay = appendDelayBySlug.get(post.slug);
                    const coverSrc = resolvePostCover(post);
                    return (
                      <motion.article
                        key={post.slug}
                        variants={storyItemVariants}
                        transition={
                          appendDelay == null
                            ? { duration: 0.4, ease: "easeOut" }
                            : { duration: 0.4, ease: "easeOut", delay: appendDelay }
                        }
                      >
                        <CardSpotlight
                          className="group rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-md"
                          style={{ background: cardBackground }}
                          glowColor={visual.glowRgb}
                        >
                          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start">
                            <div>
                              <h3 className="text-xl font-semibold text-slate-800">
                                <Link className="line-clamp-2 transition hover:opacity-80" style={{ color: visual.accentHex }} to={`/posts/${post.slug}`}>
                                  {post.title}
                                </Link>
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt || "暂无摘要"}</p>
                              <div className="mt-3 flex flex-wrap gap-1">
                                {post.tags.map((tag) => (
                                  <span
                                    key={`${post.slug}-${tag}`}
                                    className="rounded-full px-2 py-1 text-xs"
                                    style={{ background: chipBackground, color: visual.accentHex }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <p className="mt-3 text-xs text-slate-500">
                                {new Date(post.updated_at).toLocaleDateString("zh-CN")} · 👁 {formatViews(post.views_count)} · {estimateReadMinutes(post)} min
                              </p>
                            </div>
                            <div className="relative overflow-hidden rounded-xl border border-slate-200/70">
                              {coverSrc ? (
                                <BlurRevealImage
                                  alt={`${post.title} 封面图`}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  src={coverSrc}
                                  wrapperClassName="aspect-[4/3]"
                                />
                              ) : (
                                <GenerativeCover category={category} className="aspect-[4/3]" seed={post.slug} />
                              )}
                            </div>
                          </div>
                        </CardSpotlight>
                      </motion.article>
                    );
                  })}
                </motion.div>
              </TracingBeam>
            ) : null}
          </motion.section>
        ) : null}
      </AnimatePresence>

      {!loadingInitial && !fallbackPosts.length && hasMore ? (
        <div className="flex flex-col items-center gap-2 pt-1">
          <motion.div
            className="relative flex h-10 w-10 items-center justify-center"
            onViewportEnter={handleLoadMoreInView}
            viewport={{ margin: "0px 0px 80px 0px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <span className="absolute inset-0 rounded-full border-[3px] border-slate-200" />
            <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#4f6ae5]" />
          </motion.div>
          <p className="text-xs text-slate-500">{loadingMore ? "正在加载更多..." : "继续下滑，自动加载更多"}</p>
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
