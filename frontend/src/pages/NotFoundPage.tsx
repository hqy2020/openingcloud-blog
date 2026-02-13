import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-slate-600">页面不存在</p>
      <Link className="text-indigo-600 hover:text-indigo-700" to="/">
        返回首页
      </Link>
    </section>
  );
}
