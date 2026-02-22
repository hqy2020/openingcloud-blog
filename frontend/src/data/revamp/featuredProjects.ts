export type FeaturedProject = {
  id: string;
  name: string;
  summary: string;
  href: string;
  tech_stack: string[];
};

export const featuredTechStack = [
  "React",
  "TypeScript",
  "Three",
  "ECharts",
  "Django",
  "Docker",
  "Tailwind",
  "Motion",
] as const;

export const featuredProjects: FeaturedProject[] = [
  {
    id: "proj-blog",
    name: "openingcloud-blog",
    summary: "全栈博客系统，覆盖首页可视化、分类检索、文章阅读与后台管理。",
    href: "https://github.com/hqy2020/openingcloud-blog",
    tech_stack: ["React", "TypeScript", "Django", "Docker", "Tailwind", "Motion", "ECharts"],
  },
  {
    id: "proj-garden",
    name: "GardenOfOpeningClouds",
    summary: "个人知识花园与内容整理仓库，承载长期笔记与知识链接。",
    href: "https://github.com/hqy2020/GardenOfOpeningClouds",
    tech_stack: ["TypeScript", "React", "Tailwind"],
  },
  {
    id: "proj-profile",
    name: "hqy2020",
    summary: "GitHub 个人主页仓库，沉淀个人能力图谱、项目索引与年度记录。",
    href: "https://github.com/hqy2020/hqy2020",
    tech_stack: ["TypeScript", "React", "Tailwind", "Motion"],
  },
  {
    id: "proj-sync",
    name: "obsidian-sync-pipeline",
    summary: "Obsidian 到博客的同步链路，支持定时同步、标签筛选和内容发布流程。",
    href: "https://github.com/hqy2020/openingcloud-blog",
    tech_stack: ["Django", "TypeScript", "Docker"],
  },
  {
    id: "proj-viz",
    name: "travel-time-visuals",
    summary: "把 timeline 与旅行数据转成地图、堆叠面积图与雷达图的可视化模块。",
    href: "https://github.com/hqy2020/openingcloud-blog",
    tech_stack: ["ECharts", "TypeScript", "React", "Tailwind"],
  },
  {
    id: "proj-admin",
    name: "admin-ops-tooling",
    summary: "后台能力与部署脚本集，覆盖导入、备份、恢复、健康检查与上线流程。",
    href: "https://github.com/hqy2020/openingcloud-blog",
    tech_stack: ["Django", "Docker", "TypeScript", "Tailwind"],
  },
];
