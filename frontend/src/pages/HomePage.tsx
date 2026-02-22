import { Helmet } from "react-helmet-async";
import type { HighlightStage, PhotoWallItem, PinnedPost, SocialGraphLink, SocialGraphNode, TimelineNode } from "../api/home";
import { fetchHome } from "../api/home";
import { HighlightsSection } from "../components/home/HighlightsSection";
import { PhotoWallSection } from "../components/home/PhotoWallSection";
import { PinnedPostsSidebar } from "../components/home/PinnedPostsSidebar";
import { SocialGraphSection } from "../components/home/SocialGraphSection";
import { StatsSection } from "../components/home/StatsSection";
import { TimelineSection } from "../components/home/TimelineSection";
import { TravelSection } from "../components/home/TravelSection";
import { DualRadarSection } from "../components/revamp/home/DualRadarSection";
import { FeaturedProjectsSection } from "../components/revamp/home/FeaturedProjectsSection";
import { GameSection } from "../components/revamp/home/GameSection";
import { HomeHero } from "../components/revamp/home/HomeHero";
import { SocialMarquee } from "../components/revamp/home/SocialMarquee";
import { TimeAreaSection } from "../components/revamp/home/TimeAreaSection";
import { SectionCard } from "../components/revamp/shared/SectionCard";
import { useAsync } from "../hooks/useAsync";
import { fallbackHomePayload } from "../data/fallback";
import { currentLocation } from "../data/revamp/location";

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

  return (
    <section className="space-y-20">
      <Helmet>
        <title>Keyon Blog ｜ 云际漫游者</title>
        <meta content="在云层之上，记录技术、效率与生活。" name="description" />
        <meta content="Keyon Blog ｜ 云际漫游者" property="og:title" />
        <meta content="在云层之上，记录技术、效率与生活。" property="og:description" />
        <meta content="/og-cloudscape-card.png" property="og:image" />
        <link href="https://blog.oc.slgneon.cn/" rel="canonical" />
      </Helmet>

      {loading ? <p className="text-sm text-slate-500">首页数据加载中...</p> : null}
      {/* #1 Hero */}
      <HomeHero
        hero={payload.hero}
      />

      {/* #2 Achievement Marquee */}
      <SocialMarquee stages={highlightStages} />

      {/* #3 Featured Projects */}
      <FeaturedProjectsSection />

      {/* #4 Game */}
      <SectionCard id="game" fullWidth>
        <GameSection />
      </SectionCard>

      {/* #5 Time */}
      <TimeAreaSection timeline={timelineNodes} timeSeries={payload.time_series} />

      {/* #6 Timeline + Highlights */}
      <SectionCard id="timeline">
        <div className="grid gap-8 lg:grid-cols-2">
          <TimelineSection nodes={timelineNodes} />
          <HighlightsSection stages={highlightStages} />
        </div>
      </SectionCard>

      {/* #7 Travel Map + Radar */}
      <SectionCard id="map">
        <div className="grid gap-8 lg:grid-cols-2">
          <TravelSection travel={payload.travel} currentLocation={currentLocation} />
          <DualRadarSection />
        </div>
      </SectionCard>

      {/* #8 Social Graph */}
      <SectionCard id="social">
        <div className="grid gap-8">
          <SocialGraphSection links={socialLinks} nodes={socialNodes} />
        </div>
      </SectionCard>

      {/* #9 Photo Wall */}
      <SectionCard id="gallery" fullWidth>
        <PhotoWallSection photos={photoWallItems} />
      </SectionCard>

      {/* #10 Stats */}
      <SectionCard id="stats" fullWidth>
        <StatsSection stats={payload.stats} />
      </SectionCard>

      {pinnedPosts.length > 0 && (
        <PinnedPostsSidebar posts={pinnedPosts} />
      )}
    </section>
  );
}
