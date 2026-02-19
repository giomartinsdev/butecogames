import { useState, useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { useAdminUsers, useUpdateUserRole, useUpdateUserBan } from "@/hooks/useAdminUsers.js";
import { getRouteLabel } from "@butecogames/shared";
import type { AdminUser } from "@/api/admin-users.js";
import { DataTable } from "@/components/ui/DataTable.js";
import { toast } from "sonner";

export function AdminUsersPage() {
  const { isAdmin, isLoading: profileLoading, user: currentUser } = useUserProfile();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useAdminUsers(page, limit, debouncedSearch);
  const roleMutation = useUpdateUserRole();
  const banMutation = useUpdateUserBan();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

  const columns = useMemo<ColumnDef<AdminUser, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Usuário",
        cell: ({ row }) => {
          const user = row.original;
          return (
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
          );
        },
      },
      {
        id: "level",
        header: "Level",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.profile?.level ?? "—"}
          </span>
        ),
      },
      {
        id: "role",
        header: "Cargo",
        cell: ({ row }) => {
          const role = row.original.profile?.role ?? "user";
          return (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                role === "admin"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {role === "admin" ? "Admin" : "Usuário"}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const banned = row.original.profile?.banned ?? false;
          return (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                banned
                  ? "bg-destructive/20 text-destructive"
                  : "bg-green-500/20 text-green-400"
              }`}
            >
              {banned ? "Banido" : "Ativo"}
            </span>
          );
        },
      },
      {
        id: "presence",
        header: "Atividade",
        cell: ({ row }) => {
          const presence = row.original.presence;
          if (!presence) {
            return <span className="text-xs text-muted-foreground">Offline</span>;
          }
          return (
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    presence.status === "online" ? "bg-green-500" : "bg-orange-400"
                  }`}
                />
                <span className="text-xs text-card-foreground">
                  {presence.status === "online" ? "Online" : "Ausente"}
                </span>
              </div>
              {presence.currentPage && (
                <span className="text-xs text-muted-foreground">
                  {getRouteLabel(presence.currentPage)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Ações",
        meta: { textAlign: "right" } as any,
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === currentUser?.id;
          const role = user.profile?.role ?? "user";
          const banned = user.profile?.banned ?? false;

          if (isSelf) {
            return <span className="text-xs text-muted-foreground">Você</span>;
          }

          return (
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
          );
        },
      },
    ],
    [currentUser?.id, roleMutation.isPending, banMutation.isPending],
  );

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

  return (
    <div>
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

      {/* Search + page size */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-4 py-2 text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:max-w-md"
        />
        <select
          value={limit}
          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          className="rounded-lg bg-muted px-3 py-2 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          {[25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.users ?? []}
        pagination={data?.pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="Nenhum usuário encontrado"
      />
    </div>
  );
}
