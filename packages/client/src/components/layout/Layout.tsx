import { Outlet } from "react-router-dom";
import { Header } from "./Header.js";
import { useSocket } from "@/hooks/useSocket.js";

export function Layout() {
  useSocket();

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
