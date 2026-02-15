import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { useAdminUsers, useUpdateUserRole, useUpdateUserBan } from "@/hooks/useAdminUsers.js";
import { toast } from "sonner";

export function AdminUsersPage() {
  const { isAdmin, isLoading: profileLoading, user: currentUser } = useUserProfile();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useAdminUsers(page, debouncedSearch);
  const roleMutation = useUpdateUserRole();
  const banMutation = useUpdateUserBan();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleToggleRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const label = newRole === "admin" ? "administrador" : "usuário";
    roleMutation.mutate(
      { userId, role: newRole as "admin" | "user" },
      {
        onSuccess: () => toast.success(`Cargo alterado para ${label}`),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleToggleBan = (userId: string, currentlyBanned: boolean) => {
    if (!currentlyBanned) {
      if (!confirm("Tem certeza que deseja banir este usuário?")) return;
    }
    banMutation.mutate(
      { userId, banned: !currentlyBanned },
      {
        onSuccess: () =>
          toast.success(currentlyBanned ? "Usuário desbanido" : "Usuário banido"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          to="/admin"
          className="text-sm text-muted-foreground hover:text-card-foreground transition-colors"
        >
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-card-foreground">
          Gerenciamento de Usuários
        </h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-4 py-2 text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:max-w-md"
        />
      </div>

      {/* User list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Usuário</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Level</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Cargo</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Status</th>
              <th className="px-4 py-3 text-right text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const role = user.profile?.role ?? "user";
                const banned = user.profile?.banned ?? false;

                return (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                            {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-card-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.profile?.level ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          role === "admin"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {role === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          banned
                            ? "bg-destructive/20 text-destructive"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {banned ? "Banido" : "Ativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">Você</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRole(user.id, role)}
                            disabled={roleMutation.isPending}
                            className="rounded-md border border-border px-3 py-1 text-xs text-card-foreground hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            {role === "admin" ? "Remover Admin" : "Tornar Admin"}
                          </button>
                          <button
                            onClick={() => handleToggleBan(user.id, banned)}
                            disabled={banMutation.isPending}
                            className={`rounded-md px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                              banned
                                ? "border border-border text-card-foreground hover:bg-muted"
                                : "bg-destructive text-destructive-foreground hover:bg-destructive/80"
                            }`}
                          >
                            {banned ? "Desbanir" : "Banir"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-border px-3 py-1 text-sm text-card-foreground hover:bg-muted disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="rounded-md border border-border px-3 py-1 text-sm text-card-foreground hover:bg-muted disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
