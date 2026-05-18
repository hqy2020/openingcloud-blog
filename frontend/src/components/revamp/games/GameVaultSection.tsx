import { motion, useReducedMotion } from "motion/react";
import type { GameItem } from "../../../api/home";
import { useTheme } from "../../../app/theme";
import { cn } from "../../../lib/utils";
import { CardSpotlight } from "../../ui/CardSpotlight";
import { BackgroundBeams } from "../../ui/BackgroundBeams";
import { StripeBgGuides } from "../../ui/StripeBgGuides";
import { SectionTitleCard } from "../shared/SectionTitleCard";

type GameVaultSectionProps = {
  games?: GameItem[];
  compact?: boolean;
  embedded?: boolean;
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
  embedded = false,
}: {
  title: string;
  label: string;
  description: string;
  games: GameItem[];
  status: GameItem["status"];
  accentClassName: string;
  glowColor: string;
  emptyCopy: string;
  embedded?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-theme-line bg-theme-surface/80 shadow-[var(--theme-shadow-whisper)]",
        embedded ? "rounded-[var(--theme-radius)] p-4" : "rounded-[calc(var(--theme-radius)+2px)] p-5",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className={cn("flex items-start justify-between gap-4", embedded ? "mb-4" : "mb-5")}>
        <div>
          <p
            className={cn(
              "inline-flex items-center gap-2 rounded-full border font-theme-sans uppercase tracking-[0.26em]",
              embedded ? "px-2.5 py-1 text-[9px]" : "px-3 py-1 text-[10px]",
              accentClassName,
            )}
          >
            <StatusIcon status={status} />
            {label}
          </p>
          <h3 className={cn("mt-3 font-theme-display font-semibold text-theme-ink", embedded ? "text-xl" : "text-2xl")}>
            {title}
          </h3>
          <p
            className={cn(
              "mt-2 max-w-lg font-theme-body text-theme-muted",
              embedded ? "text-[13px] leading-5" : "text-sm leading-6",
            )}
          >
            {description}
          </p>
        </div>
        <div
          className={cn(
            "border border-theme-line bg-black/10 font-theme-sans text-right text-theme-soft",
            embedded ? "rounded-xl px-2.5 py-2 text-[11px]" : "rounded-2xl px-3 py-2 text-xs",
          )}
        >
          <div className="uppercase tracking-[0.28em]">Count</div>
          <div className={cn("mt-1 font-semibold text-theme-ink tabular-nums", embedded ? "text-xl" : "text-2xl")}>
            {games.length}
          </div>
        </div>
      </div>

      {games.length > 0 ? (
        <motion.ul
          variants={containerVariants}
          initial={prefersReducedMotion ? false : "hidden"}
          whileInView={prefersReducedMotion ? undefined : "show"}
          viewport={{ once: true, amount: 0.15 }}
          className={cn("grid", embedded ? "gap-2.5" : "gap-3")}
        >
          {games.map((game, index) => {
            const href = game.info_url || undefined;
            const content = (
              <CardSpotlight
                glowColor={glowColor}
                className="rounded-[var(--theme-radius)] border border-theme-line bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]"
              >
                <div
                  className={cn(
                    "relative overflow-hidden rounded-[var(--theme-radius)]",
                    embedded ? "px-3.5 py-3" : "px-4 py-4",
                  )}
                >
                  <div
                    className={cn(
                      "absolute font-theme-sans uppercase tracking-[0.32em] text-theme-soft",
                      embedded ? "right-3 top-3 text-[9px]" : "right-4 top-4 text-[10px]",
                    )}
                  >
                    #{String(index + 1).padStart(2, "0")}
                  </div>
                  <div className={cn("flex items-start", embedded ? "gap-2.5" : "gap-3")}>
                    <div
                      className={cn(
                        "mt-0.5 inline-flex items-center justify-center border bg-black/10",
                        embedded ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-2xl",
                        accentClassName,
                      )}
                    >
                      <StatusIcon status={game.status} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={cn(
                            "font-theme-display font-semibold leading-tight text-theme-ink",
                            embedded ? "text-base" : "text-lg",
                          )}
                        >
                          {game.title}
                        </h4>
                        <span
                          className={cn(
                            "rounded-full border border-theme-line font-theme-sans uppercase tracking-[0.22em] text-theme-soft",
                            embedded ? "px-2 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
                          )}
                        >
                          {game.platform}
                        </span>
                      </div>
                      {game.english_title ? (
                        <p
                          className={cn(
                            "mt-1.5 font-theme-sans uppercase tracking-[0.16em] text-theme-soft/90",
                            embedded ? "text-[10px]" : "text-xs",
                          )}
                        >
                          {game.english_title}
                        </p>
                      ) : null}
                      {game.notes ? (
                        <p
                          className={cn(
                            "font-theme-body text-theme-muted",
                            embedded ? "mt-2 text-[13px] leading-5" : "mt-3 text-sm leading-6",
                          )}
                        >
                          {game.notes}
                        </p>
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

export function GameVaultSection({
  games = [],
  compact = false,
  embedded = false,
}: GameVaultSectionProps) {
  const { theme } = useTheme();
  const isCompact = compact || embedded;
  const allGames = sortGames(games);
  const wishlist = sliceForMode(allGames.filter((game) => game.status === "wishlist"), isCompact);
  const owned = sliceForMode(allGames.filter((game) => game.status === "owned"), isCompact);
  const platforms = Array.from(new Set(allGames.map((game) => game.platform).filter(Boolean)));
  const statusSummary = `${allGames.filter((game) => game.status === "wishlist").length} 想买 / ${allGames.filter((game) => game.status === "owned").length} 已买`;
  const sectionCategory = embedded ? "Life x Game" : "Game Protocol";
  const sectionTitle = embedded ? "生活里的游戏" : "Switch 游戏库";
  const sectionTagline = embedded
    ? "游戏不再单独漂出去做一页，而是回到时间轴下面，和旅行、照片、愿望一起构成生活偏好的另一条切片。"
    : "Obsidian checklist 和个人网站共用一份清单。愿望池与已购库分轨展示，保留一点控制台气质。";
  const heroBadge = embedded ? "Timeline Embedded" : "Obsidian Sync Online";
  const heroTitle = embedded
    ? "想买与已入手，作为时间轴下面的一段轻量兴趣记录。"
    : "把想买和已买拆成两条流，让游戏收藏也像一个清晰的数据面板。";
  const heroCopy = embedded
    ? `当前以 ${platforms.join(" / ") || "Switch"} 为主。它和阅读、出行、写作一样，只需要安静地挂在生活叙事里，而不是再抢一个主视觉中心。`
    : `当前以 ${platforms.join(" / ") || "Switch"} 为主，主页显示摘要，完整清单走独立页面；后续在 Obsidian 改动后，结构化同步会直接推回站点。`;

  return (
    <section id="games" className={cn("scroll-mt-28", embedded ? "space-y-4" : "space-y-5")}>
      {!embedded ? (
        <SectionTitleCard
          category={sectionCategory}
          title={sectionTitle}
          meta={statusSummary}
          tagline={sectionTagline}
        />
      ) : null}

      <div
        className={cn(
          "relative overflow-hidden border",
          embedded
            ? "rounded-[calc(var(--theme-radius)+4px)] border-theme-line/90 bg-[linear-gradient(135deg,rgba(255,248,242,0.94),rgba(255,255,255,0.9))] shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
            : "rounded-[calc(var(--theme-radius)+10px)] border-theme-line-strong bg-theme-surface shadow-[var(--theme-shadow-lifted)]",
        )}
      >
        <BackgroundBeams
          className={embedded ? "opacity-20" : "opacity-60"}
          colors={theme === "operator" ? ["#7dffda", "#58d8ff", "#ff9f43"] : ["#c96442", "#90b4ce", "#8fbc8f"]}
        />
        <StripeBgGuides
          animated
          animationDelay={0.25}
          animationDuration={28}
          className={embedded ? "opacity-20" : "opacity-55"}
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
        <div
          className={cn(
            "relative z-10 grid",
            embedded
              ? "gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.52fr)] md:px-5 md:py-4.5"
              : "gap-4 px-5 py-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:px-7 md:py-6",
          )}
        >
          <div>
            {embedded ? (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-theme-line bg-white/75 px-3 py-1 font-theme-sans text-[9px] font-semibold uppercase tracking-[0.28em] text-theme-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-theme-accent" />
                  {sectionCategory}
                </span>
                <span className="inline-flex rounded-full border border-theme-line/80 bg-black/5 px-3 py-1 font-theme-sans text-[9px] font-semibold uppercase tracking-[0.24em] text-theme-soft">
                  {statusSummary}
                </span>
              </div>
            ) : null}

            <div
              className={cn(
                "inline-flex items-center gap-2 border bg-black/10 font-theme-sans uppercase tracking-[0.26em] text-theme-soft",
                embedded
                  ? "rounded-full border-theme-line px-2.5 py-1 text-[9px]"
                  : "rounded-full border-theme-line-strong px-3 py-1 text-[10px]",
              )}
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-theme-accent" />
              {heroBadge}
            </div>
            <h3
              className={cn(
                "max-w-2xl font-theme-display font-semibold leading-tight text-theme-ink",
                embedded ? "mt-3 text-xl md:text-[1.75rem]" : "mt-4 text-3xl md:text-4xl",
              )}
            >
              {heroTitle}
            </h3>
            {embedded ? (
              <>
                <p className="mt-2 max-w-2xl font-theme-body text-[13px] leading-6 text-theme-muted">{sectionTagline}</p>
                <p className="mt-2 max-w-2xl font-theme-body text-[13px] leading-6 text-theme-muted/90">{heroCopy}</p>
              </>
            ) : (
              <p className="mt-4 max-w-2xl font-theme-body text-sm leading-7 text-theme-muted md:text-[15px]">{heroCopy}</p>
            )}
          </div>
          <div className={cn("grid", embedded ? "grid-cols-3 gap-2 self-start md:grid-cols-3" : "gap-3 sm:grid-cols-3 md:grid-cols-1")}>
            {[
              { label: "Wishlist", value: allGames.filter((game) => game.status === "wishlist").length, tone: "text-[#ffb15f]" },
              { label: "Owned", value: allGames.filter((game) => game.status === "owned").length, tone: "text-[#7dffda]" },
              { label: "Platforms", value: platforms.length || 1, tone: "text-[#58d8ff]" },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-[var(--theme-radius)] border border-theme-line bg-black/10 backdrop-blur-sm",
                  embedded ? "px-3 py-2.5" : "px-4 py-4",
                )}
              >
                <div className={cn("font-theme-sans uppercase tracking-[0.28em] text-theme-soft", embedded ? "text-[9px]" : "text-[10px]")}>
                  {item.label}
                </div>
                <div className={cn("mt-1.5 font-theme-display font-semibold tabular-nums", embedded ? `text-xl ${item.tone}` : `text-3xl ${item.tone}`)}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cn("grid xl:grid-cols-2", embedded ? "gap-4" : "gap-6")}>
        <StatusPanel
          title="想买清单"
          label="Wishlist Queue"
          description="还没入手，但已经进入待执行列表的目标。"
          games={wishlist}
          status="wishlist"
          accentClassName="border-[#ff9f43]/40 text-[#ffb15f]"
          glowColor="255, 159, 67"
          emptyCopy="暂时没有待购游戏。"
          embedded={embedded}
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
          embedded={embedded}
        />
      </div>
    </section>
  );
}
