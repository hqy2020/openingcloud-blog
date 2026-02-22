import { Helmet } from "react-helmet-async";
import type { HighlightStage, PhotoWallItem, PinnedPost, SocialGraphLink, SocialGraphNode, TimelineNode } from "../api/home";
import { fetchHome } from "../api/home";
import { ContactSection } from "../components/home/ContactSection";
import { HighlightsSection } from "../components/home/HighlightsSection";
import { PhotoWallSection } from "../components/home/PhotoWallSection";
import { PinnedPostsSidebar } from "../components/home/PinnedPostsSidebar";
import { SocialGraphSection } from "../components/home/SocialGraphSection";
import { StatsSection } from "../components/home/StatsSection";
import { TimelineSection } from "../components/home/TimelineSection";
import { TravelSection } from "../components/home/TravelSection";
import { DualRadarSection } from "../components/revamp/home/DualRadarSection";
import { FeaturedProjectsSection } from "../components/revamp/home/FeaturedProjectsSection";
import { HomeHero } from "../components/revamp/home/HomeHero";
import { SocialMarquee } from "../components/revamp/home/SocialMarquee";
import { TimeAreaSection } from "../components/revamp/home/TimeAreaSection";
import { SectionCard } from "../components/revamp/shared/SectionCard";
import { Dock, DockIcon } from "../components/ui/MagicUIDock";
import { useMotionValue } from "motion/react";
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

function GithubDockIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.38 6.84 9.74.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.38-3.37-1.38-.46-1.2-1.11-1.52-1.11-1.52-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.45c.85 0 1.7.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.95-2.33 4.82-4.56 5.08.36.32.67.95.67 1.91 0 1.38-.01 2.5-.01 2.84 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.59 17.52 2 12 2z" />
    </svg>
  );
}

function MailDockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function AdminDockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <rect height="14" rx="3" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="5" />
      <path d="m9.2 10.2 2.1 1.8-2.1 1.8m4.1 0h2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowUpDockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  );
}

function ProjectsDockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15M4.5 12h15M4.5 17.25h15" />
    </svg>
  );
}

function TimeDockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.5 2.2" />
      <circle cx="12" cy="12" r="8.25" />
    </svg>
  );
}

function MapDockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21V9m8 12V9m-12.5.8L8 6l8 3.8L20.5 6v12.2L16 22l-8-3.8-4.5 3.8V9.8Z" />
    </svg>
  );
}

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
  const pinnedPosts: PinnedPost[] = Array.isArray(payload.pinned_posts) ? payload.pinned_posts : [];

  const mouseX = useMotionValue(Infinity);

  return (
    <section className="space-y-20">
      <Helmet>
        <title>启云博客</title>
        <meta content="在云层之上，记录技术、效率与生活。" name="description" />
        <meta content="启云博客" property="og:title" />
        <meta content="在云层之上，记录技术、效率与生活。" property="og:description" />
        <meta content="/og-cloudscape-card.png" property="og:image" />
        <link href="https://blog.oc.slgneon.cn/" rel="canonical" />
      </Helmet>

      {loading ? <p className="text-sm text-slate-500">首页数据加载中...</p> : null}
      {!loading && error ? <p className="text-sm text-amber-700">实时数据暂不可用，已展示静态内容。</p> : null}

      {/* #1 Hero */}
      <HomeHero
        hero={payload.hero}
      />

      {/* #2 Achievement Marquee */}
      <SocialMarquee stages={highlightStages} />

      {/* #3 Featured Projects + #4 Time */}
      <FeaturedProjectsSection />
      <TimeAreaSection timeline={timelineNodes} />

      {/* #5 Timeline + Highlights */}
      <SectionCard id="timeline">
        <div className="grid gap-8 lg:grid-cols-2">
          <TimelineSection nodes={timelineNodes} />
          <HighlightsSection stages={highlightStages} />
        </div>
      </SectionCard>

      {/* #6 Travel Map + Radar */}
      <SectionCard id="map">
        <div className="grid gap-8 lg:grid-cols-2">
          <TravelSection travel={payload.travel} currentLocation={currentLocation} />
          <DualRadarSection />
        </div>
      </SectionCard>

      {/* #7 Social Graph */}
      <SectionCard id="social">
        <div className="grid gap-8">
          <SocialGraphSection links={socialLinks} nodes={socialNodes} />
        </div>
      </SectionCard>

      {/* #8 Photo Wall */}
      <SectionCard id="gallery" fullWidth>
        <PhotoWallSection photos={photoWallItems} />
      </SectionCard>

      {/* #9 Stats */}
      <SectionCard id="stats" fullWidth>
        <StatsSection stats={payload.stats} />
      </SectionCard>

      {/* #10 Contact */}
      <SectionCard id="contact" fullWidth>
        <ContactSection contact={payload.contact ?? fallbackHomePayload.contact} variant="section" />
      </SectionCard>

      {pinnedPosts.length > 0 && (
        <PinnedPostsSidebar posts={pinnedPosts} />
      )}

      {/* Magic UI Dock — floating social bar at bottom */}
      <Dock magnification={60} distance={140}>
        <DockIcon
          label="GitHub"
          href="https://github.com/hqy2020"
          external
          mouseX={mouseX}
          magnification={60}
          distance={140}
        >
          <GithubDockIcon />
        </DockIcon>
        <DockIcon
          label="邮箱"
          href="mailto:hqy200091@163.com"
          mouseX={mouseX}
          magnification={60}
          distance={140}
        >
          <MailDockIcon />
        </DockIcon>
        <DockIcon
          label="后台"
          href="/admin/"
          mouseX={mouseX}
          magnification={60}
          distance={140}
        >
          <AdminDockIcon />
        </DockIcon>
        <DockIcon
          label="项目"
          href="#projects"
          mouseX={mouseX}
          magnification={60}
          distance={140}
        >
          <ProjectsDockIcon />
        </DockIcon>
        <DockIcon
          label="Time"
          href="#time"
          mouseX={mouseX}
          magnification={60}
          distance={140}
        >
          <TimeDockIcon />
        </DockIcon>
        <DockIcon
          label="地图"
          href="#map"
          mouseX={mouseX}
          magnification={60}
          distance={140}
        >
          <MapDockIcon />
        </DockIcon>
        <DockIcon
          label="回到顶部"
          mouseX={mouseX}
          magnification={60}
          distance={140}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUpDockIcon />
        </DockIcon>
      </Dock>
    </section>
  );
}
