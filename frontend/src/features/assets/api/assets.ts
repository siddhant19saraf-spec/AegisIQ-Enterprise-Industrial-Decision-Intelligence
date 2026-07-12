import { api } from "@/lib/api";
import type { Asset, AssetCreate, AssetUpdate, PaginatedResponse } from "@/types";

export interface AssetFilters {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const assetsApi = {
  list: (filters?: AssetFilters) => {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.type) params.type = filters.type;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = String(filters.page);
    if (filters?.page_size) params.page_size = String(filters.page_size);
    if (filters?.sort_by) params.sort_by = filters.sort_by;
    if (filters?.sort_order) params.sort_order = filters.sort_order;
    return api.get<PaginatedResponse<Asset>>("/api/v1/assets", params);
  },

  get: (id: string) => api.get<Asset>(`/api/v1/assets/${id}`),

  create: (data: AssetCreate) => api.post<Asset>("/api/v1/assets", data),

  update: (id: string, data: AssetUpdate) => api.patch<Asset>(`/api/v1/assets/${id}`, data),

  delete: (id: string) => api.delete<void>(`/api/v1/assets/${id}`),
};
