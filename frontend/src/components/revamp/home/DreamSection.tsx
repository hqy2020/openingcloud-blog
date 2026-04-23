import type { WishItem } from "../../../api/home";
import { SectionTitleCard } from "../shared/SectionTitleCard";

type DreamSectionProps = {
  wishes: WishItem[];
};

const priorityColors: Record<WishItem["priority"], string> = {
  high: "border-claude-terracotta/40 bg-claude-ivory",
  medium: "border-claude-border-warm bg-claude-ivory",
  low: "border-claude-border-cream bg-claude-parchment",
};

const priorityTagColors: Record<WishItem["priority"], string> = {
  high: "border-claude-terracotta/40 text-claude-terracotta",
  medium: "border-claude-border-warm text-claude-olive-gray",
  low: "border-claude-border-cream text-claude-stone-gray",
};

const priorityLabels: Record<WishItem["priority"], string> = {
  high: "Most Wanted",
  medium: "Want",
  low: "Nice to Have",
};

function WishCard({ wish }: { wish: WishItem }) {
  return (
    <article
      className={`flex items-start gap-3 rounded-claude-lg border p-5 shadow-whisper transition-shadow duration-200 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] ${priorityColors[wish.priority]}`}
    >
      <span className="mt-0.5 text-2xl">{wish.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-serif text-base font-medium text-claude-near-black">{wish.title}</h3>
          <span
            className={`rounded-full border px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-[0.12em] ${priorityTagColors[wish.priority]}`}
          >
            {priorityLabels[wish.priority]}
          </span>
        </div>
        <p className="mt-1.5 font-serif text-sm leading-[1.6] text-claude-olive-gray">{wish.description}</p>
      </div>
    </article>
  );
}

export function DreamSection({ wishes }: DreamSectionProps) {
  return (
    <section id="dream" className="space-y-4">
      <SectionTitleCard
        category="Dream"
        title="心愿清单"
        accentColor="#c96442"
        tagline="还没拥有的东西，先写下来，总有一天会实现。"
      />

      <ul className="mx-auto min-w-[70%] space-y-3">
        {wishes.map((wish) => (
          <li key={wish.id}>
            <WishCard wish={wish} />
          </li>
        ))}
      </ul>
    </section>
  );
}
