import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import type { HomeTimeSeries, TimelineNode } from "../../../api/home";
import { timeAreaSeriesConfig, type TimeSeriesKey } from "../../../data/revamp/timeSeries";
import { SparklesText } from "../../ui/SparklesText";

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
const AXIS_X_TICKS = [0, 5, 10, 15, 20, 25];
const AXIS_Y_TICKS = [0, 20, 40, 60, 80];
const DEFAULT_TIME_SERIES: HomeTimeSeries = {
  x_axis: Array.from({ length: 27 }, (_, age) => String(age)),
  series: [
    {
      name: "学习",
      color: "#B3D4FF",
      data: [0, 0, 8, 20, 35, 50, 58, 60, 55, 45, 40, 38, 36, 34, 32, 30, 30, 30, 30, 30, 28, 24, 20, 20, 20, 20, 30],
    },
    {
      name: "游戏",
      color: "#80E5FF",
      data: [0, 0, 0, 0, 0, 0, 0, 0, 5, 15, 22, 28, 30, 28, 24, 20, 18, 16, 15, 15, 15, 15, 15, 15, 15, 15, 10],
    },
    {
      name: "写代码",
      color: "#8FD9D0",
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 14, 18, 22, 24, 24, 24, 24, 24, 23, 22, 20, 18, 16, 14, 10],
    },
    {
      name: "运动",
      color: "#7BC9FF",
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 8, 10, 12, 12, 10, 10, 9, 8, 8, 6, 6, 5, 5, 5, 5, 5, 3],
    },
    {
      name: "音乐",
      color: "#A7C4FF",
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 5, 6, 7, 9, 10, 10, 10, 10, 8],
    },
    {
      name: "社交&家庭",
      color: "#A3F0C7",
      data: [100, 100, 92, 80, 65, 50, 42, 40, 40, 35, 25, 14, 8, 8, 12, 16, 17, 18, 18, 19, 21, 25, 30, 32, 34, 36, 39],
    },
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

function buildOverlayGraphics(ages: string[]) {
  const leftPct = 3.6;
  const rightPct = 2.6;
  const topPct = 2.1;
  const bottomPct = 4.4;
  const plotWidth = 100 - leftPct - rightPct;
  const plotHeight = 100 - topPct - bottomPct;

  const numericAges = ages.map((age) => Number(age)).filter((age) => Number.isFinite(age));
  const minAge = numericAges.length > 0 ? Math.min(...numericAges) : 0;
  const maxAge = numericAges.length > 0 ? Math.max(...numericAges) : 26;
  const span = Math.max(1, maxAge - minAge);

  const xToPct = (age: number) => `${leftPct + ((age - minAge) / span) * plotWidth}%`;
  const yToPct = (value: number) => `${topPct + ((100 - value) / 100) * plotHeight}%`;
  const bottomLabelTop = `${topPct + plotHeight - 3.1}%`;

  const yTexts = AXIS_Y_TICKS.map((tick) => ({
    type: "text",
    left: `${leftPct - 1.8}%`,
    top: yToPct(tick),
    z: 220,
    style: {
      text: `${tick}%`,
      fill: "#34425a",
      font: "500 18px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
      textAlign: "left",
      textVerticalAlign: "middle",
    },
  }));

  const xTexts = AXIS_X_TICKS.filter((tick) => tick >= minAge && tick <= maxAge).map((tick) => ({
    type: "text",
    left: xToPct(tick),
    top: bottomLabelTop,
    z: 220,
    style: {
      text: String(tick),
      fill: "#34425a",
      font: "500 20px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
      textAlign: "center",
      textVerticalAlign: "middle",
    },
  }));

  const areaTexts = [
    { text: "社交&家庭", left: "11%", top: "16%", fontSize: 64 },
    { text: "学习", left: "20%", top: "74%", fontSize: 66 },
    { text: "游戏", left: "40%", top: "47%", fontSize: 66 },
    { text: "写代码", left: "69%", top: "34%", fontSize: 62 },
    { text: "音乐", left: "82%", top: "74%", fontSize: 56 },
    { text: "运动", left: "56%", top: "60%", fontSize: 36 },
  ].map((item) => ({
    type: "text",
    left: item.left,
    top: item.top,
    z: 240,
    style: {
      text: item.text,
      fill: "#34425a",
      font: `500 ${item.fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`,
      textAlign: "center",
      textVerticalAlign: "middle",
    },
  }));

  return [
    ...yTexts,
    ...xTexts,
    {
      type: "text",
      left: `${leftPct - 1.4}%`,
      top: yToPct(100),
      z: 220,
      style: {
        text: "100%",
        fill: "#34425a",
        font: "500 18px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        textAlign: "left",
        textVerticalAlign: "middle",
      },
    },
    {
      type: "text",
      left: "50%",
      top: `${topPct + plotHeight - 5.2}%`,
      z: 230,
      style: {
        text: "Age",
        fill: "#34425a",
        font: "500 56px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        textAlign: "center",
      },
    },
    ...areaTexts,
  ];
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
    const overlayGraphics = buildOverlayGraphics(ages);

    return {
      animation: !reduceMotion,
      animationDuration: 700,
      animationDurationUpdate: 560,
      tooltip: { show: false },
      legend: { show: false },
      grid: {
        left: 12,
        right: 12,
        top: 10,
        bottom: 6,
        containLabel: true,
      },
      graphic: overlayGraphics,
      xAxis: {
        type: "category",
        z: 120,
        zlevel: 1,
        boundaryGap: false,
        data: ages,
        axisLabel: {
          show: false,
        },
        axisTick: {
          inside: true,
          length: 16,
          interval: (_index: number, value: string) => {
            const numeric = Number(value);
            return Number.isFinite(numeric) && numeric % 5 === 0 && numeric <= 25;
          },
          lineStyle: { color: "#34425a", width: 2 },
        },
        axisLine: {
          lineStyle: { color: "#34425a", width: 2 },
        },
      },
      yAxis: {
        type: "value",
        z: 120,
        zlevel: 1,
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          show: false,
        },
        axisTick: {
          inside: true,
          length: 16,
          interval: (value: number) => value >= 0 && value <= 80 && value % 20 === 0,
          lineStyle: { color: "#34425a", width: 2 },
        },
        splitLine: { show: false },
        axisLine: {
          lineStyle: { color: "#34425a", width: 2 },
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
            width: 6,
            color: "rgba(255,255,255,0)",
            cap: "round",
            join: "round",
          },
          areaStyle: {
            opacity: 1,
            color: item.color,
          },
          label: {
            show: false,
          },
          emphasis: {
            focus: "series",
            lineStyle: {
              width: 8,
              color: "rgba(255,255,255,0.98)",
              cap: "round",
              join: "round",
            },
            areaStyle: {
              opacity: 1,
            },
          },
          blur: {
            lineStyle: {
              width: 6,
              color: "rgba(255,255,255,0)",
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
        <h2 className="text-2xl font-semibold text-slate-800">
          <SparklesText className="text-inherit" sparklesCount={8} colors={{ first: "#38bdf8", second: "#f59e0b" }}>
            Time
          </SparklesText>
        </h2>
      </div>

      <div className="overflow-hidden rounded-[1.8rem] border border-white/70 bg-[#e8edf2] shadow-[0_14px_28px_rgba(15,23,42,0.12)]">
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
