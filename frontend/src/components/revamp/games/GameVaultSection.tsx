import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import type { GameItem } from "../../../api/home";
import { useTheme } from "../../../app/theme";
import { CardSpotlight } from "../../ui/CardSpotlight";
import { BackgroundBeams } from "../../ui/BackgroundBeams";
import { StripeBgGuides } from "../../ui/StripeBgGuides";
import { SectionTitleCard } from "../shared/SectionTitleCard";

type GameVaultSectionProps = {
  games?: GameItem[];
  compact?: boolean;
  showExplorerLink?: boolean;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 160, damping: 20 } },
};

function sortGames(games: GameItem[]) {
  return [...games].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.id - b.id);
}

function sliceForMode(games: GameItem[], compact: boolean) {
  return compact ? games.slice(0, 4) : games;
}

function StatusIcon({ status }: { status: GameItem["status"] }) {
  if (status === "owned") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 12 4.5 4.5 9-9" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 4.5 2.2 4.45 4.92.71-3.56 3.47.84 4.9L12 15.75l-4.4 2.28.84-4.9L4.88 9.66l4.92-.71L12 4.5Z" />
    </svg>
  );
}

function StatusPanel({
  title,
  label,
  description,
  games,
  status,
  accentClassName,
  glowColor,
  emptyCopy,
}: {
  title: string;
  label: string;
  description: string;
  games: GameItem[];
  status: GameItem["status"];
  accentClassName: string;
  glowColor: string;
  emptyCopy: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-[calc(var(--theme-radius)+2px)] border border-theme-line bg-theme-surface/80 p-5 shadow-[var(--theme-shadow-whisper)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-theme-sans text-[10px] uppercase tracking-[0.26em] ${accentClassName}`}>
            <StatusIcon status={status} />
            {label}
          </p>
          <h3 className="mt-3 font-theme-display text-2xl font-semibold text-theme-ink">{title}</h3>
          <p className="mt-2 max-w-lg font-theme-body text-sm leading-6 text-theme-muted">{description}</p>
        </div>
        <div className="rounded-2xl border border-theme-line bg-black/10 px-3 py-2 font-theme-sans text-right text-xs text-theme-soft">
          <div className="uppercase tracking-[0.28em]">Count</div>
          <div className="mt-1 text-2xl font-semibold text-theme-ink tabular-nums">{games.length}</div>
        </div>
      </div>

      {games.length > 0 ? (
        <motion.ul
          variants={containerVariants}
          initial={prefersReducedMotion ? false : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "show"}
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-3"
        >
          {games.map((game, index) => {
            const href = game.info_url || undefined;
            const content = (
              <CardSpotlight
                glowColor={glowColor}
                className="rounded-[var(--theme-radius)] border border-theme-line bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]"
              >
                <div className="relative overflow-hidden rounded-[var(--theme-radius)] px-4 py-4">
                  <div className="absolute right-4 top-4 font-theme-sans text-[10px] uppercase tracking-[0.32em] text-theme-soft">
                    #{String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-black/10 ${accentClassName}`}>
                      <StatusIcon status={game.status} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-theme-display text-lg font-semibold leading-tight text-theme-ink">{game.title}</h4>
                        <span className="rounded-full border border-theme-line px-2 py-0.5 font-theme-sans text-[10px] uppercase tracking-[0.22em] text-theme-soft">
                          {game.platform}
                        </span>
                      </div>
                      {game.english_title ? (
                        <p className="mt-2 font-theme-sans text-xs uppercase tracking-[0.16em] text-theme-soft/90">
                          {game.english_title}
                        </p>
                      ) : null}
                      {game.notes ? (
                        <p className="mt-3 font-theme-body text-sm leading-6 text-theme-muted">{game.notes}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardSpotlight>
            );

            return (
              <motion.li key={`${game.status}-${game.id}-${game.title}`} variants={itemVariants}>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="group block no-underline">
                    {content}
                  </a>
                ) : (
                  <article className="group">{content}</article>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      ) : (
        <div className="rounded-[var(--theme-radius)] border border-dashed border-theme-line bg-theme-bg/40 px-4 py-8 text-center font-theme-sans text-sm text-theme-soft">
          {emptyCopy}
        </div>
      )}
    </div>
  );
}

export function GameVaultSection({ games = [], compact = false, showExplorerLink = false }: GameVaultSectionProps) {
  const { theme } = useTheme();
  const allGames = sortGames(games);
  const wishlist = sliceForMode(allGames.filter((game) => game.status === "wishlist"), compact);
  const owned = sliceForMode(allGames.filter((game) => game.status === "owned"), compact);
  const platforms = Array.from(new Set(allGames.map((game) => game.platform).filter(Boolean)));
  const statusSummary = `${allGames.filter((game) => game.status === "wishlist").length} 想买 / ${allGames.filter((game) => game.status === "owned").length} 已买`;

  return (
    <section id="games" className="space-y-5">
      <SectionTitleCard
        category="Game Protocol"
        title="Switch 游戏库"
        meta={statusSummary}
        tagline="Obsidian checklist 和个人网站共用一份清单。愿望池与已购库分轨展示，保留一点控制台气质。"
      />

      <div className="relative overflow-hidden rounded-[calc(var(--theme-radius)+6px)] border border-theme-line-strong bg-theme-surface shadow-[var(--theme-shadow-lifted)]">
        <BackgroundBeams
          className="opacity-60"
          colors={theme === "operator" ? ["#7dffda", "#58d8ff", "#ff9f43"] : ["#c96442", "#90b4ce", "#8fbc8f"]}
        />
        <StripeBgGuides
          animated
          animationDelay={0.25}
          animationDuration={28}
          className="opacity-55"
          columnCount={5}
          contained
          darkMode={theme === "operator"}
          direction="both"
          glowColor={theme === "operator" ? "rgba(125, 255, 218, 0.42)" : "rgba(201, 100, 66, 0.22)"}
          glowOpacity={0.4}
          glowSize="22vh"
          maxActiveColumns={2}
          minColumnWidth="6rem"
          randomInterval={7600}
          responsive
        />
        <div className="relative z-10 grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:px-7 md:py-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-theme-line-strong bg-black/10 px-3 py-1 font-theme-sans text-[10px] uppercase tracking-[0.26em] text-theme-soft">
              <span className="inline-flex h-2 w-2 rounded-full bg-theme-accent" />
              Obsidian Sync Online
            </div>
            <h3 className="mt-4 max-w-2xl font-theme-display text-3xl font-semibold leading-tight text-theme-ink md:text-4xl">
              把想买和已买拆成两条流，让游戏收藏也像一个清晰的数据面板。
            </h3>
            <p className="mt-4 max-w-2xl font-theme-body text-sm leading-7 text-theme-muted md:text-[15px]">
              当前以 {platforms.join(" / ") || "Switch"} 为主，主页显示摘要，完整清单走独立页面；后续在 Obsidian 改动后，结构化同步会直接推回站点。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            {[
              { label: "Wishlist", value: allGames.filter((game) => game.status === "wishlist").length, tone: "text-[#ffb15f]" },
              { label: "Owned", value: allGames.filter((game) => game.status === "owned").length, tone: "text-[#7dffda]" },
              { label: "Platforms", value: platforms.length || 1, tone: "text-[#58d8ff]" },
            ].map((item) => (
              <div key={item.label} className="rounded-[var(--theme-radius)] border border-theme-line bg-black/10 px-4 py-4 backdrop-blur-sm">
                <div className="font-theme-sans text-[10px] uppercase tracking-[0.28em] text-theme-soft">{item.label}</div>
                <div className={`mt-2 font-theme-display text-3xl font-semibold tabular-nums ${item.tone}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <StatusPanel
          title="想买清单"
          label="Wishlist Queue"
          description="还没入手，但已经进入待执行列表的目标。"
          games={wishlist}
          status="wishlist"
          accentClassName="border-[#ff9f43]/40 text-[#ffb15f]"
          glowColor="255, 159, 67"
          emptyCopy="暂时没有待购游戏。"
        />
        <StatusPanel
          title="已买清单"
          label="Owned Stack"
          description="已经进库的游戏，用更稳的视觉语言单独标出来。"
          games={owned}
          status="owned"
          accentClassName="border-[#7dffda]/40 text-[#7dffda]"
          glowColor="125, 255, 218"
          emptyCopy="暂时还没有已购游戏。"
        />
      </div>

      {showExplorerLink ? (
        <div className="flex justify-end">
          <Link
            to="/games"
            className="inline-flex items-center gap-2 rounded-full border border-theme-line-strong bg-theme-surface-raised px-4 py-2 font-theme-sans text-xs uppercase tracking-[0.24em] text-theme-ink no-underline shadow-[var(--theme-shadow-whisper)] hover:border-theme-accent/60 hover:text-theme-accent"
          >
            打开完整游戏页
            <span aria-hidden="true">/&gt;</span>
          </Link>
        </div>
      ) : null}
    </section>
  );
}
