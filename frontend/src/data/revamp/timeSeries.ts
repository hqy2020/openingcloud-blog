export type TimeSeriesKey = "family" | "gaming" | "sports" | "music" | "learning" | "coding" | "work";

export type TimeAreaSeriesItem = {
  key: TimeSeriesKey;
  label: string;
  color: string;
};

export type TimeAreaSeriesConfig = {
  birth_date: string;
  fallback_bucket: TimeSeriesKey;
  series: TimeAreaSeriesItem[];
};

export const timeAreaSeriesConfig: TimeAreaSeriesConfig = {
  birth_date: "2000-09-01",
  fallback_bucket: "family",
  series: [
    { key: "family",   label: "社交&家庭", color: "#FF8066" },
    { key: "gaming",   label: "游戏",      color: "#3BC9DB" },
    { key: "sports",   label: "运动",      color: "#94D82D" },
    { key: "music",    label: "音乐",      color: "#F783AC" },
    { key: "learning", label: "学习",      color: "#FCC419" },
    { key: "coding",   label: "写代码",    color: "#74C0FC" },
    { key: "work",     label: "工作",      color: "#9775FA" },
  ],
};
