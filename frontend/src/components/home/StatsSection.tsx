import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { HomePayload } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type StatsSectionProps = {
  stats: HomePayload["stats"];
};

type DeltaKey =
  | "published_posts_delta_week"
  | "views_delta_week"
  | "total_words_delta_week"
  | "likes_delta_week"
  | "travel_delta_year";

type StatValueKey = "published_posts_total" | "views_total" | "total_words" | "likes_total" | "travel_total" | "site_days";

type StatItem = {
  key: StatValueKey;
  label: string;
  deltaKey?: DeltaKey;
  deltaLabel?: string;
  note?: (stats: HomePayload["stats"]) => string;
};

const statItems: StatItem[] = [
  { key: "published_posts_total", label: "已发布文章", deltaKey: "published_posts_delta_week", deltaLabel: "较上周" },
  { key: "views_total", label: "总阅读量", deltaKey: "views_delta_week", deltaLabel: "较上周" },
  { key: "total_words", label: "总字数", deltaKey: "total_words_delta_week", deltaLabel: "较上周" },
  { key: "likes_total", label: "点赞数", deltaKey: "likes_delta_week", deltaLabel: "较上周" },
  { key: "travel_total", label: "旅行城市", deltaKey: "travel_delta_year", deltaLabel: "较去年" },
  { key: "site_days", label: "建站天数", note: (stats) => `起算于 ${stats.site_launch_date}` },
];

const numberFormatter = new Intl.NumberFormat("zh-CN");

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

  return <>{numberFormatter.format(display)}</>;
}

function DeltaBadge({ delta, label }: { delta: number; label: string }) {
  const sign = delta > 0 ? "↑" : delta < 0 ? "↓" : "↕";
  const tone = delta > 0 ? "text-rose-600" : delta < 0 ? "text-emerald-600" : "text-slate-500";
  const formatted = `${delta > 0 ? "+" : ""}${numberFormatter.format(delta)}`;

  return (
    <p className={`text-xs font-medium ${tone}`}>
      {sign} {formatted} {label}
    </p>
  );
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
            const delta = item.deltaKey ? stats[item.deltaKey] : null;
            const note = item.note ? item.note(stats) : "";
            return (
              <StaggerItem key={item.key} className="h-full">
                <CardSpotlight className="flex h-[188px] w-full flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold leading-none text-slate-900">
                    <AnimatedNumber active={countingStarted} value={stats[item.key]} />
                  </p>
                  <div className="mt-auto min-h-5 pt-4">
                    {typeof delta === "number" && item.deltaLabel ? (
                      <DeltaBadge delta={delta} label={item.deltaLabel} />
                    ) : (
                      <p className="text-xs font-medium text-slate-500">{note}</p>
                    )}
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
