import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchPostBySlug, incrementPostViews } from "../api/posts";
import { useAsync } from "../hooks/useAsync";

export function PostDetailPage() {
  const { slug = "" } = useParams();
  const { data, loading, error } = useAsync(() => fetchPostBySlug(slug), [slug]);

  useEffect(() => {
    if (!slug) {
      return;
    }
    void incrementPostViews(slug);
  }, [slug]);

  if (loading) {
    return <p className="text-slate-500">加载中...</p>;
  }

  if (error || !data) {
    return <p className="text-rose-600">{error || "文章不存在"}</p>;
  }

  return (
    <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
      <p className="text-sm text-slate-500">阅读 {data.views_count}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        {data.content}
      </pre>
    </article>
  );
}
