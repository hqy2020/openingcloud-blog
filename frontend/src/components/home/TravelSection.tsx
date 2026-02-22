import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import type { TravelProvince } from "../../api/home";
import type { CurrentLocation } from "../../data/revamp/location";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type TravelSectionProps = {
  travel: TravelProvince[];
  currentLocation?: CurrentLocation | null;
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

function formatVisitedAtLabel(value: string | null | undefined) {
  if (!value) {
    return "时间未记录";
  }
  const parts = value.split("-");
  if (parts.length !== 3) {
    return value;
  }
  const [year, month, day] = parts;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatCityTooltip(params: unknown) {
  if (!params || typeof params !== "object") {
    return "";
  }
  const payload = params as {
    seriesType?: string;
    data?: {
      name?: string;
      province?: string;
      visitedAt?: string | null;
      status?: string;
      isCurrent?: boolean;
    };
  };

  if (payload.seriesType !== "effectScatter") {
    return "";
  }

  const city = payload.data?.name ?? "未知城市";
  const province = payload.data?.province ?? "";
  if (payload.data?.isCurrent) {
    const cityLine = province ? `${province} · ${city}` : city;
    const status = payload.data?.status ?? "当前所在";
    return `${cityLine}<br/>${status}`;
  }
  const visitedAt = formatVisitedAtLabel(payload.data?.visitedAt);
  const cityLine = province ? `${province} · ${city}` : city;
  return `${cityLine}<br/>${visitedAt}`;
}

export function TravelSection({ travel, currentLocation }: TravelSectionProps) {
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
    const cityData = revealedCities
      .filter((city) => city.longitude !== null && city.latitude !== null)
      .map((city) => ({
        name: city.city,
        value: [city.longitude, city.latitude, 1],
        province: city.province,
        visitedAt: city.visited_at,
      }));

    const currentPoint = currentLocation
      ? {
          name: currentLocation.city,
          value: [currentLocation.longitude, currentLocation.latitude, 1],
          province: currentLocation.province,
          status: currentLocation.status,
          isCurrent: true,
        }
      : null;

    return {
      animation: true,
      animationDuration: 650,
      animationEasing: "cubicOut",
      animationDurationUpdate: 520,
      animationEasingUpdate: "cubicInOut",
      tooltip: {
        trigger: "item",
        formatter: (params: unknown) => formatCityTooltip(params),
      },
      series: [
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
        ...(currentPoint
          ? [
              {
                name: "当前",
                type: "effectScatter",
                coordinateSystem: "geo",
                rippleEffect: { scale: 7, brushType: "stroke", period: 3.2 },
                symbolSize: 14,
                zlevel: 5,
                z: 18,
                itemStyle: {
                  color: "#f97316",
                  borderColor: "#fff7ed",
                  borderWidth: 2,
                  shadowBlur: 18,
                  shadowColor: "rgba(249, 115, 22, 0.42)",
                },
                data: [currentPoint],
              },
              {
                name: "雷达圈",
                type: "effectScatter",
                coordinateSystem: "geo",
                rippleEffect: { scale: 11, brushType: "stroke", period: 2.8 },
                symbolSize: 22,
                zlevel: 4,
                z: 16,
                itemStyle: {
                  color: "rgba(249,115,22,0.18)",
                },
                silent: true,
                tooltip: { show: false },
                data: [currentPoint],
              },
            ]
          : []),
      ],
      geo: {
        map: "china",
        roam: false,
        silent: true,
        itemStyle: {
          areaColor: "#eef2f7",
          borderColor: "#c7d3e3",
          borderWidth: 1,
        },
        emphasis: {
          disabled: true,
        },
      },
    };
  }, [currentLocation, revealedCities]);

  return (
    <ScrollReveal className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">旅行足迹</h2>
        <div className="text-right">
          <p className="text-sm text-slate-500">已点亮 {displayProvinceCount} 个省份 / 34</p>
          {currentLocation ? <p className="text-xs text-slate-500">当前所在：{currentLocation.city}</p> : null}
        </div>
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
                      <p className="mt-1 text-sm text-slate-600">
                        {province.cities
                          .map((city) => {
                            const isCurrent =
                              currentLocation &&
                              city.city === currentLocation.city &&
                              province.province === currentLocation.province;
                            return isCurrent ? `${city.city}(当前)` : city.city;
                          })
                          .join("、")}
                      </p>
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
