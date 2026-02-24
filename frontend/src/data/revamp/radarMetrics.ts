export type RadarMetric = {
  label: string;
  value: number;
};

export type RadarMetricSet = {
  id: string;
  title: string;
  subtitle: string;
  metrics: RadarMetric[];
};

export const radarMetricSets: RadarMetricSet[] = [
  {
    id: "work-writing",
    title: "Learn",
    subtitle: "",
    metrics: [
      { label: "编码", value: 80 },
      { label: "协作", value: 85 },
      { label: "写作", value: 90 },
      { label: "沟通", value: 90 },
      { label: "速学", value: 40 },
      { label: "规划", value: 60 },
    ],
  },
  {
    id: "interest-life",
    title: "Habbit",
    subtitle: "",
    metrics: [
      { label: "运动", value: 90 },
      { label: "旅行", value: 60 },
      { label: "社交", value: 70 },
      { label: "音乐", value: 40 },
      { label: "厨艺", value: 75 },
      { label: "摄影", value: 65 },
    ],
  },
];
