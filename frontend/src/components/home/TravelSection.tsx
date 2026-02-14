import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import type { TravelProvince } from "../../api/home";

type TravelSectionProps = {
  travel: TravelProvince[];
};

type EChartsLikeProps = {
  option: unknown;
  style?: CSSProperties;
  notMerge?: boolean;
  lazyUpdate?: boolean;
};

export function TravelSection({ travel }: TravelSectionProps) {
  const [Chart, setChart] = useState<ComponentType<EChartsLikeProps> | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const canUseCanvas =
      typeof window !== "undefined" &&
      typeof document !== "undefined" &&
      !!document.createElement("canvas").getContext;

    if (!canUseCanvas) {
      return;
    }

    let cancelled = false;

    void (async () => {
      let mapLoaded = false;
      try {
        await import("china-map-data/china.js");
        mapLoaded = true;
      } catch {
        // The map bundle may be unavailable in some environments.
      }

      const module = await import("echarts-for-react");
      if (!cancelled) {
        setChart(() => module.default);
        setMapReady(mapLoaded);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const option = useMemo(() => {
    const provinceData = travel.map((item) => ({ name: item.province, value: item.count }));
    const cityData = travel.flatMap((item) =>
      item.cities
        .filter((city) => city.longitude !== null && city.latitude !== null)
        .map((city) => ({
          name: city.city,
          value: [city.longitude, city.latitude, 1],
          province: item.province,
        })),
    );

    return {
      tooltip: {
        trigger: "item",
      },
      visualMap: {
        min: 0,
        max: Math.max(1, ...provinceData.map((item) => item.value)),
        text: ["足迹", "少"],
        orient: "vertical",
        right: 10,
        top: "center",
        inRange: {
          color: ["#e2e8f0", "#4f46e5"],
        },
      },
      series: [
        {
          name: "省份",
          type: "map",
          map: "china",
          roam: false,
          label: { show: false },
          data: provinceData,
        },
        {
          name: "城市",
          type: "effectScatter",
          coordinateSystem: "geo",
          rippleEffect: { scale: 3 },
          symbolSize: 8,
          itemStyle: { color: "#f97316" },
          data: cityData,
        },
      ],
      geo: {
        map: "china",
        roam: false,
        silent: true,
      },
    };
  }, [travel]);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">旅行足迹</h2>
        <span className="text-sm text-slate-500">
          已点亮 {travel.length} 个省份 / 34
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {Chart && mapReady ? (
          <Chart lazyUpdate notMerge option={option} style={{ height: 480, width: "100%" }} />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {travel.map((province) => (
              <article key={province.province} className="rounded-xl bg-slate-50 p-4">
                <h3 className="font-medium text-slate-900">{province.province}</h3>
                <p className="mt-1 text-sm text-slate-600">{province.cities.map((city) => city.city).join("、")}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
