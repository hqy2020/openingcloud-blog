import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Highlight } from "../ui/hero-highlight";
import type { WikiQuoteItem } from "../../api/home";
import { pickRandomQuote } from "../../lib/quotes";

type Props = {
  pool: WikiQuoteItem[];
  intervalMs?: number;
  seedOffset?: number;
};

export function RotatingQuoteHighlight({ pool, intervalMs = 10000, seedOffset = 0 }: Props) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!pool || pool.length <= 1) return;
    const id = window.setInterval(() => setRotation((r) => r + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [pool, intervalMs]);

  const current = useMemo(
    () => pickRandomQuote(pool) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, rotation, seedOffset],
  );

  if (!current) return null;

  return (
    <div className="mx-auto -my-4 max-w-5xl px-2 text-center">
      <AnimatePresence mode="wait">
        <motion.h3
          key={`${rotation}-${seedOffset}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-block pb-3 text-2xl font-bold !leading-[1.5] tracking-tight text-theme-ink sm:text-3xl lg:text-4xl">
            <Highlight
              className="rounded-md px-2 py-0 align-[0.02em] text-theme-ink from-orange-300 to-amber-300 dark:text-white dark:from-orange-500 dark:to-amber-500"
              backgroundHeight="100%"
              backgroundPosition="left center"
              duration={3}
            >
              {current.text}
            </Highlight>
          </span>
        </motion.h3>
      </AnimatePresence>
    </div>
  );
}
