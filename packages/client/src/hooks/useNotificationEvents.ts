import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/stores/socketStore.js";
import { useSoundStore } from "@/stores/soundStore.js";

export function useNotificationEvents() {
  const socket = useSocketStore((s) => s.socket);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleGlobal = (data: {
      type: "info" | "success" | "warning" | "error" | "announcement";
      title: string;
      message?: string;
    }) => {
      if (data.type === "announcement") {
        useSoundStore.getState().playSound("bet_win");
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
}
