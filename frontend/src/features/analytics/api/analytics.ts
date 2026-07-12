import { api } from "@/lib/api/client";

export interface AnalyticsSummary {
  assets: {
    total: number;
    by_status: Record<string, number>;
    by_type: Record<string, number>;
    by_location: Record<string, number>;
  };
  incidents: {
    total: number;
    by_severity: Record<string, number>;
    by_status: Record<string, number>;
  };
  risk_distribution: Record<string, number>;
  avg_risk_score: number;
}

export const analyticsApi = {
  getSummary: () => api.get<AnalyticsSummary>("/api/v1/analytics/summary"),
};
