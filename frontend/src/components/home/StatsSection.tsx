import type { HomePayload } from "../../api/home";

type StatsSectionProps = {
  stats: HomePayload["stats"];
};

const statItems: Array<{ key: keyof HomePayload["stats"]; label: string }> = [
  { key: "published_posts_total", label: "已发布文章" },
  { key: "views_total", label: "总阅读量" },
  { key: "timeline_total", label: "时间线节点" },
  { key: "travel_total", label: "旅行城市" },
  { key: "social_total", label: "公开社交节点" },
  { key: "tags_total", label: "标签数" },
];

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">数据面板</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((item) => (
          <article key={item.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stats[item.key]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
