import { motion, useScroll, useSpring } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { fetchPostBySlug, incrementPostViews } from "../api/posts";
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
  if (!value || value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) {
    return value;
  }
  try {
    const parsed = new URL(value);
    const isLegacyHost = parsed.hostname.toLowerCase() === "blog.openingclouds.com";
    if (isLegacyHost && typeof window !== "undefined" && window.location.hostname !== parsed.hostname) {
      return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return value;
  }
  return value;
}

export function PostDetailPage() {
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
    return <p className="text-slate-500">加载中...</p>;
  }

  if (error || !data) {
    return <p className="text-rose-600">{error || "文章不存在"}</p>;
  }

  const postTags = Array.isArray(data.tags)
    ? data.tags.map((tag) => String(tag).trim()).filter((tag) => tag.length > 0)
    : [];

  const markdownComponents = {
    h2: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
      const text = plainText(children);
      const id = consumeHeadingId(2, text);
      const isActive = activeHeadingId === id;
      return (
        <h2
          {...props}
          className={`mt-8 scroll-mt-24 rounded-md px-1 text-2xl font-semibold transition-colors ${
            isActive ? "bg-indigo-50/70 text-indigo-700 ring-1 ring-indigo-100" : "text-slate-900"
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
            isActive ? "bg-indigo-50/70 text-indigo-700 ring-1 ring-indigo-100" : "text-slate-800"
          }`}
          id={id}
        >
          {children}
        </h3>
      );
    },
    p: ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props} className="mt-4 leading-8 text-slate-700">
        {children}
      </p>
    ),
    code: ({ children, className, ...props }: HTMLAttributes<HTMLElement>) => {
      const isInline = !(className ?? "").includes("language-");
      if (isInline) {
        return (
          <code {...props} className="rounded bg-slate-100 px-1 py-0.5 text-sm text-slate-800">
            {children}
          </code>
        );
      }
      return (
        <code {...props} className="block overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
          {children}
        </code>
      );
    },
    ul: ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => (
      <ul {...props} className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
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
          className="font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-4 transition hover:text-indigo-800 hover:decoration-indigo-500"
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => {
      const initialSrc = resolveMarkdownAssetUrl(String(src ?? ""));
      return (
        <figure className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img
            {...props}
            src={initialSrc}
            alt={String(alt ?? "")}
            loading="lazy"
            className="max-h-[460px] w-full object-contain bg-white"
            onError={(event) => {
              const img = event.currentTarget;
              if (img.dataset.fallbackTried === "1") {
                return;
              }
              try {
                const parsed = new URL(img.currentSrc || img.src, window.location.origin);
                if (parsed.hostname.toLowerCase() !== "blog.openingclouds.com") {
                  return;
                }
                img.dataset.fallbackTried = "1";
                img.src = `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
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

  return (
    <section className="space-y-6">
      <Helmet>
        <title>{`${data.title} | openingClouds`}</title>
        <meta content={data.excerpt || "openingClouds 文章详情"} name="description" />
        <meta content={data.title} property="og:title" />
        <meta content={data.excerpt || "openingClouds 文章详情"} property="og:description" />
        <meta content={data.cover || "/og-cloudscape-card.png"} property="og:image" />
        <link href={`https://blog.openingclouds.com/posts/${data.slug}`} rel="canonical" />
      </Helmet>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-1 bg-slate-200/85 backdrop-blur-sm">
        <motion.div className="h-full origin-left bg-indigo-600" style={{ scaleX: smoothProgress }} />
      </div>

      {data.cover ? (
        <img alt={data.title} className="h-72 w-full rounded-2xl object-cover shadow" src={data.cover} />
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{data.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
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

          <div className="mt-10 space-y-4 border-t border-slate-200 pt-5">
            {postTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-500">文末标签</span>
                {postTags.map((tag) => (
                  <Link
                    key={`post-tag-${tag}`}
                    to={`${categoryPathMap[data.category]}?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : null}

            <div>
              <Link
                to={categoryPathMap[data.category]}
                className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
              >
                返回{categoryLabelMap[data.category]}分类
              </Link>
            </div>
          </div>
        </article>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">目录</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {headings.length === 0 ? <li className="text-slate-400">暂无目录</li> : null}
            {headings.map((item) => (
              <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                <a
                  className={`block rounded-md px-2 py-1 transition ${
                    activeHeadingId === item.id
                      ? "bg-indigo-100 font-semibold text-indigo-800 ring-1 ring-indigo-200"
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
