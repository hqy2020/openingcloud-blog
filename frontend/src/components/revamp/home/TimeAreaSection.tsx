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
  if (ages.length === 0) {
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
    return buildChartFromBackend(timeSeries) ?? buildChartFromTimeline(timeline);
  }, [timeSeries, timeline]);

  const latestDistribution = useMemo(() => {
    return Object.fromEntries(
      chartData.series.map((item) => [item.key, item.data[item.data.length - 1] ?? 0]),
    ) as Record<string, number>;
  }, [chartData.series]);

  const option = useMemo(() => {
    const ages = chartData.ages;
    const sparseInterval = ages.length > 24 ? Math.ceil(ages.length / 8) : 1;

    return {
      animation: !reduceMotion,
      animationDuration: 520,
      animationDurationUpdate: 420,
      tooltip: {
        trigger: "axis",
        valueFormatter: (value: number) => `${value.toFixed(2)}%`,
      },
      legend: {
        top: 8,
        right: 12,
        itemHeight: 8,
        itemWidth: 14,
        textStyle: { color: "#334155", fontSize: 12 },
      },
      grid: {
        left: 12,
        right: 12,
        top: 44,
        bottom: 10,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: ages,
        name: "Age",
        nameLocation: "middle",
        nameGap: 6,
        axisLabel: {
          inside: true,
          color: "#334155",
          formatter: (_: string, index: number) => (index % sparseInterval === 0 ? ages[index] : ""),
        },
        axisTick: { inside: true, lineStyle: { color: "#334155" } },
        axisLine: { lineStyle: { color: "#334155" } },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          formatter: "{value}%",
          inside: true,
          color: "#334155",
        },
        splitLine: { show: false },
        axisTick: { inside: true, lineStyle: { color: "#334155" } },
        axisLine: { lineStyle: { color: "#334155" } },
      },
      series: chartData.series.map((item) => ({
        name: item.label,
        type: "line",
        stack: "Total",
        smooth: true,
        smoothMonotone: "x",
        showSymbol: false,
        lineStyle: {
          width: 0.8,
          color: item.color,
        },
        areaStyle: {
          opacity: 0.8,
          color: item.color,
        },
        emphasis: {
          focus: "series",
          lineStyle: {
            width: 2.2,
            color: item.color,
          },
          areaStyle: {
            opacity: 0.92,
          },
        },
        data: item.data,
      })),
    };
  }, [chartData, reduceMotion]);

  return (
    <section id="time" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Time</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-800">人生阶段占比堆叠面积图</h2>
        <p className="mt-1 text-sm text-slate-600">支持后台录入数据；接口会自动归一化为 100%，曲线默认平滑显示。</p>
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
            {chartData.series.map((item) => {
              const value = latestDistribution[item.key] ?? 0;
              return (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                    <span>{item.label}</span>
                    <span>{value.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
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
