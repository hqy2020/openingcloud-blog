import { apiClient } from "./client";

export type KnowledgeGraphNode = {
  id: string;
  title: string;
  category: "entity" | "source" | "exploration" | "hub" | "index" | "other";
  path: string;
  git_created_at: string | null;
};

export type KnowledgeGraphEdge = {
  source: string;
  target: string;
};

export type KnowledgeGraphPayload = {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
};

export async function fetchKnowledgeGraph() {
  const { data } = await apiClient.get("/knowledge-graph/");
  return data.data as KnowledgeGraphPayload;
}
