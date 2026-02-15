import { Link, Navigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile.js";

interface AdminAction {
  title: string;
  description: string;
  path: string;
  icon: string;
}

const adminActions: AdminAction[] = [
  {
    title: "Apostas Esportivas",
    description: "Criar e gerenciar eventos de apostas esportivas",
    path: "/admin/event-betting",
    icon: "⚽",
  },
  // Add more admin actions here as needed
];

export function AdminPage() {
  const { isAdmin, isLoading, profile } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-card-foreground mb-2">
          Painel de Administração
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo, {profile?.displayName}! Gerencie a plataforma usando as ferramentas abaixo.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adminActions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg"
          >
            <div className="mb-4 text-4xl">{action.icon}</div>
            <h3 className="text-xl font-bold text-card-foreground mb-2 group-hover:text-primary transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-bold text-card-foreground mb-4">
          Informações do Sistema
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seu Perfil:</span>
            <span className="text-card-foreground font-medium">
              {profile?.displayName} ({profile?.role})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Level:</span>
            <span className="text-card-foreground font-medium">
              {profile?.level}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">XP:</span>
            <span className="text-card-foreground font-medium">
              {profile?.xp}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-accent/20 bg-accent/10 p-4">
        <p className="text-sm text-accent">
          <strong>⚠️ Atenção:</strong> Você tem permissões de administrador. Use essas ferramentas com cuidado.
        </p>
      </div>
    </div>
  );
}
