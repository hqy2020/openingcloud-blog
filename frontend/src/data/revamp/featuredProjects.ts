export type FeaturedProject = {
  id: string;
  name: string;
  summary: string;
  summary_zh: string;
  repo_path: string;
  detail: string;
  detail_zh: string;
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
    summary: "A full-stack personal blog built with React and Django, deployed with Docker and Nginx.",
    summary_zh: "个人博客系统，React + Django 全栈实现，使用 Docker + Nginx 部署。",
    repo_path: "hqy2020/openingcloud-blog",
    detail: "Includes 11 interactive homepage sections with split frontend-backend deployment and content management.",
    detail_zh: "包含 11 个首页互动分区，支持前后端分离部署与内容管理。",
    href: "https://github.com/hqy2020/openingcloud-blog",
    tech_stack: ["TypeScript", "Python", "React", "Django", "Tailwind", "Docker", "Shell"],
  },
  {
    id: "proj-algorithm-trainer",
    name: "algorithm-trainer",
    summary: "An algorithm training repo with TypeScript/Python solutions and repeatable practice scripts.",
    summary_zh: "算法训练与刷题工程，包含 TypeScript/Python 代码与训练脚本。",
    repo_path: "hqy2020/algorithm-trainer",
    detail: "Problems are organized by topic and training cadence for easier review and steady iteration.",
    detail_zh: "按题型与训练节奏组织题目，便于复盘和持续迭代。",
    href: "https://github.com/hqy2020/algorithm-trainer",
    tech_stack: ["TypeScript", "Python", "Docker", "Shell"],
  },
  {
    id: "proj-bagu",
    name: "bagu",
    summary: "An experimental dual-stack project combining TypeScript and Python with containerized tooling.",
    summary_zh: "实验性双栈项目，使用 TypeScript 与 Python，配套容器与脚本支持。",
    repo_path: "hqy2020/bagu",
    detail: "Focused on rapid prototyping while refining cross-language architecture and dev scaffolding.",
    detail_zh: "面向快速原型验证，沉淀跨语言工程结构与开发脚手架。",
    href: "https://github.com/hqy2020/bagu",
    tech_stack: ["TypeScript", "Python", "Docker", "Shell"],
  },
  {
    id: "proj-thesis-2025",
    name: "2025_HQY_Thesis",
    summary: "Graduation thesis repository maintained with TeX for manuscript authoring and build workflows.",
    summary_zh: "2025 届毕业论文仓库，主要用 TeX 维护正文与构建流程。",
    repo_path: "hqy2020/2025_HQY_Thesis",
    detail: "Supports chapter-based management and automated compilation for traceable revisions and reviews.",
    detail_zh: "支持章节化管理和自动化编译，便于版本追踪与内容审阅。",
    href: "https://github.com/hqy2020/2025_HQY_Thesis",
    tech_stack: ["TeX", "Shell"],
  },
  {
    id: "proj-hqy2020",
    name: "hqy2020",
    summary: "GitHub profile repository using Markdown to present project navigation and yearly highlights.",
    summary_zh: "GitHub 个人主页仓库，用 Markdown 展示项目导航与年度记录。",
    repo_path: "hqy2020/hqy2020",
    detail: "Acts as the profile README landing page that aggregates links, updates, and key outcomes.",
    detail_zh: "作为 Profile README 首页，聚合个人导航、年度更新与成果入口。",
    href: "https://github.com/hqy2020/hqy2020",
    tech_stack: ["Markdown"],
  },
];
