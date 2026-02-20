import { apiClient } from "./client";

export type BarrageComment = {
  id: number;
  nickname: string;
  content: string;
  created_at: string;
  reviewed_at: string | null;
};

export type SubmitBarrageCommentPayload = {
  nickname?: string;
  content: string;
  page_path?: string;
};

export async function fetchBarrageComments(limit = 40) {
  const { data } = await apiClient.get("/barrage-comments/", {
    params: { limit },
  });
  return data.data as BarrageComment[];
}

export async function submitBarrageComment(payload: SubmitBarrageCommentPayload) {
  const { data } = await apiClient.post("/barrage-comments/", payload);
  return data.data as {
    id: number;
    status: "pending" | "approved" | "rejected";
    submitted: boolean;
  };
}
