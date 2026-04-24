import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { BlurRevealImage } from "../components/ui/BlurRevealImage";
import { loadCachedQuotesPool, pickRandomQuote } from "../lib/quotes";

export function NotFoundPage() {
  const quote = useMemo(() => pickRandomQuote(loadCachedQuotesPool()), []);
  return (
    <section className="space-y-4 rounded-xl border border-theme-line bg-theme-surface-raised p-8 text-center">
      <Helmet>
        <title>页面未找到 | Keyon Blog ｜ 云际漫游者</title>
      </Helmet>
      <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-theme-line">
        <BlurRevealImage
          alt="404 迷路绵羊"
          className="h-full w-full object-cover"
          src="/media/error/404-lost-sheep.png"
          wrapperClassName="aspect-[4/3]"
        />
      </div>
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-theme-muted">页面不存在，云海有点大，我们一起回到起点。</p>
      {quote ? (
        <p className="mx-auto max-w-md pt-2 font-theme-display text-sm italic leading-relaxed text-theme-muted">
          「{quote.text}」
        </p>
      ) : null}
      <Link className="text-indigo-600 hover:text-indigo-700" to="/">
        返回首页
      </Link>
    </section>
  );
}
