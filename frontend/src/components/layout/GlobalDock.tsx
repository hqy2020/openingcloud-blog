import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useMatch } from "react-router-dom";
import { Dock, DockIcon } from "../ui/MagicUIDock";
import { useTheme } from "../../app/theme";
import {
  fetchHomeLikeStatus,
  toggleHomeLike,
} from "../../api/home";
import {
  fetchPostLikeStatus,
  togglePostLike,
} from "../../api/posts";

function GithubIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.38 6.84 9.74.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.38-3.37-1.38-.46-1.2-1.11-1.52-1.11-1.52-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.45c.85 0 1.7.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.95-2.33 4.82-4.56 5.08.36.32.67.95.67 1.91 0 1.38-.01 2.5-.01 2.84 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.59 17.52 2 12 2z" />
    </svg>
  );
}

function ArticleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 4.5h8.75L19.5 8.5v11H6.75V4.5Zm8.75 0v4h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.25 12h7.5m-7.5 3h5.5" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <rect height="14" rx="3" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="5" />
      <path d="m9.2 10.2 2.1 1.8-2.1 1.8m4.1 0h2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  );
}

function PaletteIcon({ swatch }: { swatch: string }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-theme-line shadow-inner"
      style={{ backgroundColor: swatch }}
      aria-hidden="true"
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: "rgb(var(--theme-ink))" }}
      />
    </span>
  );
}

/** Route-aware like state: homepage / post-detail. */
function useContextualLike() {
  const postMatch = useMatch("/posts/:slug");
  const slug = postMatch?.params.slug;
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (isHome) {
      void fetchHomeLikeStatus()
        .then((s) => {
          if (!cancelled) {
            setLiked(s.liked);
            setCount(s.likes);
          }
        })
        .catch(() => {});
    } else if (slug) {
      void fetchPostLikeStatus(slug)
        .then((s) => {
          if (!cancelled) {
            setLiked(s.liked);
            setCount(s.likes);
          }
        })
        .catch(() => {});
    } else {
      setLiked(false);
      setCount(0);
    }
    return () => {
      cancelled = true;
    };
  }, [isHome, slug]);

  const toggle = useCallback(() => {
    if (isHome) {
      const wasLiked = liked;
      setLiked(!wasLiked);
      setCount((n) => n + (wasLiked ? -1 : 1));
      void toggleHomeLike().then((res) => {
        setLiked(res.liked);
        setCount(res.likes);
      });
    } else if (slug) {
      const wasLiked = liked;
      setLiked(!wasLiked);
      setCount((n) => n + (wasLiked ? -1 : 1));
      void togglePostLike(slug).then((res) => {
        setLiked(res.liked);
        setCount(res.likes);
      });
    }
  }, [isHome, slug, liked]);

  const enabled = isHome || Boolean(slug);
  return { enabled, liked, count, toggle };
}

export function GlobalDock() {
  const { theme, palettes, setTheme } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteWrapperRef = useRef<HTMLDivElement>(null);
  const like = useContextualLike();
  const current = palettes.find((p) => p.id === theme) ?? palettes[0];

  useEffect(() => {
    if (!paletteOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (paletteWrapperRef.current && !paletteWrapperRef.current.contains(event.target as Node)) {
        setPaletteOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPaletteOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [paletteOpen]);

  return (
    <Dock magnification={80} distance={150} draggable className="hidden md:flex">
      <DockIcon label="置顶" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <ArrowUpIcon />
      </DockIcon>
      <DockIcon label="文章" href="/tech">
        <ArticleIcon />
      </DockIcon>
      {like.enabled ? (
        <DockIcon label={`点赞 ${like.count}`} onClick={like.toggle}>
          <span className={like.liked ? "text-theme-accent" : undefined}>
            <HeartIcon filled={like.liked} />
          </span>
        </DockIcon>
      ) : null}
      <DockIcon label="后台" href="/admin/">
        <AdminIcon />
      </DockIcon>
      <DockIcon label="GitHub" href="https://github.com/hqy2020/openingcloud-blog" external>
        <GithubIcon />
      </DockIcon>

      {/* Theme switcher — swatch icon with popup palette */}
      <div ref={paletteWrapperRef} className="relative">
        <DockIcon label={`主题：${current.label}`} onClick={() => setPaletteOpen((v) => !v)}>
          <PaletteIcon swatch={current.swatch} />
        </DockIcon>
        <AnimatePresence>
          {paletteOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 flex items-center gap-2 rounded-[var(--theme-radius)] border border-theme-line bg-theme-surface-raised p-2 shadow-[var(--theme-shadow-lifted)]"
            >
              {palettes.map((p) => {
                const active = p.id === theme;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setTheme(p.id);
                      setPaletteOpen(false);
                    }}
                    aria-label={`切换到 ${p.label} 主题`}
                    title={p.label}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      active ? "border-transparent ring-2 ring-offset-2" : "border-theme-line"
                    }`}
                    style={
                      active
                        ? ({ ["--tw-ring-color" as string]: p.swatch } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <span
                      className="h-5 w-5 rounded-full shadow-inner"
                      style={{ backgroundColor: p.swatch }}
                    />
                  </button>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Dock>
  );
}
