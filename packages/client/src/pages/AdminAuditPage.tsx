import { useState, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { useAuditLogs } from "@/hooks/useAuditLogs.js";
import type { AuditLogEntry } from "@/api/audit.js";
import { DataTable } from "@/components/ui/DataTable.js";
import { Search } from "lucide-react";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "user.role_change": { label: "Cargo alterado", color: "bg-blue-500/20 text-blue-400" },
  "user.ban_change": { label: "Ban/Unban", color: "bg-red-500/20 text-red-400" },
  "settings.update": { label: "Config. alterada", color: "bg-yellow-500/20 text-yellow-400" },
  "event.create": { label: "Evento criado", color: "bg-green-500/20 text-green-400" },
  "event.status_change": { label: "Status evento", color: "bg-orange-500/20 text-orange-400" },
  "event.resolve": { label: "Evento resolvido", color: "bg-purple-500/20 text-purple-400" },
  "notification.create": { label: "Notificação", color: "bg-cyan-500/20 text-cyan-400" },
  "notification.resend": { label: "Reenvio", color: "bg-teal-500/20 text-teal-400" },
};

const ACTION_OPTIONS = [
  { value: "", label: "Todas as ações" },
  { value: "user.role_change", label: "Cargo alterado" },
  { value: "user.ban_change", label: "Ban/Unban" },
  { value: "settings.update", label: "Config. alterada" },
  { value: "event.create", label: "Evento criado" },
  { value: "event.status_change", label: "Status evento" },
  { value: "event.resolve", label: "Evento resolvido" },
  { value: "notification.create", label: "Notificação" },
  { value: "notification.resend", label: "Reenvio" },
];

const PAGE_SIZES = [25, 50, 100];

export function AdminAuditPage() {
  const { isAdmin, isLoading } = useUserProfile();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading: logsLoading } = useAuditLogs(page, limit, search, action);

  const columns = useMemo<ColumnDef<AuditLogEntry, any>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {new Date(getValue<string>()).toLocaleString("pt-BR")}
          </span>
        ),
      },
      {
        accessorKey: "adminName",
        header: "Admin",
        cell: ({ getValue }) => (
          <span className="text-card-foreground font-medium">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "action",
        header: "Ação",
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const info = ACTION_LABELS[val];
          if (!info) return <span className="text-muted-foreground">{val}</span>;
          return (
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${info.color}`}>
              {info.label}
            </span>
          );
        },
      },
      {
        accessorKey: "targetLabel",
        header: "Alvo",
        cell: ({ getValue }) => (
          <span className="text-card-foreground">{getValue<string>() || "—"}</span>
        ),
      },
      {
        id: "details",
        header: "Detalhes",
        cell: ({ row }) => {
          const { oldData, newData } = row.original;
          if (!oldData && !newData) return <span className="text-muted-foreground">—</span>;
          return (
            <details className="text-xs">
              <summary className="cursor-pointer text-accent hover:underline">
                Ver detalhes
              </summary>
              <div className="mt-1 space-y-1 max-w-xs">
                {oldData && (
                  <div>
                    <span className="text-red-400 font-medium">Antes: </span>
                    <pre className="whitespace-pre-wrap text-muted-foreground break-all">
                      {JSON.stringify(oldData, null, 2)}
                    </pre>
                  </div>
                )}
                {newData && (
                  <div>
                    <span className="text-green-400 font-medium">Depois: </span>
                    <pre className="whitespace-pre-wrap text-muted-foreground break-all">
                      {JSON.stringify(newData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          );
        },
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleActionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setAction(e.target.value);
    setPage(1);
  }

  function handleLimitChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLimit(Number(e.target.value));
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            to="/admin"
            className="text-sm text-muted-foreground hover:text-card-foreground transition-colors"
          >
            &larr; Voltar
          </Link>
          <h1 className="text-2xl font-bold text-card-foreground">
            Auditoria
          </h1>
        </div>
        <p className="text-muted-foreground">
          Histórico de ações administrativas na plataforma.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar admin ou alvo..."
              className="rounded-lg bg-muted pl-9 pr-3 py-1.5 text-sm text-card-foreground placeholder-muted-foreground outline-none focus:ring-1 focus:ring-primary w-56"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            Buscar
          </button>
        </form>

        <select
          value={action}
          onChange={handleActionChange}
          className="rounded-lg bg-muted px-3 py-1.5 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={limit}
          onChange={handleLimitChange}
          className="rounded-lg bg-muted px-3 py-1.5 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.logs ?? []}
        pagination={data?.pagination}
        onPageChange={setPage}
        isLoading={logsLoading}
        emptyMessage="Nenhum registro de auditoria encontrado"
      />
    </div>
  );
}
