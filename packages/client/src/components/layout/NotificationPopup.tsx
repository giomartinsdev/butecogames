import { X } from "lucide-react";
import { TYPE_ICONS, TYPE_LABELS } from "./NotificationBell.js";
import type { NotificationPopup as NotificationPopupData } from "@/hooks/useNotificationEvents.js";

interface Props {
  notification: NotificationPopupData;
  onClose: () => void;
}

export function NotificationPopup({ notification, onClose }: Props) {
  const t = TYPE_ICONS[notification.type] ?? TYPE_ICONS.info;
  const Icon = t.icon;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center gap-2 ${t.color}`}>
            <Icon size={18} />
            <span className="font-semibold">
              {TYPE_LABELS[notification.type] ?? notification.type}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-card-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <h3 className="text-card-foreground font-semibold mb-2">
          {notification.title}
        </h3>
        {notification.message && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {notification.message}
          </p>
        )}
      </div>
    </div>
  );
}
