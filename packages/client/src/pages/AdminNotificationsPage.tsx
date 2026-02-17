import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { apiFetch } from "@/api/client.js";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/DataTable.js";
import {
  Send,
  Info,
  CircleCheck,
  TriangleAlert,
  CircleX,
  Megaphone,
  RotateCw,
  Search,
} from "lucide-react";

const MESSAGE_TYPES = [
  { value: "info", label: "Informação", icon: Info, color: "text-blue-400", border: "border-blue-400" },
  { value: "success", label: "Sucesso", icon: CircleCheck, color: "text-green-400", border: "border-green-400" },
  { value: "warning", label: "Aviso", icon: TriangleAlert, color: "text-yellow-400", border: "border-yellow-400" },
  { value: "error", label: "Erro", icon: CircleX, color: "text-red-400", border: "border-red-400" },
  { value: "announcement", label: "Anúncio", icon: Megaphone, color: "text-accent", border: "border-accent" },
] as const;

const TYPE_MAP = Object.fromEntries(MESSAGE_TYPES.map((t) => [t.value, t]));

interface NotificationRecord {
  _id: string;
  type: string;
  title: string;
  message?: string;
  sentByName: string;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: NotificationRecord[];
  pagination: { page: number; pages: number; total: number };
}

export function AdminNotificationsPage() {
  const { isAdmin, isLoading } = useUserProfile();
  const queryClient = useQueryClient();

  // Form state
  const [type, setType] = useState<string>("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // History state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["admin-notifications", page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      return apiFetch<NotificationsResponse>(`/api/admin/notifications?${params}`);
    },
    enabled: !!isAdmin,
  });

  const columns = useMemo<ColumnDef<NotificationRecord, any>[]>(
    () => [
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ getValue }) => {
          const t = TYPE_MAP[getValue<string>()];
          if (!t) return getValue<string>();
          const Icon = t.icon;
          return (
            <span className={`flex items-center gap-1.5 ${t.color}`}>
              <Icon size={14} />
              {t.label}
            </span>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ getValue }) => (
          <span className="text-card-foreground font-medium">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "message",
        header: "Mensagem",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-xs line-clamp-1">
            {getValue<string>() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "sentByName",
        header: "Enviado por",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {new Date(getValue<string>()).toLocaleString("pt-BR")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const n = row.original;
          const isResending = resendingId === n._id;
          return (
            <button
              type="button"
              disabled={isResending}
              onClick={() => handleResend(n._id)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
              title="Reenviar"
            >
              <RotateCw size={13} className={isResending ? "animate-spin" : ""} />
              Reenviar
            </button>
          );
        },
      },
    ],
    [resendingId],
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

  const selected = MESSAGE_TYPES.find((t) => t.value === type)!;

  async function handleSend() {
    if (!title.trim()) {
      toast.error("Título obrigatório");
      return;
    }

    setSending(true);
    try {
      await apiFetch("/api/admin/notifications", {
        method: "POST",
        body: JSON.stringify({
          type,
          title: title.trim(),
          message: message.trim() || undefined,
        }),
      });
      toast.success("Notificação enviada!");
      setTitle("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  async function handleResend(id: string) {
    setResendingId(id);
    try {
      await apiFetch(`/api/admin/notifications/${id}/resend`, { method: "POST" });
      toast.success("Notificação reenviada!");
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao reenviar");
    } finally {
      setResendingId(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-card-foreground mb-2">
          Notificações Globais
        </h1>
        <p className="text-muted-foreground">
          Envie uma notificação para todos os usuários conectados.
        </p>
      </div>

      {/* Type selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-card-foreground">Tipo</label>
        <div className="flex flex-wrap gap-2">
          {MESSAGE_TYPES.map((t) => {
            const Icon = t.icon;
            const isActive = type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? `${t.border} ${t.color} bg-card`
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-card-foreground">
          Título <span className="text-muted-foreground">(obrigatório)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Ex: Manutenção programada"
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-card-foreground placeholder-muted-foreground focus:border-accent focus:outline-none"
        />
        <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-card-foreground">
          Mensagem <span className="text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Detalhes adicionais..."
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-card-foreground placeholder-muted-foreground focus:border-accent focus:outline-none resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-card-foreground">Preview</label>
        <div className={`rounded-lg border-l-4 ${selected.border} bg-card p-4`}>
          <div className={`flex items-center gap-2 ${selected.color}`}>
            <selected.icon size={18} />
            <span className="font-semibold">{title || "Título da notificação"}</span>
          </div>
          {(message || !title) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {message || "Mensagem opcional aparecerá aqui."}
            </p>
          )}
        </div>
      </div>

      {/* Send button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !title.trim()}
        className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={16} />
        {sending ? "Enviando..." : "Enviar notificação"}
      </button>

      {/* History */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-card-foreground">Histórico</h2>
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
                placeholder="Buscar..."
                className="rounded-lg border border-border bg-card pl-9 pr-3 py-1.5 text-sm text-card-foreground placeholder-muted-foreground focus:border-accent focus:outline-none w-48"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>

        <DataTable
          columns={columns}
          data={historyData?.notifications ?? []}
          pagination={historyData?.pagination}
          onPageChange={setPage}
          isLoading={historyLoading}
          emptyMessage="Nenhuma notificação enviada"
        />
      </div>
    </div>
  );
}
