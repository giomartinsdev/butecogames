import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "./Header.js";
import { useSocket } from "@/hooks/useSocket.js";
import { useCursorEffect } from "@/hooks/useCursorEffect.js";
import { useOnlineUsers } from "@/hooks/useOnlineUsers.js";

export function Layout() {
  const { socket } = useSocket();
  useCursorEffect();
  useOnlineUsers();
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
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 h-full w-full object-cover -z-10 opacity-10"
      >
        <source src="/bg-animated.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-background/100 -z-10" />
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
