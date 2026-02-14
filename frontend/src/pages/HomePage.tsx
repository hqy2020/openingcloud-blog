import { Helmet } from "react-helmet-async";
import { fetchHome } from "../api/home";
import { ContactSection } from "../components/home/ContactSection";
import { HeroSection } from "../components/home/HeroSection";
import { HighlightsSection } from "../components/home/HighlightsSection";
import { SocialGraphSection } from "../components/home/SocialGraphSection";
import { StatsSection } from "../components/home/StatsSection";
import { TimelineSection } from "../components/home/TimelineSection";
import { TravelSection } from "../components/home/TravelSection";
import { useAsync } from "../hooks/useAsync";
import { fallbackHomePayload } from "../data/fallback";

export function HomePage() {
  const { data, loading, error } = useAsync(fetchHome, []);
  const payload = data ?? fallbackHomePayload;

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
      <TimelineSection nodes={payload.timeline} />
      <HighlightsSection stages={payload.highlights} />
      <TravelSection travel={payload.travel} />
      <SocialGraphSection links={payload.social_graph.links} nodes={payload.social_graph.nodes} />
      <StatsSection stats={payload.stats} />
      <ContactSection contact={payload.contact} />
    </section>
  );
}
