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

const completedPrefixPattern = /^已完成(?:购入)?[。:：\s]*/;

function resolveWishCompletion(description: string) {
  const normalized = description.trim();
  const completed = completedPrefixPattern.test(normalized);
  const displayDescription = completed ? normalized.replace(completedPrefixPattern, "").trim() : normalized;
  return {
    completed,
    description: displayDescription || "这项心愿已经达成，留在这里做个纪念。",
  };
}

function WishCard({ wish }: { wish: WishItem }) {
  const Wrapper = wish.purchase_url ? "a" : "article";
  const completion = resolveWishCompletion(wish.description);
  return (
    <Wrapper
      className={`group theme-card relative overflow-hidden flex items-start gap-3 rounded-[var(--theme-radius)] border p-5 shadow-[var(--theme-shadow-whisper)] transition-all duration-300 hover:border-theme-accent/50 hover:shadow-[var(--theme-shadow-lifted)] ${
        completion.completed
          ? "border-emerald-300/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(248,250,252,0.98))] shadow-[0_16px_36px_rgba(16,185,129,0.14)] hover:border-emerald-400/80 hover:shadow-[0_20px_42px_rgba(16,185,129,0.18)]"
          : priorityColors[wish.priority]
      }`}
      href={wish.purchase_url || undefined}
      target={wish.purchase_url ? "_blank" : undefined}
      rel={wish.purchase_url ? "noopener noreferrer" : undefined}
      aria-label={wish.purchase_url ? `查看${wish.title}参考链接` : undefined}
    >
      {completion.completed ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-500" />
      ) : null}
      <span
        className={`mt-0.5 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg] ${
          completion.completed ? "drop-shadow-[0_4px_10px_rgba(16,185,129,0.18)]" : ""
        }`}
      >
        {wish.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`font-theme-display text-base font-medium transition-colors duration-200 ${
              completion.completed
                ? "text-slate-700 line-through decoration-emerald-400/80 decoration-2"
                : "text-theme-ink group-hover:text-theme-accent"
            }`}
          >
            {wish.title}
          </h3>
          <span
            className={`rounded-full border px-2 py-0.5 font-theme-sans text-[10px] font-medium uppercase tracking-[0.12em] ${priorityTagColors[wish.priority]}`}
          >
            {priorityLabels[wish.priority]}
          </span>
          {completion.completed ? (
            <span className="rounded-full border border-emerald-300/80 bg-emerald-50 px-2 py-0.5 font-theme-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Completed
            </span>
          ) : null}
        </div>
        <p className={`mt-1.5 font-theme-body text-sm leading-[1.6] ${completion.completed ? "text-slate-600" : "text-theme-muted"}`}>
          {completion.description}
        </p>
        {wish.price ? (
          <p className={`mt-2 font-theme-sans text-xs ${completion.completed ? "text-emerald-700/80" : "text-theme-soft"}`}>
            参考价 ¥{wish.price}
          </p>
        ) : null}
      </div>
    </Wrapper>
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
