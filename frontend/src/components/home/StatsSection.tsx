import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { HomePayload } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type StatsSectionProps = {
  stats: HomePayload["stats"];
};

type StatValueKey = "published_posts_total" | "site_visits_total" | "views_total" | "likes_total" | "travel_total" | "site_days";

type StatItem = {
  key: StatValueKey;
  label: string;
  note: (stats: HomePayload["stats"]) => string;
};

const statItems: StatItem[] = [
  { key: "published_posts_total", label: "已发布文章", note: (s) => `本周新增 ${s.published_posts_delta_week} 篇` },
  { key: "site_visits_total", label: "站点访问量", note: (s) => `本周新增 ${s.site_visits_delta_week} 次` },
  { key: "views_total", label: "文章阅读量", note: (s) => `本周新增 ${s.views_delta_week} 次` },
  { key: "likes_total", label: "点赞数", note: (s) => `本周新增 ${s.likes_delta_week} 个` },
  { key: "travel_total", label: "旅行城市", note: (s) => s.last_travel_date ? `上一次旅行 ${s.last_travel_date}` : "暂无旅行记录" },
  { key: "site_days", label: "建站天数", note: (s) => `完成 ${s.total_updates} 次更新` },
];

function AnimatedNumber({ value, active }: { value: number; active: boolean }) {
  const [display, setDisplay] = useState(0);
  const previousValueRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setDisplay(0);
      previousValueRef.current = 0;
      return;
    }

    let raf = 0;
    const start = performance.now();
    const duration = 700;
    const from = previousValueRef.current;
    const delta = value - from;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + delta * progress));
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        previousValueRef.current = value;
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [active, value]);

  if (!active) {
    return <>0</>;
  }

  return <>{new Intl.NumberFormat("zh-CN").format(display)}</>;
}

export function StatsSection({ stats }: StatsSectionProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const [countingStarted, setCountingStarted] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || countingStarted || reduceMotion) {
      if (reduceMotion && !countingStarted) {
        setCountingStarted(true);
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setCountingStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [countingStarted, reduceMotion]);

  return (
    <div ref={hostRef}>
      <ScrollReveal className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-900">数据面板</h2>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
          {statItems.map((item) => {
            const note = item.note(stats);
            return (
              <StaggerItem key={item.key} className="h-full">
                <CardSpotlight className="flex h-[188px] w-full flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold leading-none text-slate-900">
                    <AnimatedNumber active={countingStarted} value={stats[item.key]} />
                  </p>
                  <div className="mt-auto min-h-5 pt-4">
                    <p className="text-xs font-medium text-slate-500">{note}</p>
                  </div>
                </CardSpotlight>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </ScrollReveal>
    </div>
  );
}
