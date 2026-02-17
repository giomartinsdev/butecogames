import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "./Header.js";
import { useSocket } from "@/hooks/useSocket.js";
import { useCursorEffect } from "@/hooks/useCursorEffect.js";
import { useOnlineUsers } from "@/hooks/useOnlineUsers.js";
import { useGamificationEvents } from "@/hooks/useGamificationEvents.js";

export function Layout() {
  const { socket } = useSocket();
  useCursorEffect();
  useOnlineUsers();
  useGamificationEvents();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleWalletUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    };

    socket.on("wallet:updated", handleWalletUpdated);
    return () => {
      socket.off("wallet:updated", handleWalletUpdated);
    };
  }, [socket, queryClient]);

  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
