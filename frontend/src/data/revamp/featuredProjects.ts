export type FeaturedProject = {
  id: string;
  name: string;
  summary: string;
  repo_path: string;
  detail: string;
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
    repo_path: "hqy2020/openingcloud-blog",
    detail: "包含 11 个首页互动分区，支持前后端分离部署与内容管理。",
    href: "https://github.com/hqy2020/openingcloud-blog",
    tech_stack: ["TypeScript", "Python", "React", "Django", "Tailwind", "Docker", "Shell"],
  },
  {
    id: "proj-algorithm-trainer",
    name: "algorithm-trainer",
    summary: "算法训练与刷题工程，包含 TypeScript/Python 代码与训练脚本。",
    repo_path: "hqy2020/algorithm-trainer",
    detail: "按题型与训练节奏组织题目，便于复盘和持续迭代。",
    href: "https://github.com/hqy2020/algorithm-trainer",
    tech_stack: ["TypeScript", "Python", "Docker", "Shell"],
  },
  {
    id: "proj-bagu",
    name: "bagu",
    summary: "实验性双栈项目，使用 TypeScript 与 Python，配套容器与脚本支持。",
    repo_path: "hqy2020/bagu",
    detail: "面向快速原型验证，沉淀跨语言工程结构与开发脚手架。",
    href: "https://github.com/hqy2020/bagu",
    tech_stack: ["TypeScript", "Python", "Docker", "Shell"],
  },
  {
    id: "proj-thesis-2025",
    name: "2025_HQY_Thesis",
    summary: "2025 届毕业论文仓库，主要用 TeX 维护正文与构建流程。",
    repo_path: "hqy2020/2025_HQY_Thesis",
    detail: "支持章节化管理和自动化编译，便于版本追踪与内容审阅。",
    href: "https://github.com/hqy2020/2025_HQY_Thesis",
    tech_stack: ["TeX", "Shell"],
  },
  {
    id: "proj-hqy2020",
    name: "hqy2020",
    summary: "GitHub 个人主页仓库，用 Markdown 展示项目导航与年度记录。",
    repo_path: "hqy2020/hqy2020",
    detail: "作为 Profile README 首页，聚合个人导航、年度更新与成果入口。",
    href: "https://github.com/hqy2020/hqy2020",
    tech_stack: ["Markdown"],
  },
];
