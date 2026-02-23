import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import type { HighlightStage, PhotoWallItem, PinnedPost, SocialGraphLink, SocialGraphNode, TimelineNode } from "../api/home";
import { fetchHome, fetchHomeLikeStatus, toggleHomeLike } from "../api/home";
import type { ConfettiRef } from "../components/ui/Confetti";
import { Confetti } from "../components/ui/Confetti";
import { getConfettiOriginFromElement } from "../lib/confetti";
import { PhotoWallSection } from "../components/home/PhotoWallSection";
import { SocialGraphSection } from "../components/home/SocialGraphSection";
import { StatsSection } from "../components/home/StatsSection";
import { TimelineSection } from "../components/home/TimelineSection";
import { TravelSection } from "../components/home/TravelSection";
import { DualRadarSection } from "../components/revamp/home/DualRadarSection";
import { FeaturedProjectsSection } from "../components/revamp/home/FeaturedProjectsSection";
import { GameSection } from "../components/revamp/home/GameSection";
import { HomeHero } from "../components/revamp/home/HomeHero";
import { RecommendedPostsSection } from "../components/revamp/home/RecommendedPostsSection";
import { SocialMarquee } from "../components/revamp/home/SocialMarquee";
import { TimeAreaSection } from "../components/revamp/home/TimeAreaSection";
import { DreamSection } from "../components/revamp/home/DreamSection";
import { SectionCard } from "../components/revamp/shared/SectionCard";
import { SectionQuoteHighlight, type SectionQuote } from "../components/revamp/shared/SectionQuoteHighlight";
import { Dock, DockIcon } from "../components/ui/MagicUIDock";
import { useAsync } from "../hooks/useAsync";
import { fallbackHomePayload } from "../data/fallback";
import { currentLocation } from "../data/revamp/location";

const timelineFallbackForUx: TimelineNode[] = fallbackHomePayload.timeline;
const highlightsFallbackForUx: HighlightStage[] = fallbackHomePayload.highlights;

const interleavedQuotes: SectionQuote[] = [
  {
    id: "quote-tech-1",
    category: "技术",
    lead: "真正可靠的工程，不是一次写对所有逻辑，而是持续把复杂度",
    emphasis: "沉淀成可复用的能力",
    tail: "。",
  },
  {
    id: "quote-life-1",
    category: "生活",
    lead: "生活质量的提升，不一定来自更多空闲，而是来自每天都能",
    emphasis: "认真感受当下",
    tail: "。",
  },
  {
    id: "quote-organize-1",
    category: "整理",
    lead: "整理的核心不是堆叠工具，而是建立一套在需要时可以",
    emphasis: "快速定位与执行",
    tail: "的系统。",
  },
  {
    id: "quote-tech-2",
    category: "技术",
    lead: "性能优化最有价值的部分，不是跑分本身，而是把用户等待变成",
    emphasis: "即时反馈的体验",
    tail: "。",
  },
  {
    id: "quote-life-2",
    category: "生活",
    lead: "长期主义不是做很多事，而是把真正重要的事",
    emphasis: "稳定地做很多次",
    tail: "。",
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

function GithubDockIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.38 6.84 9.74.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.38-3.37-1.38-.46-1.2-1.11-1.52-1.11-1.52-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.45c.85 0 1.7.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.95-2.33 4.82-4.56 5.08.36.32.67.95.67 1.91 0 1.38-.01 2.5-.01 2.84 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.59 17.52 2 12 2z" />
    </svg>
  );
}

function ArticleDockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 4.5h8.75L19.5 8.5v11H6.75V4.5Zm8.75 0v4h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.25 12h7.5m-7.5 3h5.5" />
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

function HeartDockIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  );
}

export function HomePage() {
  const { data, loading } = useAsync(fetchHome, []);
  const payload = data ?? fallbackHomePayload;

  // --- Home like state ---
  const [homeLiked, setHomeLiked] = useState(false);
  const [homeLikes, setHomeLikes] = useState(0);
  const heartBtnRef = useRef<HTMLButtonElement>(null);
  const confettiRef = useRef<ConfettiRef>(null);

  useEffect(() => {
    void fetchHomeLikeStatus().then((s) => {
      setHomeLiked(s.liked);
      setHomeLikes(s.likes);
    }).catch(() => {});
  }, []);

  const handleHomeLike = useCallback(() => {
    const wasLiked = homeLiked;
    setHomeLiked(!wasLiked);
    setHomeLikes((n) => n + (wasLiked ? -1 : 1));

    if (!wasLiked && heartBtnRef.current) {
      const origin = getConfettiOriginFromElement(heartBtnRef.current);
      void confettiRef.current?.fire({
        origin,
        particleCount: 80,
        spread: 60,
        startVelocity: 30,
        ticks: 60,
        scalar: 0.9,
      });
    }

    void toggleHomeLike().then((s) => {
      setHomeLiked(s.liked);
      setHomeLikes(s.likes);
    }).catch(() => {
      setHomeLiked(wasLiked);
      setHomeLikes((n) => n + (wasLiked ? 1 : -1));
    });
  }, [homeLiked]);
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

      {/* #2 Recommended Posts 3D Marquee (always shown) */}
      <RecommendedPostsSection posts={pinnedPosts} />

      {/* #3 Achievement Marquee - HighLight */}
      <SocialMarquee stages={highlightStages} />

      {/* #3.5 Quote */}
      <SectionQuoteHighlight quote={interleavedQuotes[0]} />

      {/* #4 Featured Projects - Code */}
      <FeaturedProjectsSection />

      {/* #5 Game */}
      <SectionCard id="game" fullWidth>
        <GameSection />
      </SectionCard>

      {/* #5.5 Quote */}
      <SectionQuoteHighlight quote={interleavedQuotes[1]} />

      {/* #6 Life Section (consolidated) */}
      <SectionCard id="life">
        <div className="space-y-12">
          {/* Time */}
          <TimeAreaSection timeline={timelineNodes} timeSeries={payload.time_series} />

          {/* Milestone */}
          <TimelineSection nodes={timelineNodes} />

          {/* Travel + Radar (2 columns) */}
          <div className="grid gap-8 lg:grid-cols-2">
            <TravelSection travel={payload.travel} currentLocation={currentLocation} />
            <DualRadarSection />
          </div>

          {/* Social */}
          <SocialGraphSection links={socialLinks} nodes={socialNodes} />

          {/* Photo */}
          <PhotoWallSection photos={photoWallItems} />
        </div>
      </SectionCard>

      {/* #7 Dream */}
      <DreamSection />

      {/* #7.5 Quote */}
      <SectionQuoteHighlight quote={interleavedQuotes[2]} />

      {/* #8 Stats */}
      <SectionCard id="stats" fullWidth>
        <StatsSection stats={payload.stats} />
      </SectionCard>

      <Dock magnification={80} distance={150} draggable>
        <DockIcon label="置顶" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUpDockIcon />
        </DockIcon>
        <DockIcon label="文章" href="/tech">
          <ArticleDockIcon />
        </DockIcon>
        <DockIcon
          label={`点赞 ${homeLikes}`}
          onClick={handleHomeLike}
        >
          <span ref={heartBtnRef as React.RefObject<HTMLSpanElement>} className={homeLiked ? "text-rose-500" : undefined}>
            <HeartDockIcon filled={homeLiked} />
          </span>
        </DockIcon>
        <DockIcon label="后台" href="/admin/">
          <AdminDockIcon />
        </DockIcon>
        <DockIcon label="GitHub" href="https://github.com/hqy2020/openingcloud-blog" external>
          <GithubDockIcon />
        </DockIcon>
      </Dock>

      <Confetti
        ref={confettiRef}
        manualStart
        className="pointer-events-none fixed inset-0 z-[60]"
        style={{ width: "100%", height: "100%" }}
      />
    </section>
  );
}
