import { api } from "@/lib/api/client";

export interface FacilitySummary {
  id: string;
  name: string;
  location: string | null;
  asset_count: number;
  critical_count: number;
  health_score: number;
  risk_score: number;
  active_incident_count: number;
}

export interface DigitalTwinNode {
  id: string;
  label: string;
  type: string;
  status: string;
  health_score: number;
  risk_score: number;
  risk_level: string;
  location: string | null;
  facility_id: string | null;
  parent_id: string | null;
  active_incidents: number;
  incident_severities: string[];
  maintenance_due: boolean;
  children_count: number;
}

export interface DigitalTwinEdge {
  source: string;
  target: string;
  relationship: string;
  label: string;
  weight: number;
}

export interface DigitalTwinTopology {
  nodes: DigitalTwinNode[];
  edges: DigitalTwinEdge[];
}

export interface DigitalTwinOverview {
  total_assets: number;
  total_facilities: number;
  total_nodes: number;
  total_edges: number;
  critical_count: number;
  at_risk_count: number;
  active_incidents: number;
  average_health: number;
  facilities: FacilitySummary[];
}

export const digitalTwinApi = {
  facilities: () => api.get<FacilitySummary[]>("/api/v1/digital-twin/facilities"),

  facility: (id: string) =>
    api.get<DigitalTwinTopology>(`/api/v1/digital-twin/facilities/${encodeURIComponent(id)}`),

  assets: () => api.get<DigitalTwinTopology>("/api/v1/digital-twin/assets"),

  overview: () => api.get<DigitalTwinOverview>("/api/v1/digital-twin/overview"),
};
