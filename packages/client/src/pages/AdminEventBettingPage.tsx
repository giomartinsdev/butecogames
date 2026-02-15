import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventCategory, BetOption, EventStatus } from "@butecogames/shared";
import { EVENT_CATEGORIES } from "@butecogames/shared";
import { apiClient } from "@/api/client.js";
import { toast } from "sonner";
import { formatCoins } from "@/lib/utils.js";
import { useUserProfile } from "@/hooks/useUserProfile.js";

const getStatusLabel = (status: EventStatus): string => {
  const labels: Record<EventStatus, string> = {
    upcoming: "Próximo",
    in_progress: "Em Andamento",
    completed: "Concluído",
    cancelled: "Cancelado",
  };
  return labels[status];
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
    category: "sports" as EventCategory,
    team1: "",
    team2: "",
    startTime: "",
    allowDraw: true,
  });

  // Fetch all events
  const { data: eventsData } = useQuery({
    queryKey: ["admin-event-betting-events"],
    queryFn: async () => {
      const res = await apiClient.get("/api/event-betting/events");
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Create event mutation
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
        category: "sports",
        team1: "",
        team2: "",
        startTime: "",
        allowDraw: true,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-event-betting-events"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      eventId,
      status,
      startTime
    }: {
      eventId: string;
      status: string;
      startTime?: string;
    }) => {
      const res = await apiClient.put(`/api/event-betting/events/${eventId}/status`, {
        body: JSON.stringify({ status, startTime }),
      });
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
      queryClient.invalidateQueries({ queryKey: ["admin-event-betting-events"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Resolve event mutation
  const resolveEventMutation = useMutation({
    mutationFn: async ({ eventId, result }: { eventId: string; result: BetOption }) => {
      const res = await apiClient.post(`/api/event-betting/events/${eventId}/resolve`, {
        body: JSON.stringify({ result }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao resolver evento");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Evento encerrado e vencedores pagos!");
      queryClient.invalidateQueries({ queryKey: ["admin-event-betting-events"] });
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

  const events = eventsData?.events || [];

  if (profileLoading) {
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground mb-2">
            Administração - Apostas Esportivas
          </h1>
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
                  className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Categoria</label>
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
              <label className="text-sm text-muted-foreground">Descrição</label>
              <textarea
                required
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
                <label className="text-sm text-muted-foreground">Time 1</label>
                <input
                  type="text"
                  required
                  value={formData.team1}
                  onChange={(e) =>
                    setFormData({ ...formData, team1: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Time 2</label>
                <input
                  type="text"
                  required
                  value={formData.team2}
                  onChange={(e) =>
                    setFormData({ ...formData, team2: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Horário de Início
              </label>
              <input
                type="datetime-local"
                required
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

      {/* Events list */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-card-foreground">Eventos</h2>
        {events.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            Nenhum evento criado
          </div>
        ) : (
          events.map((event: any) => (
            <div
              key={event._id}
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {EVENT_CATEGORIES[event.category as EventCategory]}
                  </div>
                  <h3 className="font-bold text-card-foreground">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.team1} vs {event.team2}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Início:{" "}
                    {new Date(event.startTime).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded px-2 py-1 text-xs font-medium bg-muted">
                  {getStatusLabel(event.status)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded bg-muted p-2">
                  <div className="text-muted-foreground">{event.team1}</div>
                  <div className="font-bold text-card-foreground">
                    {formatCoins(event.team1Pool)}
                  </div>
                </div>
                <div className="rounded bg-muted p-2">
                  <div className="text-muted-foreground">Empate</div>
                  <div className="font-bold text-card-foreground">
                    {formatCoins(event.drawPool)}
                  </div>
                </div>
                <div className="rounded bg-muted p-2">
                  <div className="text-muted-foreground">{event.team2}</div>
                  <div className="font-bold text-card-foreground">
                    {formatCoins(event.team2Pool)}
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Pool total: {formatCoins(event.totalPool)} coins
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-border">
                {/* Status Change Section */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground">Status:</span>

                  {/* Show status change buttons based on current status */}
                  {event.status === "upcoming" && (
                    <>
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            eventId: event._id,
                            status: "in_progress",
                          })
                        }
                        className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        → Em Andamento
                      </button>
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            eventId: event._id,
                            status: "cancelled",
                          })
                        }
                        className="rounded bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
                      >
                        → Cancelar
                      </button>
                    </>
                  )}

                  {event.status === "in_progress" && (
                    <>
                      {editingStartTime === event._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={newStartTime}
                            onChange={(e) => setNewStartTime(e.target.value)}
                            className="rounded bg-muted px-2 py-1 text-xs text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            onClick={() => {
                              if (!newStartTime) {
                                toast.error("Por favor, defina um horário de início");
                                return;
                              }
                              updateStatusMutation.mutate({
                                eventId: event._id,
                                status: "upcoming",
                                startTime: newStartTime,
                              });
                            }}
                            className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => {
                              setEditingStartTime(null);
                              setNewStartTime("");
                            }}
                            className="rounded bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingStartTime(event._id);
                              // Set default to 1 hour from now
                              const oneHourFromNow = new Date();
                              oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
                              setNewStartTime(oneHourFromNow.toISOString().slice(0, 16));
                            }}
                            className="rounded bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                          >
                            ← Voltar para Próximo
                          </button>
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                eventId: event._id,
                                status: "cancelled",
                              })
                            }
                            className="rounded bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
                          >
                            → Cancelar
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {event.status === "cancelled" && (
                    <>
                      {editingStartTime === event._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={newStartTime}
                            onChange={(e) => setNewStartTime(e.target.value)}
                            className="rounded bg-muted px-2 py-1 text-xs text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            onClick={() => {
                              if (!newStartTime) {
                                toast.error("Por favor, defina um horário de início");
                                return;
                              }
                              updateStatusMutation.mutate({
                                eventId: event._id,
                                status: "upcoming",
                                startTime: newStartTime,
                              });
                            }}
                            className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => {
                              setEditingStartTime(null);
                              setNewStartTime("");
                            }}
                            className="rounded bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingStartTime(event._id);
                            // Set default to 1 hour from now
                            const oneHourFromNow = new Date();
                            oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
                            setNewStartTime(oneHourFromNow.toISOString().slice(0, 16));
                          }}
                          className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          ← Reativar
                        </button>
                      )}
                    </>
                  )}

                  {event.status === "completed" && (
                    <span className="text-xs text-muted-foreground">
                      Evento finalizado - {event.result && `Vencedor: ${event.result}`}
                    </span>
                  )}
                </div>

                {/* Result Selection - Only for in_progress events */}
                {event.status === "in_progress" && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-muted-foreground">Resolver:</span>
                    <button
                      onClick={() =>
                        resolveEventMutation.mutate({
                          eventId: event._id,
                          result: "team1",
                        })
                      }
                      className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
                    >
                      ✓ {event.team1}
                    </button>
                    {event.allowDraw && (
                      <button
                        onClick={() =>
                          resolveEventMutation.mutate({
                            eventId: event._id,
                            result: "draw",
                          })
                        }
                        className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
                      >
                        ✓ Empate
                      </button>
                    )}
                    <button
                      onClick={() =>
                        resolveEventMutation.mutate({
                          eventId: event._id,
                          result: "team2",
                        })
                      }
                      className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
                    >
                      ✓ {event.team2}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
