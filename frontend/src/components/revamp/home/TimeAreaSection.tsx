import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import type { TimelineNode } from "../../../api/home";
import { timeAreaSeriesConfig, type TimeSeriesKey } from "../../../data/revamp/timeSeries";

type EChartsLikeProps = {
  option: unknown;
  style?: CSSProperties;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  echarts?: unknown;
};

type TimeSlice = {
  age: number;
  label: string;
  distribution: Record<TimeSeriesKey, number>;
};

function unwrapDefault<T>(moduleValue: unknown): T {
  const first = (moduleValue as { default?: unknown })?.default ?? moduleValue;
  const second = (first as { default?: unknown })?.default ?? first;
  return second as T;
}

function parseDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function toMonthStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, count: number) {
  return new Date(value.getFullYear(), value.getMonth() + count, 1);
}

function ageFromDates(current: Date, birth: Date) {
  const years = (current.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.2425);
  return Math.max(0, years);
}

function buildTimeSlices(nodes: TimelineNode[]) {
  const birth = parseDate(timeAreaSeriesConfig.birth_date) ?? new Date(2000, 8, 1);
  const now = new Date();
  const start = toMonthStart(birth);
  const end = toMonthStart(now);
  const seriesKeys = timeAreaSeriesConfig.series.map((item) => item.key);
  const fallbackBucket = timeAreaSeriesConfig.fallback_bucket;

  const safeNodes = nodes
    .map((node) => {
      const startDate = parseDate(node.start_date);
      const endDate = node.end_date ? parseDate(node.end_date) : null;
      if (!startDate) {
        return null;
      }
      return {
        ...node,
        start: startDate.getTime(),
        end: (endDate ?? now).getTime(),
      };
    })
    .filter((node): node is TimelineNode & { start: number; end: number } => Boolean(node));

  const slices: TimeSlice[] = [];
  let cursor = new Date(start.getTime());
  while (cursor <= end) {
    const bucketCount = Object.fromEntries(seriesKeys.map((key) => [key, 0])) as Record<TimeSeriesKey, number>;
    const timestamp = cursor.getTime();

    safeNodes.forEach((node) => {
      if (timestamp < node.start || timestamp >= node.end) {
        return;
      }
      const key = node.type as TimeSeriesKey;
      if (key in bucketCount) {
        bucketCount[key] += 1;
      }
    });

    let total = Object.values(bucketCount).reduce((sum, current) => sum + current, 0);
    if (total === 0) {
      bucketCount[fallbackBucket] += 1;
      total = 1;
    }

    const distribution = Object.fromEntries(
      seriesKeys.map((key) => [key, Number(((bucketCount[key] / total) * 100).toFixed(2))]),
    ) as Record<TimeSeriesKey, number>;

    const age = Number(ageFromDates(cursor, birth).toFixed(2));
    slices.push({
      age,
      label: age.toFixed(1),
      distribution,
    });
    cursor = addMonths(cursor, 1);
  }
  return slices;
}

export function TimeAreaSection({ timeline }: { timeline: TimelineNode[] }) {
  const reduceMotion = Boolean(useReducedMotion());
  const [Chart, setChart] = useState<ComponentType<EChartsLikeProps> | null>(null);
  const [echartsRuntime, setEchartsRuntime] = useState<unknown>(null);
  const [chartUnavailable, setChartUnavailable] = useState(false);

  useEffect(() => {
    const canUseCanvas =
      typeof window !== "undefined" &&
      typeof document !== "undefined" &&
      Boolean(document.createElement("canvas").getContext);
    if (!canUseCanvas) {
      setChartUnavailable(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [chartModule, echartsModule] = await Promise.all([import("echarts-for-react"), import("echarts")]);
        if (cancelled) {
          return;
        }
        setChart(() => chartModule.default as ComponentType<EChartsLikeProps>);
        setEchartsRuntime(() => unwrapDefault<unknown>(echartsModule));
        setChartUnavailable(false);
      } catch {
        if (!cancelled) {
          setChart(null);
          setChartUnavailable(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slices = useMemo(() => buildTimeSlices(timeline), [timeline]);
  const seriesConfig = timeAreaSeriesConfig.series;
  const latestDistribution = slices[slices.length - 1]?.distribution;

  const option = useMemo(() => {
    const ages = slices.map((slice) => slice.label);
    return {
      animation: !reduceMotion,
      animationDuration: 520,
      animationDurationUpdate: 460,
      tooltip: {
        trigger: "axis",
        valueFormatter: (value: number) => `${value.toFixed(1)}%`,
      },
      legend: {
        top: 6,
        itemHeight: 8,
        itemWidth: 14,
        textStyle: { color: "#475569", fontSize: 12 },
      },
      grid: {
        left: 44,
        right: 20,
        top: 48,
        bottom: 34,
      },
      xAxis: {
        type: "category",
        data: ages,
        name: "Age",
        nameLocation: "middle",
        nameGap: 26,
        axisLabel: {
          color: "#64748b",
          formatter: (_: string, index: number) => (index % 24 === 0 ? ages[index] : ""),
        },
        axisLine: { lineStyle: { color: "#CBD5E1" } },
      },
      yAxis: {
        type: "value",
        name: "%",
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: { color: "#64748b", formatter: "{value}%" },
        splitLine: { lineStyle: { color: "rgba(148,163,184,0.24)" } },
        axisLine: { show: false },
      },
      series: seriesConfig.map((seriesItem) => ({
        name: seriesItem.label,
        type: "line",
        stack: "timeline",
        smooth: true,
        showSymbol: false,
        emphasis: {
          focus: "series",
          lineStyle: {
            width: 3,
            color: seriesItem.color,
          },
          areaStyle: {
            opacity: 0.58,
          },
        },
        lineStyle: {
          width: 1.4,
          color: seriesItem.color,
        },
        areaStyle: {
          opacity: 0.38,
          color: seriesItem.color,
        },
        data: slices.map((slice) => slice.distribution[seriesItem.key]),
      })),
    };
  }, [reduceMotion, seriesConfig, slices]);

  return (
    <section id="time" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Time</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-800">人生阶段占比堆叠面积图</h2>
        <p className="mt-1 text-sm text-slate-600">x 轴为年龄（Age），y 轴为类型占比（%）。悬停时描边高亮当前系列。</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/82 p-3 shadow-[0_12px_26px_rgba(15,23,42,0.1)] backdrop-blur">
        {Chart && !chartUnavailable ? (
          <Chart
            echarts={echartsRuntime ?? undefined}
            lazyUpdate
            notMerge
            option={option}
            style={{ height: 420, width: "100%" }}
          />
        ) : (
          <div className="space-y-3 px-2 py-3">
            <p className="text-xs text-amber-700">图表组件不可用，已降级为当前阶段占比条。</p>
            {seriesConfig.map((seriesItem) => {
              const value = latestDistribution?.[seriesItem.key] ?? 0;
              return (
                <div key={seriesItem.key}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                    <span>{seriesItem.label}</span>
                    <span>{value.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${value}%`, background: seriesItem.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
