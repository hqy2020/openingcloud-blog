import { useEffect, useMemo, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { fetchPostBySlug, incrementPostViews } from "../api/posts";
import { useAsync } from "../hooks/useAsync";

type HeadingItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

function toHeadingId(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5-\s]/g, "")
    .replace(/\s+/g, "-");
}

function extractHeadings(markdown: string): HeadingItem[] {
  const lines = markdown.split("\n");
  const result: HeadingItem[] = [];

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2?.[1]) {
      const text = h2[1].trim();
      result.push({ id: toHeadingId(text), text, level: 2 });
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3?.[1]) {
      const text = h3[1].trim();
      result.push({ id: toHeadingId(text), text, level: 3 });
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

export function PostDetailPage() {
  const { slug = "" } = useParams();
  const { data, loading, error } = useAsync(() => fetchPostBySlug(slug), [slug]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!slug) {
      return;
    }
    void incrementPostViews(slug);
  }, [slug]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(100, Math.max(0, (window.scrollY / total) * 100)));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headings = useMemo(() => extractHeadings(data?.content ?? ""), [data?.content]);

  if (loading) {
    return <p className="text-slate-500">加载中...</p>;
  }

  if (error || !data) {
    return <p className="text-rose-600">{error || "文章不存在"}</p>;
  }

  const markdownComponents = {
    h2: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
      const text = plainText(children);
      return (
        <h2 {...props} className="mt-8 text-2xl font-semibold text-slate-900" id={toHeadingId(text)}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
      const text = plainText(children);
      return (
        <h3 {...props} className="mt-6 text-xl font-semibold text-slate-800" id={toHeadingId(text)}>
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

      <div className="sticky top-0 z-10 h-1 rounded-full bg-slate-200">
        <div className="h-1 rounded-full bg-indigo-600 transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      {data.cover ? (
        <img alt={data.title} className="h-72 w-full rounded-2xl object-cover shadow" src={data.cover} />
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{data.title}</h1>
          <p className="mt-2 text-sm text-slate-500">阅读 {data.views_count}</p>
          <div className="mt-6">
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
              {data.content}
            </ReactMarkdown>
          </div>
        </article>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">目录</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {headings.length === 0 ? <li className="text-slate-400">暂无目录</li> : null}
            {headings.map((item) => (
              <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                <a className="text-slate-700 transition hover:text-indigo-700" href={`#${item.id}`}>
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
