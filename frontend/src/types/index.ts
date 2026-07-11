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
  location: string;
  parent_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved" | "closed";
  asset_id: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
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
  pending_reports: number;
}
