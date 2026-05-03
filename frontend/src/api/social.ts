import { apiClient } from "./client";

export type PlatformStat = {
  id: number;
  platform: string;
  account_name: string;
  date: string;
  followers: number;
  total_views: number;
  total_likes: number;
  posts_count: number;
  comments: number;
  shares: number;
  favorites: number;
  best_post_title: string;
  best_post_views: number;
  best_post_likes: number;
  best_post_url: string;
  yesterday_followers: number;
  yesterday_views: number;
  yesterday_shares: number;
  is_active: boolean;
  sort_order: number;
  collected_at: string;
  platform_icon: string;
  engagement_rate: number;
};

export type SocialStatsPayload = {
  total_followers: number;
  total_views: number;
  total_likes: number;
  platform_count: number;
  platforms: PlatformStat[];
  updated_at: string | null;
};

export async function fetchSocialStats(): Promise<SocialStatsPayload> {
  const { data } = await apiClient.get("/social-stats/");
  return data.data;
}

export async function fetchPlatformHistory(platform: string): Promise<{ date: string; followers: number; total_views: number; total_likes: number }[]> {
  const { data } = await apiClient.get(`/social-stats/${platform}/history/`);
  return data.data;
}
