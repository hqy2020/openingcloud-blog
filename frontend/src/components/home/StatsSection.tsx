import type { HomePayload } from "../../api/home";
import { cn } from "../../lib/utils";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";
import { TextGif } from "../ui/TextGif";
import { SectionTitleCard } from "../revamp/shared/SectionTitleCard";

type StatsSectionProps = {
  stats: HomePayload["stats"];
};

type StatValueKey = "published_posts_total" | "site_visits_total" | "site_days" | "likes_total";

type StatItem = {
  key: StatValueKey;
  label: string;
  note: (stats: HomePayload["stats"]) => string;
  gifUrl: string;
};

const statItems: StatItem[] = [
  {
    key: "published_posts_total",
    label: "已发布文章",
    note: (s) => `本周新增 ${s.published_posts_delta_week} 篇`,
    gifUrl: "https://media.giphy.com/media/3zvbrvbRe7wxBofOBI/giphy.gif",
  },
  {
    key: "site_visits_total",
    label: "站点访问量",
    note: (s) => `本周新增 ${s.site_visits_delta_week} 次`,
    gifUrl: "https://media.giphy.com/media/fnglNFjBGiyAFtm6ke/giphy.gif",
  },
  {
    key: "site_days",
    label: "建站天数",
    note: (s) => `完成 ${s.total_updates} 次更新`,
    gifUrl: "https://media.giphy.com/media/9Pmfazv34l7aNIKK05/giphy.gif",
  },
  {
    key: "likes_total",
    label: "点赞数",
    note: (s) => `本周新增 ${s.likes_delta_week} 个`,
    gifUrl: "https://media.giphy.com/media/4bhs1boql4XVJgmm4H/giphy.gif",
  },
];

const numberFormatter = new Intl.NumberFormat("zh-CN");

export function StatsSection({ stats }: StatsSectionProps) {

  return (
    <ScrollReveal className="space-y-4">
      <SectionTitleCard
        category="Stats"
        title="数据面板"
        accentColor="#c96442"
        tagline="用数字丈量这个博客的成长轨迹。"
      />
      <StaggerContainer className="grid h-full grid-cols-2 gap-5 lg:grid-cols-4" stagger={0.06}>
        {statItems.map((item) => {
          const note = item.note(stats);
          const valueText = numberFormatter.format(stats[item.key]);
          const len = valueText.length;
          const sizeClass =
            len >= 9
              ? "text-2xl sm:text-3xl lg:text-4xl"
              : len >= 7
                ? "text-3xl sm:text-4xl lg:text-5xl"
                : len >= 5
                  ? "text-4xl sm:text-5xl lg:text-6xl"
                  : "text-5xl sm:text-6xl lg:text-7xl";
          return (
            <StaggerItem key={item.key} className="h-full">
              <CardSpotlight className="group theme-card flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[var(--theme-radius)] border border-theme-line bg-theme-surface p-6 text-center shadow-[var(--theme-shadow-whisper)] transition-all duration-300 hover:border-theme-accent/50 hover:shadow-[var(--theme-shadow-lifted)]">
                <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-theme-soft">{item.label}</p>
                <div className="my-3 flex w-full min-w-0 justify-center">
                  <TextGif
                    gifUrl={item.gifUrl}
                    size="xxl"
                    weight="bold"
                    className={cn("max-w-full whitespace-nowrap tabular-nums", sizeClass)}
                  >
                    {valueText}
                  </TextGif>
                </div>
                <p className="font-serif text-xs italic text-theme-muted">{note}</p>
              </CardSpotlight>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </ScrollReveal>
  );
}
