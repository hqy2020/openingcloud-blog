import { useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import type { PinnedPost } from "../../api/home";
import { categoryVisuals } from "../../theme/categoryVisuals";

type PinnedPostsSidebarProps = {
  posts: PinnedPost[];
};

function PinnedCard({ post }: { post: PinnedPost }) {
  const accent = categoryVisuals[post.category]?.accentHex ?? "#4F6AE5";

  return (
    <Link
      to={`/posts/${post.slug}`}
      className="group block rounded-lg border border-slate-200/70 bg-white/85 p-3 transition-shadow hover:shadow-md"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <h4 className="text-sm font-semibold leading-snug text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {post.title}
      </h4>
      {post.excerpt && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{post.excerpt}</p>
      )}
      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
        <span>{post.views_count} 阅读</span>
        <span>{post.likes_count} 点赞</span>
      </div>
    </Link>
  );
}

export function PinnedPostsSidebar({ posts }: PinnedPostsSidebarProps) {
  const prefersReducedMotion = useReducedMotion();

  if (posts.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-slate-400">
          <path d="M8.5 1.5a.5.5 0 0 0-1 0v4.793L5.854 4.646a.5.5 0 1 0-.708.708L7.293 7.5H2.5a.5.5 0 0 0 0 1h4.793l-2.147 2.146a.5.5 0 0 0 .708.708L7.5 9.707V14.5a.5.5 0 0 0 1 0V9.707l2.146 2.147a.5.5 0 0 0 .708-.708L9.207 8.5H14a.5.5 0 0 0 0-1H9.207l2.147-2.146a.5.5 0 0 0-.708-.708L8.5 6.293V1.5z"/>
        </svg>
        置顶推荐
      </div>

      {prefersReducedMotion ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <PinnedCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="pinned-sidebar-viewport max-h-[70vh]">
          <div className="pinned-sidebar-track pinned-sidebar-animate">
            <div className="pinned-sidebar-segment">
              {posts.map((post) => (
                <PinnedCard key={post.slug} post={post} />
              ))}
            </div>
            <div className="pinned-sidebar-segment" aria-hidden="true">
              {posts.map((post) => (
                <PinnedCard key={`dup-${post.slug}`} post={post} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
