import type { WishItem } from "../../../api/home";
import { AnimatedList } from "../../ui/AnimatedList";
import { SectionTitleCard } from "../shared/SectionTitleCard";

type DreamSectionProps = {
  wishes: WishItem[];
};

const priorityColors: Record<WishItem["priority"], string> = {
  high: "border-amber-300/60 bg-amber-50/60",
  medium: "border-sky-300/60 bg-sky-50/60",
  low: "border-slate-200/80 bg-white/70",
};

const priorityLabels: Record<WishItem["priority"], string> = {
  high: "Most Wanted",
  medium: "Want",
  low: "Nice to Have",
};

function WishCard({ wish }: { wish: WishItem }) {
  return (
    <article
      className={`flex items-start gap-3 rounded-2xl border p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] backdrop-blur ${priorityColors[wish.priority]}`}
    >
      <span className="mt-0.5 text-2xl">{wish.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">{wish.title}</h3>
          <span className="rounded-full border border-current/20 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {priorityLabels[wish.priority]}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-600">{wish.description}</p>
      </div>
    </article>
  );
}

export function DreamSection({ wishes }: DreamSectionProps) {
  return (
    <section id="dream" className="space-y-4">
      <SectionTitleCard category="Dream" title="心愿清单" accentColor="#f97316" tagline="还没拥有的东西，先写下来，总有一天会实现。" />

      <div className="mx-auto min-w-[70%]">
        <AnimatedList delay={2400} className="space-y-3">
          {wishes.map((wish) => (
            <WishCard key={wish.id} wish={wish} />
          ))}
        </AnimatedList>
      </div>
    </section>
  );
}
