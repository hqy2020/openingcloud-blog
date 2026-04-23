import { useCallback, useEffect, useMemo, useState } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { fetchPostBySlug, fetchPosts, fetchPostLikeStatus, incrementPostViews, togglePostLike } from "../api/posts";
import type { PostSummary } from "../api/posts";
import { LikeButton } from "../components/ui/LikeButton";
import { useAsync } from "../hooks/useAsync";
import { LEGACY_SITE_HOSTS, siteUrl } from "../lib/site";
import { cn } from "../lib/utils";

type HeadingItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

const HEADING_SCROLL_OFFSET = 96;

const categoryLabelMap: Record<"tech" | "learning" | "life", string> = {
  tech: "技术",
  learning: "效率",
  life: "生活",
};

const categoryPathMap: Record<"tech" | "learning" | "life", string> = {
  tech: "/tech",
  learning: "/learning",
  life: "/life",
};

function toHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5-\s]/g, "")
    .replace(/\s+/g, "-");
}

function createHeadingIdResolver() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = toHeadingId(text) || "section";
    const current = (seen.get(base) ?? 0) + 1;
    seen.set(base, current);
    return current === 1 ? base : `${base}-${current}`;
  };
}

function normalizeHeadingText(text: string): string {
  return text
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

function extractHeadings(markdown: string): HeadingItem[] {
  const lines = markdown.split("\n");
  const result: HeadingItem[] = [];
  const resolveHeadingId = createHeadingIdResolver();
  let inFence = false;
  let fenceMarker = "";

  for (const line of lines) {
    const fence = line.match(/^\s*(```+|~~~+)/);
    if (fence?.[1]) {
      const marker = fence[1].startsWith("`") ? "`" : "~";
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = "";
      }
      continue;
    }

    if (inFence) {
      continue;
    }

    const h2 = line.match(/^\s{0,3}##\s+(.+?)\s*#*\s*$/);
    if (h2?.[1]) {
      const text = normalizeHeadingText(h2[1]);
      result.push({ id: resolveHeadingId(text), text, level: 2 });
      continue;
    }

    const h3 = line.match(/^\s{0,3}###\s+(.+?)\s*#*\s*$/);
    if (h3?.[1]) {
      const text = normalizeHeadingText(h3[1]);
      result.push({ id: resolveHeadingId(text), text, level: 3 });
    }
  }

  return result;
}

function plainText(node: ReactNode): string {
  if (typeof node === "string") {
    return node;
  }
  if (typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(plainText).join("");
  }
  if (node && typeof node === "object" && "props" in node) {
    const maybeNode = node as { props?: { children?: ReactNode } };
    return plainText(maybeNode.props?.children ?? "");
  }
  return "";
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

function resolveMarkdownAssetUrl(src: string): string {
  const value = src.trim();
  if (!value) {
    return value;
  }

  if (value.startsWith("assets/")) {
    return `/media/library/${value.slice("assets/".length)}`;
  }
  if (value.startsWith("./assets/")) {
    return `/media/library/${value.slice("./assets/".length)}`;
  }
  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsed = new URL(value);
    const isLegacyHost = LEGACY_SITE_HOSTS.has(parsed.hostname.toLowerCase());
    if (isLegacyHost && typeof window !== "undefined" && window.location.hostname !== parsed.hostname) {
      return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return value;
  } catch {
    const normalized = value.replace(/^(\.\/)+/, "").replace(/^(\.\.\/)+/, "");
    return `/${normalized}`;
  }
}

function scoreRelatedPost(post: PostSummary, tagSet: Set<string>): number {
  return post.tags.reduce((total, tag) => {
    const normalizedTag = String(tag).trim();
    return normalizedTag && tagSet.has(normalizedTag) ? total + 1 : total;
  }, 0);
}

export function PostDetailPage() {
  const { slug = "" } = useParams();
  const { data, loading, error } = useAsync(() => fetchPostBySlug(slug), [slug]);
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const [relatedPosts, setRelatedPosts] = useState<PostSummary[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [postLiked, setPostLiked] = useState(false);
  const [postLikes, setPostLikes] = useState(0);

  useEffect(() => {
    if (!slug) {
      return;
    }
    void incrementPostViews(slug);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    void fetchPostLikeStatus(slug).then((s) => {
      setPostLiked(s.liked);
      setPostLikes(s.likes);
    }).catch(() => {});
  }, [slug]);

  const handleToggleLike = useCallback(() => {
    const wasLiked = postLiked;
    setPostLiked(!wasLiked);
    setPostLikes((n) => n + (wasLiked ? -1 : 1));

    void togglePostLike(slug).then((res) => {
      setPostLiked(res.liked);
      setPostLikes(res.likes);
    }).catch(() => {
      setPostLiked(wasLiked);
      setPostLikes((n) => n + (wasLiked ? 1 : -1));
    });
  }, [slug, postLiked]);

  const postTags = useMemo(() => {
    if (!Array.isArray(data?.tags)) {
      return [] as string[];
    }
    return data.tags.map((tag) => String(tag).trim()).filter((tag) => tag.length > 0);
  }, [data?.tags]);

  const headings = useMemo(() => extractHeadings(data?.content ?? ""), [data?.content]);

  const scrollToHeading = useCallback((id: string, behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") {
      return false;
    }
    const target = document.getElementById(id);
    if (!target) {
      return false;
    }
    const top = target.getBoundingClientRect().top + window.scrollY - HEADING_SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(top, 0), behavior });
    return true;
  }, []);

  useEffect(() => {
    if (headings.length === 0 || typeof window === "undefined") {
      setActiveHeadingId("");
      return;
    }

    const syncFromHash = () => {
      const hashValue = window.location.hash.replace(/^#/, "");
      if (!hashValue) {
        setActiveHeadingId(headings[0].id);
        return;
      }

      let decoded = "";
      try {
        decoded = decodeURIComponent(hashValue);
      } catch {
        decoded = "";
      }

      if (!decoded) {
        setActiveHeadingId(headings[0].id);
        return;
      }

      if (scrollToHeading(decoded, "auto")) {
        setActiveHeadingId(decoded);
      } else {
        setActiveHeadingId(headings[0].id);
      }
    };

    const frameId = window.requestAnimationFrame(syncFromHash);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [headings, scrollToHeading]);

  useEffect(() => {
    if (headings.length === 0 || typeof window === "undefined") {
      return;
    }

    const updateActiveHeading = () => {
      const positions = headings.map((heading) => {
        const element = document.getElementById(heading.id);
        return {
          id: heading.id,
          top: element ? element.getBoundingClientRect().top : Number.POSITIVE_INFINITY,
        };
      });

      let next = positions.find((item) => item.top >= 0 && item.top <= 120);
      if (!next) {
        const above = positions.filter((item) => item.top < 0).sort((a, b) => b.top - a.top);
        next = above[0];
      }
      if (!next) {
        const below = positions.filter((item) => item.top > 120).sort((a, b) => a.top - b.top);
        next = below[0];
      }

      if (next) {
        setActiveHeadingId((current) => (current === next.id ? current : next.id));
      }
    };

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [headings]);

  const currentCategory = data?.category;
  const currentSlug = data?.slug;
  const postTagsKey = postTags.join("|");

  useEffect(() => {
    let cancelled = false;

    if (!currentCategory || !currentSlug) {
      setRelatedPosts([]);
      setLoadingRelated(false);
      return () => {
        cancelled = true;
      };
    }

    const loadRelatedPosts = async () => {
      setLoadingRelated(true);
      try {
        const payload = await fetchPosts({
          category: currentCategory,
          sort: "latest",
          page: 1,
          page_size: 24,
        });

        const currentTagSet = new Set(postTags);
        const ranked = payload.results
          .filter((item) => item.slug !== currentSlug)
          .map((item) => ({
            post: item,
            score: scoreRelatedPost(item, currentTagSet),
            updatedAt: new Date(item.updated_at).getTime(),
          }))
          .sort((a, b) => {
            if (a.score !== b.score) {
              return b.score - a.score;
            }
            return b.updatedAt - a.updatedAt;
          })
          .slice(0, 3)
          .map((entry) => entry.post);

        if (!cancelled) {
          setRelatedPosts(ranked);
        }
      } catch {
        if (!cancelled) {
          setRelatedPosts([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRelated(false);
        }
      }
    };

    void loadRelatedPosts();

    return () => {
      cancelled = true;
    };
  }, [currentCategory, currentSlug, postTags, postTagsKey]);

  const headingIdLookup = useMemo(() => {
    const source = new Map<string, string[]>();
    for (const item of headings) {
      const key = `${item.level}:${item.text}`;
      const queue = source.get(key) ?? [];
      queue.push(item.id);
      source.set(key, queue);
    }
    return source;
  }, [headings]);

  const markdownComponents = useMemo(() => {
    const idQueues = new Map<string, string[]>(
      Array.from(headingIdLookup.entries(), ([key, values]) => [key, [...values]]),
    );
    const fallbackResolveHeadingId = createHeadingIdResolver();

    const consumeHeadingId = (level: 2 | 3, text: string) => {
      const normalized = normalizeHeadingText(text);
      const key = `${level}:${normalized}`;
      const queue = idQueues.get(key);
      if (queue?.length) {
        return queue.shift()!;
      }
      return fallbackResolveHeadingId(normalized);
    };

    return {
      h2: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
        const text = plainText(children);
        const id = consumeHeadingId(2, text);
        return (
          <h2
            {...props}
            id={id}
            className={cn(
              "mt-12 scroll-mt-24 font-theme-display text-3xl font-medium leading-[1.2] tracking-normal text-theme-ink",
              activeHeadingId === id && "text-theme-accent",
            )}
          >
            {children}
          </h2>
        );
      },
      h3: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
        const text = plainText(children);
        const id = consumeHeadingId(3, text);
        return (
          <h3
            {...props}
            id={id}
            className={cn(
              "mt-8 scroll-mt-24 font-theme-display text-2xl font-medium leading-[1.2] tracking-normal text-theme-ink",
              activeHeadingId === id && "text-theme-accent",
            )}
          >
            {children}
          </h3>
        );
      },
      p: ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
        <p {...props} className="mt-5 font-theme-display text-[17px] leading-[1.7] text-theme-ink">
          {children}
        </p>
      ),
      a: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
        const link = String(href ?? "").trim();
        const isExternal = /^https?:\/\//i.test(link);
        const isHash = link.startsWith("#");

        return (
          <a
            {...props}
            href={link || undefined}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer nofollow" : undefined}
            className="font-medium text-theme-accent underline underline-offset-4 transition hover:text-theme-accent"
            onClick={(event) => {
              if (!isHash) {
                return;
              }

              const rawId = link.slice(1);
              if (!rawId) {
                return;
              }

              event.preventDefault();
              let decodedId = rawId;
              try {
                decodedId = decodeURIComponent(rawId);
              } catch {
                decodedId = rawId;
              }

              if (scrollToHeading(decodedId)) {
                setActiveHeadingId(decodedId);
                if (typeof window !== "undefined") {
                  window.history.replaceState(
                    null,
                    "",
                    `${window.location.pathname}${window.location.search}#${encodeURIComponent(decodedId)}`,
                  );
                }
              }
            }}
          >
            {children}
          </a>
        );
      },
      code: ({ children, className, ...props }: HTMLAttributes<HTMLElement>) => {
        const isInline = !(className ?? "").includes("language-");
        if (isInline) {
          return (
            <code {...props} className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800">
              {children}
            </code>
          );
        }
        return (
          <code
            {...props}
            className="mt-4 block overflow-x-auto rounded-xl bg-claude-near-black p-4 text-sm leading-6 text-claude-warm-silver"
          >
            {children}
          </code>
        );
      },
      ul: ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => (
        <ul {...props} className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: HTMLAttributes<HTMLOListElement>) => (
        <ol {...props} className="mt-4 list-decimal space-y-2 pl-6 text-slate-700">
          {children}
        </ol>
      ),
      blockquote: ({ children, ...props }: HTMLAttributes<HTMLQuoteElement>) => (
        <blockquote
          {...props}
          className="mt-5 rounded-r-lg border-l-4 border-theme-accent/40 bg-theme-surface px-4 py-3 text-slate-700"
        >
          {children}
        </blockquote>
      ),
      table: ({ children, ...props }: HTMLAttributes<HTMLTableElement>) => (
        <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
          <table {...props} className="w-full border-collapse text-sm text-slate-700">
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
        <thead {...props} className="bg-slate-50">
          {children}
        </thead>
      ),
      tr: ({ children, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
        <tr {...props} className="transition hover:bg-slate-50">
          {children}
        </tr>
      ),
      th: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
        <th {...props} className="border-b border-slate-200 px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-600">
          {children}
        </th>
      ),
      td: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
        <td {...props} className="border-b border-slate-100 px-4 py-2.5 align-top text-sm">
          {children}
        </td>
      ),
      img: ({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => {
        const resolvedSrc = resolveMarkdownAssetUrl(String(src ?? ""));
        return (
          <figure className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <img
              {...props}
              src={resolvedSrc}
              alt={String(alt ?? "")}
              loading="lazy"
              className="max-h-[460px] w-full object-contain bg-white"
              onError={(event) => {
                const image = event.currentTarget;
                if (image.dataset.fallbackTried === "1") {
                  return;
                }

                try {
                  const parsed = new URL(image.currentSrc || image.src, window.location.origin);
                  if (!LEGACY_SITE_HOSTS.has(parsed.hostname.toLowerCase())) {
                    return;
                  }
                  image.dataset.fallbackTried = "1";
                  image.src = `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
                } catch {
                  // ignore fallback parse failures
                }
              }}
            />
            {alt ? <figcaption className="border-t border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">{alt}</figcaption> : null}
          </figure>
        );
      },
    };
  }, [activeHeadingId, headingIdLookup, scrollToHeading]);

  if (loading) {
    return <p className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">加载中...</p>;
  }

  if (error || !data) {
    return <p className="rounded-2xl border border-claude-error-crimson/30 bg-claude-error-crimson/5 p-6 text-sm text-claude-error-crimson">{error || "文章不存在"}</p>;
  }

  const readMinutes = Math.max(1, Math.round((data.word_count || 0) / 280));
  const detailCover = String(data.cover || "").trim() || null;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/92 shadow-sm">
      <Helmet>
        <title>{`${data.title} | Keyon Blog ｜ 云际漫游者`}</title>
        <meta content={data.excerpt || "Keyon Blog ｜ 云际漫游者文章详情"} name="description" />
        <meta content={data.title} property="og:title" />
        <meta content={data.excerpt || "Keyon Blog ｜ 云际漫游者文章详情"} property="og:description" />
        <meta content={detailCover || "/og-cloudscape-card.png"} property="og:image" />
        <link href={siteUrl(`/posts/${data.slug}`)} rel="canonical" />
      </Helmet>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_20%_20%,rgba(79,106,229,0.16),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(107,145,123,0.14),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 opacity-70 [background-size:32px_32px] [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)]" />

      <header className="relative space-y-4 border-b border-slate-200/80 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <Link
            to={categoryPathMap[data.category]}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            ← 返回{categoryLabelMap[data.category]}
          </Link>

          {postTags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500"
            >
              {tag}
            </span>
          ))}

          <time className="ml-auto text-xs text-slate-500">{formatDate(data.updated_at)}</time>
        </div>

        <h1 className="font-theme-display text-4xl font-medium leading-[1.1] tracking-normal text-theme-ink md:text-[52px]">{data.title}</h1>
        {data.excerpt ? <p className="max-w-4xl font-theme-display text-base italic leading-[1.6] text-theme-muted md:text-lg">{data.excerpt}</p> : null}
      </header>

      {detailCover ? (
        <div className="relative h-64 overflow-hidden border-b border-slate-200/80 md:h-[420px]">
          <img src={detailCover} alt={`${data.title} 封面`} className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="relative grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0 lg:border-r lg:border-slate-200/80">
          <article className="p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{categoryLabelMap[data.category]}</span>
              <span>{formatDate(data.updated_at)}</span>
              <span>·</span>
              <span>{readMinutes} 分钟</span>
              <span>·</span>
              <span>{data.views_count} 阅读</span>
            </div>

            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
              {data.content}
            </ReactMarkdown>
          </article>

          <div className="flex flex-col items-center gap-2 border-t border-slate-200/80 py-8">
            <p className="text-sm text-slate-500">觉得不错？给文章点个赞吧</p>
            <LikeButton
              size="md"
              liked={postLiked}
              likes={postLikes}
              onToggle={handleToggleLike}
            />
          </div>

          <section className="border-t border-slate-200/80 p-6 md:p-8">
            <h2 className="font-theme-display text-2xl font-medium leading-[1.2] tracking-normal text-theme-ink">继续阅读</h2>

            {loadingRelated ? <p className="mt-4 text-sm text-slate-500">加载相关文章中...</p> : null}

            {!loadingRelated && relatedPosts.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">暂无相关文章。</p>
            ) : null}

            {!loadingRelated && relatedPosts.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/posts/${post.slug}`}
                    className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <h3 className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:underline">{post.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{post.excerpt || "暂无摘要"}</p>
                    <time className="mt-3 block text-xs text-slate-500">{formatDate(post.updated_at)}</time>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        </main>

        <aside className="hidden bg-slate-50/70 p-6 lg:block">
          <div className="sticky top-24 space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">On this page</h2>
              {headings.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">暂无目录</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {headings.map((item) => (
                    <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                      <button
                        type="button"
                        onClick={() => {
                          if (scrollToHeading(item.id)) {
                            setActiveHeadingId(item.id);
                            if (typeof window !== "undefined") {
                              window.history.replaceState(
                                null,
                                "",
                                `${window.location.pathname}${window.location.search}#${encodeURIComponent(item.id)}`,
                              );
                            }
                          }
                        }}
                        className={cn(
                          "w-full rounded-md px-2 py-1 text-left transition",
                          activeHeadingId === item.id
                            ? "bg-claude-warm-sand font-medium text-theme-accent"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                        )}
                      >
                        {item.text}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">文章信息</h2>
              <div className="mt-3 space-y-2">
                <p>
                  <span className="text-slate-500">分类：</span>
                  {categoryLabelMap[data.category]}
                </p>
                <p>
                  <span className="text-slate-500">阅读时长：</span>
                  {readMinutes} 分钟
                </p>
                <p>
                  <span className="text-slate-500">阅读量：</span>
                  {data.views_count}
                </p>
                <p>
                  <span className="text-slate-500">更新时间：</span>
                  {formatDate(data.updated_at)}
                </p>
              </div>
            </section>
          </div>
        </aside>
      </div>

      <details className="border-t border-slate-200/80 lg:hidden">
        <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-slate-700">文章目录</summary>
        <div className="space-y-2 px-6 pb-5 text-sm">
          {headings.length === 0 ? <p className="text-slate-400">暂无目录</p> : null}
          {headings.map((item) => (
            <button
              key={`mobile-${item.id}`}
              type="button"
              onClick={() => {
                if (scrollToHeading(item.id)) {
                  setActiveHeadingId(item.id);
                  if (typeof window !== "undefined") {
                    window.history.replaceState(
                      null,
                      "",
                      `${window.location.pathname}${window.location.search}#${encodeURIComponent(item.id)}`,
                    );
                  }
                }
              }}
              className={cn(
                "block w-full rounded-md px-2 py-1 text-left transition",
                item.level === 3 && "pl-5",
                activeHeadingId === item.id
                  ? "bg-claude-warm-sand font-medium text-theme-accent"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {item.text}
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}
