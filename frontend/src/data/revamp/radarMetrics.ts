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
    title: "工作/文章能力谱",
    subtitle: "工程实践与内容沉淀",
    metrics: [
      { label: "系统设计", value: 86 },
      { label: "工程交付", value: 88 },
      { label: "问题拆解", value: 85 },
      { label: "技术写作", value: 90 },
      { label: "研究输出", value: 84 },
      { label: "协作沟通", value: 80 },
      { label: "长期迭代", value: 92 },
    ],
  },
  {
    id: "interest-life",
    title: "兴趣爱好能力谱",
    subtitle: "生活节奏与持续探索",
    metrics: [
      { label: "旅行探索", value: 86 },
      { label: "运动习惯", value: 84 },
      { label: "阅读输入", value: 88 },
      { label: "效率实验", value: 92 },
      { label: "表达分享", value: 85 },
      { label: "关系经营", value: 89 },
      { label: "自我复盘", value: 94 },
    ],
  },
];
