import { Link } from "react-router-dom";
import { fetchHealth } from "../api/posts";
import { useAsync } from "../hooks/useAsync";

export function HomePage() {
  const { data, loading, error } = useAsync(fetchHealth, []);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 to-sky-600 px-6 py-10 text-white shadow-xl">
        <h1 className="text-4xl font-bold tracking-tight">openingClouds</h1>
        <p className="mt-3 text-lg text-indigo-50">Tech · Efficiency · Life</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-lg font-semibold">后端健康检查</h2>
        {loading && <p className="text-slate-500">加载中...</p>}
        {error && <p className="text-rose-600">{error}</p>}
        {data && (
          <p className="text-slate-700">
            {data.service} / {data.status} / {new Date(data.time).toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link className="rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300" to="/tech">
          技术文章
        </Link>
        <Link className="rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300" to="/learning">
          效率文章
        </Link>
        <Link className="rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300" to="/life">
          生活文章
        </Link>
      </div>
    </section>
  );
}
