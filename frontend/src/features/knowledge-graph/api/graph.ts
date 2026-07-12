import { api } from "@/lib/api/client";

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  status?: string;
  severity?: string;
  properties?: Record<string, string>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  label: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    node_count: number;
    edge_count: number;
    relationship_types: string[];
    node_types: string[];
  };
}

export interface ImpactAnalysis {
  asset: { id: string; name: string; type: string; status: string };
  location?: string;
  parent?: { id: string; name: string } | null;
  children: { id: string; name: string; status: string }[];
  incidents: { id: string; title: string; severity: string; status: string }[];
  affected_assets: { id: string; name: string; type: string; status: string }[];
}

export interface SearchResult {
  id: string;
  label: string;
  type: string;
  status?: string;
  severity?: string;
  match: string;
}

export const graphApi = {
  getFull: async (): Promise<GraphData> => {
    return api.get("/graph/full");
  },

  getImpact: async (assetId: string): Promise<ImpactAnalysis> => {
    return api.get(`/graph/impact/${encodeURIComponent(assetId)}`);
  },

  search: async (query: string): Promise<{ results: SearchResult[]; count: number }> => {
    return api.get("/graph/search", { q: query });
  },

  getStats: async (): Promise<GraphData["stats"]> => {
    return api.get("/graph/stats");
  },
};
