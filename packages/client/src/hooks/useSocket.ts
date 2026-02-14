import { useEffect } from "react";
import { useSocketStore } from "@/stores/socketStore.js";
import { useAuth } from "./useAuth.js";

export function useSocket() {
  const { isAuthenticated } = useAuth();
  const { socket, connected, connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (isAuthenticated && !socket) {
      connect();
    }

    return () => {
      // Don't disconnect on unmount — keep connection alive
    };
  }, [isAuthenticated, socket, connect]);

  useEffect(() => {
    if (!isAuthenticated && socket) {
      disconnect();
    }
  }, [isAuthenticated, socket, disconnect]);

  return { socket, connected };
}
