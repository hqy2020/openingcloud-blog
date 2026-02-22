import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import { radarMetricSets, type RadarMetricSet } from "../../../data/revamp/radarMetrics";

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

function buildRadarOption(set: RadarMetricSet) {
  return {
    tooltip: {
      trigger: "item",
    },
    radar: {
      shape: "polygon",
      splitNumber: 5,
      radius: "68%",
      indicator: set.metrics.map((metric) => ({ name: metric.label, max: 100 })),
      axisName: { color: "#334155", fontSize: 12 },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.32)" } },
      splitArea: {
        areaStyle: {
          color: [
            "rgba(255,255,255,0.04)",
            "rgba(79,106,229,0.03)",
            "rgba(79,106,229,0.06)",
            "rgba(79,106,229,0.09)",
            "rgba(79,106,229,0.12)",
          ],
        },
      },
    },
    series: [
      {
        name: set.title,
        type: "radar",
        data: [
          {
            value: set.metrics.map((metric) => metric.value),
            name: set.title,
            areaStyle: { color: "rgba(79,106,229,0.3)" },
            lineStyle: { width: 2.3, color: "#4F6AE5" },
            itemStyle: { color: "#4F6AE5" },
            symbolSize: 5,
          },
        ],
      },
    ],
  };
}

function RadarFallbackTable({ metricSet }: { metricSet: RadarMetricSet }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/88">
      <table className="w-full border-collapse text-sm text-slate-700">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">维度</th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">数值</th>
          </tr>
        </thead>
        <tbody>
          {metricSet.metrics.map((metric) => (
            <tr key={`${metricSet.id}-${metric.label}`} className="border-t border-slate-100">
              <td className="px-3 py-2">{metric.label}</td>
              <td className="px-3 py-2 text-right font-medium">{metric.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DualRadarSection() {
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

  const options = useMemo(() => radarMetricSets.map((set) => buildRadarOption(set)), []);

  return (
    <section id="radar" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Radar</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-800">双雷达图</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {radarMetricSets.map((metricSet, index) => (
          <article
            key={metricSet.id}
            className="rounded-2xl border border-slate-200/80 bg-white/82 p-4 shadow-[0_12px_26px_rgba(15,23,42,0.1)] backdrop-blur"
          >
            <h3 className="text-base font-semibold text-slate-800">{metricSet.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{metricSet.subtitle}</p>
            <div className="mt-3">
              {Chart && !chartUnavailable ? (
                <Chart
                  echarts={echartsRuntime ?? undefined}
                  lazyUpdate
                  notMerge
                  option={options[index]}
                  style={{ height: 320, width: "100%" }}
                />
              ) : (
                <RadarFallbackTable metricSet={metricSet} />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
