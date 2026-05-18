import { motion, useReducedMotion } from "motion/react";
import type { GameItem } from "../../../api/home";
import { cn } from "../../../lib/utils";

type GameVaultSectionProps = {
  games?: GameItem[];
  compact?: boolean;
  embedded?: boolean;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

function sortGames(games: GameItem[]) {
  return [...games].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
}

function resolveStatusLabel(status: GameItem["status"]) {
  return status === "owned" ? "已入手" : "想玩";
}

function resolveStatusClass(status: GameItem["status"]) {
  return status === "owned"
    ? "border-emerald-300/80 bg-emerald-50 text-emerald-700"
    : "border-[#f3b17f]/80 bg-[#fff4ea] text-[#b55f2d]";
}

function cleanNotes(notes: string) {
  return notes.replace(/\s+/g, " ").trim();
}

function GameRow({ game }: { game: GameItem }) {
  const Wrapper = game.info_url ? "a" : "article";
  const notes = cleanNotes(game.notes);

  return (
    <Wrapper
      className="group relative flex min-w-0 items-start gap-3 overflow-hidden rounded-[var(--theme-radius)] border border-theme-line/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,248,249,0.92))] px-3.5 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all duration-300 hover:border-theme-accent/45 hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]"
      href={game.info_url || undefined}
      target={game.info_url ? "_blank" : undefined}
      rel={game.info_url ? "noopener noreferrer" : undefined}
      aria-label={game.info_url ? `查看 ${game.title}` : undefined}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex shrink-0 rounded-full border px-2 py-0.5 font-theme-sans text-[10px] font-semibold uppercase tracking-[0.14em]",
          resolveStatusClass(game.status),
        )}
      >
        {resolveStatusLabel(game.status)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="min-w-0 text-[15px] font-medium text-theme-ink transition-colors duration-200 group-hover:text-theme-accent">
            {game.title}
          </h3>
          {game.platform ? (
            <span className="rounded-full border border-theme-line bg-theme-bg px-2 py-0.5 font-theme-sans text-[10px] font-medium uppercase tracking-[0.12em] text-theme-soft">
              {game.platform}
            </span>
          ) : null}
        </div>

        {notes ? (
          <p className="mt-0.5 truncate font-theme-body text-[13px] leading-5 text-theme-muted" title={notes}>
            {notes}
          </p>
        ) : null}
      </div>
    </Wrapper>
  );
}

export function GameVaultSection({ games = [], compact = false, embedded = false }: GameVaultSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const allGames = sortGames(games);
  const maxItems = compact || embedded ? allGames : allGames;
  const platforms = Array.from(new Set(allGames.map((game) => game.platform).filter(Boolean)));

  return (
    <section
      id="games"
      className={cn(
        "scroll-mt-28",
        embedded ? "space-y-4 lg:-mt-52 lg:pt-52 xl:-mt-64 xl:pt-64" : "space-y-5",
      )}
    >
      <div className="rounded-[calc(var(--theme-radius)+8px)] border border-theme-line/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,247,248,0.92))] px-4 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.06)] sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-theme-line bg-white/92 px-3 py-1 font-theme-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-theme-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-theme-accent" />
            兴趣记录
          </span>
          {platforms.length > 0 ? (
            <span className="rounded-full border border-theme-line bg-theme-bg px-3 py-1 font-theme-sans text-[10px] font-medium tracking-[0.12em] text-theme-soft">
              {platforms.join(" / ")}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[1.35rem] font-semibold leading-tight text-theme-ink sm:text-[1.55rem]">最近在玩</h3>
            <p className="mt-1 text-sm leading-6 text-theme-muted">把游戏放回生活里，轻轻记一笔就够了。</p>
          </div>
          <span className="shrink-0 rounded-full border border-theme-line bg-white/88 px-3 py-1 font-theme-sans text-[10px] font-semibold tracking-[0.12em] text-theme-soft">
            {allGames.length} 条
          </span>
        </div>

        {maxItems.length > 0 ? (
          <motion.ul
            variants={containerVariants}
            initial={prefersReducedMotion ? false : "hidden"}
            whileInView={prefersReducedMotion ? undefined : "show"}
            viewport={{ once: true, amount: 0.2 }}
            className={cn(
              "mt-4 space-y-2.5",
              embedded ? "md:max-h-[34rem] md:overflow-y-auto md:pr-1" : "",
            )}
          >
            {maxItems.map((game) => (
              <motion.li key={`${game.status}-${game.id}-${game.title}`} variants={itemVariants}>
                <GameRow game={game} />
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <div className="mt-4 rounded-[var(--theme-radius)] border border-dashed border-theme-line bg-theme-bg/70 px-4 py-6 text-center font-theme-body text-sm text-theme-soft">
            暂时还没有同步到游戏记录。
          </div>
        )}
      </div>
    </section>
  );
}
