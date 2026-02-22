import { motion } from "motion/react";
import { useMemo } from "react";
import type { HighlightStage } from "../../../api/home";
import { achievementCards, type AchievementCard } from "../../../data/revamp/achievements";
import { Marquee } from "../../ui/Marquee";

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

function resolveAchievementCards(stages: HighlightStage[]) {
  const dynamic = stages.flatMap(fromHighlightStage).filter((item) => item.title.trim().length > 0);
  if (dynamic.length >= 8) {
    return dynamic;
  }
  if (dynamic.length === 0) {
    return achievementCards;
  }
  const required = Math.max(0, 8 - dynamic.length);
  return [...dynamic, ...achievementCards.slice(0, required)];
}

function AchievementMarqueeCard({ card }: { card: AchievementCard }) {
  return (
    <motion.article
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-[0_10px_22px_rgba(15,23,42,0.1)] backdrop-blur"
    >
      <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">{card.period}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{card.title}</p>
      <p className="mt-1.5 max-w-[320px] text-xs text-slate-600">{card.description}</p>
    </motion.article>
  );
}

export function SocialMarquee({ stages }: SocialMarqueeProps) {
  const cards = useMemo(() => resolveAchievementCards(stages), [stages]);

  return (
    <section id="achievements" className="space-y-4">
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Highlights</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-800">高光成就双向跑马灯</h2>
      </div>

      <div className="space-y-3">
        <Marquee pauseOnHover duration={28}>
          {cards.map((card) => (
            <AchievementMarqueeCard key={`row-a-${card.id}`} card={card} />
          ))}
        </Marquee>

        <Marquee reverse pauseOnHover duration={28}>
          {cards.map((card) => (
            <AchievementMarqueeCard key={`row-b-${card.id}`} card={card} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
