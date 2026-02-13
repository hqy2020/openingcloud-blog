import { apiClient } from "./client";

export type PostSummary = {
  title: string;
  slug: string;
  excerpt: string;
  category: "tech" | "learning" | "life";
  tags: string[];
  cover: string;
  draft: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
};

export type PostDetail = PostSummary & {
  content: string;
};

type PageResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function fetchHealth() {
  const { data } = await apiClient.get("/health");
  return data.data as { service: string; status: string; time: string };
}

export async function fetchPosts(params?: { category?: string; tag?: string; page?: number }) {
  const { data } = await apiClient.get("/posts/", { params });
  return data.data as PageResponse<PostSummary>;
}

export async function fetchPostBySlug(slug: string) {
  const { data } = await apiClient.get(`/posts/${slug}/`);
  return data.data as PostDetail;
}

export async function incrementPostViews(slug: string) {
  const { data } = await apiClient.post(`/posts/${slug}/view/`);
  return data.data as { slug: string; views: number; throttled: boolean };
}
