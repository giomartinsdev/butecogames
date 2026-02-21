import { useState, useMemo, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  EventCategory,
  BetOption,
  EventStatus,
  EventBettingEvent,
  UfcEventData,
} from "@butecogames/shared";
import { EVENT_CATEGORIES, EVENT_CATEGORY_COLORS } from "@butecogames/shared";
import { apiClient } from "@/api/client.js";
import { toast } from "sonner";
import { formatCoins } from "@/lib/utils.js";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { useSocketStore } from "@/stores/socketStore.js";
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
  ImagePlus,
  RefreshCw,
  Pencil,
  Download,
  Loader2,
  Trash2,
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

function EventEditForm({
  event,
  isPending,
  onSave,
  onCancel,
}: {
  event: EventBettingEvent;
  isPending: boolean;
  onSave: (data: { title: string; description: string; option1: string; option2: string }) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState({
    title: event.title,
    description: event.description || "",
    option1: event.option1,
    option2: event.option2,
  });

  return (
    <div className="flex flex-col gap-1.5 min-w-50">
      <input
        type="text"
        value={data.title}
        onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
        onBlur={(e) => {
          const match = e.target.value.match(/^(.+?)\s+(?:vs\.?|x)\s+(.+)$/i);
          if (match) {
            setData((prev) => ({
              ...prev,
              option1: match[1].trim(),
              option2: match[2].trim(),
            }));
          }
        }}
        placeholder="Título"
        className="rounded bg-muted px-2 py-1 text-xs text-card-foreground outline-none focus:ring-1 focus:ring-primary"
      />
      <input
        type="text"
        value={data.description}
        onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value }))}
        placeholder="Descrição (opcional)"
        className="rounded bg-muted px-2 py-1 text-xs text-card-foreground outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="grid grid-cols-2 gap-1">
        <input
          type="text"
          value={data.option1}
          onChange={(e) => setData((prev) => ({ ...prev, option1: e.target.value }))}
          placeholder="Opção 1"
          className="rounded bg-muted px-2 py-1 text-xs text-card-foreground outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          value={data.option2}
          onChange={(e) => setData((prev) => ({ ...prev, option2: e.target.value }))}
          placeholder="Opção 2"
          className="rounded bg-muted px-2 py-1 text-xs text-card-foreground outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex gap-1">
        <button
          title="Salvar"
          disabled={isPending}
          onClick={() => {
            if (!data.title || !data.option1 || !data.option2) {
              toast.error("Título e opções são obrigatórios");
              return;
            }
            onSave(data);
          }}
          className="rounded px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
        >
          <Check className="h-3 w-3 inline mr-1" />
          Confirmar
        </button>
        <button
          title="Cancelar"
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <X className="h-3 w-3 inline mr-1" />
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function AdminEventBettingPage() {
  const { isAdmin, isLoading: profileLoading } = useUserProfile();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStartTime, setEditingStartTime] = useState<string | null>(null);
  const [newStartTime, setNewStartTime] = useState("");
  const [editingImages, setEditingImages] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState({ option1ImageUrl: "", option2ImageUrl: "" });
  const [confirmResolve, setConfirmResolve] = useState<{ eventId: string; result: BetOption; label: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<{ eventId: string; status: string; label: string } | null>(null);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [showUfcImport, setShowUfcImport] = useState(false);
  const [selectedFights, setSelectedFights] = useState<Set<number>>(new Set());
  const [importingFights, setImportingFights] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "ufc" as EventCategory,
    option1: "",
    option2: "",
    option1ImageUrl: "",
    option2ImageUrl: "",
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

  const socket = useSocketStore((s) => s.socket);

  useEffect(() => {
    if (!socket) return;

    socket.emit("event:join");

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-event-betting-events"] });
    };

    socket.on("event:odds_update", invalidate);
    socket.on("event:events_update", invalidate);

    return () => {
      socket.emit("event:leave");
      socket.off("event:odds_update", invalidate);
      socket.off("event:events_update", invalidate);
    };
  }, [socket, queryClient]);

  const {
    data: ufcData,
    isLoading: ufcLoading,
    error: ufcError,
    refetch: refetchUfc,
  } = useQuery({
    queryKey: ["ufc-upcoming"],
    queryFn: async () => {
      const res = await apiClient.get("/api/event-betting/ufc/upcoming");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao buscar evento UFC");
      }
      return res.json() as Promise<UfcEventData>;
    },
    enabled: showUfcImport,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const toggleFight = (index: number) => {
    setSelectedFights((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleImportFights = async () => {
    if (!ufcData?.fights) return;

    const fightsToImport = ufcData.fights.filter((_, i) => selectedFights.has(i));
    if (fightsToImport.length === 0) {
      toast.error("Selecione pelo menos uma luta");
      return;
    }

    setImportingFights(true);
    let successCount = 0;
    let errorCount = 0;

    for (const fight of fightsToImport) {
      try {
        const res = await apiClient.post("/api/event-betting/events", {
          body: JSON.stringify({
            title: `${fight.fighter1} vs ${fight.fighter2}`,
            description: [ufcData.eventName, fight.weightClass].filter(Boolean).join(" • "),
            category: "ufc" as EventCategory,
            option1: fight.fighter1,
            option2: fight.fighter2,
            option1ImageUrl: fight.fighter1ImageUrl || "",
            option2ImageUrl: fight.fighter2ImageUrl || "",
            startTime: ufcData.eventDate || "",
            allowDraw: true,
          }),
        });
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }

    setImportingFights(false);

    if (successCount > 0) {
      toast.success(`${successCount} luta(s) importada(s) com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["admin-event-betting-events"] });
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} luta(s) falharam ao importar`);
    }

    setShowUfcImport(false);
    setSelectedFights(new Set());
  };

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
        option1ImageUrl: "",
        option2ImageUrl: "",
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

  const updateImagesMutation = useMutation({
    mutationFn: async ({
      eventId,
      option1ImageUrl,
      option2ImageUrl,
    }: {
      eventId: string;
      option1ImageUrl?: string;
      option2ImageUrl?: string;
    }) => {
      const res = await apiClient.put(
        `/api/event-betting/events/${eventId}/images`,
        {
          body: JSON.stringify({ option1ImageUrl, option2ImageUrl }),
        },
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao atualizar imagens");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.errors?.length) {
        toast.error(`Algumas imagens falharam: ${data.errors.join(", ")}`);
      } else {
        toast.success("Imagens atualizadas!");
      }
      setEditingImages(null);
      setImageUrls({ option1ImageUrl: "", option2ImageUrl: "" });
      queryClient.invalidateQueries({
        queryKey: ["admin-event-betting-events"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/event-betting/events/${eventId}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao excluir evento");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Evento excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-event-betting-events"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({
      eventId,
      ...data
    }: {
      eventId: string;
      title: string;
      description: string;
      option1: string;
      option2: string;
    }) => {
      const res = await apiClient.put(
        `/api/event-betting/events/${eventId}`,
        { body: JSON.stringify(data) },
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao atualizar evento");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Evento atualizado!");
      setEditingEvent(null);
      queryClient.invalidateQueries({
        queryKey: ["admin-event-betting-events"],
      });
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
  const completedEvents = (eventsData?.events || [])
    .filter(
      (e: EventBettingEvent) =>
        e.status === "completed" || e.status === "cancelled",
    )
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeColumns = useMemo<ColumnDef<EventBettingEvent, any>[]>(
    () => [
      {
        id: "event",
        header: "Evento",
        cell: ({ row }) => {
          const event = row.original;
          const catColor = EVENT_CATEGORY_COLORS[event.category];

          if (editingEvent === event._id) {
            return (
              <EventEditForm
                event={event}
                isPending={updateEventMutation.isPending}
                onSave={(data) => updateEventMutation.mutate({ eventId: event._id, ...data })}
                onCancel={() => setEditingEvent(null)}
              />
            );
          }

          return (
            <div className="group relative">
              <span
                className="text-[10px] font-medium"
                style={{ color: catColor }}
              >
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
              <button
                title="Editar evento"
                onClick={() => setEditingEvent(event._id)}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:bg-muted transition-all"
              >
                <Pencil className="h-3 w-3" />
              </button>
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
              <div className="flex items-center justify-between gap-4">
                <span className="text-card-foreground flex items-center gap-1">
                  {event.option1Image && (
                    <img src={event.option1Image} alt="" className="w-4 h-4 rounded-full object-cover" />
                  )}
                  {event.option1}
                </span>
                <span className="text-muted-foreground">
                  {formatCoins(event.option1Pool)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-card-foreground flex items-center gap-1">
                  {event.option2Image && (
                    <img src={event.option2Image} alt="" className="w-4 h-4 rounded-full object-cover" />
                  )}
                  {event.option2}
                </span>
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
              {/* Image edit inline form */}
              {editingImages === event._id && (
                <div className="flex flex-col gap-1 mb-1">
                  <input
                    type="url"
                    value={imageUrls.option1ImageUrl}
                    onChange={(e) => setImageUrls((prev) => ({ ...prev, option1ImageUrl: e.target.value }))}
                    placeholder={`Img ${event.option1}`}
                    className="rounded bg-muted px-2 py-1 text-xs text-card-foreground outline-none focus:ring-1 focus:ring-primary w-48"
                  />
                  <input
                    type="url"
                    value={imageUrls.option2ImageUrl}
                    onChange={(e) => setImageUrls((prev) => ({ ...prev, option2ImageUrl: e.target.value }))}
                    placeholder={`Img ${event.option2}`}
                    className="rounded bg-muted px-2 py-1 text-xs text-card-foreground outline-none focus:ring-1 focus:ring-primary w-48"
                  />
                  <div className="flex gap-1">
                    <button
                      title="Salvar"
                      disabled={updateImagesMutation.isPending}
                      onClick={() => {
                        if (!imageUrls.option1ImageUrl && !imageUrls.option2ImageUrl) {
                          toast.error("Forneça pelo menos uma URL");
                          return;
                        }
                        updateImagesMutation.mutate({
                          eventId: event._id,
                          option1ImageUrl: imageUrls.option1ImageUrl || undefined,
                          option2ImageUrl: imageUrls.option2ImageUrl || undefined,
                        });
                      }}
                      className="rounded px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3 w-3 inline mr-1" />
                      Confirmar
                    </button>
                    <button
                      title="Cancelar"
                      onClick={() => {
                        setEditingImages(null);
                        setImageUrls({ option1ImageUrl: "", option2ImageUrl: "" });
                      }}
                      className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      <X className="h-3 w-3 inline mr-1" />
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {/* Image retry/edit button */}
              {editingImages !== event._id && (
                <div className="flex items-center gap-1">
                  {(event.option1ImageUrl || event.option2ImageUrl) && (!event.option1Image || !event.option2Image) ? (
                    <button
                      title="Retry imagens com falha"
                      onClick={() => {
                        updateImagesMutation.mutate({
                          eventId: event._id,
                          option1ImageUrl: !event.option1Image && event.option1ImageUrl ? event.option1ImageUrl : undefined,
                          option2ImageUrl: !event.option2Image && event.option2ImageUrl ? event.option2ImageUrl : undefined,
                        });
                      }}
                      disabled={updateImagesMutation.isPending}
                      className="rounded p-1.5 text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    title="Editar imagens"
                    onClick={() => {
                      setEditingImages(event._id);
                      setImageUrls({
                        option1ImageUrl: event.option1ImageUrl || "",
                        option2ImageUrl: event.option2ImageUrl || "",
                      });
                    }}
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                </div>
              )}
              {event.status === "upcoming" && (
                confirmStatus?.eventId === event._id ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-yellow-400 font-medium">
                      {confirmStatus.label}?
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        title="Confirmar"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => {
                          updateStatusMutation.mutate({
                            eventId: confirmStatus.eventId,
                            status: confirmStatus.status,
                          });
                          setConfirmStatus(null);
                        }}
                        className="rounded px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                      >
                        <Check className="h-3 w-3 inline mr-1" />
                        Confirmar
                      </button>
                      <button
                        title="Cancelar"
                        onClick={() => setConfirmStatus(null)}
                        className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        <X className="h-3 w-3 inline mr-1" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      title="Iniciar"
                      onClick={() =>
                        setConfirmStatus({
                          eventId: event._id,
                          status: "in_progress",
                          label: "Iniciar evento",
                        })
                      }
                      className="rounded p-1.5 text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      title="Cancelar"
                      onClick={() =>
                        setConfirmStatus({
                          eventId: event._id,
                          status: "cancelled",
                          label: "Cancelar evento",
                        })
                      }
                      className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )
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
                          className="rounded px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                          <Check className="h-3 w-3 inline mr-1" />
                          Confirmar
                        </button>
                        <button
                          title="Cancelar"
                          onClick={() => {
                            setEditingStartTime(null);
                            setNewStartTime("");
                          }}
                          className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                          <X className="h-3 w-3 inline mr-1" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {confirmStatus?.eventId === event._id ? (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-yellow-400 font-medium">
                          {confirmStatus.label}?
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            title="Confirmar"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => {
                              if (confirmStatus.status === "upcoming") {
                                setEditingStartTime(event._id);
                                const oneHourFromNow = new Date();
                                oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
                                setNewStartTime(oneHourFromNow.toISOString().slice(0, 16));
                              } else {
                                updateStatusMutation.mutate({
                                  eventId: confirmStatus.eventId,
                                  status: confirmStatus.status,
                                });
                              }
                              setConfirmStatus(null);
                            }}
                            className="rounded px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                          >
                            <Check className="h-3 w-3 inline mr-1" />
                            Confirmar
                          </button>
                          <button
                            title="Cancelar"
                            onClick={() => setConfirmStatus(null)}
                            className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                          >
                            <X className="h-3 w-3 inline mr-1" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          title="Voltar para Próximo"
                          onClick={() =>
                            setConfirmStatus({
                              eventId: event._id,
                              status: "upcoming",
                              label: "Voltar para Próximo",
                            })
                          }
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Undo2 className="h-4 w-4" />
                        </button>
                        <button
                          title="Cancelar Evento"
                          onClick={() =>
                            setConfirmStatus({
                              eventId: event._id,
                              status: "cancelled",
                              label: "Cancelar evento",
                            })
                          }
                          className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                      {confirmResolve?.eventId === event._id ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-yellow-400 font-medium">
                            Confirmar vencedor: {confirmResolve.label}?
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              title="Confirmar"
                              disabled={resolveEventMutation.isPending}
                              onClick={() => {
                                resolveEventMutation.mutate({
                                  eventId: confirmResolve.eventId,
                                  result: confirmResolve.result,
                                });
                                setConfirmResolve(null);
                              }}
                              className="rounded px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                            >
                              <Check className="h-3 w-3 inline mr-1" />
                              Confirmar
                            </button>
                            <button
                              title="Cancelar"
                              onClick={() => setConfirmResolve(null)}
                              className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                            >
                              <X className="h-3 w-3 inline mr-1" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                      <div className="flex items-center gap-1">
                        <button
                          title={`Vencedor: ${event.option1}`}
                          onClick={() =>
                            setConfirmResolve({
                              eventId: event._id,
                              result: "option1",
                              label: event.option1,
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
                              setConfirmResolve({
                                eventId: event._id,
                                result: "draw",
                                label: "Empate",
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
                            setConfirmResolve({
                              eventId: event._id,
                              result: "option2",
                              label: event.option2,
                            })
                          }
                          className="rounded px-2 py-1 text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                        >
                          <Trophy className="h-3 w-3 inline mr-1" />
                          {event.option2}
                        </button>
                      </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {/* Delete button — only for events with no bets */}
              {event.totalPool === 0 && (
                confirmDelete === event._id ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-destructive font-medium">
                      Excluir evento?
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        title="Confirmar"
                        disabled={deleteEventMutation.isPending}
                        onClick={() => {
                          deleteEventMutation.mutate(event._id);
                          setConfirmDelete(null);
                        }}
                        className="rounded px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                      >
                        <Check className="h-3 w-3 inline mr-1" />
                        Confirmar
                      </button>
                      <button
                        title="Cancelar"
                        onClick={() => setConfirmDelete(null)}
                        className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        <X className="h-3 w-3 inline mr-1" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    title="Excluir evento"
                    onClick={() => setConfirmDelete(event._id)}
                    className="rounded p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )
              )}
            </div>
          );
        },
      },
    ],
    [editingStartTime, newStartTime, editingImages, imageUrls, updateImagesMutation.isPending, confirmResolve, resolveEventMutation.isPending, editingEvent, updateEventMutation.isPending, deleteEventMutation.isPending, confirmDelete, confirmStatus, updateStatusMutation.isPending],
  );

  const completedColumns = useMemo<ColumnDef<EventBettingEvent, any>[]>(
    () => [
      {
        id: "event",
        header: "Evento",
        cell: ({ row }) => {
          const event = row.original;
          const catColor = EVENT_CATEGORY_COLORS[event.category];
          return (
            <div>
              <span
                className="text-[10px] font-medium"
                style={{ color: catColor }}
              >
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
              <div className="flex items-center justify-between gap-4">
                <span className="text-card-foreground flex items-center gap-1">
                  {event.option1Image && (
                    <img src={event.option1Image} alt="" className="w-4 h-4 rounded-full object-cover" />
                  )}
                  {event.option1}
                </span>
                <span className="text-muted-foreground">
                  {formatCoins(event.option1Pool)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-card-foreground flex items-center gap-1">
                  {event.option2Image && (
                    <img src={event.option2Image} alt="" className="w-4 h-4 rounded-full object-cover" />
                  )}
                  {event.option2}
                </span>
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
                    className="rounded px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    <Check className="h-3 w-3 inline mr-1" />
                    Confirmar
                  </button>
                  <button
                    title="Cancelar"
                    onClick={() => {
                      setEditingStartTime(null);
                      setNewStartTime("");
                    }}
                    className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-3 w-3 inline mr-1" />
                    Cancelar
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
                {formData.category === "ufc" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUfcImport(!showUfcImport);
                      setSelectedFights(new Set());
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
                  >
                    <Download className="h-3 w-3" />
                    {showUfcImport ? "Fechar importação" : "Importar do UFC.com"}
                  </button>
                )}
              </div>
            </div>

            {/* UFC Import Panel */}
            {showUfcImport && (
              <div className="rounded-lg border border-primary/30 bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-card-foreground">
                    Importar Lutas do UFC
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUfcImport(false);
                      setSelectedFights(new Set());
                    }}
                    className="text-muted-foreground hover:text-card-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {ufcLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Buscando evento...
                    </span>
                  </div>
                )}

                {ufcError && (
                  <div className="text-center py-4">
                    <p className="text-sm text-destructive mb-2">
                      {(ufcError as Error).message}
                    </p>
                    <button
                      type="button"
                      onClick={() => refetchUfc()}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

                {ufcData && (
                  <>
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground">
                        {ufcData.eventName}
                        {ufcData.eventDate && (
                          <> — {new Date(ufcData.eventDate).toLocaleDateString("pt-BR")}</>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFights(
                            new Set(ufcData.fights.map((_, i) => i)),
                          )
                        }
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        Selecionar todas
                      </button>
                      <span className="text-xs text-muted-foreground">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFights(new Set())}
                        className="text-xs text-muted-foreground hover:text-card-foreground"
                      >
                        Limpar seleção
                      </button>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {selectedFights.size} selecionada(s)
                      </span>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {ufcData.fights.map((fight, index) => ({ fight, index })).reverse().map(({ fight, index }) => (
                        <label
                          key={index}
                          className={`flex items-center gap-3 rounded-lg border p-2 cursor-pointer transition-colors ${
                            selectedFights.has(index)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFights.has(index)}
                            onChange={() => toggleFight(index)}
                            className="h-4 w-4 rounded border-border bg-muted text-primary shrink-0"
                          />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {fight.fighter1ImageUrl && (
                              <div className="w-10 h-12 rounded overflow-hidden bg-muted shrink-0">
                                <img
                                  src={fight.fighter1ImageUrl}
                                  alt={fight.fighter1}
                                  className="w-full h-[200%] object-cover object-top"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-card-foreground truncate">
                                {fight.fighter1} vs {fight.fighter2}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {fight.weightClass || "—"}
                                {fight.isMainCard && (
                                  <span className="ml-1 text-primary">
                                    • Card Principal
                                  </span>
                                )}
                              </p>
                            </div>
                            {fight.fighter2ImageUrl && (
                              <div className="w-10 h-12 rounded overflow-hidden bg-muted shrink-0">
                                <img
                                  src={fight.fighter2ImageUrl}
                                  alt={fight.fighter2}
                                  className="w-full h-[200%] object-cover object-top"
                                />
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>

                    {ufcData.fights.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma luta encontrada neste evento
                      </p>
                    )}

                    {selectedFights.size > 0 && (
                      <button
                        type="button"
                        onClick={handleImportFights}
                        disabled={importingFights}
                        className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {importingFights
                          ? "Importando..."
                          : `Importar ${selectedFights.size} luta(s)`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

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
              <div className="space-y-2">
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
                  <label className="text-sm text-muted-foreground">
                    URL da Imagem (opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.option1ImageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, option1ImageUrl: e.target.value })
                    }
                    placeholder="https://exemplo.com/imagem.png"
                    className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
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
                <div>
                  <label className="text-sm text-muted-foreground">
                    URL da Imagem (opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.option2ImageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, option2ImageUrl: e.target.value })
                    }
                    placeholder="https://exemplo.com/imagem.png"
                    className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
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
