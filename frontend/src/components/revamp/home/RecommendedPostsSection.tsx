import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { PinnedPost } from "../../../api/home";
import { categoryVisuals } from "../../../theme/categoryVisuals";
import { ThreeDMarquee } from "../../ui/ThreeDMarquee";
import { SectionTitleCard } from "../shared/SectionTitleCard";

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
  return (
    <Link
      to={`/posts/${post.slug}`}
      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-lg ring ring-gray-950/5 transition-shadow hover:shadow-2xl"
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
            background: `linear-gradient(135deg, ${(categoryVisuals[post.category] ?? categoryVisuals.tech).accentHex}33, ${(categoryVisuals[post.category] ?? categoryVisuals.tech).accentHex}11)`,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Centered info */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <h3 className="line-clamp-3 text-center text-2xl font-bold leading-tight text-white drop-shadow-md sm:text-3xl">
          {post.title}
        </h3>
        <div className="mt-3 flex items-center gap-4 text-sm font-medium text-white/80">
          <span>{post.views_count} 阅读</span>
          <span>{post.likes_count} 点赞</span>
        </div>
      </div>

      {/* Hover excerpt overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-theme-accent/90 p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="line-clamp-5 text-center text-base leading-relaxed text-white">
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
      <SectionTitleCard category="Article" title="推荐阅读" accentColor="#c96442" tagline="精心挑选的文章，关于技术、效率与生活的思考碎片。" />

      <ThreeDMarquee
        items={paddedPosts}
        renderItem={(post) => <PostCard post={post} />}
        className="h-[650px] max-sm:h-[420px]"
      />
    </section>
  );
}
