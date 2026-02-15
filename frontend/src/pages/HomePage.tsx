import { Helmet } from "react-helmet-async";
import type { HighlightStage, PhotoWallItem, SocialGraphLink, SocialGraphNode, TimelineNode } from "../api/home";
import { fetchHome } from "../api/home";
import { ContactSection } from "../components/home/ContactSection";
import { HeroSection } from "../components/home/HeroSection";
import { HighlightsSection } from "../components/home/HighlightsSection";
import { PhotoWallSection } from "../components/home/PhotoWallSection";
import { SocialGraphSection } from "../components/home/SocialGraphSection";
import { StatsSection } from "../components/home/StatsSection";
import { TimelineSection } from "../components/home/TimelineSection";
import { TravelSection } from "../components/home/TravelSection";
import { useAsync } from "../hooks/useAsync";
import { fallbackHomePayload } from "../data/fallback";

const timelineFallbackForUx: TimelineNode[] = [
  {
    title: "出生",
    description: "时间线起点，家庭与成长的开始。",
    start_date: "2000-09-01",
    end_date: null,
    type: "family",
    impact: "medium",
    phase: "起点",
    tags: ["family"],
    cover: "",
    links: [],
    sort_order: 1,
  },
  {
    title: "同济大学",
    description: "系统训练工程思维，奠定技术基础。",
    start_date: "2019-09-01",
    end_date: "2023-07-01",
    type: "learning",
    impact: "high",
    phase: "本科",
    tags: ["learning"],
    cover: "",
    links: [],
    sort_order: 2,
  },
  {
    title: "云层之下",
    description: "阶段性沉淀与反思，调整方向后继续前进。",
    start_date: "2025-04-01",
    end_date: "2025-10-01",
    type: "reflection",
    impact: "low",
    phase: "沉淀",
    tags: ["reflection"],
    cover: "",
    links: [],
    sort_order: 3,
  },
  {
    title: "开始系统整理博客",
    description: "将技术、效率与生活经验结构化沉淀并持续输出。",
    start_date: "2026-02-01",
    end_date: null,
    type: "career",
    impact: "high",
    phase: "实践",
    tags: ["career"],
    cover: "",
    links: [],
    sort_order: 4,
  },
];

const highlightsFallbackForUx: HighlightStage[] = [
  {
    title: "小学 · 初中 · 高中",
    description: "从学生干部到运动项目成绩突破，逐步建立长期投入与复盘习惯。",
    start_date: "2006-09-01",
    end_date: "2019-07-01",
    sort_order: 1,
    items: [
      { title: "长期担任班级/学校职务", description: "", achieved_at: null, sort_order: 1 },
      { title: "800m/1000m 项目持续突破", description: "", achieved_at: null, sort_order: 2 },
    ],
  },
  {
    title: "同济大学 · 本科",
    description: "在组织、学业与实践并行中建立工程化做事方法。",
    start_date: "2019-09-01",
    end_date: "2023-07-01",
    sort_order: 2,
    items: [
      { title: "学生组织核心岗位实践", description: "", achieved_at: null, sort_order: 1 },
      { title: "志愿服务与毕业成果并行推进", description: "", achieved_at: null, sort_order: 2 },
    ],
  },
  {
    title: "浙江大学 · 硕士",
    description: "研究与工程双线推进，持续打磨高质量输出能力。",
    start_date: "2024-09-01",
    end_date: null,
    sort_order: 3,
    items: [
      { title: "论文与专利持续产出", description: "", achieved_at: null, sort_order: 1 },
      { title: "研究课题进入稳定迭代节奏", description: "", achieved_at: null, sort_order: 2 },
    ],
  },
];

const socialGraphFallbackForUx: {
  nodes: SocialGraphNode[];
  links: SocialGraphLink[];
} = {
  nodes: [
    { id: "stage-primary", type: "stage", label: "小学", stage_key: "primary", order: 10 },
    { id: "stage-middle", type: "stage", label: "初中", stage_key: "middle", order: 20 },
    { id: "stage-high", type: "stage", label: "高中", stage_key: "high", order: 30 },
    { id: "stage-tongji", type: "stage", label: "同济", stage_key: "tongji", order: 40 },
    { id: "stage-zju", type: "stage", label: "浙大", stage_key: "zju", order: 50 },
    { id: "stage-career", type: "stage", label: "工作", stage_key: "career", order: 60 },
    { id: "stage-family", type: "stage", label: "家庭", stage_key: "family", order: 70 },
    { id: "friend-primary-1", type: "friend", label: "同行者 A", stage_key: "primary", order: 101 },
    { id: "friend-middle-1", type: "friend", label: "同行者 B", stage_key: "middle", order: 102 },
    { id: "friend-high-1", type: "friend", label: "同行者 C", stage_key: "high", order: 103 },
    { id: "friend-tongji-1", type: "friend", label: "同行者 D", stage_key: "tongji", order: 104 },
    { id: "friend-zju-1", type: "friend", label: "同行者 E", stage_key: "zju", order: 105 },
    { id: "friend-career-1", type: "friend", label: "同行者 F", stage_key: "career", order: 106 },
    { id: "friend-family-1", type: "friend", label: "同行者 G", stage_key: "family", order: 107 },
  ],
  links: [
    { source: "stage-primary", target: "friend-primary-1" },
    { source: "stage-middle", target: "friend-middle-1" },
    { source: "stage-high", target: "friend-high-1" },
    { source: "stage-tongji", target: "friend-tongji-1" },
    { source: "stage-zju", target: "friend-zju-1" },
    { source: "stage-career", target: "friend-career-1" },
    { source: "stage-family", target: "friend-family-1" },
  ],
};

const photoWallFallbackForUx: PhotoWallItem[] = [
  {
    title: "云海日出",
    description: "远程图床示例图",
    image_url: "https://raw.githubusercontent.com/hqy2020/obsidian-images/main/gallery/sunrise.jpg",
    source_url: "https://github.com/hqy2020/obsidian-images/blob/main/gallery/sunrise.jpg",
    captured_at: "2025-11-08",
    width: null,
    height: null,
    sort_order: 1,
  },
  {
    title: "夜色城景",
    description: "Immich 风格照片墙占位图",
    image_url: "https://raw.githubusercontent.com/hqy2020/obsidian-images/main/gallery/night-city.jpg",
    source_url: "https://github.com/hqy2020/obsidian-images/blob/main/gallery/night-city.jpg",
    captured_at: "2025-12-18",
    width: null,
    height: null,
    sort_order: 2,
  },
];

export function HomePage() {
  const { data, loading, error } = useAsync(fetchHome, []);
  const payload = data ?? fallbackHomePayload;
  const timelineNodes = Array.isArray(payload.timeline) && payload.timeline.length > 0 ? payload.timeline : timelineFallbackForUx;
  const highlightStages =
    Array.isArray(payload.highlights) && payload.highlights.length > 0 ? payload.highlights : highlightsFallbackForUx;
  const socialNodesRaw = Array.isArray(payload.social_graph?.nodes) ? payload.social_graph.nodes : [];
  const socialLinksRaw = Array.isArray(payload.social_graph?.links) ? payload.social_graph.links : [];
  const socialHasFriend = socialNodesRaw.some((node) => node.type === "friend");
  const socialHasLink = socialLinksRaw.length > 0;
  const socialNodes = socialHasFriend && socialHasLink ? socialNodesRaw : socialGraphFallbackForUx.nodes;
  const socialLinks = socialHasFriend && socialHasLink ? socialLinksRaw : socialGraphFallbackForUx.links;
  const photoWallItems =
    Array.isArray(payload.photo_wall) && payload.photo_wall.length > 0 ? payload.photo_wall : photoWallFallbackForUx;

  return (
    <section className="space-y-12">
      <Helmet>
        <title>openingClouds | Tech · Efficiency · Life</title>
        <meta content="在云层之上，记录技术、效率与生活。" name="description" />
        <meta content="openingClouds" property="og:title" />
        <meta content="在云层之上，记录技术、效率与生活。" property="og:description" />
        <meta content="/og-cloudscape-card.png" property="og:image" />
        <link href="https://blog.openingclouds.com/" rel="canonical" />
      </Helmet>

      {loading ? <p className="text-sm text-slate-500">首页数据加载中...</p> : null}
      {!loading && error ? <p className="text-sm text-amber-700">实时数据暂不可用，已展示静态内容。</p> : null}

      <HeroSection hero={payload.hero} />
      <TimelineSection nodes={timelineNodes} />
      <HighlightsSection stages={highlightStages} />
      <TravelSection travel={payload.travel} />
      <SocialGraphSection links={socialLinks} nodes={socialNodes} />
      <PhotoWallSection photos={photoWallItems} />
      <StatsSection stats={payload.stats} />
      <ContactSection contact={payload.contact} />
    </section>
  );
}
