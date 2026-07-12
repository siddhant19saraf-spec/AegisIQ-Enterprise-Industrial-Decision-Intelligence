export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "engineer" | "operator" | "viewer";
  is_active: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  status: "operational" | "maintenance" | "offline" | "critical";
  location: string | null;
  description: string | null;
  parent_id: string | null;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AssetCreate {
  name: string;
  type: string;
  status?: "operational" | "maintenance" | "offline" | "critical";
  location?: string | null;
  description?: string | null;
  attributes?: Record<string, unknown>;
  parent_id?: string | null;
}

export interface AssetUpdate {
  name?: string;
  type?: string;
  status?: "operational" | "maintenance" | "offline" | "critical";
  location?: string | null;
  description?: string | null;
  attributes?: Record<string, unknown>;
  parent_id?: string | null;
}

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved" | "closed";
  asset_id: string | null;
  assigned_to: string | null;
  risk_score: number | null;
  detected_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreate {
  title: string;
  description?: string | null;
  severity?: "critical" | "high" | "medium" | "low";
  status?: "open" | "investigating" | "resolved" | "closed";
  asset_id?: string | null;
  assigned_to?: string | null;
  risk_score?: number | null;
}

export interface IncidentUpdate {
  title?: string;
  description?: string | null;
  severity?: "critical" | "high" | "medium" | "low";
  status?: "open" | "investigating" | "resolved" | "closed";
  asset_id?: string | null;
  assigned_to?: string | null;
  risk_score?: number | null;
}

export interface IncidentUpdateCreate {
  message: string;
  update_type?: string;
}

export interface IncidentUpdateResponse {
  id: string;
  incident_id: string;
  message: string;
  user_id: string | null;
  update_type: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: "alert" | "info" | "warning" | "success";
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface DashboardSummary {
  total_assets: number;
  active_incidents: number;
  critical_assets: number;
  open_reports: number;
  uptime_rate: number;
  incidents_today: number;
  assets_by_status: Record<string, number>;
  incidents_by_severity: Record<string, number>;
}
