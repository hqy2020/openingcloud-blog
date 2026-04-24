import { useRef } from "react";
import { Helmet } from "react-helmet-async";
import type { HighlightStage, PhotoWallItem, PinnedPost, SocialGraphLink, SocialGraphNode, TimelineNode } from "../api/home";
import { fetchHome } from "../api/home";
import type { ConfettiRef } from "../components/ui/Confetti";
import { Confetti } from "../components/ui/Confetti";
import { KnowledgeGraphSection } from "../components/home/KnowledgeGraphSection";
import { PhotoWallSection } from "../components/home/PhotoWallSection";
import { SocialGraphSection } from "../components/home/SocialGraphSection";
import { StatsSection } from "../components/home/StatsSection";
import { TimelineSection } from "../components/home/TimelineSection";
import { TravelSection } from "../components/home/TravelSection";
import { DualRadarSection } from "../components/revamp/home/DualRadarSection";
import { FeaturedProjectsSection } from "../components/revamp/home/FeaturedProjectsSection";
import { HomeHero } from "../components/revamp/home/HomeHero";
import { RecommendedPostsSection } from "../components/revamp/home/RecommendedPostsSection";
import { SocialMarquee } from "../components/revamp/home/SocialMarquee";
import { TimeAreaSection } from "../components/revamp/home/TimeAreaSection";
import { DreamSection } from "../components/revamp/home/DreamSection";
import { BookshelfSection } from "../components/revamp/home/BookshelfSection";
import { SectionCard } from "../components/revamp/shared/SectionCard";
import { SectionTitleCard } from "../components/revamp/shared/SectionTitleCard";
import { SectionQuoteHighlight } from "../components/revamp/shared/SectionQuoteHighlight";
import { SectionParallaxTransition } from "../components/motion/SectionParallaxTransition";
import { useAsync } from "../hooks/useAsync";
import { fallbackHomePayload } from "../data/fallback";
import { siteUrl } from "../lib/site";

const timelineFallbackForUx: TimelineNode[] = fallbackHomePayload.timeline;
const highlightsFallbackForUx: HighlightStage[] = fallbackHomePayload.highlights;

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
  const { data, loading } = useAsync(fetchHome, []);
  const payload = data ?? fallbackHomePayload;

  const confettiRef = useRef<ConfettiRef>(null);

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
  const pinnedPosts: PinnedPost[] = Array.isArray(payload.pinned_posts) ? payload.pinned_posts : [];
  const quotes = payload.section_quotes ?? {};

  return (
    <section className="space-y-20">
      <Helmet>
        <title>Keyon Blog ｜ 云际漫游者</title>
        <meta content="在云层之上，记录技术、效率与生活。" name="description" />
        <meta content="Keyon Blog ｜ 云际漫游者" property="og:title" />
        <meta content="在云层之上，记录技术、效率与生活。" property="og:description" />
        <meta content="/og-cloudscape-card.png" property="og:image" />
        <link href={siteUrl("/")} rel="canonical" />
      </Helmet>

      {loading ? <p className="text-sm text-theme-muted">首页数据加载中...</p> : null}
      {/* #1 Hero */}
      <HomeHero
        hero={payload.hero}
      />

      {/* #1.5 Knowledge Graph (Obsidian-style, time-growth animated) */}
      <SectionParallaxTransition strength={24}>
        <SectionCard id="knowledge-graph" fullWidth>
          <KnowledgeGraphSection />
        </SectionCard>
      </SectionParallaxTransition>

      {/* #2 Recommended Posts 3D Marquee (always shown) */}
      <SectionParallaxTransition strength={20}>
        <RecommendedPostsSection posts={pinnedPosts} />
      </SectionParallaxTransition>

      {/* #3 Achievement Marquee - HighLight */}
      <SectionParallaxTransition strength={20}>
        <SocialMarquee stages={highlightStages} />
      </SectionParallaxTransition>

      {/* #3.5 Quote */}
      {quotes.after_marquee && (
        <SectionParallaxTransition strength={12} fade={false}>
          <SectionQuoteHighlight quote={quotes.after_marquee} />
        </SectionParallaxTransition>
      )}

      {/* #4 Featured Projects - Code */}
      <SectionParallaxTransition strength={22}>
        <FeaturedProjectsSection projects={payload.projects} />
      </SectionParallaxTransition>

      {/* #6 Life Section (consolidated) */}
      <SectionParallaxTransition strength={26}>
        <SectionTitleCard category="Life" title="生活" accentColor="#c96442" tagline="记录走过的路、遇见的人、看过的风景。" />
        <SectionCard id="life">
          <div className="space-y-12">
            {/* Time (full-width chart) */}
            <TimeAreaSection timeline={timelineNodes} timeSeries={payload.time_series} />

            {/* Timeline + right column (2 columns) */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left: Timeline (long list) */}
              <div>
                <TimelineSection nodes={timelineNodes} />
              </div>
              {/* Right: Travel + Social + Stats + Radar + Photo + Dream */}
              <div className="space-y-8">
                <TravelSection travel={payload.travel} />
                <SocialGraphSection links={socialLinks} nodes={socialNodes} />
                <StatsSection stats={payload.stats} />
                <DualRadarSection radarData={payload.radar_charts} />
                <PhotoWallSection photos={photoWallItems} />
                <DreamSection wishes={payload.wishes ?? []} />
                <BookshelfSection books={payload.books ?? []} />
              </div>
            </div>
          </div>
        </SectionCard>
      </SectionParallaxTransition>

      {/* Quote after life/dashboard */}
      {quotes.after_dream && (
        <SectionParallaxTransition strength={12} fade={false}>
          <SectionQuoteHighlight quote={quotes.after_dream} />
        </SectionParallaxTransition>
      )}

      <Confetti
        ref={confettiRef}
        manualStart
        className="pointer-events-none fixed inset-0 z-[60]"
        style={{ width: "100%", height: "100%" }}
      />
    </section>
  );
}
