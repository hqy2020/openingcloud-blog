import type { HighlightStage } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type HighlightsSectionProps = {
  stages: HighlightStage[];
};

type HighlightTheme = {
  cardClass: string;
  itemClass: string;
  dateClass: string;
  summaryClass: string;
  glowColor: string;
};

const HIGHLIGHT_THEMES: HighlightTheme[] = [
  {
    cardClass: "border-slate-200/80 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ring-1 ring-sky-100/70",
    itemClass: "border-slate-200/80 bg-slate-50/70 text-slate-700 dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-slate-200",
    dateClass: "text-slate-500",
    summaryClass: "text-slate-700",
    glowColor: "125, 170, 230",
  },
  {
    cardClass: "border-slate-200/80 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ring-1 ring-blue-100/70",
    itemClass: "border-slate-200/80 bg-slate-50/70 text-slate-700 dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-slate-200",
    dateClass: "text-slate-500",
    summaryClass: "text-slate-700",
    glowColor: "129, 161, 223",
  },
  {
    cardClass: "border-slate-200/80 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ring-1 ring-indigo-100/70",
    itemClass: "border-slate-200/80 bg-slate-50/70 text-slate-700 dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-slate-200",
    dateClass: "text-slate-500",
    summaryClass: "text-slate-700",
    glowColor: "147, 150, 196",
  },
  {
    cardClass: "border-slate-200/80 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70",
    itemClass: "border-slate-200/80 bg-slate-50/70 text-slate-700 dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-slate-200",
    dateClass: "text-slate-600",
    summaryClass: "text-slate-700",
    glowColor: "148, 163, 184",
  },
  {
    cardClass: "border-slate-200/80 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ring-1 ring-stone-100/70",
    itemClass: "border-slate-200/80 bg-slate-50/70 text-slate-700 dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-slate-200",
    dateClass: "text-slate-500",
    summaryClass: "text-slate-700",
    glowColor: "171, 153, 128",
  },
  {
    cardClass: "border-slate-200/80 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ring-1 ring-amber-100/80",
    itemClass: "border-slate-200/80 bg-slate-50/70 text-slate-700 dark:border-slate-600/80 dark:bg-slate-800/90 dark:text-slate-200",
    dateClass: "text-slate-500",
    summaryClass: "text-slate-700",
    glowColor: "195, 161, 110",
  },
];

const PLACEHOLDER_STAGE_SUMMARIES = new Set(["持续成长中", "成长中", "持续进步中", "持续探索中", "继续成长中", "进行中"]);

const STAGE_SUMMARY_RULES: Array<{ keywords: string[]; summary: string }> = [
  { keywords: ["小学"], summary: "在好奇与热闹里学会担当，第一次把“坚持”写进日常。" },
  { keywords: ["初中"], summary: "开始把自律当作方法，成绩与责任感一起向上生长。" },
  { keywords: ["高中"], summary: "在高压节奏里稳住心态，把专注力锻成长期能力。" },
  { keywords: ["高考"], summary: "关键一役学会与焦虑并行，把结果交给过程。" },
  { keywords: ["同济", "本科"], summary: "组织、学业与实践并行，逐步形成工程化做事框架。" },
  { keywords: ["浙江大学", "浙大", "硕士"], summary: "研究与落地双线推进，输出从“完成”走向“打磨”。" },
  { keywords: ["工作", "职业"], summary: "把经验沉淀为体系，在真实场景里持续创造价值。" },
];

const FALLBACK_STAGE_SUMMARIES = [
  "从好奇出发，开始练习把热爱变成习惯。",
  "在挑战里学会自驱，节奏逐渐稳定。",
  "面对压力不再慌张，开始形成自己的方法。",
  "关键节点更懂取舍，执行力持续提高。",
  "把经验沉淀成结构，做事越来越有章法。",
  "从追赶到打磨，用长期主义定义成果。",
];

function normalizeText(text: string) {
  return text.replace(/\s+/g, "").replace(/[，。,!！；;、]/g, "");
}

function isPlaceholderSummary(description: string | null | undefined) {
  if (!description?.trim()) {
    return true;
  }
  const normalized = normalizeText(description);
  if (PLACEHOLDER_STAGE_SUMMARIES.has(normalized)) {
    return true;
  }
  return /^持续?(成长|进步|探索|前进)中$/.test(normalized);
}

function resolveStageSummary(stage: HighlightStage, index: number) {
  const rawSummary = stage.description?.trim() ?? "";
  if (!isPlaceholderSummary(rawSummary)) {
    return rawSummary;
  }

  const normalizedTitle = normalizeText(stage.title).toLowerCase();
  const matchedRule = STAGE_SUMMARY_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedTitle.includes(keyword.toLowerCase())),
  );
  if (matchedRule) {
    return matchedRule.summary;
  }
  return FALLBACK_STAGE_SUMMARIES[Math.min(index, FALLBACK_STAGE_SUMMARIES.length - 1)];
}

function pickStageTheme(index: number, total: number) {
  if (total <= 1) {
    return HIGHLIGHT_THEMES[0];
  }
  const ratio = index / (total - 1);
  const themeIndex = Math.min(HIGHLIGHT_THEMES.length - 1, Math.round(ratio * (HIGHLIGHT_THEMES.length - 1)));
  return HIGHLIGHT_THEMES[themeIndex];
}

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
        {stages.map((stage, idx) => {
          const theme = pickStageTheme(idx, stages.length);
          const stageSummary = resolveStageSummary(stage, idx);
          return (
            <StaggerItem key={`${stage.title}-${idx}`}>
              <CardSpotlight
                className={[
                  "h-full overflow-hidden rounded-2xl border p-5 backdrop-blur transition-colors duration-500",
                  theme.cardClass,
                ].join(" ")}
                glowColor={theme.glowColor}
              >
                <h3 className="text-lg font-semibold text-slate-900">{stage.title}</h3>
                <p className={`mt-1 text-xs ${theme.dateClass}`}>
                  {stage.start_date || ""}
                  {stage.end_date ? ` - ${stage.end_date}` : ""}
                </p>
                <p className={`mt-3 text-sm leading-6 ${theme.summaryClass}`}>{stageSummary}</p>

                <ul className="mt-4 space-y-2">
                  {stage.items.slice(0, 4).map((item) => (
                    <li key={`${stage.title}-${item.title}`} className={["rounded-lg border px-3 py-2 text-sm", theme.itemClass].join(" ")}>
                      {item.title}
                    </li>
                  ))}
                </ul>
              </CardSpotlight>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </ScrollReveal>
  );
}
