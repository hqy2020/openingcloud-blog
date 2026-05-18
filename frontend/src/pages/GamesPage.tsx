import { Helmet } from "react-helmet-async";
import { fetchGames } from "../api/home";
import { GameVaultSection } from "../components/revamp/games/GameVaultSection";
import { SectionParallaxTransition } from "../components/motion/SectionParallaxTransition";
import { useAsync } from "../hooks/useAsync";
import { fallbackHomePayload } from "../data/fallback";
import { siteUrl } from "../lib/site";

export function GamesPage() {
  const { data, loading } = useAsync(fetchGames, []);
  const games = data && data.length > 0 ? data : fallbackHomePayload.games ?? [];

  return (
    <section className="space-y-8">
      <Helmet>
        <title>Switch 游戏库 ｜ openingClouds</title>
        <meta content="想买与已买分轨展示的 Switch 游戏库，和 Obsidian 结构化同步保持一致。" name="description" />
        <meta content="Switch 游戏库 ｜ openingClouds" property="og:title" />
        <meta content="想买与已买分轨展示的 Switch 游戏库，和 Obsidian 结构化同步保持一致。" property="og:description" />
        <link href={siteUrl("/games")} rel="canonical" />
      </Helmet>

      {loading ? <p className="font-theme-sans text-sm text-theme-muted">游戏库数据加载中...</p> : null}

      <SectionParallaxTransition strength={18}>
        <GameVaultSection games={games} />
      </SectionParallaxTransition>
    </section>
  );
}
