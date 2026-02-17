import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client.js";

interface PopulatedUserNotification {
  _id: string;
  userId: string;
  notificationId: {
    _id: string;
    type: "info" | "success" | "warning" | "error" | "announcement";
    title: string;
    message?: string;
    sentByName: string;
    createdAt: string;
  };
  read: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationListResponse {
  notifications: PopulatedUserNotification[];
  pagination: { page: number; pages: number; total: number };
}

interface UnreadCountResponse {
  count: number;
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: () => apiFetch<UnreadCountResponse>("/api/notifications/unread-count"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useRecentNotifications() {
  return useQuery({
    queryKey: ["recent-notifications"],
    queryFn: () =>
      apiFetch<NotificationListResponse>("/api/notifications?limit=10&unreadOnly=true"),
    staleTime: 30_000,
  });
}

export function useNotificationList(page: number) {
  return useQuery({
    queryKey: ["notification-list", page],
    queryFn: () =>
      apiFetch<NotificationListResponse>(`/api/notifications?page=${page}&limit=6`),
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/notifications/${id}/read`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["recent-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-list"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/read-all", { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["recent-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-list"] });
    },
  });
}

export type { PopulatedUserNotification };
