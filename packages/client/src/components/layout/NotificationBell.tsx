import { useState, useRef, useEffect, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Bell,
  Info,
  CircleCheck,
  TriangleAlert,
  CircleX,
  Megaphone,
  X,
  CheckCheck,
  Eye,
} from "lucide-react";
import {
  useUnreadCount,
  useRecentNotifications,
  useNotificationList,
  useMarkRead,
  useMarkAllRead,
  type PopulatedUserNotification,
} from "@/hooks/useNotifications.js";
import { DataTable } from "@/components/ui/DataTable.js";

const TYPE_ICONS: Record<string, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-blue-400" },
  success: { icon: CircleCheck, color: "text-green-400" },
  warning: { icon: TriangleAlert, color: "text-yellow-400" },
  error: { icon: CircleX, color: "text-red-400" },
  announcement: { icon: Megaphone, color: "text-accent" },
};

const TYPE_LABELS: Record<string, string> = {
  info: "Informação",
  success: "Sucesso",
  warning: "Aviso",
  error: "Erro",
  announcement: "Anúncio",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [detailNotif, setDetailNotif] = useState<PopulatedUserNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const { data: recentData } = useRecentNotifications();
  const { data: modalData, isLoading: modalLoading } = useNotificationList(modalPage);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = unreadData?.count ?? 0;
  const recent = recentData?.notifications ?? [];

  // Click outside to close dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  function handleBellClick() {
    setDropdownOpen((prev) => !prev);
  }

  function handleNotificationClick(n: PopulatedUserNotification) {
    markRead.mutate(n._id);
  }

  function handleOpenDetail(n: PopulatedUserNotification) {
    markRead.mutate(n._id);
    setDropdownOpen(false);
    setDetailNotif(n);
  }

  function handleMarkAllRead() {
    markAllRead.mutate();
    setDropdownOpen(false);
  }

  function handleOpenModal() {
    setDropdownOpen(false);
    setModalPage(1);
    setModalOpen(true);
  }

  const modalColumns = useMemo<ColumnDef<PopulatedUserNotification, any>[]>(
    () => [
      {
        id: "type",
        header: "Tipo",
        cell: ({ row }) => {
          const n = row.original.notificationId;
          if (!n) return "—";
          const t = TYPE_ICONS[n.type];
          if (!t) return n.type;
          const Icon = t.icon;
          return (
            <span className={`flex items-center gap-1.5 ${t.color}`}>
              <Icon size={14} />
              {TYPE_LABELS[n.type] ?? n.type}
            </span>
          );
        },
      },
      {
        id: "title",
        header: "Título",
        meta: { width: "20%" } as any,
        cell: ({ row }) => {
          const n = row.original.notificationId;
          return (
            <span className={`font-medium ${row.original.read ? "text-muted-foreground" : "text-card-foreground"}`}>
              {n?.title ?? "—"}
            </span>
          );
        },
      },
      {
        id: "message",
        header: "Mensagem",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs line-clamp-1">
            {row.original.notificationId?.message || "—"}
          </span>
        ),
      },
      {
        id: "date",
        header: "Data",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleString("pt-BR")}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const n = row.original;
          if (n.read) {
            return <span className="text-xs text-muted-foreground">Lida</span>;
          }
          return (
            <button
              type="button"
              onClick={() => markRead.mutate(n._id)}
              className="text-xs font-medium text-accent hover:underline"
            >
              Marcar como lida
            </button>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => {
              if (!row.original.read) markRead.mutate(row.original._id);
              setDetailNotif(row.original);
            }}
            className="rounded p-1 text-muted-foreground hover:text-accent transition-colors"
            title="Ver mensagem completa"
          >
            <Eye size={14} />
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      {/* Bell icon with badge */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={handleBellClick}
          className="relative rounded-lg p-1.5 text-muted-foreground hover:text-card-foreground transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-card-foreground">Notificações</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <CheckCheck size={13} />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {recent.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma notificação não lida
                </p>
              ) : (
                recent.map((n) => {
                  const notif = n.notificationId;
                  if (!notif) return null;
                  const t = TYPE_ICONS[notif.type] ?? TYPE_ICONS.info;
                  const Icon = t.icon;
                  return (
                    <div
                      key={n._id}
                      className="flex w-full items-start gap-3 px-4 py-3 transition-colors hover:bg-muted bg-accent/5"
                    >
                      <div className={`mt-0.5 shrink-0 ${t.color}`}>
                        <Icon size={16} />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(n)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm font-semibold text-card-foreground">
                          {notif.title}
                        </p>
                        {notif.message && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {notif.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          {timeAgo(n.createdAt)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(n)}
                        className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground hover:text-accent transition-colors"
                        title="Ver mensagem completa"
                      >
                        <Eye size={14} />
                      </button>
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2.5">
              <button
                type="button"
                onClick={handleOpenModal}
                className="w-full text-center text-xs font-medium text-accent hover:underline"
              >
                Ver todas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-6xl max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground">Todas as notificações</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-card-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <DataTable
              columns={modalColumns}
              data={modalData?.notifications ?? []}
              pagination={modalData?.pagination}
              onPageChange={setModalPage}
              isLoading={modalLoading}
              emptyMessage="Nenhuma notificação"
            />
          </div>
        </div>
      )}

      {/* Detail overlay */}
      {detailNotif?.notificationId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDetailNotif(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              {(() => {
                const t = TYPE_ICONS[detailNotif.notificationId.type] ?? TYPE_ICONS.info;
                const Icon = t.icon;
                return (
                  <div className={`flex items-center gap-2 ${t.color}`}>
                    <Icon size={18} />
                    <span className="font-semibold">
                      {TYPE_LABELS[detailNotif.notificationId.type] ?? detailNotif.notificationId.type}
                    </span>
                  </div>
                );
              })()}
              <button
                type="button"
                onClick={() => setDetailNotif(null)}
                className="rounded-lg p-1 text-muted-foreground hover:text-card-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className="text-card-foreground font-semibold mb-2">
              {detailNotif.notificationId.title}
            </h3>
            {detailNotif.notificationId.message && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {detailNotif.notificationId.message}
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground/60">
              {new Date(detailNotif.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
