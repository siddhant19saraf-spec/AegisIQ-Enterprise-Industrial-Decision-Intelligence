import { api } from "@/lib/api";

export interface NotificationItem {
  id: string;
  user_id: string | null;
  type: "alert" | "info" | "warning" | "success";
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export const notificationsApi = {
  list: (page = 1, pageSize = 50) =>
    api.get<PaginatedResponse<NotificationItem>>("/api/v1/notifications", {
      page: String(page),
      page_size: String(pageSize),
    }),

  getUnreadCount: () =>
    api.get<{ count: number }>("/api/v1/notifications/unread-count"),

  markRead: (id: string) =>
    api.patch<{ message: string }>(`/api/v1/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<{ message: string }>("/api/v1/notifications/read-all"),

  create: (data: { type: string; title: string; body?: string }) =>
    api.post<NotificationItem>("/api/v1/notifications", data),
};
