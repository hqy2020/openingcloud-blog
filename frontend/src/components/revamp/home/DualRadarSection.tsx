import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import { radarMetricSets, type RadarMetricSet } from "../../../data/revamp/radarMetrics";
import type { RadarChartConfig } from "../../../api/home";

type EChartsLikeProps = {
  option: unknown;
  style?: CSSProperties;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  echarts?: unknown;
};

function unwrapDefault<T>(moduleValue: unknown): T {
  const first = (moduleValue as { default?: unknown })?.default ?? moduleValue;
  const second = (first as { default?: unknown })?.default ?? first;
  return second as T;
}

function apiToRadarMetricSet(cfg: RadarChartConfig): RadarMetricSet {
  return {
    id: cfg.id,
    title: cfg.title,
    subtitle: cfg.subtitle,
    metrics: cfg.metrics.map((m) => ({ label: m.label, value: m.value })),
  };
}

function buildRadarOption(set: RadarMetricSet) {
  return {
    tooltip: { show: false },
    radar: {
      shape: "circle",
      splitNumber: 4,
      radius: "65%",
      indicator: set.metrics.map((metric) => ({ name: metric.label, max: 100 })),
      axisName: { color: "#6b7280", fontSize: 13, fontWeight: 500 },
      axisLine: { lineStyle: { color: "rgba(209,213,219,0.5)" } },
      splitLine: { lineStyle: { color: "rgba(209,213,219,0.45)" } },
      splitArea: { show: false },
    },
    series: [
      {
        name: set.title,
        type: "radar",
        data: [
          {
            value: set.metrics.map((metric) => metric.value),
            name: set.title,
            areaStyle: { color: "rgba(134,197,173,0.35)" },
            lineStyle: { width: 2, color: "#6bc4a0" },
            itemStyle: { color: "#6bc4a0", borderColor: "#fff", borderWidth: 1.5 },
            symbolSize: 7,
          },
        ],
      },
    ],
  };
}

function RadarFallbackTable({ metricSet }: { metricSet: RadarMetricSet }) {
  return (
    <div className="overflow-hidden rounded-xl border border-theme-line/80 bg-theme-surface">
      <table className="w-full border-collapse text-sm text-theme-ink">
        <thead className="bg-theme-surface">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-theme-muted">维度</th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-theme-muted">数值</th>
          </tr>
        </thead>
        <tbody>
          {metricSet.metrics.map((metric) => (
            <tr key={`${metricSet.id}-${metric.label}`} className="border-t border-theme-line">
              <td className="px-3 py-2">{metric.label}</td>
              <td className="px-3 py-2 text-right font-medium">{metric.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type DualRadarSectionProps = {
  radarData?: RadarChartConfig[];
};

export function DualRadarSection({ radarData }: DualRadarSectionProps) {
  const [Chart, setChart] = useState<ComponentType<EChartsLikeProps> | null>(null);
  const [echartsRuntime, setEchartsRuntime] = useState<unknown>(null);
  const [chartUnavailable, setChartUnavailable] = useState(false);

  const metricSets: RadarMetricSet[] = useMemo(() => {
    if (radarData && radarData.length > 0) {
      return radarData.map(apiToRadarMetricSet);
    }
    return radarMetricSets;
  }, [radarData]);

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

  const options = useMemo(() => metricSets.map((set) => buildRadarOption(set)), [metricSets]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {metricSets.map((metricSet, index) => (
        <article
          key={metricSet.id}
          className="rounded-2xl bg-gray-50/80 px-5 pb-2 pt-5"
        >
          <h3 className="text-lg font-bold text-gray-800">{metricSet.title}</h3>
          <div className="mt-1">
            {Chart && !chartUnavailable ? (
              <Chart
                echarts={echartsRuntime ?? undefined}
                lazyUpdate
                notMerge
                option={options[index]}
                style={{ height: 240, width: "100%" }}
              />
            ) : (
              <RadarFallbackTable metricSet={metricSet} />
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
