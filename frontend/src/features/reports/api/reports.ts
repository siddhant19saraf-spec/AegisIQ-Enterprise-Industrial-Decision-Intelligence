import { api } from "@/lib/api";

export interface ReportItem {
  id: string;
  name: string;
  type: string;
  status: string;
  params: Record<string, unknown>;
  created_by: string | null;
  file_url: string | null;
  schedule_cron: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export const reportsApi = {
  list: (page = 1, pageSize = 50, search?: string) => {
    const params: Record<string, string> = {
      page: String(page),
      page_size: String(pageSize),
    };
    if (search) params.search = search;
    return api.get<PaginatedResponse<ReportItem>>("/api/v1/reports", params);
  },

  get: (id: string) => api.get<ReportItem>(`/api/v1/reports/${id}`),

  create: (data: { name: string; type: string; params?: Record<string, unknown>; schedule_cron?: string }) =>
    api.post<ReportItem>("/api/v1/reports", data),

  update: (id: string, data: { name?: string; params?: Record<string, unknown>; schedule_cron?: string }) =>
    api.patch<ReportItem>(`/api/v1/reports/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/api/v1/reports/${id}`),
};
