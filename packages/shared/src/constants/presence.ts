/** Default away timeout in seconds (3 minutes). */
export const DEFAULT_AWAY_TIMEOUT = 180;

/** Map of route path prefixes to pt-BR activity labels. More specific routes first. */
const ROUTE_LABELS: Array<{ path: string; label: string }> = [
  { path: "/games/roulette", label: "Roleta" },
  { path: "/games/event-betting", label: "Apostas em Eventos" },
  { path: "/games/card-duel", label: "Duelo de Cartas" },
  { path: "/games/uno", label: "UNO" },
  { path: "/games", label: "Jogos" },
  { path: "/apps/political-compass", label: "Bússola Política" },
  { path: "/apps", label: "Apps" },
  { path: "/leaderboard", label: "Ranking" },
  { path: "/profile", label: "Perfil" },
  { path: "/settings", label: "Configurações" },
  { path: "/admin/event-betting", label: "Admin - Eventos" },
  { path: "/admin/settings", label: "Admin - Configurações" },
  { path: "/admin/users", label: "Admin - Usuários" },
  { path: "/admin/notifications", label: "Admin - Notificações" },
  { path: "/admin/audit", label: "Admin - Auditoria" },
  { path: "/admin", label: "Admin" },
  { path: "/", label: "Início" },
];

export function getRouteLabel(pathname: string): string {
  for (const route of ROUTE_LABELS) {
    if (
      pathname === route.path ||
      (route.path !== "/" && pathname.startsWith(route.path))
    ) {
      return route.label;
    }
  }
  return "Navegando";
}
