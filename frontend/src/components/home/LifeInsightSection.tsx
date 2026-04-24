import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { WikiQuoteItem } from "../../api/home";
import { pickRandomQuotes } from "../../lib/quotes";

type Props = {
  pool: WikiQuoteItem[];
  count?: number;
  intervalMs?: number;
};

export function LifeInsightSection({ pool, count = 3, intervalMs = 10000 }: Props) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!pool || pool.length <= count) return;
    const id = window.setInterval(() => setRotation((r) => r + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [pool, count, intervalMs]);

  const picks = useMemo(() => pickRandomQuotes(pool, count), [pool, count, rotation]);

  if (!pool || pool.length === 0 || picks.length === 0) return null;

  return (
    <section className="rounded-[var(--theme-radius)] border border-theme-line bg-theme-surface p-6 shadow-[var(--theme-shadow-whisper)] md:p-8">
      <div className="mb-5">
        <p className="font-theme-sans text-xs font-medium uppercase tracking-[0.22em] text-theme-accent">
          Life Insights
        </p>
        <h2 className="mt-1 font-theme-display text-xl font-medium text-theme-ink md:text-2xl">
          人生感悟
        </h2>
      </div>

      <div className="relative min-h-[180px]">
        <AnimatePresence mode="wait">
          <motion.ul
            key={rotation}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid gap-4 md:grid-cols-3"
          >
            {picks.map((q, i) => (
              <li
                key={`${rotation}-${i}`}
                className="relative flex min-h-[140px] flex-col justify-between rounded-xl border border-theme-line bg-theme-surface-raised p-5"
              >
                <p className="font-theme-display text-base leading-relaxed text-theme-ink md:text-lg">
                  「{q.text}」
                </p>
                {q.source ? (
                  <p className="mt-4 font-theme-sans text-[11px] uppercase tracking-[0.14em] text-theme-soft">
                    {q.source}
                  </p>
                ) : null}
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
    </section>
  );
}
