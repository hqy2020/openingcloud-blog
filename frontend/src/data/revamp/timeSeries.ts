export type TimeSeriesKey = "learning" | "career" | "family" | "reflection" | "health";

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
  fallback_bucket: "reflection",
  series: [
    { key: "learning", label: "Learning", color: "#4F6AE5" },
    { key: "career", label: "Career", color: "#0EA5E9" },
    { key: "family", label: "Family", color: "#F59E0B" },
    { key: "reflection", label: "Reflection", color: "#8B5CF6" },
    { key: "health", label: "Health", color: "#10B981" },
  ],
};
