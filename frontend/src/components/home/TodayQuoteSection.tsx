import { useCallback, useMemo, useState } from "react";
import type { WikiQuoteItem } from "../../api/home";
import { pickRandomQuotes } from "../../lib/quotes";

type Props = {
  pool: WikiQuoteItem[];
  count?: number;
};

export function TodayQuoteSection({ pool, count = 3 }: Props) {
  const [seed, setSeed] = useState(0);
  const picks = useMemo(() => pickRandomQuotes(pool, count), [pool, count, seed]);
  const reroll = useCallback(() => setSeed((s) => s + 1), []);

  if (!pool || pool.length === 0 || picks.length === 0) return null;

  return (
    <section className="rounded-[var(--theme-radius)] border border-theme-line bg-theme-surface p-6 shadow-[var(--theme-shadow-whisper)] md:p-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-theme-sans text-xs font-medium uppercase tracking-[0.22em] text-theme-accent">
            Today&apos;s Quotes
          </p>
          <h2 className="mt-1 font-theme-display text-xl font-medium text-theme-ink md:text-2xl">
            今日金句
          </h2>
        </div>
        <button
          type="button"
          onClick={reroll}
          className="inline-flex items-center gap-1.5 rounded-full border border-theme-line bg-theme-surface-raised px-3 py-1.5 font-theme-sans text-xs text-theme-muted transition-colors hover:border-theme-accent/50 hover:text-theme-accent"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-4.9M20 14a8 8 0 01-14 4.9"
            />
          </svg>
          换一批
        </button>
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {picks.map((q, i) => (
          <li
            key={`${seed}-${i}`}
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
      </ul>
    </section>
  );
}
