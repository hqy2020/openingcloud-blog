import { useAsync } from "../hooks/useAsync";
import { fetchSocialStats, type PlatformStat } from "../api/social";
import { Helmet } from "react-helmet-async";
import { SectionCard } from "../components/revamp/shared/SectionCard";

const PLATFORM_CONFIG: Record<string, { icon: string; label: string; viewLabel: string }> = {
  bilibili: { icon: "📺", label: "B站", viewLabel: "播放" },
  zhihu: { icon: "💡", label: "知乎", viewLabel: "收藏" },
  xiaohongshu: { icon: "📕", label: "小红书", viewLabel: "阅读" },
  wechat_oa: { icon: "📱", label: "公众号", viewLabel: "昨日阅读" },
  blog: { icon: "🌐", label: "博客", viewLabel: "阅读" },
  douyin: { icon: "🎵", label: "抖音", viewLabel: "播放" },
  kuaishou: { icon: "📱", label: "快手", viewLabel: "播放" },
  shipinhao: { icon: "📹", label: "视频号", viewLabel: "昨日播放" },
  nowcoder: { icon: "💻", label: "牛客", viewLabel: "阅读" },
  weibo: { icon: "📢", label: "微博", viewLabel: "阅读" },
  douban: { icon: "📚", label: "豆瓣", viewLabel: "评分" },
};

function PlatformCard({ stat }: { stat: PlatformStat }) {
  const cfg = PLATFORM_CONFIG[stat.platform] ?? { icon: "🌍", label: stat.platform, viewLabel: "阅读" };
  const viewsField = stat.yesterday_views > 0 ? stat.yesterday_views : stat.total_views;
  const viewsLabel = stat.yesterday_views > 0 ? cfg.viewLabel : `总${cfg.viewLabel}`;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-theme-border/30 bg-theme-surface/70 p-5 backdrop-blur-sm transition hover:border-theme-accent/30 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cfg.icon}</span>
          <h3 className="font-semibold text-theme-ink">{cfg.label}</h3>
        </div>
        <span className="text-xs text-theme-muted">{stat.account_name || cfg.label}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-theme-muted">粉丝</div>
          <div className="text-xl font-bold text-theme-ink">{stat.followers.toLocaleString()}</div>
          {stat.yesterday_followers > 0 && (
            <div className="text-xs text-green-500">+{stat.yesterday_followers}</div>
          )}
        </div>
        <div>
          <div className="text-xs text-theme-muted">{viewsLabel}</div>
          <div className="text-xl font-bold text-theme-ink">{viewsField.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-theme-muted">获赞</div>
          <div className="text-xl font-bold text-theme-ink">{stat.total_likes.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-3 flex gap-3 text-xs text-theme-muted">
        {stat.posts_count > 0 && <span>📄 {stat.posts_count}篇</span>}
        {stat.comments > 0 && <span>💬 {stat.comments}</span>}
        {stat.shares > 0 && <span>🔄 {stat.shares}</span>}
        {stat.favorites > 0 && <span>⭐ {stat.favorites}</span>}
        {stat.engagement_rate > 0 && <span>📈 {stat.engagement_rate}%</span>}
      </div>

      {stat.best_post_title && (
        <div className="mt-3 border-t border-theme-border/20 pt-2">
          <div className="text-xs text-theme-muted">最佳内容</div>
          <a
            href={stat.best_post_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 line-clamp-1 text-sm text-theme-accent transition hover:underline"
          >
            {stat.best_post_title}
          </a>
          {(stat.best_post_views > 0 || stat.best_post_likes > 0) && (
            <div className="mt-1 flex gap-2 text-xs text-theme-muted">
              {stat.best_post_views > 0 && <span>👁️ {stat.best_post_views.toLocaleString()}</span>}
              {stat.best_post_likes > 0 && <span>👍 {stat.best_post_likes}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function InfluencePage() {
  // v2 - frontend deploy trigger
  const { data, loading, error } = useAsync(fetchSocialStats, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="animate-pulse text-theme-muted">加载中...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-theme-muted">暂无数据</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>影响力 · 码阶客</title>
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-theme-ink">📊 影响力看板</h1>
          <p className="mt-2 text-theme-muted">
            码阶客 · {data.platform_count} 个平台 · 数据更新于 {data.updated_at || "未知"}
          </p>
        </div>

        {/* Total Stats */}
        <SectionCard title="总览" className="mb-8">
          <div className="grid grid-cols-3 gap-6 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-theme-ink">{data.total_followers.toLocaleString()}</div>
              <div className="text-sm text-theme-muted">跨平台粉丝</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-theme-ink">{data.total_views.toLocaleString()}</div>
              <div className="text-sm text-theme-muted">累计播放/阅读</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-theme-ink">{data.total_likes.toLocaleString()}</div>
              <div className="text-sm text-theme-muted">累计获赞</div>
            </div>
          </div>
        </SectionCard>

        {/* Platform Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.platforms.map((stat) => (
            <PlatformCard key={stat.platform} stat={stat} />
          ))}
        </div>

        <footer className="mt-12 text-center text-xs text-theme-muted/50">
          每日 08:00 自动采集 · 数据来源 Hermes Agent
        </footer>
      </div>
    </>
  );
}
