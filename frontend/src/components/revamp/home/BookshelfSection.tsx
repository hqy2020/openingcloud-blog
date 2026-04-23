import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { BookItem } from "../../../api/home";
import { SectionTitleCard } from "../shared/SectionTitleCard";

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
        className={`flex h-full w-full items-center justify-center rounded-md bg-gradient-to-br from-claude-parchment to-claude-terracotta/20 p-2 ${className ?? ""}`}
      >
        <span className="text-center font-serif text-[11px] leading-tight text-claude-near-black/70">
          {book.title}
        </span>
      </div>
    );
  }
  return (
    <img
      src={book.cover}
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
    <motion.article
      variants={itemVariants}
      whileHover={{ y: -5, boxShadow: "0 18px 38px rgba(201,100,66,0.18)" }}
      transition={hoverSpring}
      style={{ perspective: "900px" }}
      className="group relative overflow-hidden rounded-claude-lg border border-claude-border-cream bg-gradient-to-br from-claude-parchment via-claude-ivory to-claude-ivory p-6 shadow-whisper"
    >
      {!prefersReducedMotion ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 -bottom-10 h-40 w-40 rounded-full bg-claude-terracotta/15 blur-3xl"
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
          <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-claude-terracotta/10 px-3 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-claude-terracotta">
            <BookOpenIcon className="h-3 w-3" />
            正在读
          </div>
          <h3 className="font-serif text-xl font-medium leading-tight text-claude-near-black">
            {book.title}
          </h3>
          {book.author ? (
            <p className="mt-1 font-sans text-xs text-claude-stone-gray">{book.author}</p>
          ) : null}

          <div className="mt-4">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-claude-parchment">
              <motion.div
                className="h-full rounded-full bg-claude-terracotta"
                initial={prefersReducedMotion ? false : { width: 0 }}
                whileInView={prefersReducedMotion ? undefined : { width: `${progress}%` }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.1, ease: [0.22, 0.9, 0.3, 1], delay: 0.2 }}
                style={prefersReducedMotion ? { width: `${progress}%` } : undefined}
              />
            </div>
            <div className="mt-1.5 flex justify-between font-sans text-[10px] text-claude-stone-gray">
              <span>进度</span>
              <span className="font-medium text-claude-terracotta">{progress}%</span>
            </div>
          </div>

          {book.review ? (
            <p className="mt-4 border-l-2 border-claude-terracotta/40 pl-3 font-serif text-[13px] italic leading-[1.55] text-claude-olive-gray">
              「{book.review}」
            </p>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

function FinishedCard({ book }: { book: BookItem }) {
  const prefersReducedMotion = useReducedMotion();
  const rating = book.rating ?? 0;
  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.02, boxShadow: "0 14px 28px rgba(0,0,0,0.08)" }}
      transition={hoverSpring}
      style={{ perspective: "700px" }}
      className="group flex flex-col rounded-claude-lg border border-claude-border-cream bg-claude-ivory p-4 shadow-whisper"
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
          <h4 className="line-clamp-2 font-serif text-sm font-medium leading-tight text-claude-near-black">
            {book.title}
          </h4>
          {book.author ? (
            <p className="mt-1 font-sans text-[11px] text-claude-stone-gray">{book.author}</p>
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
              className="rounded border border-claude-border-cream bg-claude-parchment px-2 py-0.5 font-sans text-[10px] text-claude-olive-gray"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </motion.article>
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
