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
const DEFAULT_TIME_SERIES: HomeTimeSeries = {
  x_axis: ["0", "5", "10", "15", "20", "25"],
  series: [
    { name: "Study", color: "#B3D4FF", data: [0, 60, 40, 30, 30, 30] },
    { name: "Game", color: "#80E5FF", data: [0, 0, 30, 20, 20, 10] },
    { name: "Social or Family", color: "#A3F0C7", data: [100, 40, 30, 50, 50, 60] },
  ],
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

function clampIndex(value: number, length: number) {
  if (length <= 1) {
    return 0;
  }
  return Math.max(0, Math.min(length - 1, value));
}

function pickLabelIndex(seriesIndex: number, length: number) {
  if (seriesIndex === 0) {
    return clampIndex(Math.round(length * 0.3), length);
  }
  if (seriesIndex === 1) {
    return clampIndex(Math.round(length * 0.5), length);
  }
  return clampIndex(Math.round(length * 0.2), length);
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
    const fromBackend = buildChartFromBackend(timeSeries);
    if (fromBackend) {
      return fromBackend;
    }
    const fromDefault = buildChartFromBackend(DEFAULT_TIME_SERIES);
    if (fromDefault) {
      return fromDefault;
    }
    return buildChartFromTimeline(timeline);
  }, [timeSeries, timeline]);

  const latestDistribution = useMemo(() => {
    return Object.fromEntries(
      chartData.series.map((item) => [item.key, item.data[item.data.length - 1] ?? 0]),
    ) as Record<string, number>;
  }, [chartData.series]);

  const option = useMemo(() => {
    const ages = chartData.ages;
    const tickStep = ages.length <= 8 ? 1 : Math.max(1, Math.floor((ages.length - 1) / 5));
    const topColor = chartData.series[chartData.series.length - 1]?.color ?? "#A3F0C7";

    return {
      backgroundColor: topColor,
      animation: !reduceMotion,
      animationDuration: 700,
      animationDurationUpdate: 560,
      tooltip: {
        trigger: "axis",
        valueFormatter: (value: number) => `${value.toFixed(1)}%`,
      },
      legend: { show: false },
      grid: {
        left: 12,
        right: 12,
        top: 10,
        bottom: 6,
        containLabel: true,
      },
      graphic: [
        {
          type: "text",
          left: "50%",
          bottom: "5%",
          z: 50,
          style: {
            text: "Age",
            fill: "#34425a",
            font: "600 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
            textAlign: "center",
          },
        },
      ],
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: ages,
        axisLabel: {
          inside: true,
          color: "#34425a",
          fontSize: 16,
          fontWeight: 500,
          formatter: (_: string, index: number) => (index % tickStep === 0 || index === ages.length - 1 ? ages[index] : ""),
        },
        axisTick: {
          inside: true,
          length: 12,
          lineStyle: { color: "#34425a", width: 2 },
        },
        axisLine: {
          lineStyle: { color: "#34425a", width: 2 },
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          formatter: "{value}%",
          inside: true,
          color: "#34425a",
          fontSize: 15,
          fontWeight: 500,
        },
        axisTick: {
          inside: true,
          length: 12,
          lineStyle: { color: "#34425a", width: 2 },
        },
        splitLine: { show: false },
        axisLine: {
          lineStyle: { color: "#34425a", width: 2 },
        },
      },
      series: chartData.series.map((item, seriesIndex) => {
        const labelIndex = pickLabelIndex(seriesIndex, item.data.length);
        return {
          name: item.label,
          type: "line",
          stack: "Total",
          smooth: 0.65,
          smoothMonotone: "x",
          showSymbol: false,
          symbol: "none",
          lineStyle: {
            width: 0,
            color: item.color,
          },
          areaStyle: {
            opacity: 0.93,
            color: item.color,
          },
          label: {
            show: true,
            position: "inside",
            color: "#334155",
            fontSize: 18,
            fontWeight: 500,
            formatter: (params: { dataIndex: number }) => (params.dataIndex === labelIndex ? item.label : ""),
          },
          labelLayout: {
            hideOverlap: false,
          },
          emphasis: {
            focus: "series",
            lineStyle: {
              width: 2,
              color: "#334155",
            },
            areaStyle: {
              opacity: 1,
            },
          },
          data: item.data,
        };
      }),
    };
  }, [chartData, reduceMotion]);

  return (
    <section id="time" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Time</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-800">This is how I spend my time.</h2>
        <p className="mt-1 text-sm text-slate-600">Backend data is editable. Every age point is normalized to 100%, and curves stay smooth.</p>
      </div>

      <div className="overflow-hidden rounded-[1.8rem] border border-white/70 bg-[#a7e5cc] shadow-[0_14px_28px_rgba(15,23,42,0.12)]">
        {Chart && !chartUnavailable ? (
          <Chart
            echarts={echartsRuntime ?? undefined}
            lazyUpdate
            notMerge
            option={option}
            style={{ height: 500, width: "100%" }}
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
