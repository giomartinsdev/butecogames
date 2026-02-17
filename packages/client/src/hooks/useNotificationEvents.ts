import { useEffect } from "react";
import { useSocketStore } from "@/stores/socketStore.js";
import { useSoundStore } from "@/stores/soundStore.js";
import { toast } from "sonner";

export function useNotificationEvents() {
  const socket = useSocketStore((s) => s.socket);

  useEffect(() => {
    if (!socket) return;

    const handleGlobal = (data: {
      type: "info" | "success" | "warning" | "error" | "announcement";
      title: string;
      message?: string;
    }) => {
      const toastType = data.type === "announcement" ? "success" : data.type;
      toast[toastType](data.title, {
        description: data.message,
        duration: data.type === "announcement" ? 10000 : 5000,
      });

      if (data.type === "announcement") {
        useSoundStore.getState().playSound("bet_win");
      }
    };

    socket.on("notification:global", handleGlobal);
    return () => {
      socket.off("notification:global", handleGlobal);
    };
  }, [socket]);
}
