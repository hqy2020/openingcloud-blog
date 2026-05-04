import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { BookItem } from "../../../api/home";
import { SectionTitleCard } from "../shared/SectionTitleCard";

/** Bump this when covers are replaced on disk — busts the 7d browser cache. */
const COVER_CACHE_VERSION = "20260424a";

function withCacheBust(url: string): string {
  if (!url) return url;
  // External URLs (doubanio etc.) don't need busting, and some CDNs choke on extra query.
  if (/^https?:/i.test(url) && !url.startsWith("/")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${COVER_CACHE_VERSION}`;
}

/** Fallback title → douban subject id map, used only when backend has no
 * douban_subject_id filled in yet. Prefer the backend field (editable via
 * Django admin) so non-dev users can maintain these mappings. */
const DOUBAN_SUBJECT_FALLBACK: Record<string, string> = {
  "哥德尔 艾舍尔 巴赫": "1291204",
  "哥德尔、艾舍尔、巴赫": "1291204",
  "黑客与画家": "35889905",
  "Effective Java": "30412517",
  "代码整洁之道": "4199741",
  "计算广告": "26596778",
  "智能简史": "37252220",
  "千脑智能": "36171025",
};

function doubanSearchUrl(book: {
  title: string;
  author?: string;
  douban_subject_id?: string | null;
}): string {
  const explicitId = (book.douban_subject_id || "").trim();
  if (explicitId) {
    return `https://book.douban.com/subject/${explicitId}/`;
  }
  const fallbackId = DOUBAN_SUBJECT_FALLBACK[book.title.trim()];
  if (fallbackId) {
    return `https://book.douban.com/subject/${fallbackId}/`;
  }
  const parts = [book.title, book.author].filter(Boolean).join(" ");
  return `https://search.douban.com/book/subject_search?search_text=${encodeURIComponent(parts)}`;
}

type BookshelfSectionProps = {
  books?: BookItem[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 130, damping: 18 } },
};

const hoverSpring = { type: "spring" as const, stiffness: 220, damping: 22 };

function BookOpenIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function BookCover({ book, className }: { book: BookItem; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken || !book.cover) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-md bg-gradient-to-br from-theme-bg to-theme-accent/20 p-2 ${className ?? ""}`}
      >
        <span className="text-center font-theme-display text-[11px] leading-tight text-theme-ink/70">
          {book.title}
        </span>
      </div>
    );
  }
  return (
    <img
      src={withCacheBust(book.cover)}
      alt={book.title}
      className={`h-full w-full object-cover ${className ?? ""}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
}

function ReadingCard({ book }: { book: BookItem }) {
  const prefersReducedMotion = useReducedMotion();
  const progress = book.progress ?? 0;
  return (
    <motion.a
      href={doubanSearchUrl(book)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`在豆瓣查看《${book.title}》`}
      variants={itemVariants}
      whileHover={{ y: -5, boxShadow: "0 18px 38px rgba(201,100,66,0.18)" }}
      transition={hoverSpring}
      style={{ perspective: "900px" }}
      className="group relative block overflow-hidden rounded-[var(--theme-radius)] border border-theme-line bg-gradient-to-br from-theme-bg via-theme-surface to-theme-surface p-6 shadow-[var(--theme-shadow-whisper)] no-underline"
    >
      {!prefersReducedMotion ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 -bottom-10 h-40 w-40 rounded-full bg-theme-accent/15 blur-3xl"
          animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 select-none text-8xl opacity-10 blur-[1px]"
      >
        ☁️
      </div>

      <div className="relative z-10 flex gap-5">
        <motion.div
          className="h-40 w-28 flex-shrink-0 overflow-hidden rounded shadow-md"
          whileHover={prefersReducedMotion ? undefined : { rotateY: 6, rotateX: -2, scale: 1.06 }}
          transition={hoverSpring}
        >
          <BookCover book={book} />
        </motion.div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-theme-accent/10 px-3 py-1 font-theme-sans text-[11px] font-medium uppercase tracking-[0.16em] text-theme-accent">
            <BookOpenIcon className="h-3 w-3" />
            正在读
          </div>
          <h3 className="font-theme-display text-xl font-medium leading-snug text-theme-ink">
            {book.title}
          </h3>
          {book.author ? (
            <p className="mt-1.5 font-theme-sans text-xs text-theme-soft">{book.author}</p>
          ) : null}

          <div className="mt-4">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-theme-surface">
              <motion.div
                className="h-full rounded-full bg-theme-accent"
                initial={prefersReducedMotion ? false : { width: 0 }}
                whileInView={prefersReducedMotion ? undefined : { width: `${progress}%` }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.1, ease: [0.22, 0.9, 0.3, 1], delay: 0.2 }}
                style={prefersReducedMotion ? { width: `${progress}%` } : undefined}
              />
            </div>
            <div className="mt-1.5 flex justify-between font-theme-sans text-[10px] text-theme-soft">
              <span>进度</span>
              <span className="font-medium text-theme-accent tabular-nums">{progress}%</span>
            </div>
          </div>

          {book.review ? (
            <p className="mt-4 border-l-2 border-theme-accent/40 pl-3 font-theme-display text-[13px] italic leading-[1.55] text-theme-muted">
              「{book.review}」
            </p>
          ) : null}
        </div>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-0.5 rounded-full bg-theme-surface-raised/80 px-2 py-0.5 font-theme-sans text-[10px] text-theme-soft opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        豆瓣 ↗
      </span>
    </motion.a>
  );
}

function FinishedCard({ book }: { book: BookItem }) {
  const prefersReducedMotion = useReducedMotion();
  const rating = book.rating ?? 0;
  return (
    <motion.a
      href={doubanSearchUrl(book)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`在豆瓣查看《${book.title}》`}
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.02, boxShadow: "0 14px 28px rgba(0,0,0,0.08)" }}
      transition={hoverSpring}
      style={{ perspective: "700px" }}
      className="group relative flex flex-col rounded-[var(--theme-radius)] border border-theme-line bg-theme-bg p-4 shadow-[var(--theme-shadow-whisper)] no-underline"
    >
      <div className="flex gap-3">
        <motion.div
          className="h-24 w-16 flex-shrink-0 overflow-hidden rounded shadow-sm"
          whileHover={prefersReducedMotion ? undefined : { rotateY: 8, scale: 1.08 }}
          transition={hoverSpring}
        >
          <BookCover book={book} />
        </motion.div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h4 className="line-clamp-2 font-theme-display text-sm font-medium leading-tight text-theme-ink">
            {book.title}
          </h4>
          {book.author ? (
            <p className="mt-1 font-theme-sans text-[11px] text-theme-soft">{book.author}</p>
          ) : null}

          {rating > 0 ? (
            <div className="mt-auto flex gap-0.5 pt-2" aria-label={`评分 ${rating} 颗云`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${i < rating ? "opacity-100" : "opacity-25 grayscale"}`}
                >
                  ☁️
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {book.tags && book.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {book.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-theme-line bg-theme-surface px-2 py-0.5 font-theme-sans text-[10px] text-theme-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-theme-surface-raised/80 px-1.5 py-0.5 font-theme-sans text-[9px] text-theme-soft opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        豆瓣 ↗
      </span>
    </motion.a>
  );
}

export function BookshelfSection({ books }: BookshelfSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const list = books ?? [];

  if (list.length === 0) return null;

  const reading = list.find((b) => b.status === "reading");
  const finished = list.filter((b) => b.status === "finished");

  const Container = prefersReducedMotion ? "div" : motion.div;
  const containerProps = prefersReducedMotion
    ? { className: "space-y-4" }
    : {
        className: "space-y-4",
        variants: containerVariants,
        initial: "hidden" as const,
        whileInView: "show" as const,
        viewport: { once: true, amount: 0.15 },
      };

  return (
    <section id="bookshelf" className="space-y-4">
      <SectionTitleCard
        category="Reading"
        title="书架"
        accentColor="#c96442"
        tagline="正在读的，和读过后留在脑子里的几本。"
      />

      <Container {...containerProps}>
        {reading ? <ReadingCard book={reading} /> : null}

        {finished.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {finished.map((book) => (
              <FinishedCard key={book.id} book={book} />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
