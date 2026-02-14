import { Helmet } from "react-helmet-async";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPosts } from "../api/posts";
import type { PostSummary } from "../api/posts";
import { getFallbackPosts } from "../data/fallback";
import { useAsync } from "../hooks/useAsync";

type CategoryPageProps = {
  category: "tech" | "learning" | "life";
  title: string;
};

const categoryDescriptions: Record<CategoryPageProps["category"], string> = {
  tech: "技术实践、系统设计与工程复盘。",
  learning: "效率系统、学习方法和个人生产力。",
  life: "旅行、日常观察与生活记录。",
};

export function CategoryPage({ category, title }: CategoryPageProps) {
  const [selectedTag, setSelectedTag] = useState<string>("");
  const { data, loading, error } = useAsync(
    () => fetchPosts({ category, tag: selectedTag || undefined }),
    [category, selectedTag],
  );
  const posts: PostSummary[] = data?.results ?? getFallbackPosts(category);

  const tags = useMemo(() => {
    const values = new Set<string>();
    posts.forEach((post) => {
      post.tags.forEach((tag) => values.add(tag));
    });
    return Array.from(values).sort();
  }, [posts]);

  return (
    <section className="space-y-6">
      <Helmet>
        <title>{`${title} | openingClouds`}</title>
        <meta content={categoryDescriptions[category]} name="description" />
        <meta content={`${title} | openingClouds`} property="og:title" />
        <meta content={categoryDescriptions[category]} property="og:description" />
        <link href={`https://blog.openingclouds.com/${category}`} rel="canonical" />
      </Helmet>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-600">{categoryDescriptions[category]}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={`rounded-full px-3 py-1 text-sm ${
              selectedTag ? "bg-slate-100 text-slate-700" : "bg-indigo-600 text-white"
            }`}
            onClick={() => setSelectedTag("")}
            type="button"
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              className={`rounded-full px-3 py-1 text-sm transition ${
                selectedTag === tag
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => setSelectedTag(tag)}
              type="button"
            >
              {tag}
            </button>
          ))}
        </div>
      </header>

      {loading && <p className="text-slate-500">加载中...</p>}
      {error ? <p className="text-sm text-amber-700">实时数据暂不可用，已展示静态内容。</p> : null}

      <div className="columns-1 gap-4 md:columns-2">
        {posts.map((post) => (
          <article key={post.slug} className="mb-4 break-inside-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              <Link className="transition hover:text-indigo-700" to={`/posts/${post.slug}`}>
                {post.title}
              </Link>
            </h2>

            <p className="mt-2 text-sm text-slate-600">{post.excerpt || "暂无摘要"}</p>

            <div className="mt-3 flex flex-wrap gap-1">
              {post.tags.map((tag) => (
                <span key={`${post.slug}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              阅读 {post.views_count} · {new Date(post.updated_at).toLocaleDateString()}
            </p>
          </article>
        ))}
      </div>

      {!loading && posts.length === 0 ? <p className="text-slate-500">暂无文章</p> : null}
    </section>
  );
}
