import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import type { PinnedPost } from "../../api/home";
import { categoryVisuals } from "../../theme/categoryVisuals";
import { SidePanel } from "../ui/SidePanel";

type PinnedPostsSidebarProps = {
  posts: PinnedPost[];
};

function PinnedCard({ post }: { post: PinnedPost }) {
  const accent = categoryVisuals[post.category]?.accentHex ?? "#4F6AE5";

  return (
    <Link
      to={`/posts/${post.slug}`}
      className="group block rounded-xl border border-slate-700/70 bg-slate-900/72 p-3 transition-all hover:-translate-y-0.5 hover:border-slate-500/80 hover:bg-slate-800/84"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-100 transition-colors group-hover:text-cyan-300">
        {post.title}
      </h4>
      {post.excerpt && (
        <p className="mt-1 line-clamp-1 text-xs text-slate-400">{post.excerpt}</p>
      )}
      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
        <span>{post.views_count} 阅读</span>
        <span>{post.likes_count} 点赞</span>
      </div>
    </Link>
  );
}

export function PinnedPostsSidebar({ posts }: PinnedPostsSidebarProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  if (posts.length === 0) return null;

  return (
    <SidePanel
      side="right"
      panelOpen={isOpen}
      handlePanelOpen={() => setIsOpen((open) => !open)}
      reducedMotion={prefersReducedMotion}
      expandedWidth={320}
      renderButton={(toggle, panelOpen) =>
        panelOpen ? (
          <>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-cyan-300/90">
                <path d="M8.5 1.5a.5.5 0 0 0-1 0v4.793L5.854 4.646a.5.5 0 1 0-.708.708L7.293 7.5H2.5a.5.5 0 0 0 0 1h4.793l-2.147 2.146a.5.5 0 0 0 .708.708L7.5 9.707V14.5a.5.5 0 0 0 1 0V9.707l2.146 2.147a.5.5 0 0 0 .708-.708L9.207 8.5H14a.5.5 0 0 0 0-1H9.207l2.147-2.146a.5.5 0 0 0-.708-.708L8.5 6.293V1.5z"/>
              </svg>
              置顶推荐
            </div>
            <button
              onClick={toggle}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              aria-label="关闭置顶推荐"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z"/>
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={toggle}
            className="flex flex-col items-center gap-1.5 rounded-l-[18px] px-2 py-4 transition-colors hover:bg-slate-800/75"
            aria-label="展开置顶推荐"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-cyan-300/90">
              <path d="M8.5 1.5a.5.5 0 0 0-1 0v4.793L5.854 4.646a.5.5 0 1 0-.708.708L7.293 7.5H2.5a.5.5 0 0 0 0 1h4.793l-2.147 2.146a.5.5 0 0 0 .708.708L7.5 9.707V14.5a.5.5 0 0 0 1 0V9.707l2.146 2.147a.5.5 0 0 0 .708-.708L9.207 8.5H14a.5.5 0 0 0 0-1H9.207l2.147-2.146a.5.5 0 0 0-.708-.708L8.5 6.293V1.5z"/>
            </svg>
            <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-100" style={{ writingMode: "vertical-rl" }}>
              置顶推荐
            </span>
          </button>
        )
      }
    >
      <div className="flex-1 overflow-hidden px-4 py-3">
        {prefersReducedMotion ? (
          <div className="max-h-full space-y-3 overflow-y-auto">
            {posts.map((post) => (
              <PinnedCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="pinned-sidebar-viewport h-full">
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
    </SidePanel>
  );
}
