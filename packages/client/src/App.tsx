import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { CircleCheck, CircleX, TriangleAlert, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth.js";
import { Layout } from "@/components/layout/Layout.js";
import { LoginPage } from "@/pages/LoginPage.js";
import { DashboardPage } from "@/pages/DashboardPage.js";
import { GamesPage } from "@/pages/GamesPage.js";
import { RoulettePage } from "@/pages/RoulettePage.js";
import { EventBettingPage } from "@/pages/EventBettingPage.js";
import { AdminPage } from "@/pages/AdminPage.js";
import { AdminEventBettingPage } from "@/pages/AdminEventBettingPage.js";
import { AdminSettingsPage } from "@/pages/AdminSettingsPage.js";
import { AdminUsersPage } from "@/pages/AdminUsersPage.js";
import { ProfilePage } from "@/pages/ProfilePage.js";
import { LeaderboardPage } from "@/pages/LeaderboardPage.js";
import { SettingsPage } from "@/pages/SettingsPage.js";
import { CardDuelPage } from "@/pages/CardDuelPage.js";
import { AdminNotificationsPage } from "@/pages/AdminNotificationsPage.js";
import { AppsPage } from "@/pages/AppsPage.js";
import { PoliticalCompassPage } from "@/pages/PoliticalCompassPage.js";
import { AdminAuditPage } from "@/pages/AdminAuditPage.js";
import { UnecoPage } from "@/pages/UnecoPage.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/roulette" element={<RoulettePage />} />
        <Route path="/games/event-betting" element={<EventBettingPage />} />
        <Route path="/games/card-duel" element={<CardDuelPage />} />
        <Route path="/games/uneco" element={<UnecoPage />} />
        <Route path="/apps" element={<AppsPage />} />
        <Route path="/apps/political-compass" element={<PoliticalCompassPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/event-betting" element={<AdminEventBettingPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-center"
          offset={75}
          icons={{
            success: <CircleCheck size={24} />,
            error: <CircleX size={24} />,
            warning: <TriangleAlert size={24} />,
            info: <Info size={24} />,
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
