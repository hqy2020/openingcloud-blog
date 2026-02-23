import type { TimelineNode } from "../../api/home";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useMemo, useRef } from "react";
import { cn } from "../../lib/utils";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";
import { SparklesText } from "../ui/SparklesText";

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
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
        dot: "bg-blue-500",
        isDiamond: false,
        glowColor: "92, 138, 249",
      };
    case "health":
      return {
        label: "健康",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
        dot: "bg-amber-500",
        isDiamond: false,
        glowColor: "213, 160, 76",
      };
    case "learning":
      return {
        label: "求学",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
        dot: "bg-emerald-500",
        isDiamond: false,
        glowColor: "84, 171, 138",
      };
    case "family":
      return {
        label: "家庭",
        badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
        dot: "bg-violet-500",
        isDiamond: false,
        glowColor: "166, 111, 217",
      };
    case "reflection":
      return {
        label: "沉淀",
        badge: "bg-slate-200 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200",
        dot: "bg-slate-500",
        isDiamond: true,
        glowColor: "148, 163, 184",
      };
    default:
      return {
        label: type,
        badge: "bg-slate-100 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200",
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
      className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
    };
  }
  if (impact === "medium") {
    return {
      label: "持续推进",
      className: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    };
  }
  return {
    label: "阶段沉淀",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300",
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
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-200">
            <SparklesText className="text-inherit" sparklesCount={8} colors={{ first: "#0ea5e9", second: "#a855f7" }}>
              人生足迹
            </SparklesText>
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">0 个节点</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/84 dark:text-slate-300">
          暂无时间线数据，请先在后台补充人生节点。
        </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-200">
          <SparklesText className="text-inherit" sparklesCount={8} colors={{ first: "#0ea5e9", second: "#a855f7" }}>
            人生足迹
          </SparklesText>
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">{nodes.length} 个节点</span>
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
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      {formatYear(node)}
                    </span>
                    <span className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{formatAnchor(node)}</span>
                  </div>

                  <div className="relative flex justify-center pt-1">
                    <span
                      className={cn(
                        "relative mt-1 flex h-4 w-4 items-center justify-center rounded-full border bg-white shadow-sm transition-colors dark:bg-slate-950",
                        isHighlighted
                          ? "border-indigo-300 shadow-[0_0_0_4px_rgba(79,106,229,0.16)] dark:border-indigo-400/80 dark:shadow-[0_0_0_4px_rgba(79,106,229,0.25)]"
                          : "border-slate-300 dark:border-slate-600",
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
                        "rounded-2xl border p-5 backdrop-blur transition-shadow duration-300",
                        isHighlighted
                          ? "border-indigo-200/85 bg-white/92 shadow-[0_18px_42px_rgba(79,106,229,0.16)] ring-1 ring-indigo-100/85 dark:border-indigo-500/65 dark:bg-slate-900/88 dark:shadow-[0_16px_38px_rgba(2,6,23,0.55)] dark:ring-indigo-500/35"
                          : "border-slate-200/82 bg-white/88 shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-slate-700/82 dark:bg-slate-900/86 dark:shadow-[0_14px_34px_rgba(2,6,23,0.48)]",
                      )}
                      glowColor={typeMeta.glowColor}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", typeMeta.badge)}>{typeMeta.label}</span>
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", impactMeta.className)}>
                          {impactMeta.label}
                        </span>
                        {node.phase ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/70 dark:text-slate-200">
                            {node.phase}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-200">{node.title}</h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatPeriod(node)}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 md:hidden">
                        {formatAnchor(node)}
                      </p>
                      {node.description ? (
                        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{node.description}</p>
                      ) : (
                        <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">这段旅程暂无补充描述。</p>
                      )}

                      {node.tags.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {node.tags.slice(0, 4).map((tag) => (
                            <span
                              key={`${node.title}-${tag}`}
                              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400"
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
