import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { PostSummary } from "../../../api/posts";
import { cn } from "../../../lib/utils";
import { Marquee } from "../../ui/Marquee";

type ArticleMarquee3DProps = {
  posts: PostSummary[];
  accentHex: string;
  glowRgb: string;
};

function formatViews(value: number) {
  if (value >= 1000) {
    const short = value >= 10000 ? (value / 1000).toFixed(0) : (value / 1000).toFixed(1);
    return `${short}k`;
  }
  return String(value);
}

function estimateReadMinutes(post: PostSummary) {
  const words = post.word_count || 0;
  return Math.max(1, Math.round(words / 280));
}

function normalizeTrackPosts(posts: PostSummary[]) {
  if (posts.length >= 3) {
    return posts;
  }
  if (posts.length === 2) {
    return [...posts, ...posts];
  }
  if (posts.length === 1) {
    return [posts[0], posts[0], posts[0]];
  }
  return [];
}

function splitIntoColumns(posts: PostSummary[], columns = 4) {
  const buckets = Array.from({ length: columns }, () => [] as PostSummary[]);
  posts.forEach((post, index) => {
    buckets[index % columns].push(post);
  });
  return buckets.map((bucket) => normalizeTrackPosts(bucket.length > 0 ? bucket : posts.slice(0, 3)));
}

function ArticleMarqueeCard({
  post,
  accentHex,
  glowRgb,
}: {
  post: PostSummary;
  accentHex: string;
  glowRgb: string;
}) {
  const cardBackground = `linear-gradient(165deg, rgba(255,255,255,0.95), rgba(${glowRgb},0.09))`;

  return (
    <article
      className="group relative w-72 overflow-hidden rounded-2xl border border-theme-line/70 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition-transform hover:-translate-y-1 sm:w-80"
      style={{ background: cardBackground }}
    >
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${accentHex} 0%, transparent 100%)` }} />
      <p className="text-[11px] font-medium text-theme-muted">
        {new Date(post.updated_at).toLocaleDateString("zh-CN")} · 👁 {formatViews(post.views_count)} · {estimateReadMinutes(post)} min
      </p>
      <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-theme-ink sm:text-lg">
        <Link className="transition hover:opacity-80" style={{ color: accentHex }} to={`/posts/${post.slug}`}>
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-theme-muted">{post.excerpt || "暂无摘要"}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {post.tags.slice(0, 3).map((tag) => (
          <span
            key={`${post.slug}-${tag}`}
            className="rounded-full px-2 py-0.5 text-[11px]"
            style={{ color: accentHex, background: `rgba(${glowRgb},0.14)` }}
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

export function ArticleMarquee3D({ posts, accentHex, glowRgb }: ArticleMarquee3DProps) {
  const columns = useMemo(() => splitIntoColumns(posts, 4), [posts]);

  if (columns.every((column) => column.length === 0)) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-theme-line/70 bg-theme-surface p-4 shadow-sm sm:p-6">
      <div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden [perspective:760px] sm:h-[520px]">
        <div
          className="flex w-max min-w-full items-center gap-3 sm:gap-4"
          style={{
            transform:
              "translateX(-70px) translateY(0px) translateZ(-110px) rotateX(20deg) rotateY(-12deg) rotateZ(16deg)",
          }}
        >
          {columns.map((column, columnIndex) => (
            <Marquee
              key={`article-column-${columnIndex}`}
              className={cn(
                "h-[380px] [--gap:0.75rem] sm:h-[470px] sm:[--gap:1rem]",
                columnIndex === 1 && "hidden sm:flex",
                columnIndex > 1 && "hidden lg:flex",
              )}
              duration={22 + columnIndex * 2}
              pauseOnHover
              reverse={columnIndex % 2 === 1}
              vertical
            >
              {column.map((post, index) => (
                <ArticleMarqueeCard
                  key={`${post.slug}-${columnIndex}-${index}`}
                  accentHex={accentHex}
                  glowRgb={glowRgb}
                  post={post}
                />
              ))}
            </Marquee>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-white/80 to-transparent sm:h-28" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent sm:h-28" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-white via-white/80 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-white via-white/80 to-transparent sm:w-24" />
    </div>
  );
}
