import { motion } from "motion/react";
import { Highlight } from "../../ui/hero-highlight";
import { GradientHeading, type Variant } from "../../ui/gradient-heading";

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
  const variantByCategory: Record<SectionQuote["category"], Variant> = {
    技术: "default",
    生活: "pink",
    整理: "secondary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto -my-4 max-w-5xl px-2 text-center"
    >
      <GradientHeading
        variant={variantByCategory[quote.category]}
        size="lg"
        weight="bold"
      >
        <span className="leading-[1.5]">
          {quote.lead}
          {" "}
          <Highlight
            className="rounded-md px-1 py-0 align-[0.02em] text-slate-900 from-indigo-300 to-purple-300 dark:text-white dark:from-indigo-500 dark:to-purple-500"
            backgroundHeight="100%"
            backgroundPosition="left center"
          >
            {quote.emphasis}
          </Highlight>
          {" "}
          {quote.tail}
        </span>
      </GradientHeading>
    </motion.div>
  );
}
