import { api } from "@/lib/api";
import type { Incident, IncidentCreate, IncidentUpdate, IncidentUpdateCreate, IncidentUpdateResponse, PaginatedResponse } from "@/types";

export interface IncidentFilters {
  status?: string;
  severity?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const incidentsApi = {
  list: (filters?: IncidentFilters) => {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.severity) params.severity = filters.severity;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = String(filters.page);
    if (filters?.page_size) params.page_size = String(filters.page_size);
    if (filters?.sort_by) params.sort_by = filters.sort_by;
    if (filters?.sort_order) params.sort_order = filters.sort_order;
    return api.get<PaginatedResponse<Incident>>("/api/v1/incidents", params);
  },

  get: (id: string) => api.get<Incident>(`/api/v1/incidents/${id}`),

  create: (data: IncidentCreate) => api.post<Incident>("/api/v1/incidents", data),

  update: (id: string, data: IncidentUpdate) => api.patch<Incident>(`/api/v1/incidents/${id}`, data),

  delete: (id: string) => api.delete<void>(`/api/v1/incidents/${id}`),

  addUpdate: (incidentId: string, data: IncidentUpdateCreate) =>
    api.post<IncidentUpdateResponse>(`/api/v1/incidents/${incidentId}/updates`, data),

  getUpdates: (incidentId: string) =>
    api.get<IncidentUpdateResponse[]>(`/api/v1/incidents/${incidentId}/updates`),
};
