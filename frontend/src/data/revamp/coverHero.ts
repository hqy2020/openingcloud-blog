export type CoverHeroBadgeStat = {
  label: string;
  value: string;
};

export type CoverHeroBadge = {
  id: string;
  label: string;
  subtitle: string;
  icon_text: string;
  icon_src?: string;
  stats: CoverHeroBadgeStat[];
};

export type CoverHeroConfig = {
  my_name_is: string;
  spaced_name: string;
  role_line: string;
  one_liner: string;
  cta: {
    primary_label: string;
    primary_href: string;
    secondary_label: string;
    secondary_href: string;
  };
  badges: CoverHeroBadge[];
};

export const coverHeroConfig: CoverHeroConfig = {
  my_name_is: "My name is:",
  spaced_name: "openingClouds",
  role_line: "I'm a: 浙江大学硕士 · 全栈工程实践者 · 长期主义写作者",
  one_liner: "在云层之上，写下自己的坐标。把复杂讲清楚，把经验留给后来者。",
  cta: {
    primary_label: "开始阅读",
    primary_href: "/tech",
    secondary_label: "看看足迹",
    secondary_href: "#time",
  },
  badges: [
    {
      id: "zju",
      label: "浙江大学",
      subtitle: "School Badge",
      icon_text: "浙",
      icon_src: "/brand/badge-zju.svg",
      stats: [
        { label: "学习阶段", value: "2024.09 - 2026.03" },
        { label: "代表成果", value: "CCF-B 一作 / CCF-A 二作" },
      ],
    },
    {
      id: "aliyun",
      label: "阿里云",
      subtitle: "Cloud Badge",
      icon_text: "云",
      icon_src: "/brand/badge-aliyun.svg",
      stats: [
        { label: "实习阶段", value: "2025.04 - 2025.06" },
        { label: "实践方向", value: "云计算 + 工程化交付" },
      ],
    },
  ],
};
