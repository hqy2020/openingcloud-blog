import { motion } from "motion/react";
import { Highlight } from "../../ui/hero-highlight";

export type SectionQuote = {
  id: string;
  category: "技术" | "生活" | "整理";
  lead: string;
  emphasis: string;
  tail: string;
};

type SectionQuoteHighlightProps = {
  quote: SectionQuote;
};

export function SectionQuoteHighlight({ quote }: SectionQuoteHighlightProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto -my-4 max-w-5xl px-2 text-center"
    >
      <h3>
        <span className="inline-block pb-3 text-3xl font-bold !leading-[1.5] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          {quote.lead}
          {" "}
          <Highlight
            className="rounded-md px-1 py-0 align-[0.02em] text-slate-900 from-orange-300 to-amber-300 dark:text-white dark:from-orange-500 dark:to-amber-500"
            backgroundHeight="100%"
            backgroundPosition="left center"
            duration={3}
          >
            {quote.emphasis}
          </Highlight>
          {" "}
          {quote.tail}
        </span>
      </h3>
    </motion.div>
  );
}
