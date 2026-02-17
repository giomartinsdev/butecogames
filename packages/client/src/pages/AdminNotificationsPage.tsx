import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { apiFetch } from "@/api/client.js";
import { toast } from "sonner";
import { Send, Info, CircleCheck, TriangleAlert, CircleX, Megaphone } from "lucide-react";

const MESSAGE_TYPES = [
  { value: "info", label: "Informação", icon: Info, color: "text-blue-400", border: "border-blue-400" },
  { value: "success", label: "Sucesso", icon: CircleCheck, color: "text-green-400", border: "border-green-400" },
  { value: "warning", label: "Aviso", icon: TriangleAlert, color: "text-yellow-400", border: "border-yellow-400" },
  { value: "error", label: "Erro", icon: CircleX, color: "text-red-400", border: "border-red-400" },
  { value: "announcement", label: "Anúncio", icon: Megaphone, color: "text-accent", border: "border-accent" },
] as const;

export function AdminNotificationsPage() {
  const { isAdmin, isLoading } = useUserProfile();
  const [type, setType] = useState<string>("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
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
    </div>
  );
}
