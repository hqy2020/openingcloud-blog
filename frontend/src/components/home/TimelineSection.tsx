import type { TimelineNode } from "../../api/home";
import { FadeIn } from "../motion/FadeIn";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type TimelineSectionProps = {
  nodes: TimelineNode[];
};

function typeBadge(type: TimelineNode["type"]) {
  switch (type) {
    case "career":
      return { label: "职业", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500", isDiamond: false };
    case "health":
      return { label: "健康", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", isDiamond: false };
    case "learning":
      return { label: "求学", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", isDiamond: false };
    case "family":
      return { label: "家庭", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500", isDiamond: false };
    case "reflection":
      return { label: "沉淀", badge: "bg-slate-200 text-slate-700", dot: "bg-slate-500", isDiamond: true };
    default:
      return { label: type, badge: "bg-slate-100 text-slate-700", dot: "bg-slate-500", isDiamond: false };
  }
}

function formatPeriod(node: TimelineNode) {
  if (!node.end_date) {
    return node.start_date;
  }
  return `${node.start_date} - ${node.end_date}`;
}

export function TimelineSection({ nodes }: TimelineSectionProps) {
  if (nodes.length === 0) {
    return (
      <ScrollReveal className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">人生足迹</h2>
          <span className="text-sm text-slate-500">0 个节点</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-6 text-sm text-slate-600">
          暂无时间线数据，请先在后台补充人生节点。
        </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">人生足迹</h2>
        <span className="text-sm text-slate-500">{nodes.length} 个节点</span>
      </div>

      <div className="relative overflow-x-auto pb-4">
        <FadeIn className="absolute left-0 top-9 h-[2px] min-w-full bg-gradient-to-r from-[#4F6AE5]/45 via-[#9684A8]/40 to-[#B8945E]/35" />

        <StaggerContainer className="flex min-w-max items-start gap-5" stagger={0.06}>
          {nodes.map((node, idx) => {
            const typeMeta = typeBadge(node.type);
            const isHighlighted = node.impact === "high";

            return (
              <StaggerItem key={`${node.title}-${node.start_date}-${idx}`} className="w-72">
                <CardSpotlight
                  className={[
                    "relative overflow-hidden rounded-2xl border bg-white/90 p-5 backdrop-blur",
                    isHighlighted
                      ? "border-indigo-300/90 shadow-[0_14px_40px_rgba(79,106,229,0.2)] ring-1 ring-indigo-200/80"
                      : "border-slate-200/80 shadow-[0_12px_32px_rgba(15,23,42,0.08)]",
                  ].join(" ")}
                >
                  {isHighlighted ? (
                    <span className="pointer-events-none absolute inset-x-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300" />
                  ) : null}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "inline-block h-2.5 w-2.5",
                          typeMeta.isDiamond ? "rotate-45 rounded-[2px]" : "rounded-full",
                          typeMeta.dot,
                        ].join(" ")}
                      />
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${typeMeta.badge}`}>{typeMeta.label}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{node.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{formatPeriod(node)}</p>
                  {node.description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">{node.description}</p>
                  ) : null}
                </CardSpotlight>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </ScrollReveal>
  );
}
