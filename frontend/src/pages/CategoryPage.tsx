import { Helmet } from "react-helmet-async";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchPosts, togglePostLike } from "../api/posts";
import type { PostSummary } from "../api/posts";
import { LikeButton } from "../components/ui/LikeButton";
import { getFallbackPosts } from "../data/fallback";
import { siteUrl } from "../lib/site";
import { cn } from "../lib/utils";

type CategoryPageProps = {
  category: "tech" | "learning" | "life";
  title: string;
};

const CATEGORY_PAGE_SIZE = 60;

const categoryDescriptions: Record<CategoryPageProps["category"], string> = {
  tech: "技术实践、系统设计与工程复盘。",
  learning: "效率系统、学习方法和个人生产力。",
  life: "旅行、日常观察与生活记录。",
};

const categoryTabs = [
  { id: "tech", label: "技术", path: "/tech" },
  { id: "learning", label: "效率", path: "/learning" },
  { id: "life", label: "生活", path: "/life" },
] as const;

function resolvePostCover(post: PostSummary): string | null {
  const normalizedCover = String(post.cover || "").trim();
  return normalizedCover || null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateReadMinutes(post: PostSummary): number {
  const words = post.word_count || 0;
  return Math.max(1, Math.round(words / 280));
}

export function CategoryPage({ category, title }: CategoryPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTag, setSelectedTag] = useState<string>(() => String(searchParams.get("tag") || "").trim());
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeOverrides, setLikeOverrides] = useState<Record<string, { liked: boolean; likes: number }>>({});

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
      const normalizedTag = nextTag.trim();
      setSelectedTag(normalizedTag);

      const currentTag = String(searchParams.get("tag") || "").trim();
      if (currentTag === normalizedTag || (!currentTag && !normalizedTag)) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams);
      if (normalizedTag) {
        nextParams.set("tag", normalizedTag);
      } else {
        nextParams.delete("tag");
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const queryTag = String(searchParams.get("tag") || "").trim();
    setSelectedTag((current) => (current === queryTag ? current : queryTag));
  }, [searchParams]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchPosts({
        category,
        sort: "latest",
        page: 1,
        page_size: CATEGORY_PAGE_SIZE,
      });
      setPosts(payload.results);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
      setError(message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleToggleLike = useCallback((post: PostSummary) => {
    const current = likeOverrides[post.slug];
    const wasLiked = current?.liked ?? false;
    const prevLikes = current?.likes ?? post.likes_count;

    setLikeOverrides((prev) => ({
      ...prev,
      [post.slug]: { liked: !wasLiked, likes: prevLikes + (wasLiked ? -1 : 1) },
    }));

    void togglePostLike(post.slug).then((res) => {
      setLikeOverrides((prev) => ({
        ...prev,
        [post.slug]: { liked: res.liked, likes: res.likes },
      }));
    }).catch(() => {
      setLikeOverrides((prev) => ({
        ...prev,
        [post.slug]: { liked: wasLiked, likes: prevLikes },
      }));
    });
  }, [likeOverrides]);

  const fallbackPosts = useMemo(
    () => (error && posts.length === 0 ? getFallbackPosts(category) : []),
    [category, error, posts.length],
  );
  const effectivePosts = fallbackPosts.length > 0 ? fallbackPosts : posts;

  const allTags = useMemo(() => {
    const values = new Set<string>();
    effectivePosts.forEach((post) => {
      post.tags.forEach((tag) => {
        const normalized = String(tag).trim();
        if (normalized) {
          values.add(normalized);
        }
      });
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [effectivePosts]);

  const filteredPosts = useMemo(() => {
    if (!selectedTag) {
      return effectivePosts;
    }
    return effectivePosts.filter((post) => post.tags.some((tag) => String(tag).trim() === selectedTag));
  }, [effectivePosts, selectedTag]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {
      全部: effectivePosts.length,
    };

    allTags.forEach((tag) => {
      counts[tag] = effectivePosts.filter((post) => post.tags.some((item) => String(item).trim() === tag)).length;
    });

    return counts;
  }, [allTags, effectivePosts]);

  const tagItems = useMemo(
    () => [{ label: "全部", value: "" }, ...allTags.map((tag) => ({ label: tag, value: tag }))],
    [allTags],
  );

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-theme-line/80 bg-theme-surface shadow-sm">
      <Helmet>
        <title>{`${title} | Keyon Blog ｜ 云际漫游者`}</title>
        <meta content={categoryDescriptions[category]} name="description" />
        <meta content={`${title} | Keyon Blog ｜ 云际漫游者`} property="og:title" />
        <meta content={categoryDescriptions[category]} property="og:description" />
        <link href={siteUrl(`/${category}`)} rel="canonical" />
      </Helmet>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_18%_18%,rgba(79,106,229,0.18),transparent_55%),radial-gradient(circle_at_80%_4%,rgba(107,145,123,0.16),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-70 [background-size:32px_32px] [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)]" />

      <header className="relative border-b border-theme-line/80 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {categoryTabs.map((tab) => {
            const active = tab.id === category;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabSelect(tab.id)}
                className={cn(
                  "rounded-full border px-5 py-2.5 text-base font-medium transition",
                  active
                    ? "border-[#4f6ae5]/35 bg-[#4f6ae5]/10 text-[#4f6ae5]"
                    : "border-theme-line bg-theme-surface text-theme-muted hover:border-theme-line-strong hover:text-theme-ink",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-theme-ink md:text-4xl">{title}文章</h1>
        <p className="mt-2 max-w-2xl text-sm text-theme-muted md:text-base">{categoryDescriptions[category]}</p>
        {!loading ? (
          <p className="mt-2 text-xs text-theme-muted">
            {filteredPosts.length} / {effectivePosts.length} 篇文章
            {selectedTag ? ` · 当前标签：${selectedTag}` : ""}
          </p>
        ) : null}

        <div className="mt-5">
          <div className="hidden flex-wrap gap-2 md:flex">
            {tagItems.map((tag) => {
              const active = selectedTag === tag.value;
              return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => handleSelectTag(tag.value)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-base transition",
                    active
                      ? "border-[#4f6ae5]/35 bg-[#4f6ae5] text-white"
                      : "border-theme-line bg-theme-surface-raised text-theme-muted hover:bg-theme-surface",
                  )}
                >
                  {tag.label}
                  <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-md border border-current/20 px-1 text-xs">
                    {tagCounts[tag.label] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="block md:hidden">
            <span className="mb-1 block text-xs font-medium text-theme-muted">按标签筛选</span>
            <select
              value={selectedTag}
              onChange={(event) => handleSelectTag(event.target.value)}
              className="w-full rounded-xl border border-theme-line bg-theme-surface-raised px-3 py-2 text-sm text-theme-ink outline-none ring-theme-accent/20 transition focus:border-theme-accent/40 focus:ring"
            >
              <option value="">全部</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag} ({tagCounts[tag] ?? 0})
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {loading ? <p className="relative px-6 py-10 text-sm text-theme-muted md:px-8">加载文章中...</p> : null}

      {!loading && filteredPosts.length > 0 ? (
        <div className="relative grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-3 md:p-6 md:gap-6">
          {filteredPosts.map((post) => {
            const cover = resolvePostCover(post);
            return (
              <Link
                key={post.slug}
                to={`/posts/${post.slug}`}
                className="group theme-card relative flex flex-col overflow-hidden rounded-[var(--theme-radius)] border border-theme-line bg-theme-surface-raised shadow-[var(--theme-shadow-whisper)] transition-all duration-300 hover:border-theme-accent/50 hover:shadow-[var(--theme-shadow-lifted)]"
              >
                {cover ? (
                  <div className="relative h-48 overflow-hidden bg-theme-surface">
                    <img
                      src={cover}
                      alt={`${post.title} 封面`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90"
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-theme-surface-raised/95 px-2 py-1 font-theme-sans text-[10px] font-medium uppercase tracking-[0.14em] text-theme-muted shadow-[var(--theme-shadow-whisper)]">
                      {estimateReadMinutes(post)} min read
                    </span>
                  </div>
                ) : (
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-theme-accent/15 via-theme-surface to-theme-bg">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(var(--theme-accent)/0.12),transparent_60%),radial-gradient(circle_at_80%_80%,rgb(var(--theme-accent-soft)/0.1),transparent_55%)]"
                    />
                    <div className="relative flex h-full items-end p-5">
                      <span className="line-clamp-3 font-theme-display text-lg font-medium text-theme-ink/80">
                        {post.title}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
                  <h2 className="line-clamp-2 font-theme-display text-xl font-medium leading-snug tracking-tight text-theme-ink transition-colors duration-200 group-hover:text-theme-accent">
                    {post.title}
                  </h2>
                  <p className="line-clamp-3 font-theme-body text-sm leading-[1.65] text-theme-muted">
                    {post.excerpt || "暂无摘要"}
                  </p>

                  {post.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={`${post.slug}-${tag}`}
                          className="rounded-full border border-theme-line bg-theme-surface px-2 py-0.5 font-theme-sans text-[11px] text-theme-soft"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-theme-soft">
                    <div className="flex flex-wrap items-center gap-1.5 font-theme-sans">
                      <time>{formatDate(post.updated_at)}</time>
                      <span aria-hidden="true">·</span>
                      <span>{post.views_count} 阅读</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LikeButton
                        size="sm"
                        liked={likeOverrides[post.slug]?.liked ?? false}
                        likes={likeOverrides[post.slug]?.likes ?? post.likes_count}
                        onToggle={() => handleToggleLike(post)}
                      />
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className="pointer-events-none flex items-center gap-1 font-theme-sans text-xs font-medium text-theme-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  >
                    阅读全文
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h15" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}

      {!loading && filteredPosts.length === 0 ? (
        <p className="relative px-6 py-10 text-sm text-theme-muted md:px-8">
          {selectedTag ? "当前标签下暂无文章。" : "暂无文章。"}
        </p>
      ) : null}

      {error ? (
        <p className="relative border-t border-theme-line/80 px-6 py-3 text-xs text-amber-700 md:px-8">
          接口请求失败，当前显示本地回退内容。
        </p>
      ) : null}
    </section>
  );
}
