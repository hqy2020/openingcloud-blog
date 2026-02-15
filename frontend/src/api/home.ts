import { apiClient } from "./client";

export type TimelineNode = {
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  type: "career" | "health" | "learning" | "family" | "reflection";
  impact: "high" | "medium" | "low";
  phase: string;
  tags: string[];
  cover: string;
  links: string[];
  sort_order: number;
};

export type HighlightItem = {
  title: string;
  description: string;
  achieved_at: string | null;
  sort_order: number;
};

export type HighlightStage = {
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  items: HighlightItem[];
};

export type TravelCity = {
  city: string;
  notes: string;
  visited_at: string | null;
  latitude: number | null;
  longitude: number | null;
  cover: string;
  sort_order: number;
};

export type TravelProvince = {
  province: string;
  count: number;
  cities: TravelCity[];
};

export type SocialGraphNode = {
  id: string;
  type: "stage" | "friend";
  label: string;
  stage_key: string;
  order: number;
};

export type SocialGraphLink = {
  source: string;
  target: string;
};

export type SocialGraphPayload = {
  nodes: SocialGraphNode[];
  links: SocialGraphLink[];
};

export type PhotoWallItem = {
  title: string;
  description: string;
  image_url: string;
  source_url: string;
  captured_at: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
};

export type HomePayload = {
  hero: {
    title: string;
    subtitle: string;
    slogans: string[];
    fallback_image: string;
    fallback_video: string;
  };
  timeline: TimelineNode[];
  highlights: HighlightStage[];
  travel: TravelProvince[];
  social_graph: SocialGraphPayload;
  photo_wall: PhotoWallItem[];
  stats: {
    posts_total: number;
    published_posts_total: number;
    timeline_total: number;
    travel_total: number;
    social_total: number;
    highlight_stages_total: number;
    highlight_items_total: number;
    tags_total: number;
    views_total: number;
    total_words: number;
    site_days: number;
  };
  contact: {
    email: string;
    github: string;
  };
};

export async function fetchHome() {
  const { data } = await apiClient.get("/home/");
  return data.data as HomePayload;
}

export async function fetchTimeline() {
  const { data } = await apiClient.get("/timeline/");
  return data.data as TimelineNode[];
}

export async function fetchHighlights() {
  const { data } = await apiClient.get("/highlights/");
  return data.data as HighlightStage[];
}

export async function fetchTravel() {
  const { data } = await apiClient.get("/travel/");
  return data.data as TravelProvince[];
}

export async function fetchSocialGraph() {
  const { data } = await apiClient.get("/social-graph/");
  return data.data as SocialGraphPayload;
}

export async function fetchPhotoWall() {
  const { data } = await apiClient.get("/photo-wall/");
  return data.data as PhotoWallItem[];
}
