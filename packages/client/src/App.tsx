import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
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
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/event-betting" element={<AdminEventBettingPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
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
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
