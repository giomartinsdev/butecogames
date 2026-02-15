import { Outlet } from "react-router-dom";
import { Header } from "./Header.js";
import { useSocket } from "@/hooks/useSocket.js";
import { useCursorEffect } from "@/hooks/useCursorEffect.js";

export function Layout() {
  useSocket();
  useCursorEffect();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
