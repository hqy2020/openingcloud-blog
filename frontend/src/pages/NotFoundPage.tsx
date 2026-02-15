import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { BlurRevealImage } from "../components/ui/BlurRevealImage";

export function NotFoundPage() {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
      <Helmet>
        <title>页面未找到 | 启云博客</title>
      </Helmet>
      <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-slate-200">
        <BlurRevealImage
          alt="404 迷路绵羊"
          className="h-full w-full object-cover"
          src="/media/error/404-lost-sheep.png"
          wrapperClassName="aspect-[4/3]"
        />
      </div>
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-slate-600">页面不存在，云海有点大，我们一起回到起点。</p>
      <Link className="text-indigo-600 hover:text-indigo-700" to="/">
        返回首页
      </Link>
    </section>
  );
}
