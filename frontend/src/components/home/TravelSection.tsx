import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import type { TravelProvince } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type TravelSectionProps = {
  travel: TravelProvince[];
};

type EChartsLikeProps = {
  option: unknown;
  style?: CSSProperties;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  echarts?: unknown;
};

type EChartsRuntime = {
  getMap?: (mapName: string) => unknown;
  registerMap?: (mapName: string, geoJson: unknown) => void;
};

type GeoJsonFeature = {
  properties?: {
    name?: string;
  };
};

type GeoJsonLike = {
  type?: string;
  features?: GeoJsonFeature[];
};

type OrderedTravelCity = {
  province: string;
  city: string;
  notes: string;
  visited_at: string | null;
  latitude: number | null;
  longitude: number | null;
  cover: string;
  sort_order: number;
};

const CHINA_GEOJSON_URL = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json";
const CITY_REVEAL_INTERVAL_MS = 560;

function unwrapDefault<T>(moduleValue: unknown): T {
  const first = (moduleValue as { default?: unknown })?.default ?? moduleValue;
  const second = (first as { default?: unknown })?.default ?? first;
  return second as T;
}

function isGeoJsonLike(value: unknown): value is GeoJsonLike {
  if (!value || typeof value !== "object") {
    return false;
  }
  return Array.isArray((value as GeoJsonLike).features);
}

export function TravelSection({ travel }: TravelSectionProps) {
  const [Chart, setChart] = useState<ComponentType<EChartsLikeProps> | null>(null);
  const [echartsRuntime, setEchartsRuntime] = useState<EChartsRuntime | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [fallbackHint, setFallbackHint] = useState<string | null>(null);
  const [activeLoad, setActiveLoad] = useState(false);
  const [revealedCityCount, setRevealedCityCount] = useState(0);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActiveLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeLoad) {
      return;
    }

    const canUseCanvas =
      typeof window !== "undefined" &&
      typeof document !== "undefined" &&
      !!document.createElement("canvas").getContext;

    if (!canUseCanvas) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [chartModule, echartsModule] = await Promise.all([import("echarts-for-react"), import("echarts")]);
        const echarts = unwrapDefault<EChartsRuntime>(echartsModule);
        let ready = Boolean(echarts.getMap?.("china"));

        // Prefer online GeoJSON to avoid old encoded map-format incompatibilities.
        if (!ready) {
          try {
            const response = await fetch(CHINA_GEOJSON_URL, { cache: "force-cache" });
            if (response.ok) {
              const onlineMap = (await response.json()) as unknown;
              if (isGeoJsonLike(onlineMap)) {
                echarts.registerMap?.("china", onlineMap);
                ready = Boolean(echarts.getMap?.("china"));
              }
            }
          } catch {
            // Continue to local map fallback.
          }
        }

        // Local data fallback if online GeoJSON is unavailable.
        if (!ready) {
          try {
            const localMapModule = await import("china-map-data/china.js");
            const localMap = unwrapDefault<unknown>(localMapModule);
            if (isGeoJsonLike(localMap)) {
              echarts.registerMap?.("china", localMap);
              ready = Boolean(echarts.getMap?.("china"));
            }
          } catch {
            // Keep fallback cards.
          }
        }

        if (!cancelled) {
          setChart(() => chartModule.default as ComponentType<EChartsLikeProps>);
          setEchartsRuntime(() => echarts);
          setMapReady(ready);
          setFallbackHint(ready ? null : "地图暂不可用，已切换为列表视图。");
        }
      } catch {
        if (!cancelled) {
          setChart(null);
          setEchartsRuntime(null);
          setMapReady(false);
          setFallbackHint("地图组件加载失败，已切换为列表视图。");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeLoad]);

  const orderedCities = useMemo(() => {
    const flattened: OrderedTravelCity[] = travel.flatMap((province) =>
      province.cities.map((city) => ({
        province: province.province,
        city: city.city,
        notes: city.notes,
        visited_at: city.visited_at,
        latitude: city.latitude,
        longitude: city.longitude,
        cover: city.cover,
        sort_order: city.sort_order,
      })),
    );

    return flattened.sort((a, b) => {
      const aDate = a.visited_at;
      const bDate = b.visited_at;
      if (aDate && bDate) {
        const byDate = aDate.localeCompare(bDate);
        if (byDate !== 0) {
          return byDate;
        }
      } else if (aDate || bDate) {
        return aDate ? -1 : 1;
      }

      const byOrder = a.sort_order - b.sort_order;
      if (byOrder !== 0) {
        return byOrder;
      }

      const byProvince = a.province.localeCompare(b.province, "zh-Hans-CN");
      if (byProvince !== 0) {
        return byProvince;
      }
      return a.city.localeCompare(b.city, "zh-Hans-CN");
    });
  }, [travel]);

  useEffect(() => {
    if (!activeLoad || !mapReady || hasPlayedOnce || orderedCities.length === 0) {
      return;
    }

    setRevealedCityCount(0);
    let next = 0;
    const timerId = window.setInterval(() => {
      next += 1;
      setRevealedCityCount(next);
      if (next >= orderedCities.length) {
        window.clearInterval(timerId);
        setHasPlayedOnce(true);
      }
    }, CITY_REVEAL_INTERVAL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [activeLoad, mapReady, hasPlayedOnce, orderedCities.length]);

  useEffect(() => {
    if (!hasPlayedOnce) {
      return;
    }
    setRevealedCityCount(orderedCities.length);
  }, [hasPlayedOnce, orderedCities.length]);

  const effectiveRevealedCityCount = hasPlayedOnce ? orderedCities.length : Math.min(revealedCityCount, orderedCities.length);
  const revealedCities = useMemo(
    () => orderedCities.slice(0, effectiveRevealedCityCount),
    [orderedCities, effectiveRevealedCityCount],
  );
  const totalProvinceCount = useMemo(() => new Set(travel.map((item) => item.province)).size, [travel]);
  const revealedProvinceCount = useMemo(() => new Set(revealedCities.map((city) => city.province)).size, [revealedCities]);
  const displayProvinceCount = Chart && mapReady ? revealedProvinceCount : totalProvinceCount;

  const option = useMemo(() => {
    const maxProvinceValue = Math.max(1, ...travel.map((item) => Math.max(item.count, item.cities.length)));
    const provinceCounts = new Map<string, number>();
    for (const city of revealedCities) {
      provinceCounts.set(city.province, (provinceCounts.get(city.province) ?? 0) + 1);
    }
    const provinceData = travel.map((item) => ({ name: item.province, value: provinceCounts.get(item.province) ?? 0 }));
    const cityData = revealedCities
      .filter((city) => city.longitude !== null && city.latitude !== null)
      .map((city) => ({
        name: city.city,
        value: [city.longitude, city.latitude, 1],
        province: city.province,
      }));

    return {
      animation: true,
      animationDuration: 650,
      animationEasing: "cubicOut",
      animationDurationUpdate: 520,
      animationEasingUpdate: "cubicInOut",
      tooltip: {
        trigger: "item",
      },
      visualMap: {
        show: false,
        seriesIndex: 0,
        min: 1,
        max: maxProvinceValue,
        inRange: {
          color: ["#7dd3fc", "#0284c7"],
        },
        outOfRange: {
          color: ["#eef2f7"],
        },
      },
      series: [
        {
          name: "省份",
          type: "map",
          map: "china",
          roam: false,
          label: { show: false },
          itemStyle: {
            borderColor: "#c7d3e3",
            borderWidth: 1,
          },
          data: provinceData,
        },
        {
          name: "城市",
          type: "effectScatter",
          coordinateSystem: "geo",
          rippleEffect: { scale: 3, brushType: "stroke", period: 4.8 },
          symbolSize: 10,
          zlevel: 3,
          z: 10,
          itemStyle: {
            color: "#0ea5e9",
            borderColor: "#ffffff",
            borderWidth: 1.5,
            shadowBlur: 10,
            shadowColor: "rgba(14, 165, 233, 0.3)",
          },
          data: cityData,
        },
      ],
      geo: {
        map: "china",
        roam: false,
        silent: true,
      },
    };
  }, [travel, revealedCities]);

  return (
    <ScrollReveal className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">旅行足迹</h2>
        <span className="text-sm text-slate-500">
          已点亮 {displayProvinceCount} 个省份 / 34
        </span>
      </div>

      <div ref={hostRef} className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur">
        {Chart && mapReady ? (
          <Chart echarts={echartsRuntime ?? undefined} lazyUpdate notMerge option={option} style={{ height: 480, width: "100%" }} />
        ) : (
          <div className="space-y-3">
            {fallbackHint ? <p className="text-xs text-amber-700">{fallbackHint}</p> : null}

            {travel.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-600">
                暂无旅行足迹数据。
              </div>
            ) : (
              <StaggerContainer className="grid gap-3 md:grid-cols-3" stagger={0.06}>
                {travel.map((province) => (
                  <StaggerItem key={province.province}>
                    <CardSpotlight className="rounded-xl bg-slate-50/85 p-4">
                      <h3 className="font-medium text-slate-900">{province.province}</h3>
                      <p className="mt-1 text-sm text-slate-600">{province.cities.map((city) => city.city).join("、")}</p>
                    </CardSpotlight>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}
