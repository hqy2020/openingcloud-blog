import { Link } from "react-router-dom";
import { fetchPosts } from "../api/posts";
import { useAsync } from "../hooks/useAsync";

type CategoryPageProps = {
  category: "tech" | "learning" | "life";
  title: string;
};

export function CategoryPage({ category, title }: CategoryPageProps) {
  const { data, loading, error } = useAsync(() => fetchPosts({ category }), [category]);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {loading && <p className="text-slate-500">加载中...</p>}
      {error && <p className="text-rose-600">{error}</p>}

      <div className="grid gap-4">
        {data?.results.map((post) => (
          <article key={post.slug} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-slate-900">
              <Link className="hover:text-indigo-700" to={`/posts/${post.slug}`}>
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-slate-600">{post.excerpt || "暂无摘要"}</p>
            <p className="mt-3 text-xs text-slate-500">阅读 {post.views_count} · {new Date(post.updated_at).toLocaleDateString()}</p>
          </article>
        ))}
      </div>

      {!loading && !error && data && data.results.length === 0 && <p className="text-slate-500">暂无文章</p>}
    </section>
  );
}
