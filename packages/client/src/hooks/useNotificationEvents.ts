import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/stores/socketStore.js";
import { useSoundStore } from "@/stores/soundStore.js";

export interface NotificationPopup {
  type: "success" | "warning" | "error" | "announcement";
  title: string;
  message?: string;
}

export function useNotificationEvents() {
  const socket = useSocketStore((s) => s.socket);
  const queryClient = useQueryClient();
  const [popup, setPopup] = useState<NotificationPopup | null>(null);

  const clearPopup = useCallback(() => setPopup(null), []);

  useEffect(() => {
    if (!socket) return;

    const handleGlobal = (data: {
      type: "info" | "success" | "warning" | "error" | "announcement";
      title: string;
      message?: string;
    }) => {
      if (data.type === "announcement") {
        useSoundStore.getState().playSound("system_alert");
      }

      // Show popup modal for non-info types
      if (data.type !== "info") {
        setPopup({ type: data.type, title: data.title, message: data.message });
      }

      // Refresh notification bell data
      queryClient.invalidateQueries({ queryKey: ["recent-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
    };

    const handleUnreadCount = (data: { count: number }) => {
      queryClient.setQueryData(["notification-unread-count"], { count: data.count });
    };

    socket.on("notification:global", handleGlobal);
    socket.on("notification:unread_count", handleUnreadCount);
    return () => {
      socket.off("notification:global", handleGlobal);
      socket.off("notification:unread_count", handleUnreadCount);
    };
  }, [socket, queryClient]);

  return { popup, clearPopup };
}
