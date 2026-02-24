import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import type { HomeTimeSeries, TimelineNode } from "../../../api/home";
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

type ChartSeries = {
  key: string;
  label: string;
  color: string;
  data: number[];
};

type ChartDataset = {
  ages: string[];
  series: ChartSeries[];
};

const FALLBACK_COLORS = ["#B3D4FF", "#80E5FF", "#A3F0C7", "#8BB8FF", "#7DD3FC", "#86EFAC"];

// x 轴只在这些年龄处显示数字标签
const AGE_TICKS = [5, 10, 15, 20, 25];

function aggregateToYearly(monthly: ChartDataset): ChartDataset {
  const maxAge = Math.ceil(Math.max(...monthly.ages.map(Number)));
  const yearLabels: string[] = [];
  for (let y = 0; y <= maxAge; y++) yearLabels.push(String(y));

  const yearlySeries = monthly.series.map((item) => {
    const yearData = yearLabels.map((yearStr) => {
      const year = Number(yearStr);
      const indices: number[] = [];
      monthly.ages.forEach((a, idx) => {
        const age = Number(a);
        if (age >= year && age < year + 1) indices.push(idx);
      });
      if (indices.length === 0) return 0;
      return indices.reduce((s, i) => s + (item.data[i] ?? 0), 0) / indices.length;
    });
    return { ...item, data: yearData };
  });

  // 每列重新归一化，确保各系列之和 = 100
  for (let col = 0; col < yearLabels.length; col++) {
    const normalized = normalizeTo100(yearlySeries.map((s) => s.data[col]));
    yearlySeries.forEach((s, i) => {
      s.data[col] = normalized[i];
    });
  }

  return { ages: yearLabels, series: yearlySeries };
}

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

function normalizeTo100(values: number[]) {
  if (values.length === 0) {
    return [];
  }

  const safe = values.map((value) => (Number.isFinite(value) && value > 0 ? value : 0));
  const total = safe.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return safe.map((_, index) => (index === 0 ? 100 : 0));
  }

  const scaledBasisPoints = safe.map((value) => (value * 10000) / total);
  const basisPoints = scaledBasisPoints.map((value) => Math.floor(value));
  let remaining = 10000 - basisPoints.reduce((sum, value) => sum + value, 0);

  const order = scaledBasisPoints
    .map((value, index) => ({
      index,
      fraction: value - basisPoints[index],
      value,
    }))
    .sort((left, right) => right.fraction - left.fraction || right.value - left.value);

  while (remaining > 0) {
    const cursor = 10000 - remaining;
    const target = order[cursor % order.length];
    basisPoints[target.index] += 1;
    remaining -= 1;
  }

  return basisPoints.map((value) => value / 100);
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

    const total = Object.values(bucketCount).reduce((sum, current) => sum + current, 0);
    if (total === 0) {
      bucketCount[fallbackBucket] = 1;
    }

    const normalized = normalizeTo100(seriesKeys.map((key) => bucketCount[key]));
    const distribution = Object.fromEntries(
      seriesKeys.map((key, index) => [key, normalized[index] ?? 0]),
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

function buildChartFromTimeline(nodes: TimelineNode[]): ChartDataset {
  const slices = buildTimeSlices(nodes);
  return {
    ages: slices.map((slice) => slice.label),
    series: timeAreaSeriesConfig.series.map((item) => ({
      key: item.key,
      label: item.label,
      color: item.color,
      data: slices.map((slice) => slice.distribution[item.key]),
    })),
  };
}

function buildChartFromBackend(timeSeries?: HomeTimeSeries): ChartDataset | null {
  if (!timeSeries || !Array.isArray(timeSeries.x_axis) || !Array.isArray(timeSeries.series)) {
    return null;
  }

  const ages = timeSeries.x_axis.map((item) => String(item).trim()).filter(Boolean);
  if (ages.length < 2) {
    return null;
  }

  const series = timeSeries.series
    .map((item, index) => {
      const label = String(item?.name ?? "").trim();
      if (!label) {
        return null;
      }

      const values = Array.from({ length: ages.length }, (_, pointIndex) => {
        const raw = Array.isArray(item.data) ? item.data[pointIndex] : 0;
        const numeric = Number(raw);
        return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
      });

      const color = String(item.color ?? "").trim() || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
      return {
        key: `series_${index}`,
        label,
        color,
        data: values,
      };
    })
    .filter((item): item is ChartSeries => Boolean(item));

  if (series.length === 0) {
    return null;
  }

  for (let columnIndex = 0; columnIndex < ages.length; columnIndex += 1) {
    const normalized = normalizeTo100(series.map((item) => item.data[columnIndex] ?? 0));
    series.forEach((item, seriesIndex) => {
      item.data[columnIndex] = normalized[seriesIndex] ?? 0;
    });
  }

  return {
    ages,
    series,
  };
}


export function TimeAreaSection({ timeline, timeSeries }: { timeline: TimelineNode[]; timeSeries?: HomeTimeSeries }) {
  const reduceMotion = Boolean(useReducedMotion());
  const [Chart, setChart] = useState<ComponentType<EChartsLikeProps> | null>(null);
  const [echartsRuntime, setEchartsRuntime] = useState<unknown>(null);
  const [chartUnavailable, setChartUnavailable] = useState(false);
  const [chartHeight, setChartHeight] = useState(500);

  useEffect(() => {
    const update = () => setChartHeight(window.innerWidth < 640 ? 260 : 500);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

  const chartData = useMemo(() => {
    const monthly = buildChartFromBackend(timeSeries) ?? buildChartFromTimeline(timeline);

    // 如果后端已返回非数字（预聚合）标签，直接使用
    const isMonthly = monthly.ages.length > 10 && monthly.ages.every((a) => !Number.isNaN(Number(a)));
    if (!isMonthly) {
      return monthly;
    }

    // 将月度数据聚合为整年数据
    return aggregateToYearly(monthly);
  }, [timeSeries, timeline]);

  const latestDistribution = useMemo(() => {
    return Object.fromEntries(
      chartData.series.map((item) => [item.key, item.data[item.data.length - 1] ?? 0]),
    ) as Record<string, number>;
  }, [chartData.series]);

  const option = useMemo(() => {
    return {
      animation: !reduceMotion,
      animationDuration: 700,
      animationDurationUpdate: 560,
      tooltip: { show: false },
      legend: {
        show: true,
        bottom: 0,
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 16,
        textStyle: { color: "#555", fontSize: 12 },
        data: chartData.series.map((item) => ({
          name: item.label,
          itemStyle: { color: item.color },
        })),
      },
      grid: {
        left: 12,
        right: 12,
        top: 10,
        bottom: 40,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: chartData.ages,
        axisLabel: {
          show: true,
          color: "#666",
          fontSize: 12,
          // 只在 5, 10, 15, 20, 25 处显示数字标签
          formatter: (value: string) => {
            const age = Math.round(Number(value));
            if (AGE_TICKS.includes(age)) return String(age);
            return "";
          },
          interval: 0,
        },
        axisTick: { show: false },
        axisLine: {
          lineStyle: { color: "#555", width: 1.5 },
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          show: true,
          formatter: (value: number) =>
            value > 0 && value < 100 && value % 20 === 0 ? `${value}%` : "",
          color: "#666",
          fontSize: 12,
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLine: {
          lineStyle: { color: "#555", width: 1.5 },
        },
      },
      series: chartData.series.map((item) => {
        return {
          name: item.label,
          type: "line",
          z: 10,
          stack: "Total",
          smooth: 0.5,
          smoothMonotone: "x",
          showSymbol: false,
          symbol: "none",
          lineStyle: {
            width: 1.5,
            color: "rgba(60,60,60,0.25)",
            cap: "round",
            join: "round",
          },
          areaStyle: {
            opacity: 1,
            color: item.color,
          },
          emphasis: {
            focus: "series",
            lineStyle: {
              width: 5,
              color: "rgba(255,255,255,0.98)",
              cap: "round",
              join: "round",
              shadowBlur: 6,
              shadowColor: "rgba(0,0,0,0.25)",
            },
            areaStyle: { opacity: 1 },
          },
          blur: {
            areaStyle: { opacity: 0.35 },
            lineStyle: { width: 0.5, color: "rgba(60,60,60,0.08)" },
          },
          data: item.data,
        };
      }),
    };
  }, [chartData, reduceMotion]);

  return (
    <section id="time" className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-800">时间都去哪了?</h2>

      <div className="overflow-hidden rounded-[1.8rem] border border-white/70 bg-[#e8edf2] shadow-[0_14px_28px_rgba(15,23,42,0.12)]">
        {Chart && !chartUnavailable ? (
          <Chart
            echarts={echartsRuntime ?? undefined}
            lazyUpdate
            notMerge
            option={option}
            style={{ height: chartHeight, width: "100%" }}
          />
        ) : (
          <div className="space-y-3 px-4 py-5">
            <p className="text-xs text-amber-700">Chart runtime unavailable. Showing latest normalized percentages.</p>
            {chartData.series.map((item) => {
              const value = latestDistribution[item.key] ?? 0;
              return (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
                    <span>{item.label}</span>
                    <span>{value.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/60">
                    <div className="h-full rounded-full" style={{ width: `${value}%`, background: item.color }} />
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
