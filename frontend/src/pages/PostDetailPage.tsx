import { motion, useScroll, useSpring } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { fetchPostBySlug, fetchPostLikeStatus, incrementPostViews, togglePostLike } from "../api/posts";
import { useTheme } from "../app/theme";
import { BlurRevealImage } from "../components/ui/BlurRevealImage";
import { GenerativeCover } from "../components/ui/GenerativeCover";
import { useAsync } from "../hooks/useAsync";

type HeadingItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

const HEADING_SCROLL_OFFSET = 112;

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

function toHeadingId(text: string) {
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

function normalizeHeadingText(text: string) {
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

function estimateReadingMinutes(markdown: string) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#[\]()>*_~!-]/g, " ")
    .replace(/\s+/g, "");
  const chars = plain.length;
  return Math.max(1, Math.round(chars / 380));
}

function resolveMarkdownAssetUrl(src: string) {
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
    const isLegacyHost = parsed.hostname.toLowerCase() === "blog.oc.slgneon.cn";
    if (isLegacyHost && typeof window !== "undefined" && window.location.hostname !== parsed.hostname) {
      return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return value;
  } catch {
    const normalized = value.replace(/^(\.\/)+/, "").replace(/^(\.\.\/)+/, "");
    return `/${normalized}`;
  }
}

export function PostDetailPage() {
  const { isDark } = useTheme();
  const { slug = "" } = useParams();
  const { data, loading, error } = useAsync(() => fetchPostBySlug(slug), [slug]);
  const { scrollYProgress } = useScroll();
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 26,
    mass: 0.2,
  });

  useEffect(() => {
    if (!slug) {
      return;
    }
    void incrementPostViews(slug);
  }, [slug]);

  const headings = useMemo(() => extractHeadings(data?.content ?? ""), [data?.content]);
  const readMinutes = useMemo(() => estimateReadingMinutes(data?.content ?? ""), [data?.content]);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(data?.likes_count ?? 0);
  const likeLoadingRef = useRef(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setLikesCount(data.likes_count);
    }
  }, [data]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchPostLikeStatus(slug)
      .then((result) => {
        if (cancelled) return;
        setLiked(result.liked);
        setLikesCount(result.likes);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [slug]);

  const handleToggleLike = useCallback(async () => {
    if (likeLoadingRef.current || !slug) return;
    likeLoadingRef.current = true;
    setLikeLoading(true);
    try {
      const result = await togglePostLike(slug);
      setLiked(result.liked);
      setLikesCount(result.likes);
    } catch { /* ignore network errors */ }
    likeLoadingRef.current = false;
    setLikeLoading(false);
  }, [slug]);
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

  const scrollToHeading = (id: string, behavior: ScrollBehavior = "smooth") => {
    const target = document.getElementById(id);
    if (!target) {
      return false;
    }
    const top = target.getBoundingClientRect().top + window.scrollY - HEADING_SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(top, 0), behavior });
    return true;
  };

  useEffect(() => {
    if (headings.length === 0) {
      const rafId = window.requestAnimationFrame(() => {
        setActiveHeadingId("");
      });
      return () => window.cancelAnimationFrame(rafId);
    }

    const headingIdSet = new Set(headings.map((item) => item.id));
    const firstHeadingId = headings[0].id;

    const readHashHeadingId = () => {
      const hashValue = window.location.hash.replace(/^#/, "");
      if (!hashValue) {
        return "";
      }
      try {
        return decodeURIComponent(hashValue);
      } catch {
        return "";
      }
    };

    const syncActiveFromHash = () => {
      const hashId = readHashHeadingId();
      if (hashId && headingIdSet.has(hashId) && scrollToHeading(hashId, "auto")) {
        setActiveHeadingId(hashId);
        return;
      }
      setActiveHeadingId(firstHeadingId);
    };

    const rafId = window.requestAnimationFrame(syncActiveFromHash);
    window.addEventListener("hashchange", syncActiveFromHash);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("hashchange", syncActiveFromHash);
    };
  }, [headings]);

  const idQueues = new Map(
    Array.from(headingIdLookup.entries(), ([key, values]) => [key, [ ...values ]]),
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

  if (loading) {
    return <p className={isDark ? "text-slate-300" : "text-slate-500"}>加载中...</p>;
  }

  if (error || !data) {
    return <p className={isDark ? "text-rose-300" : "text-rose-600"}>{error || "文章不存在"}</p>;
  }

  const postTags = Array.isArray(data.tags)
    ? data.tags.map((tag) => String(tag).trim()).filter((tag) => tag.length > 0)
    : [];
  const detailCover = String(data.cover || "").trim() || null;

  const markdownComponents = {
    h2: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
      const text = plainText(children);
      const id = consumeHeadingId(2, text);
      const isActive = activeHeadingId === id;
      return (
        <h2
          {...props}
          className={`mt-8 scroll-mt-24 rounded-md px-1 text-2xl font-semibold transition-colors ${
            isActive
              ? isDark
                ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/40"
                : "bg-indigo-50/70 text-indigo-700 ring-1 ring-indigo-100"
              : isDark
                ? "text-slate-100"
                : "text-slate-900"
          }`}
          id={id}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
      const text = plainText(children);
      const id = consumeHeadingId(3, text);
      const isActive = activeHeadingId === id;
      return (
        <h3
          {...props}
          className={`mt-6 scroll-mt-24 rounded-md px-1 text-xl font-semibold transition-colors ${
            isActive
              ? isDark
                ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/40"
                : "bg-indigo-50/70 text-indigo-700 ring-1 ring-indigo-100"
              : isDark
                ? "text-slate-200"
                : "text-slate-800"
          }`}
          id={id}
        >
          {children}
        </h3>
      );
    },
    p: ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props} className={`mt-4 leading-8 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
        {children}
      </p>
    ),
    code: ({ children, className, ...props }: HTMLAttributes<HTMLElement>) => {
      const isInline = !(className ?? "").includes("language-");
      if (isInline) {
        return (
          <code
            {...props}
            className={`rounded px-1 py-0.5 text-sm ${isDark ? "bg-slate-700/70 text-slate-100" : "bg-slate-100 text-slate-800"}`}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          {...props}
          className={`block overflow-x-auto rounded-xl p-4 text-sm ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-900 text-slate-100"}`}
        >
          {children}
        </code>
      );
    },
    ul: ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => (
      <ul {...props} className={`mt-4 list-disc space-y-2 pl-6 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
        {children}
      </ul>
    ),
    a: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const link = String(href ?? "").trim();
      const isExternal = /^https?:\/\//i.test(link);
      return (
        <a
          {...props}
          href={link || undefined}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer nofollow" : undefined}
          className={`font-medium underline underline-offset-4 transition ${
            isDark
              ? "text-indigo-300 decoration-indigo-400 hover:text-indigo-200 hover:decoration-indigo-300"
              : "text-indigo-700 decoration-indigo-300 hover:text-indigo-800 hover:decoration-indigo-500"
          }`}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => {
      const initialSrc = resolveMarkdownAssetUrl(String(src ?? ""));
      return (
        <figure
          className={`mt-5 overflow-hidden rounded-xl border ${isDark ? "border-slate-700 bg-slate-900/88" : "border-slate-200 bg-slate-50"}`}
        >
          <img
            {...props}
            src={initialSrc}
            alt={String(alt ?? "")}
            loading="lazy"
            className={`max-h-[460px] w-full object-contain ${isDark ? "bg-slate-950" : "bg-white"}`}
            onError={(event) => {
              const img = event.currentTarget;
              if (img.dataset.fallbackTried === "1") {
                return;
              }
              try {
                const parsed = new URL(img.currentSrc || img.src, window.location.origin);
                if (parsed.hostname.toLowerCase() !== "blog.oc.slgneon.cn") {
                  return;
                }
                img.dataset.fallbackTried = "1";
                img.src = `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
              } catch {
                // ignore fallback parse failures
              }
            }}
          />
          {alt ? (
            <figcaption
              className={`border-t px-3 py-2 text-sm ${
                isDark ? "border-slate-700 bg-slate-900/95 text-slate-300" : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              {alt}
            </figcaption>
          ) : null}
        </figure>
      );
    },
  };

  return (
    <section className="space-y-6">
      <Helmet>
        <title>{`${data.title} | 启云博客`}</title>
        <meta content={data.excerpt || "启云博客文章详情"} name="description" />
        <meta content={data.title} property="og:title" />
        <meta content={data.excerpt || "启云博客文章详情"} property="og:description" />
        <meta content={detailCover || "/og-cloudscape-card.png"} property="og:image" />
        <link href={`https://blog.oc.slgneon.cn/posts/${data.slug}`} rel="canonical" />
      </Helmet>

      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-40 h-1 backdrop-blur-sm ${isDark ? "bg-slate-800/85" : "bg-slate-200/85"}`}
      >
        <motion.div className="h-full origin-left bg-indigo-600" style={{ scaleX: smoothProgress }} />
      </div>

      <div className={`relative overflow-hidden rounded-2xl border shadow ${isDark ? "border-slate-700" : "border-slate-200"}`}>
        {detailCover ? (
          <BlurRevealImage
            alt={`${data.title} 封面`}
            className="h-full w-full object-cover"
            src={detailCover}
            wrapperClassName="h-72"
          />
        ) : (
          <GenerativeCover
            category={data.category}
            className="h-40"
            seed={data.slug}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/18 via-transparent to-transparent" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
        <article
          className={`rounded-2xl border p-6 shadow-sm ${
            isDark ? "border-slate-700 bg-slate-900/84 text-slate-100" : "border-slate-200 bg-white text-slate-900"
          }`}
        >
          <h1 className={`text-3xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>{data.title}</h1>

          <div className={`mt-3 flex flex-wrap items-center gap-2 text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                isDark ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-700"
              }`}
            >
              {categoryLabelMap[data.category]}
            </span>
            <span>{new Date(data.updated_at).toLocaleDateString("zh-CN")}</span>
            <span>·</span>
            <span>{readMinutes} min</span>
            <span>·</span>
            <span>阅读 {data.views_count}</span>
          </div>

          <div className="mt-6">
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
              {data.content}
            </ReactMarkdown>
          </div>

          <div className={`mt-10 space-y-4 border-t pt-5 ${isDark ? "border-slate-700" : "border-slate-200"}`}>
            <div className="flex flex-col items-center gap-2 py-4">
              <motion.button
                type="button"
                disabled={likeLoading}
                onClick={handleToggleLike}
                whileTap={{ scale: 0.9 }}
                className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                  liked
                    ? isDark
                      ? "border-rose-400/50 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                      : "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : isDark
                      ? "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                <motion.span
                  key={liked ? "liked" : "unliked"}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="text-lg"
                >
                  {liked ? "❤️" : "🤍"}
                </motion.span>
                觉得不错？给这篇文章一个赞
              </motion.button>
              <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {likesCount > 0 ? `${likesCount} 人觉得很赞` : "成为第一个点赞的人"}
              </span>
            </div>

            {postTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-500"}`}>文末标签</span>
                {postTags.map((tag) => (
                  <Link
                    key={`post-tag-${tag}`}
                    to={`${categoryPathMap[data.category]}?tag=${encodeURIComponent(tag)}`}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                      isDark
                        ? "border-slate-600 bg-slate-800 text-slate-100 hover:border-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-200"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : null}

            <div>
              <Link
                to={categoryPathMap[data.category]}
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isDark
                    ? "border-indigo-400/50 bg-indigo-500/20 text-indigo-200 hover:border-indigo-300 hover:bg-indigo-500/30"
                    : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100"
                }`}
              >
                返回{categoryLabelMap[data.category]}分类
              </Link>
            </div>
          </div>
        </article>

        <aside
          className={`h-fit rounded-2xl border p-4 shadow-sm xl:sticky xl:top-8 ${
            isDark ? "border-slate-700 bg-slate-900/84" : "border-slate-200 bg-white"
          }`}
        >
          <h2 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-slate-500"}`}>目录</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {headings.length === 0 ? <li className={isDark ? "text-slate-500" : "text-slate-400"}>暂无目录</li> : null}
            {headings.map((item) => (
              <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                <a
                  className={`block rounded-md px-2 py-1 transition ${
                    activeHeadingId === item.id
                      ? isDark
                        ? "bg-indigo-500/20 font-semibold text-indigo-200 ring-1 ring-indigo-400/40"
                        : "bg-indigo-100 font-semibold text-indigo-800 ring-1 ring-indigo-200"
                      : isDark
                        ? "text-slate-200 hover:bg-slate-800 hover:text-indigo-200"
                        : "text-slate-700 hover:bg-slate-50 hover:text-indigo-700"
                  }`}
                  href={`#${item.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    if (scrollToHeading(item.id)) {
                      setActiveHeadingId(item.id);
                      window.history.replaceState(
                        null,
                        "",
                        `${window.location.pathname}${window.location.search}#${encodeURIComponent(item.id)}`,
                      );
                    }
                  }}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
