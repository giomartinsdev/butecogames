import { CURSOR_SETS } from "@butecogames/shared";
import { toast } from "sonner";
import { useUserSettings, useUpdateUserSettings } from "@/hooks/useUserSettings.js";
import { cn } from "@/lib/utils.js";

export function SettingsPage() {
  const { data: settings, isLoading } = useUserSettings();
  const updateMutation = useUpdateUserSettings();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  function handleCursorSelect(cursorSetId: string) {
    updateMutation.mutate(
      { cursorSetId },
      {
        onSuccess: () => toast.success("Cursor atualizado!"),
        onError: (err: Error) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-card-foreground">Configurações</h1>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-2">
          Cursor
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Escolha o estilo do cursor do mouse.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {CURSOR_SETS.map((cursorSet) => {
            const isSelected = settings?.settings?.cursorSetId === cursorSet.id;
            return (
              <button
                key={cursorSet.id}
                onClick={() => handleCursorSelect(cursorSet.id)}
                disabled={updateMutation.isPending}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-lg border p-4 transition-colors disabled:opacity-50",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground",
                )}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  {cursorSet.cursorUrl ? (
                    <img
                      src={cursorSet.cursorUrl}
                      alt={cursorSet.label}
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <svg
                      className="h-8 w-8 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M5 3l14 8-6.5 2L9 19.5z" />
                    </svg>
                  )}
                </div>

                <span className="text-sm font-medium text-card-foreground">
                  {cursorSet.label}
                </span>

                {isSelected && (
                  <span className="text-xs text-primary font-medium">
                    Selecionado
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
