import type { WishItem } from "../../../api/home";
import { SectionTitleCard } from "../shared/SectionTitleCard";

type DreamSectionProps = {
  wishes: WishItem[];
};

const priorityColors: Record<WishItem["priority"], string> = {
  high: "border-theme-accent/40 bg-theme-bg",
  medium: "border-theme-line-strong bg-theme-bg",
  low: "border-theme-line bg-theme-surface",
};

const priorityTagColors: Record<WishItem["priority"], string> = {
  high: "border-theme-accent/40 text-theme-accent",
  medium: "border-theme-line-strong text-theme-muted",
  low: "border-theme-line text-theme-soft",
};

const priorityLabels: Record<WishItem["priority"], string> = {
  high: "Most Wanted",
  medium: "Want",
  low: "Nice to Have",
};

function WishCard({ wish }: { wish: WishItem }) {
  return (
    <article
      className={`group flex items-start gap-3 rounded-[var(--theme-radius)] border p-5 shadow-[var(--theme-shadow-whisper)] transition-all duration-300 hover:-translate-y-0.5 hover:border-theme-accent/50 hover:shadow-[var(--theme-shadow-lifted)] ${priorityColors[wish.priority]}`}
    >
      <span className="mt-0.5 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]">
        {wish.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-theme-display text-base font-medium text-theme-ink transition-colors duration-200 group-hover:text-theme-accent">
            {wish.title}
          </h3>
          <span
            className={`rounded-full border px-2 py-0.5 font-theme-sans text-[10px] font-medium uppercase tracking-[0.12em] ${priorityTagColors[wish.priority]}`}
          >
            {priorityLabels[wish.priority]}
          </span>
        </div>
        <p className="mt-1.5 font-theme-body text-sm leading-[1.6] text-theme-muted">{wish.description}</p>
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
