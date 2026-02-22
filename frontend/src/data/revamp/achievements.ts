export type AchievementCard = {
  id: string;
  title: string;
  period: string;
  description: string;
  href?: string;
};

export const achievementCards: AchievementCard[] = [
  {
    id: "ach-primary-captain",
    title: "三年大队长",
    period: "小学阶段",
    description: "在集体协作中建立责任感，形成长期坚持的底层习惯。",
  },
  {
    id: "ach-run-800-first",
    title: "校 800 米第一",
    period: "初中阶段",
    description: "把训练与复盘带入日常，持续迭代执行力和韧性。",
  },
  {
    id: "ach-gaokao",
    title: "高考 575 分",
    period: "2019",
    description: "在关键阶段完成目标验证，进入同济大学继续深造。",
  },
  {
    id: "ach-tongji-president",
    title: "学生会主席",
    period: "2019-2023",
    description: "本科阶段承担组织协同与事务推进，沉淀工程化管理能力。",
  },
  {
    id: "ach-shanghai-grad",
    title: "上海市优秀毕业生",
    period: "2023",
    description: "以稳定输出完成本科阶段收束，形成学业与实践双线成果。",
  },
  {
    id: "ach-volunteer",
    title: "进博会志愿者",
    period: "2021-2022",
    description: "连续参与第四、第五届进博会，强化高压场景协作能力。",
  },
  {
    id: "ach-ccf-b",
    title: "CCF-B 一作",
    period: "硕士阶段",
    description: "从研究问题定义到实验验证，形成完整学术产出闭环。",
  },
  {
    id: "ach-ccf-a",
    title: "CCF-A 二作",
    period: "硕士阶段",
    description: "在高标准研究协作中打磨方法，兼顾研究深度与可复现性。",
  },
  {
    id: "ach-patent",
    title: "两篇专利 + 一篇期刊在投",
    period: "硕士阶段",
    description: "持续推进成果转化，把研究思路落地到可交付成果。",
  },
  {
    id: "ach-zju-honor",
    title: "浙江大学优秀毕业生",
    period: "2026",
    description: "完成阶段性成长闭环，从输入到输出形成稳定节奏。",
  },
  {
    id: "ach-aliyun-intern",
    title: "阿里云实习",
    period: "2025.04-2025.06",
    description: "在真实业务环境中锻炼云上工程化能力与交付效率。",
  },
  {
    id: "ach-blog-system",
    title: "系统化整理博客",
    period: "2026-至今",
    description: "把技术、效率与生活经验结构化，持续公开沉淀与迭代。",
  },
];
