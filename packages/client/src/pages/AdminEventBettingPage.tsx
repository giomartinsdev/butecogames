import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  EventCategory,
  BetOption,
  EventStatus,
  EventBettingEvent,
} from "@butecogames/shared";
import { EVENT_CATEGORIES } from "@butecogames/shared";
import { apiClient } from "@/api/client.js";
import { toast } from "sonner";
import { formatCoins } from "@/lib/utils.js";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { DataTable } from "@/components/ui/DataTable.js";
import {
  Play,
  XCircle,
  Undo2,
  RotateCcw,
  Trophy,
  Check,
  X,
  Calendar,
} from "lucide-react";

const statusConfig: Record<
  EventStatus,
  { label: string; className: string }
> = {
  upcoming: {
    label: "Próximo",
    className: "bg-primary/20 text-primary",
  },
  in_progress: {
    label: "Em Andamento",
    className: "bg-yellow-500/20 text-yellow-400",
  },
  completed: {
    label: "Concluído",
    className: "bg-green-500/20 text-green-400",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-destructive/20 text-destructive",
  },
};

export function AdminEventBettingPage() {
  const { isAdmin, isLoading: profileLoading } = useUserProfile();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStartTime, setEditingStartTime] = useState<string | null>(null);
  const [newStartTime, setNewStartTime] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "ufc" as EventCategory,
    option1: "",
    option2: "",
    startTime: "",
    allowDraw: true,
  });

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["admin-event-betting-events"],
    queryFn: async () => {
      const res = await apiClient.get("/api/event-betting/events");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post("/api/event-betting/events", {
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao criar evento");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Evento criado com sucesso!");
      setShowCreateForm(false);
      setFormData({
        title: "",
        description: "",
        category: "ufc",
        option1: "",
        option2: "",
        startTime: "",
        allowDraw: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-event-betting-events"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      eventId,
      status,
      startTime,
    }: {
      eventId: string;
      status: string;
      startTime?: string;
    }) => {
      const res = await apiClient.put(
        `/api/event-betting/events/${eventId}/status`,
        {
          body: JSON.stringify({ status, startTime }),
        },
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao atualizar status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      setEditingStartTime(null);
      setNewStartTime("");
      queryClient.invalidateQueries({
        queryKey: ["admin-event-betting-events"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resolveEventMutation = useMutation({
    mutationFn: async ({
      eventId,
      result,
    }: {
      eventId: string;
      result: BetOption;
    }) => {
      const res = await apiClient.post(
        `/api/event-betting/events/${eventId}/resolve`,
        {
          body: JSON.stringify({ result }),
        },
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao resolver evento");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Evento encerrado e vencedores pagos!");
      queryClient.invalidateQueries({
        queryKey: ["admin-event-betting-events"],
      });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate(formData);
  };

  const activeEvents = (eventsData?.events || []).filter(
    (e: EventBettingEvent) =>
      e.status === "upcoming" || e.status === "in_progress",
  );
  const completedEvents = (eventsData?.events || []).filter(
    (e: EventBettingEvent) =>
      e.status === "completed" || e.status === "cancelled",
  );

  const activeColumns = useMemo<ColumnDef<EventBettingEvent, any>[]>(
    () => [
      {
        id: "event",
        header: "Evento",
        cell: ({ row }) => {
          const event = row.original;
          return (
            <div>
              <span className="text-[10px] text-muted-foreground">
                {EVENT_CATEGORIES[event.category]}
              </span>
              <p className="font-medium text-card-foreground">{event.title}</p>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.description}
                </p>
              )}
              {event.startTime && (
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(event.startTime).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "options",
        header: "Opções / Pool",
        cell: ({ row }) => {
          const event = row.original;
          return (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-card-foreground">{event.option1}</span>
                <span className="text-muted-foreground">
                  {formatCoins(event.option1Pool)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-card-foreground">{event.option2}</span>
                <span className="text-muted-foreground">
                  {formatCoins(event.option2Pool)}
                </span>
              </div>
              {event.allowDraw && (
                <div className="flex justify-between gap-4">
                  <span className="text-card-foreground">Empate</span>
                  <span className="text-muted-foreground">
                    {formatCoins(event.drawPool)}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-border pt-1">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="text-card-foreground font-medium">
                  {formatCoins(event.totalPool)}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const { status } = row.original;
          const config = statusConfig[status];
          return (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
            >
              {config.label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const event = row.original;
          return (
            <div className="flex flex-col gap-1.5">
              {event.status === "upcoming" && (
                <div className="flex items-center gap-1">
                  <button
                    title="Iniciar"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        eventId: event._id,
                        status: "in_progress",
                      })
                    }
                    className="rounded p-1.5 text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    title="Cancelar"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        eventId: event._id,
                        status: "cancelled",
                      })
                    }
                    className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              )}
              {event.status === "in_progress" && (
                <>
                  {editingStartTime === event._id ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="datetime-local"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="rounded bg-muted px-2 py-1 text-xs text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex gap-1">
                        <button
                          title="Confirmar"
                          onClick={() => {
                            updateStatusMutation.mutate({
                              eventId: event._id,
                              status: "upcoming",
                              startTime: newStartTime || undefined,
                            });
                          }}
                          className="rounded p-1.5 text-green-400 hover:bg-green-500/10 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          title="Cancelar"
                          onClick={() => {
                            setEditingStartTime(null);
                            setNewStartTime("");
                          }}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          title="Voltar para Próximo"
                          onClick={() => {
                            setEditingStartTime(event._id);
                            const oneHourFromNow = new Date();
                            oneHourFromNow.setHours(
                              oneHourFromNow.getHours() + 1,
                            );
                            setNewStartTime(
                              oneHourFromNow.toISOString().slice(0, 16),
                            );
                          }}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Undo2 className="h-4 w-4" />
                        </button>
                        <button
                          title="Cancelar Evento"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              eventId: event._id,
                              status: "cancelled",
                            })
                          }
                          className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          title={`Vencedor: ${event.option1}`}
                          onClick={() =>
                            resolveEventMutation.mutate({
                              eventId: event._id,
                              result: "option1",
                            })
                          }
                          className="rounded px-2 py-1 text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                        >
                          <Trophy className="h-3 w-3 inline mr-1" />
                          {event.option1}
                        </button>
                        {event.allowDraw && (
                          <button
                            title="Empate"
                            onClick={() =>
                              resolveEventMutation.mutate({
                                eventId: event._id,
                                result: "draw",
                              })
                            }
                            className="rounded px-2 py-1 text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                          >
                            <Trophy className="h-3 w-3 inline mr-1" />
                            Empate
                          </button>
                        )}
                        <button
                          title={`Vencedor: ${event.option2}`}
                          onClick={() =>
                            resolveEventMutation.mutate({
                              eventId: event._id,
                              result: "option2",
                            })
                          }
                          className="rounded px-2 py-1 text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                        >
                          <Trophy className="h-3 w-3 inline mr-1" />
                          {event.option2}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        },
      },
    ],
    [editingStartTime, newStartTime],
  );

  const completedColumns = useMemo<ColumnDef<EventBettingEvent, any>[]>(
    () => [
      {
        id: "event",
        header: "Evento",
        cell: ({ row }) => {
          const event = row.original;
          return (
            <div>
              <span className="text-[10px] text-muted-foreground">
                {EVENT_CATEGORIES[event.category]}
              </span>
              <p className="font-medium text-card-foreground">{event.title}</p>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.description}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "options",
        header: "Opções / Pool",
        cell: ({ row }) => {
          const event = row.original;
          return (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-card-foreground">{event.option1}</span>
                <span className="text-muted-foreground">
                  {formatCoins(event.option1Pool)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-card-foreground">{event.option2}</span>
                <span className="text-muted-foreground">
                  {formatCoins(event.option2Pool)}
                </span>
              </div>
              {event.allowDraw && (
                <div className="flex justify-between gap-4">
                  <span className="text-card-foreground">Empate</span>
                  <span className="text-muted-foreground">
                    {formatCoins(event.drawPool)}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-border pt-1">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className="text-card-foreground font-medium">
                  {formatCoins(event.totalPool)}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const { status } = row.original;
          const config = statusConfig[status];
          return (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
            >
              {config.label}
            </span>
          );
        },
      },
      {
        id: "result",
        header: "Resultado",
        cell: ({ row }) => {
          const event = row.original;
          if (event.status === "cancelled") {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          if (!event.result) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          const label =
            event.result === "option1"
              ? event.option1
              : event.result === "option2"
                ? event.option2
                : "Empate";
          return (
            <span className="text-xs font-medium text-accent flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const event = row.original;
          if (event.status === "cancelled") {
            return editingStartTime === event._id ? (
              <div className="flex flex-col gap-1">
                <input
                  type="datetime-local"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="rounded bg-muted px-2 py-1 text-xs text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-1">
                  <button
                    title="Confirmar"
                    onClick={() => {
                      if (!newStartTime) {
                        toast.error("Defina um horário de início");
                        return;
                      }
                      updateStatusMutation.mutate({
                        eventId: event._id,
                        status: "upcoming",
                        startTime: newStartTime,
                      });
                    }}
                    className="rounded p-1.5 text-green-400 hover:bg-green-500/10 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    title="Cancelar"
                    onClick={() => {
                      setEditingStartTime(null);
                      setNewStartTime("");
                    }}
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                title="Reativar"
                onClick={() => {
                  setEditingStartTime(event._id);
                  const oneHourFromNow = new Date();
                  oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
                  setNewStartTime(
                    oneHourFromNow.toISOString().slice(0, 16),
                  );
                }}
                className="rounded p-1.5 text-primary hover:bg-primary/10 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            );
          }
          return <span className="text-xs text-muted-foreground">—</span>;
        },
      },
    ],
    [editingStartTime, newStartTime],
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link
              to="/admin"
              className="text-sm text-muted-foreground hover:text-card-foreground transition-colors"
            >
              ← Voltar
            </Link>
            <h1 className="text-2xl font-bold text-card-foreground">Eventos</h1>
          </div>
          <p className="text-muted-foreground">
            Gerenciar eventos e resultados
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showCreateForm ? "Cancelar" : "Criar Evento"}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-xl font-bold text-card-foreground mb-4">
            Novo Evento
          </h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Título</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  onBlur={(e) => {
                    const title = e.target.value;
                    const match = title.match(
                      /^(.+?)\s+(?:vs\.?|x)\s+(.+)$/i,
                    );
                    if (match) {
                      setFormData((prev) => ({
                        ...prev,
                        option1: match[1].trim(),
                        option2: match[2].trim(),
                      }));
                    }
                  }}
                  className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as EventCategory,
                    })
                  }
                  className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  {Object.entries(EVENT_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Opção 1</label>
                <input
                  type="text"
                  required
                  value={formData.option1}
                  onChange={(e) =>
                    setFormData({ ...formData, option1: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Opção 2</label>
                <input
                  type="text"
                  required
                  value={formData.option2}
                  onChange={(e) =>
                    setFormData({ ...formData, option2: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Horário de Início (opcional)
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowDraw"
                checked={formData.allowDraw}
                onChange={(e) =>
                  setFormData({ ...formData, allowDraw: e.target.checked })
                }
                className="h-4 w-4 rounded border-border bg-muted text-primary focus:ring-1 focus:ring-primary"
              />
              <label htmlFor="allowDraw" className="text-sm text-card-foreground">
                Permitir apostas em empate
              </label>
            </div>

            <button
              type="submit"
              disabled={createEventMutation.isPending}
              className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {createEventMutation.isPending ? "Criando..." : "Criar Evento"}
            </button>
          </form>
        </div>
      )}

      {/* Active events table */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground mb-3">
            Eventos Ativos
          </h2>
          <DataTable
            columns={activeColumns}
            data={activeEvents}
            isLoading={isLoading}
            emptyMessage="Nenhum evento ativo"
            pageSize={10}
          />
        </div>

        {/* Completed/Cancelled events table */}
        {completedEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-card-foreground mb-3">
              Eventos Encerrados
            </h2>
            <DataTable
              columns={completedColumns}
              data={completedEvents}
              emptyMessage="Nenhum evento encerrado"
              pageSize={10}
            />
          </div>
        )}
      </div>
    </div>
  );
}
