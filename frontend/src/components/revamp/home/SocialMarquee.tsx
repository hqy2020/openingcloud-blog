import { motion } from "motion/react";
import { useMemo } from "react";
import type { HighlightStage } from "../../../api/home";
import type { AchievementCard } from "../../../data/revamp/achievements";
import { Marquee } from "../../ui/Marquee";
import { SectionTitleCard } from "../shared/SectionTitleCard";

type SocialMarqueeProps = {
  stages: HighlightStage[];
};

function fromHighlightStage(stage: HighlightStage): AchievementCard[] {
  if (!Array.isArray(stage.items) || stage.items.length === 0) {
    return [];
  }
  return stage.items.map((item, itemIndex) => ({
    id: `${stage.title}-${item.title}-${itemIndex}`,
    title: item.title,
    period: item.achieved_at ?? stage.start_date ?? "长期",
    description: item.description || stage.description || stage.title,
  }));
}

function AchievementMarqueeCard({ card }: { card: AchievementCard }) {
  return (
    <motion.article
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      className="group flex h-[132px] w-[280px] shrink-0 flex-col rounded-2xl bg-transparent px-5 py-4 transition-all duration-200 hover:border hover:border-theme-accent/60 hover:bg-theme-surface/40 hover:shadow-[var(--theme-shadow-lifted)]"
    >
      <p className="line-clamp-1 text-[11px] font-semibold tracking-[0.16em] text-theme-muted group-hover:text-theme-accent-soft">{card.period}</p>
      <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-theme-ink group-hover:text-white">{card.title}</p>
      <p className="mt-auto line-clamp-2 text-xs leading-relaxed text-theme-muted group-hover:text-theme-accent-soft">{card.description}</p>
    </motion.article>
  );
}

export function SocialMarquee({ stages }: SocialMarqueeProps) {
  const cards = useMemo(
    () => stages.flatMap(fromHighlightStage).filter((item) => item.title.trim().length > 0),
    [stages],
  );

  if (cards.length === 0) return null;

  return (
    <section id="achievements" className="space-y-4">
      <SectionTitleCard category="HighLight" title="高光时刻" accentColor="#c96442" tagline="那些值得被记住的瞬间，散落在时间线的各个角落。" />

      <div className="space-y-4">
        <Marquee pauseOnHover duration={300} className="gap-6 [--gap:1.5rem]">
          {cards.filter((_, i) => i % 2 === 0).map((card) => (
            <AchievementMarqueeCard key={`row-a-${card.id}`} card={card} />
          ))}
        </Marquee>

        <Marquee reverse pauseOnHover duration={300} className="gap-6 [--gap:1.5rem]">
          {cards.filter((_, i) => i % 2 === 1).map((card) => (
            <AchievementMarqueeCard key={`row-b-${card.id}`} card={card} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
