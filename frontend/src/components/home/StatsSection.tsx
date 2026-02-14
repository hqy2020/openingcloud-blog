import { useEffect, useState } from "react";
import type { HomePayload } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type StatsSectionProps = {
  stats: HomePayload["stats"];
};

const statItems: Array<{ key: keyof HomePayload["stats"]; label: string }> = [
  { key: "published_posts_total", label: "已发布文章" },
  { key: "views_total", label: "总阅读量" },
  { key: "total_words", label: "总字数" },
  { key: "travel_total", label: "旅行城市" },
  { key: "site_days", label: "建站天数" },
  { key: "tags_total", label: "标签数" },
];

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 700;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * progress));
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <ScrollReveal className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">数据面板</h2>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
        {statItems.map((item) => (
          <StaggerItem key={item.key}>
            <CardSpotlight className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                <AnimatedNumber value={stats[item.key]} />
              </p>
            </CardSpotlight>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </ScrollReveal>
  );
}
