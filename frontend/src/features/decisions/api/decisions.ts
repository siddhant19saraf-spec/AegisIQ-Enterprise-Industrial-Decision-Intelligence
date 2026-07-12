import { api } from "@/lib/api/client";

export interface Recommendation {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  summary: string;
  explanation: string;
  evidence: string[];
  recommended_actions: string[];
  risk_score: number;
  risk_level: string;
  confidence: number;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total: number;
  generated_at: string;
}

export const decisionsApi = {
  getRecommendations: async (): Promise<RecommendationsResponse> => {
    return api.get("/decisions/recommendations");
  },

  getAssetRecommendations: async (assetId: string): Promise<RecommendationsResponse> => {
    return api.get(`/decisions/recommendations/${encodeURIComponent(assetId)}`);
  },
};
