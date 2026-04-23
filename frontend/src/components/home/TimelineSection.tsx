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
        badge: "bg-claude-warm-sand text-claude-coral dark:bg-claude-near-black/20 dark:text-claude-coral",
        dot: "bg-claude-near-black",
        isDiamond: false,
        glowColor: "92, 138, 249",
      };
    case "health":
      return {
        label: "健康",
        badge: "bg-claude-warm-sand text-claude-terracotta dark:bg-claude-warm-sand dark:text-claude-terracotta",
        dot: "bg-claude-warm-sand",
        isDiamond: false,
        glowColor: "213, 160, 76",
      };
    case "learning":
      return {
        label: "求学",
        badge: "bg-claude-warm-sand text-claude-olive-gray dark:bg-claude-warm-sand dark:text-claude-olive-gray",
        dot: "bg-claude-warm-sand",
        isDiamond: false,
        glowColor: "84, 171, 138",
      };
    case "family":
      return {
        label: "家庭",
        badge: "bg-claude-warm-sand text-claude-charcoal-warm dark:bg-claude-warm-sand dark:text-claude-charcoal-warm",
        dot: "bg-claude-warm-sand",
        isDiamond: false,
        glowColor: "166, 111, 217",
      };
    case "reflection":
      return {
        label: "沉淀",
        badge: "bg-slate-200 text-slate-700 dark:bg-claude-dark-surface dark:text-claude-warm-silver",
        dot: "bg-slate-500",
        isDiamond: true,
        glowColor: "148, 163, 184",
      };
    default:
      return {
        label: type,
        badge: "bg-slate-100 text-slate-700 dark:bg-claude-dark-surface dark:text-claude-warm-silver",
        dot: "bg-slate-500",
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
      className: "bg-claude-dark-surface text-claude-charcoal-warm dark:bg-claude-dark-surface/20 dark:text-claude-charcoal-warm",
    };
  }
  if (impact === "medium") {
    return {
      label: "持续推进",
      className: "bg-claude-warm-sand text-claude-coral dark:bg-claude-warm-sand dark:text-claude-coral",
    };
  }
  return {
    label: "阶段沉淀",
    className: "bg-slate-100 text-slate-600 dark:bg-claude-dark-surface dark:text-claude-warm-silver",
  };
}

export function TimelineSection({ nodes }: TimelineSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);
  const orderedNodes = useMemo(
    () =>
      [...nodes].sort((left, right) => {
        if (left.sort_order !== right.sort_order) {
          return left.sort_order - right.sort_order;
        }
        if (left.start_date !== right.start_date) {
          return left.start_date.localeCompare(right.start_date);
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
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-claude-warm-silver">人生足迹</h2>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-claude-ivory px-5 py-6 text-sm text-slate-600 dark:border-claude-dark-surface dark:bg-claude-dark-surface dark:text-claude-warm-silver">
          暂无时间线数据，请先在后台补充人生节点。
        </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal className="space-y-6">
      <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-claude-warm-silver">人生足迹</h2>
      </div>

      <div ref={timelineRef} className="relative">
        <div className="pointer-events-none absolute left-[1.125rem] top-8 h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-gradient-to-b from-slate-300/70 via-slate-200/50 to-slate-300/70 dark:from-slate-700/75 dark:via-slate-700/30 dark:to-slate-700/75 md:left-[12.125rem]" />
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
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-claude-warm-silver">
                      {formatYear(node)}
                    </span>
                    <span className="mt-1 text-sm font-semibold text-slate-700 dark:text-claude-warm-silver">{formatAnchor(node)}</span>
                  </div>

                  <div className="relative flex justify-center pt-1">
                    <span
                      className={cn(
                        "relative mt-1 flex h-4 w-4 items-center justify-center rounded-full border bg-white shadow-sm transition-colors dark:bg-slate-950",
                        isHighlighted
                          ? "border-claude-border-warm shadow-[0_0_0_4px_rgba(79,106,229,0.16)] dark:border-claude-border-warm dark:shadow-[0_0_0_4px_rgba(79,106,229,0.25)]"
                          : "border-slate-300 dark:border-claude-dark-surface",
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
                          ? "border-claude-border-warm bg-claude-ivory shadow-whisper-lg ring-1 ring-indigo-100/85 dark:border-claude-border-warm dark:bg-claude-dark-surface dark:shadow-whisper-lg dark:ring-indigo-500/35"
                          : "border-slate-200/82 bg-claude-ivory shadow-whisper dark:border-claude-dark-surface dark:bg-claude-dark-surface dark:shadow-whisper-lg",
                      )}
                      glowColor={typeMeta.glowColor}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", typeMeta.badge)}>{typeMeta.label}</span>
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", impactMeta.className)}>
                          {impactMeta.label}
                        </span>
                        {node.phase ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-claude-dark-surface dark:text-claude-warm-silver">
                            {node.phase}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-claude-warm-silver">{node.title}</h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-claude-warm-silver">{formatPeriod(node)}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-claude-warm-silver md:hidden">
                        {formatAnchor(node)}
                      </p>
                      {node.description ? (
                        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-claude-warm-silver">{node.description}</p>
                      ) : null}

                      {node.tags.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {node.tags.slice(0, 4).map((tag) => (
                            <span
                              key={`${node.title}-${tag}`}
                              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-500 dark:border-claude-dark-surface dark:bg-claude-dark-surface dark:text-claude-warm-silver"
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
