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
    { key: "family",   label: "社交&家庭", color: "#CBA782" },
    { key: "gaming",   label: "游戏",      color: "#D9A05B" },
    { key: "sports",   label: "运动",      color: "#D9958F" },
    { key: "music",    label: "音乐",      color: "#A38F9B" },
    { key: "learning", label: "学习",      color: "#6B90A6" },
    { key: "coding",   label: "写代码",    color: "#7E9C8A" },
    { key: "work",     label: "工作",      color: "#9B8EA0" },
  ],
};
