import { motion, useReducedMotion } from "motion/react";
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

type DisplaySeriesKey = "family" | "coding" | "game" | "music" | "study" | "other";

type DisplaySeriesProfile = {
  key: DisplaySeriesKey;
  label: string;
  shortLabel: string;
  color: string;
  order: number;
  matchers: RegExp[];
};

type LabelPlacement = {
  key: string;
  label: string;
  displayLabel: string;
  color: string;
  left: number;
  top: number;
  align: "left" | "center" | "right";
  value: number;
  fontClass: string;
};

const FALLBACK_COLORS = [
  "#FFAAB5",
  "#FFD6A5",
  "#FDFFB6",
  "#CAFFBF",
  "#9BF6FF",
  "#BDB2FF",
  "#FFC6FF",
  "#A8DADC",
];

const AGE_TICKS = [0, 5, 10, 15, 20, 25];

const DISPLAY_SERIES_PROFILES: DisplaySeriesProfile[] = [
  {
    key: "family",
    label: "社交 / 家庭",
    shortLabel: "社交",
    color: "#A5E4C2",
    order: 10,
    matchers: [/社交/u, /家庭/u, /social/u, /family/u],
  },
  {
    key: "coding",
    label: "编程 / 工作",
    shortLabel: "编程",
    color: "#90D8C8",
    order: 20,
    matchers: [/代码/u, /编程/u, /coding/u, /code/u, /工作/u, /career/u, /work/u],
  },
  {
    key: "game",
    label: "游戏",
    shortLabel: "游戏",
    color: "#84D7EE",
    order: 30,
    matchers: [/游戏/u, /gaming/u, /game/u],
  },
  {
    key: "music",
    label: "音乐 / 运动",
    shortLabel: "音乐",
    color: "#A5BAEF",
    order: 40,
    matchers: [/音乐/u, /music/u, /运动/u, /sports/u, /sport/u, /health/u],
  },
  {
    key: "study",
    label: "学习",
    shortLabel: "学习",
    color: "#B5CBEC",
    order: 50,
    matchers: [/学习/u, /learning/u, /study/u],
  },
  {
    key: "other",
    label: "其他",
    shortLabel: "其他",
    color: "#D6C4AD",
    order: 60,
    matchers: [],
  },
];

function aggregateToYearly(monthly: ChartDataset): ChartDataset {
  const maxAge = Math.ceil(Math.max(...monthly.ages.map(Number)));
  const yearLabels: string[] = [];
  for (let y = 0; y <= maxAge; y += 1) {
    yearLabels.push(String(y));
  }

  const yearlySeries = monthly.series.map((item) => {
    const yearData = yearLabels.map((yearStr) => {
      const year = Number(yearStr);
      const indices: number[] = [];
      monthly.ages.forEach((ageText, index) => {
        const age = Number(ageText);
        if (age >= year && age < year + 1) {
          indices.push(index);
        }
      });
      if (indices.length === 0) {
        return 0;
      }
      return indices.reduce((sum, index) => sum + (item.data[index] ?? 0), 0) / indices.length;
    });
    return { ...item, data: yearData };
  });

  for (let column = 0; column < yearLabels.length; column += 1) {
    const normalized = normalizeTo100(yearlySeries.map((series) => series.data[column]));
    yearlySeries.forEach((series, index) => {
      series.data[column] = normalized[index];
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

function findDisplaySeriesProfile(label: string) {
  const normalized = label.toLowerCase().replace(/\s+/gu, "");
  return DISPLAY_SERIES_PROFILES.find((profile) => profile.matchers.some((matcher) => matcher.test(normalized))) ?? null;
}

function getDisplaySeriesProfileByKey(key: string) {
  return DISPLAY_SERIES_PROFILES.find((profile) => profile.key === key) ?? null;
}

function hasVisibleData(data: number[]) {
  return data.some((value) => value > 0.05);
}

function groupChartDataset(dataset: ChartDataset): ChartDataset {
  const grouped = new Map<string, ChartSeries>();

  dataset.series.forEach((item) => {
    const profile = findDisplaySeriesProfile(item.label) ?? DISPLAY_SERIES_PROFILES.find((entry) => entry.key === "other");
    if (!profile) {
      return;
    }

    const existing = grouped.get(profile.key) ?? {
      key: profile.key,
      label: profile.label,
      color: profile.color,
      data: dataset.ages.map(() => 0),
    };

    item.data.forEach((value, index) => {
      existing.data[index] = Number(((existing.data[index] ?? 0) + value).toFixed(2));
    });
    grouped.set(profile.key, existing);
  });

  const ordered = Array.from(grouped.values())
    .filter((item) => hasVisibleData(item.data))
    .sort((left, right) => {
      const leftOrder = DISPLAY_SERIES_PROFILES.find((item) => item.key === left.key)?.order ?? 999;
      const rightOrder = DISPLAY_SERIES_PROFILES.find((item) => item.key === right.key)?.order ?? 999;
      return leftOrder - rightOrder;
    });

  for (let columnIndex = 0; columnIndex < dataset.ages.length; columnIndex += 1) {
    const normalized = normalizeTo100(ordered.map((series) => series.data[columnIndex] ?? 0));
    ordered.forEach((series, seriesIndex) => {
      series.data[columnIndex] = normalized[seriesIndex] ?? 0;
    });
  }

  return {
    ages: [...dataset.ages],
    series: ordered,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickLabelIndex(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  if (values.length === 1) {
    return 0;
  }

  const totalWeight = values.reduce((sum, value) => sum + Math.max(value, 0.1), 0);
  const weightedCenter = values.reduce((sum, value, index) => sum + index * Math.max(value, 0.1), 0) / totalWeight;
  const safeMin = values.length > 6 ? 1 : 0;
  const safeMax = values.length > 6 ? values.length - 2 : values.length - 1;
  const preferred = clamp(Math.round(weightedCenter), safeMin, safeMax);

  let bestIndex = preferred;
  let bestScore = Number.NEGATIVE_INFINITY;

  values.forEach((value, index) => {
    const centrality = 1 - Math.abs(0.5 - index / (values.length - 1));
    const score = value * 1.8 + centrality * 12 - Math.abs(index - preferred) * 1.5;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function buildLabelPlacements(dataset: ChartDataset, compact: boolean): LabelPlacement[] {
  if (dataset.series.length === 0 || dataset.ages.length === 0) {
    return [];
  }

  const placements = dataset.series
    .map((item, seriesIndex) => {
      const bestIndex = pickLabelIndex(item.data);
      const value = item.data[bestIndex] ?? 0;
      if (value < (compact ? 14 : 6)) {
        return null;
      }

      const stackedBefore = dataset.series
        .slice(0, seriesIndex)
        .reduce((sum, series) => sum + (series.data[bestIndex] ?? 0), 0);
      const profile = getDisplaySeriesProfileByKey(item.key);
      const left = dataset.ages.length === 1 ? 50 : (bestIndex / (dataset.ages.length - 1)) * 100;
      const top = stackedBefore + value / 2;
      const align = left < 20 ? "left" : left > 82 ? "right" : "center";
      const fontClass =
        compact
          ? value >= 26
            ? "text-[0.72rem] sm:text-[0.8rem]"
            : value >= 18
              ? "text-[0.66rem] sm:text-[0.74rem]"
              : "text-[0.6rem] sm:text-[0.68rem]"
          : value >= 26
            ? "text-lg md:text-[2.2rem]"
            : value >= 18
              ? "text-base md:text-[1.8rem]"
              : "text-sm md:text-[1.35rem]";

      return {
        key: item.key,
        label: item.label,
        displayLabel: compact ? (profile?.shortLabel ?? item.label) : item.label,
        color: item.color,
        left,
        top,
        align,
        value,
        fontClass,
      };
    })
    .filter((item): item is LabelPlacement => Boolean(item));

  const filteredPlacements = compact
    ? (() => {
        const kept: LabelPlacement[] = [];
        [...placements]
          .sort((left, right) => right.value - left.value)
          .forEach((placement) => {
            const overlaps = kept.some((current) => {
              return Math.abs(current.left - placement.left) < 20 && Math.abs(current.top - placement.top) < 17;
            });
            if (!overlaps) {
              kept.push(placement);
            }
          });

        return kept.sort((left, right) => left.top - right.top);
      })()
    : placements;

  const adjusted = filteredPlacements.map((placement) => ({ ...placement }));
  for (let leftIndex = 0; leftIndex < adjusted.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < adjusted.length; rightIndex += 1) {
      const leftPlacement = adjusted[leftIndex];
      const rightPlacement = adjusted[rightIndex];
      const overlaps =
        Math.abs(leftPlacement.left - rightPlacement.left) < (compact ? 18 : 16) &&
        Math.abs(leftPlacement.top - rightPlacement.top) < (compact ? 14 : 12);

      if (!overlaps) {
        continue;
      }

      const target = leftPlacement.value >= rightPlacement.value ? rightPlacement : leftPlacement;
      const anchor = target === rightPlacement ? leftPlacement : rightPlacement;
      const shiftX = target.left <= anchor.left ? -10 : 10;
      const shiftY = target.top <= anchor.top ? -6 : 6;
      target.left = clamp(target.left + shiftX, 8, 92);
      target.top = clamp(target.top + shiftY, 8, 92);
      target.align = target.left < 20 ? "left" : target.left > 82 ? "right" : "center";
    }
  }

  return adjusted.sort((left, right) => left.top - right.top);
}

function formatPercentage(value: number) {
  if (value >= 10) {
    return `${Math.round(value)}%`;
  }
  return `${value.toFixed(1)}%`;
}

export function TimeAreaSection({ timeline, timeSeries }: { timeline: TimelineNode[]; timeSeries?: HomeTimeSeries }) {
  const reduceMotion = Boolean(useReducedMotion());
  const [Chart, setChart] = useState<ComponentType<EChartsLikeProps> | null>(null);
  const [echartsRuntime, setEchartsRuntime] = useState<unknown>(null);
  const [chartUnavailable, setChartUnavailable] = useState(false);
  const [chartHeight, setChartHeight] = useState(560);
  const [activeSeriesKey, setActiveSeriesKey] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) {
        setChartHeight(360);
        return;
      }
      if (window.innerWidth < 1024) {
        setChartHeight(460);
        return;
      }
      setChartHeight(560);
    };

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

  const chartGrid = useMemo(() => {
    if (chartHeight <= 360) {
      return { left: 44, right: 18, top: 24, bottom: 44 };
    }
    if (chartHeight <= 460) {
      return { left: 54, right: 22, top: 30, bottom: 52 };
    }
    return { left: 72, right: 28, top: 36, bottom: 60 };
  }, [chartHeight]);

  const chartData = useMemo(() => {
    const monthly = buildChartFromBackend(timeSeries) ?? buildChartFromTimeline(timeline);
    const isMonthly = monthly.ages.length > 10 && monthly.ages.every((age) => !Number.isNaN(Number(age)));
    const yearly = isMonthly ? aggregateToYearly(monthly) : monthly;
    return groupChartDataset(yearly);
  }, [timeSeries, timeline]);

  const compactChart = chartHeight <= 360;
  const labelPlacements = useMemo(() => buildLabelPlacements(chartData, compactChart), [chartData, compactChart]);

  const latestDistribution = useMemo(() => {
    return Object.fromEntries(
      chartData.series.map((item) => [item.key, item.data[item.data.length - 1] ?? 0]),
    ) as Record<string, number>;
  }, [chartData.series]);

  const hasActiveSeries = activeSeriesKey !== null;
  const activeOverlay = useMemo(() => {
    if (!activeSeriesKey) {
      return null;
    }

    const activeIndex = chartData.series.findIndex((item) => item.key === activeSeriesKey);
    if (activeIndex < 0) {
      return null;
    }

    const activeItem = chartData.series[activeIndex];
    const upper = chartData.ages.map((_, dataIndex) => {
      const stackedBefore = chartData.series
        .slice(0, activeIndex)
        .reduce((sum, series) => sum + (series.data[dataIndex] ?? 0), 0);
      return clamp(100 - stackedBefore, 0, 100);
    });
    const lower = chartData.ages.map((_, dataIndex) => {
      const stackedThroughActive = chartData.series
        .slice(0, activeIndex + 1)
        .reduce((sum, series) => sum + (series.data[dataIndex] ?? 0), 0);
      return clamp(100 - stackedThroughActive, 0, 100);
    });

    return {
      item: activeItem,
      upper,
      lower,
    };
  }, [activeSeriesKey, chartData]);

  const option = useMemo(() => {
    const baseSeries = chartData.series.map((item, index) => {
      const isActive = activeSeriesKey === item.key;
      const lineColor = hasActiveSeries ? "rgba(255,255,255,0.48)" : "rgba(255,255,255,0.84)";
      const areaOpacity = isActive ? 1 : hasActiveSeries ? 0.3 : 0.88;

      return {
        name: item.label,
        type: "line",
        z: isActive ? 36 : 20 - index,
        stack: "Total",
        smooth: 0.58,
        smoothMonotone: "x",
        showSymbol: false,
        symbol: "none",
        lineStyle: {
          width: hasActiveSeries ? 2.5 : 4,
          color: lineColor,
          cap: "round",
          join: "round",
        },
        areaStyle: {
          opacity: areaOpacity,
          color: item.color,
        },
        emphasis: {
          disabled: true,
        },
        data: item.data,
      };
    });

    const highlightSeries = activeOverlay
      ? [
          {
            name: `${activeOverlay.item.label}-upper`,
            type: "line",
            z: 58,
            showSymbol: false,
            symbol: "none",
            smooth: 0.58,
            smoothMonotone: "x",
            silent: true,
            tooltip: { show: false },
            lineStyle: {
              width: 6,
              color: "rgba(255,255,255,0.98)",
              cap: "round",
              join: "round",
              shadowBlur: 12,
              shadowColor: "rgba(148,163,184,0.22)",
            },
            areaStyle: { opacity: 0 },
            data: activeOverlay.upper,
          },
          {
            name: `${activeOverlay.item.label}-lower`,
            type: "line",
            z: 58,
            showSymbol: false,
            symbol: "none",
            smooth: 0.58,
            smoothMonotone: "x",
            silent: true,
            tooltip: { show: false },
            lineStyle: {
              width: 6,
              color: "rgba(255,255,255,0.98)",
              cap: "round",
              join: "round",
              shadowBlur: 12,
              shadowColor: "rgba(148,163,184,0.22)",
            },
            areaStyle: { opacity: 0 },
            data: activeOverlay.lower,
          },
        ]
      : [];

    return {
      animation: !reduceMotion,
      animationDuration: 950,
      animationDurationUpdate: 500,
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "line",
          lineStyle: {
            color: "rgba(255,255,255,0.96)",
            width: 2.5,
          },
        },
        borderWidth: 0,
        backgroundColor: "rgba(15,23,42,0.86)",
        textStyle: { color: "#f8fafc", fontSize: 12 },
        padding: [10, 12],
        formatter: (
          params: Array<{
            axisValueLabel?: string;
            marker?: string;
            seriesName?: string;
            value?: number | string;
          }>,
        ) => {
          const age = params[0]?.axisValueLabel ?? "";
          const rows = [...params]
            .map((item) => ({
              marker: item.marker ?? "",
              seriesName: item.seriesName ?? "",
              value: Number(item.value ?? 0),
            }))
            .sort((left, right) => right.value - left.value)
            .map((item) => `${item.marker}${item.seriesName}: ${formatPercentage(item.value)}`)
            .join("<br/>");

          return `<div><div style="font-weight:600;margin-bottom:6px;">Age ${age}</div>${rows}</div>`;
        },
      },
      legend: { show: false },
      grid: {
        ...chartGrid,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: chartData.ages,
        axisLabel: {
          show: true,
          color: "#475569",
          fontSize: chartHeight <= 360 ? 13 : 16,
          fontWeight: 500,
          formatter: (value: string) => {
            const age = Math.round(Number(value));
            if (AGE_TICKS.includes(age)) {
              return String(age);
            }
            return "";
          },
          interval: 0,
          margin: 16,
        },
        axisTick: {
          show: true,
          interval: 0,
          length: chartHeight <= 360 ? 8 : 12,
          lineStyle: { color: "rgba(71,85,105,0.82)", width: 2 },
        },
        splitLine: { show: false },
        axisLine: {
          lineStyle: { color: "rgba(71,85,105,0.82)", width: 2 },
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          show: true,
          formatter: (value: number) => {
            if (value === 0) {
              return "0";
            }
            if (value > 0 && value < 100 && value % 20 === 0) {
              return `${value}%`;
            }
            return "";
          },
          color: "#475569",
          fontSize: chartHeight <= 360 ? 13 : 16,
          fontWeight: 500,
          margin: 14,
        },
        axisTick: {
          show: true,
          length: chartHeight <= 360 ? 8 : 12,
          lineStyle: { color: "rgba(71,85,105,0.82)", width: 2 },
        },
        splitLine: { show: false },
        axisLine: {
          show: true,
          lineStyle: { color: "rgba(71,85,105,0.82)", width: 2 },
        },
      },
      series: [...baseSeries, ...highlightSeries],
    };
  }, [activeOverlay, activeSeriesKey, chartData, chartGrid, chartHeight, hasActiveSeries, reduceMotion]);

  const cardBody = (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.12),transparent_28%)]" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-sm">
        {Chart && !chartUnavailable ? (
          <>
            <div className="relative" onMouseLeave={() => setActiveSeriesKey(null)}>
              <Chart
                echarts={echartsRuntime ?? undefined}
                lazyUpdate
                notMerge
                option={option}
                style={{ height: chartHeight, width: "100%" }}
              />

              <div
                className="pointer-events-none absolute"
                style={{ inset: `${chartGrid.top}px ${chartGrid.right}px ${chartGrid.bottom}px ${chartGrid.left}px` }}
              >
                {labelPlacements.map((placement) => {
                  const isActive = activeSeriesKey === placement.key;
                  const isDimmed = hasActiveSeries && !isActive;
                  const translateX =
                    placement.align === "left" ? "0%" : placement.align === "right" ? "-100%" : "-50%";

                  return (
                    <div
                      key={placement.key}
                      role="button"
                      tabIndex={0}
                      aria-label={`高亮 ${placement.label}`}
                      className={`pointer-events-auto absolute select-none text-slate-700 transition-all duration-200 ${
                        isActive ? "scale-[1.03]" : isDimmed ? "opacity-55" : "opacity-95"
                      }`}
                      style={{
                        left: `${placement.left}%`,
                        top: `${placement.top}%`,
                        transform: `translate(${translateX}, -50%)`,
                      }}
                      onMouseEnter={() => setActiveSeriesKey(placement.key)}
                      onFocus={() => setActiveSeriesKey(placement.key)}
                      onMouseLeave={() => setActiveSeriesKey(null)}
                      onBlur={() => setActiveSeriesKey(null)}
                    >
                        <span
                          className={`${placement.fontClass} block whitespace-nowrap font-semibold leading-none tracking-tight text-slate-700 transition-colors duration-200`}
                          style={{
                            color: isActive ? "#24364f" : "rgba(51,65,85,0.94)",
                            textShadow: isActive
                              ? "0 1px 0 rgba(255,255,255,0.75)"
                              : "0 1px 0 rgba(255,255,255,0.55)",
                          }}
                        >
                          {placement.displayLabel}
                        </span>
                    </div>
                  );
                })}

                <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border border-white/80 bg-white/74 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 shadow-[0_10px_24px_rgba(148,163,184,0.18)] md:text-sm">
                  Age
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-white/65 px-4 pb-5 pt-4 md:px-6">
              {chartData.series.map((item) => {
                const value = latestDistribution[item.key] ?? 0;
                const isActive = activeSeriesKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className="rounded-full bg-white/78 px-3 py-2 text-left shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition-all duration-200"
                    style={{
                      borderColor: isActive ? item.color : "rgba(226,232,240,0.9)",
                      borderStyle: "solid",
                      borderWidth: isActive ? 3 : 1.5,
                      boxShadow: isActive
                        ? `0 12px 28px rgba(148,163,184,0.18), inset 0 0 0 1px ${item.color}`
                        : "0 10px 24px rgba(148,163,184,0.12)",
                    }}
                    onMouseEnter={() => setActiveSeriesKey(item.key)}
                    onFocus={() => setActiveSeriesKey(item.key)}
                    onMouseLeave={() => setActiveSeriesKey(null)}
                    onBlur={() => setActiveSeriesKey(null)}
                  >
                    <span className="block text-sm font-semibold text-slate-700">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">现在约 {formatPercentage(value)}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-4 px-5 py-6">
            <p className="text-sm text-amber-700">Chart runtime unavailable. Showing latest normalized percentages.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {chartData.series.map((item) => {
                const value = latestDistribution[item.key] ?? 0;
                return (
                  <div key={item.key} className="rounded-2xl border border-white/75 bg-white/65 p-4 shadow-[0_10px_24px_rgba(148,163,184,0.12)]">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                      <span>{item.label}</span>
                      <span>{formatPercentage(value)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <section id="time" className="space-y-5">
      <div className="space-y-3 px-1">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Time</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-800 md:text-4xl xl:text-[3.8rem]">时间都去哪了？</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
            把零散活动折叠成更大的生活切片，直接看到每个阶段的重心。悬停标签或底部类目，分界线会加粗。
          </p>
        </div>
      </div>

      {reduceMotion ? (
        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),rgba(232,237,242,0.92)_45%,rgba(222,232,241,0.84))] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:p-5">
          {cardBody}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="relative overflow-hidden rounded-[2.4rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),rgba(232,237,242,0.92)_45%,rgba(222,232,241,0.84))] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:p-5"
        >
          {cardBody}
        </motion.div>
      )}
    </section>
  );
}
