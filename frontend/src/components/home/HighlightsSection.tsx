import type { HighlightStage } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type HighlightsSectionProps = {
  stages: HighlightStage[];
};

export function HighlightsSection({ stages }: HighlightsSectionProps) {
  if (stages.length === 0) {
    return (
      <ScrollReveal className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">高光时刻</h2>
          <span className="text-sm text-slate-500">0 个阶段</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-6 text-sm text-slate-600">
          暂无高光数据，请先在后台补充阶段与成就。
        </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">高光时刻</h2>
        <span className="text-sm text-slate-500">{stages.length} 个阶段</span>
      </div>

      <StaggerContainer className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" stagger={0.07}>
        {stages.map((stage, idx) => (
          <StaggerItem key={`${stage.title}-${idx}`}>
            <CardSpotlight className="h-full rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur">
              <h3 className="text-lg font-semibold text-slate-900">{stage.title}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {stage.start_date || ""}
                {stage.end_date ? ` - ${stage.end_date}` : ""}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{stage.description || "持续成长中"}</p>

              <ul className="mt-4 space-y-2">
                {stage.items.slice(0, 4).map((item) => (
                  <li
                    key={`${stage.title}-${item.title}`}
                    className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm text-slate-700"
                  >
                    {item.title}
                  </li>
                ))}
              </ul>
            </CardSpotlight>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </ScrollReveal>
  );
}
