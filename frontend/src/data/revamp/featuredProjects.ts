export type FeaturedProject = {
  id: string;
  name: string;
  summary: string;
  href: string;
  tech_stack: string[];
};

export const featuredTechStack = [
  "TypeScript",
  "Python",
  "React",
  "Django",
  "Tailwind",
  "Docker",
  "Shell",
  "TeX",
  "Markdown",
] as const;

export const featuredProjects: FeaturedProject[] = [
  {
    id: "proj-openingcloud-blog",
    name: "openingcloud-blog",
    summary: "个人博客系统，React + Django 全栈实现，使用 Docker + Nginx 部署。",
    href: "https://github.com/hqy2020/openingcloud-blog",
    tech_stack: ["TypeScript", "Python", "React", "Django", "Tailwind", "Docker", "Shell"],
  },
  {
    id: "proj-algorithm-trainer",
    name: "algorithm-trainer",
    summary: "算法训练与刷题工程，包含 TypeScript/Python 代码与训练脚本。",
    href: "https://github.com/hqy2020/algorithm-trainer",
    tech_stack: ["TypeScript", "Python", "Docker", "Shell"],
  },
  {
    id: "proj-bagu",
    name: "bagu",
    summary: "实验性双栈项目，使用 TypeScript 与 Python，配套容器与脚本支持。",
    href: "https://github.com/hqy2020/bagu",
    tech_stack: ["TypeScript", "Python", "Docker", "Shell"],
  },
  {
    id: "proj-thesis-2025",
    name: "2025_HQY_Thesis",
    summary: "2025 届毕业论文仓库，主要用 TeX 维护正文与构建流程。",
    href: "https://github.com/hqy2020/2025_HQY_Thesis",
    tech_stack: ["TeX", "Shell"],
  },
  {
    id: "proj-hqy2020",
    name: "hqy2020",
    summary: "GitHub 个人主页仓库，用 Markdown 展示项目导航与年度记录。",
    href: "https://github.com/hqy2020/hqy2020",
    tech_stack: ["Markdown"],
  },
];
