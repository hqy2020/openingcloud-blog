import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { PinnedPost } from "../../../api/home";
import { categoryVisuals, type CategoryVisualKey } from "../../../theme/categoryVisuals";
import { ThreeDMarquee } from "../../ui/ThreeDMarquee";
import { SparklesText } from "../../ui/SparklesText";

const categoryLabels: Record<CategoryVisualKey, string> = {
  tech: "技术",
  learning: "学习",
  life: "生活",
};

/**
 * Ensure enough items to fill a 4-column grid nicely.
 * Repeats the source array until we reach at least `minCount` items.
 */
function padItems(posts: PinnedPost[], minCount = 12): PinnedPost[] {
  if (posts.length === 0) return [];
  const result: PinnedPost[] = [];
  while (result.length < minCount) {
    for (const p of posts) {
      result.push(p);
      if (result.length >= minCount) break;
    }
  }
  return result;
}

function PostCard({ post }: { post: PinnedPost }) {
  const visual = categoryVisuals[post.category] ?? categoryVisuals.tech;
  const label = categoryLabels[post.category] ?? post.category;

  return (
    <Link
      to={`/posts/${post.slug}`}
      className="group relative block aspect-[970/700] w-full overflow-hidden rounded-lg ring ring-gray-950/5 transition-shadow hover:shadow-2xl"
    >
      {/* Cover image */}
      {post.cover ? (
        <img
          src={post.cover}
          alt={post.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${visual.accentHex}33, ${visual.accentHex}11)`,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Category badge */}
      <span
        className="absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm"
        style={{ backgroundColor: `${visual.accentHex}cc` }}
      >
        {label}
      </span>

      {/* Bottom info */}
      <div className="absolute right-0 bottom-0 left-0 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-sm">
          {post.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-white/70">
          <span>{post.views_count} 阅读</span>
          <span>{post.likes_count} 点赞</span>
        </div>
      </div>

      {/* Hover excerpt overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
        <p className="line-clamp-4 text-center text-xs leading-relaxed text-white/90">
          {post.excerpt || post.title}
        </p>
      </div>
    </Link>
  );
}

type RecommendedPostsSectionProps = {
  posts: PinnedPost[];
};

export function RecommendedPostsSection({ posts }: RecommendedPostsSectionProps) {
  const paddedPosts = useMemo(() => padItems(posts, 12), [posts]);

  if (paddedPosts.length === 0) return null;

  return (
    <section id="recommended" className="space-y-4">
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Recommended
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-800">
          <SparklesText
            className="text-inherit"
            sparklesCount={6}
            colors={{ first: "#6B917B", second: "#B8945E" }}
          >
            推荐阅读
          </SparklesText>
        </h2>
      </div>

      {/* Break out of parent px-[5%] padding for full-width 3D effect */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <ThreeDMarquee
          items={paddedPosts}
          renderItem={(post) => <PostCard post={post} />}
          className="h-[650px] max-sm:h-[420px]"
        />
      </div>
    </section>
  );
}
