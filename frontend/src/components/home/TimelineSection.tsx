import type { TimelineNode } from "../../api/home";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useMemo, useRef } from "react";
import { cn } from "../../lib/utils";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type TimelineSectionProps = {
  nodes: TimelineNode[];
};

type TimelineTypeMeta = {
  label: string;
  badge: string;
  dot: string;
  isDiamond: boolean;
  glowColor: string;
};

function typeBadge(type: TimelineNode["type"]): TimelineTypeMeta {
  switch (type) {
    case "career":
      return {
        label: "职业",
        badge: "bg-theme-surface-raised text-theme-accent-soft dark:bg-theme-ink/20 dark:text-theme-accent-soft",
        dot: "bg-theme-ink",
        isDiamond: false,
        glowColor: "92, 138, 249",
      };
    case "health":
      return {
        label: "健康",
        badge: "bg-theme-surface-raised text-theme-accent dark:bg-theme-surface-raised dark:text-theme-accent",
        dot: "bg-theme-surface-raised",
        isDiamond: false,
        glowColor: "213, 160, 76",
      };
    case "learning":
      return {
        label: "求学",
        badge: "bg-theme-surface-raised text-theme-muted dark:bg-theme-surface-raised dark:text-theme-muted",
        dot: "bg-theme-surface-raised",
        isDiamond: false,
        glowColor: "84, 171, 138",
      };
    case "family":
      return {
        label: "家庭",
        badge: "bg-theme-surface-raised text-theme-muted dark:bg-theme-surface-raised dark:text-theme-muted",
        dot: "bg-theme-surface-raised",
        isDiamond: false,
        glowColor: "166, 111, 217",
      };
    case "reflection":
      return {
        label: "沉淀",
        badge: "bg-theme-surface-raised text-theme-ink dark:bg-theme-ink dark:text-theme-soft",
        dot: "bg-theme-muted",
        isDiamond: true,
        glowColor: "148, 163, 184",
      };
    default:
      return {
        label: type,
        badge: "bg-theme-surface text-theme-ink dark:bg-theme-ink dark:text-theme-soft",
        dot: "bg-theme-muted",
        isDiamond: false,
        glowColor: "148, 163, 184",
      };
  }
}

function formatPeriod(node: TimelineNode) {
  if (!node.end_date) {
    return `${node.start_date} - 至今`;
  }
  return `${node.start_date} - ${node.end_date}`;
}

function formatAnchor(node: TimelineNode) {
  const [year = "", month = ""] = node.start_date.split("-");
  if (!year) {
    return node.start_date;
  }
  if (!month) {
    return year;
  }
  return `${year}.${month}`;
}

function formatYear(node: TimelineNode) {
  const [year = ""] = node.start_date.split("-");
  return year || node.start_date;
}

function impactBadge(impact: TimelineNode["impact"]) {
  if (impact === "high") {
    return {
      label: "关键节点",
      className: "bg-theme-accent text-theme-bg dark:bg-theme-accent dark:text-theme-bg",
    };
  }
  if (impact === "medium") {
    return {
      label: "持续推进",
      className: "bg-theme-surface-raised text-theme-muted dark:bg-theme-surface-raised dark:text-theme-muted",
    };
  }
  return {
    label: "阶段沉淀",
    className: "bg-theme-line text-theme-muted dark:bg-theme-ink dark:text-theme-soft",
  };
}

export function TimelineSection({ nodes }: TimelineSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);
  const orderedNodes = useMemo(
    () =>
      [...nodes].sort((left, right) => {
        if (left.start_date !== right.start_date) {
          return left.start_date.localeCompare(right.start_date);
        }
        if (left.sort_order !== right.sort_order) {
          return left.sort_order - right.sort_order;
        }
        return left.title.localeCompare(right.title);
      }),
    [nodes],
  );

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 60%", "end 82%"],
  });
  const progressScale = useSpring(scrollYProgress, {
    stiffness: 190,
    damping: 30,
    mass: 0.35,
  });
  const progressOpacity = useTransform(scrollYProgress, [0, 0.08], [0.25, 1]);

  if (nodes.length === 0) {
    return (
      <ScrollReveal className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-theme-ink dark:text-theme-soft">人生足迹</h2>
        </div>
        <div className="rounded-2xl border border-theme-line bg-theme-surface px-5 py-6 text-sm text-theme-muted dark:border-theme-ink dark:bg-theme-ink dark:text-theme-soft">
          暂无时间线数据，请先在后台补充人生节点。
        </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal className="space-y-6">
      <div>
          <h2 className="text-2xl font-semibold text-theme-ink dark:text-theme-soft">人生足迹</h2>
      </div>

      <div ref={timelineRef} className="relative">
        <div className="pointer-events-none absolute left-[1.125rem] top-8 h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-gradient-to-b from-theme-line-strong via-theme-line to-theme-line-strong dark:from-theme-ink dark:via-theme-ink dark:to-theme-ink md:left-[12.125rem]" />
        {prefersReducedMotion ? (
          <div className="pointer-events-none absolute left-[1.125rem] top-8 h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-gradient-to-b from-[#4F6AE5]/95 via-[#6B917B]/80 to-[#B8945E]/92 md:left-[12.125rem]" />
        ) : (
          <motion.div
            className="pointer-events-none absolute left-[1.125rem] top-8 h-[calc(100%-4rem)] w-px -translate-x-1/2 origin-top bg-gradient-to-b from-[#4F6AE5]/95 via-[#6B917B]/80 to-[#B8945E]/92 md:left-[12.125rem]"
            style={{ scaleY: progressScale, opacity: progressOpacity }}
          />
        )}

        <StaggerContainer className="space-y-1" stagger={0.08}>
          {orderedNodes.map((node, idx) => {
            const typeMeta = typeBadge(node.type);
            const impactMeta = impactBadge(node.impact);
            const isHighlighted = node.impact === "high";

            return (
              <StaggerItem key={`${node.title}-${node.start_date}-${idx}`}>
                <article className="grid grid-cols-[2.25rem_minmax(0,1fr)] py-5 md:grid-cols-[11rem_2.25rem_minmax(0,1fr)]">
                  <div className="hidden md:flex md:sticky md:top-24 md:self-start md:flex-col md:items-end md:pr-4 md:pt-1">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-theme-soft dark:text-theme-soft">
                      {formatYear(node)}
                    </span>
                    <span className="mt-1 text-sm font-semibold text-theme-ink dark:text-theme-soft">{formatAnchor(node)}</span>
                  </div>

                  <div className="relative flex justify-center pt-1">
                    <span
                      className={cn(
                        "relative mt-1 flex h-4 w-4 items-center justify-center rounded-full border bg-theme-surface-raised shadow-sm transition-colors dark:bg-theme-ink",
                        isHighlighted
                          ? "border-theme-line-strong shadow-[0_0_0_4px_rgba(79,106,229,0.16)] dark:border-theme-line-strong dark:shadow-[0_0_0_4px_rgba(79,106,229,0.25)]"
                          : "border-theme-line-strong dark:border-theme-ink",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5",
                          typeMeta.isDiamond ? "rotate-45 rounded-[2px]" : "rounded-full",
                          typeMeta.dot,
                        )}
                      />
                    </span>
                  </div>

                  <div className="pl-2 md:pl-4">
                    <CardSpotlight
                      className={cn(
                        "rounded-2xl border p-5 transition-shadow duration-300",
                        isHighlighted
                          ? "border-theme-line-strong bg-theme-surface shadow-[var(--theme-shadow-lifted)] ring-1 ring-indigo-100/85 dark:border-theme-line-strong dark:bg-theme-ink dark:shadow-[var(--theme-shadow-lifted)] dark:ring-indigo-500/35"
                          : "border-theme-line/82 bg-theme-surface shadow-[var(--theme-shadow-whisper)] dark:border-theme-ink dark:bg-theme-ink dark:shadow-[var(--theme-shadow-lifted)]",
                      )}
                      glowColor={typeMeta.glowColor}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", typeMeta.badge)}>{typeMeta.label}</span>
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", impactMeta.className)}>
                          {impactMeta.label}
                        </span>
                        {node.phase ? (
                          <span className="rounded-full bg-theme-surface px-2.5 py-1 text-xs font-medium text-theme-muted dark:bg-theme-ink dark:text-theme-soft">
                            {node.phase}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-theme-ink dark:text-theme-soft">{node.title}</h3>
                      <p className="mt-1 text-xs text-theme-muted dark:text-theme-soft">{formatPeriod(node)}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-theme-soft dark:text-theme-soft md:hidden">
                        {formatAnchor(node)}
                      </p>
                      {node.description ? (
                        <p className="mt-3 text-sm leading-6 text-theme-ink dark:text-theme-soft">{node.description}</p>
                      ) : null}

                      {node.tags.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {node.tags.slice(0, 4).map((tag) => (
                            <span
                              key={`${node.title}-${tag}`}
                              className="rounded-md border border-theme-line bg-theme-surface px-2 py-1 text-[11px] text-theme-muted dark:border-theme-ink dark:bg-theme-ink dark:text-theme-soft"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </CardSpotlight>
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </ScrollReveal>
  );
}
