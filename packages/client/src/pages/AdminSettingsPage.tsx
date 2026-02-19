import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings.js";

export function AdminSettingsPage() {
  const { isAdmin, isLoading: profileLoading } = useUserProfile();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  const [roulette, setRoulette] = useState({
    bettingDuration: 10,
    spinningDuration: 5,
    resultDuration: 5,
    minBet: 10,
    maxBet: 10000,
    maxBetsPerRound: 5,
  });

  const [eventBetting, setEventBetting] = useState({
    houseEdge: 0.05,
    minBet: 10,
    maxBet: 10000,
    maxBetsPerEvent: 3,
  });

  const [cardDuel, setCardDuel] = useState({
    minBet: 10,
    maxBet: 10000,
    revengeTimeout: 15,
    disconnectGrace: 60,
    cardRevealDelay: 3,
    botBetAmount: 100,
  });

  const [general, setGeneral] = useState({
    cursorSize: 32,
    awayTimeout: 180,
  });

  const [politicalCompass, setPoliticalCompass] = useState({
    retestCooldownDays: 180,
  });

  useEffect(() => {
    if (settings) {
      setRoulette(settings.roulette);
      if (settings.eventBetting) {
        setEventBetting(settings.eventBetting);
      }
      if (settings.cardDuel) {
        setCardDuel(settings.cardDuel);
      }
      if (settings.general) {
        setGeneral(settings.general);
      }
      if (settings.politicalCompass) {
        setPoliticalCompass(settings.politicalCompass);
      }
    }
  }, [settings]);

  if (profileLoading || settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  function handleSave() {
    updateMutation.mutate(
      { roulette, eventBetting, cardDuel, general, politicalCompass },
      {
        onSuccess: () => toast.success("Configurações salvas!"),
        onError: (err: Error) => toast.error(err.message),
      },
    );
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
          Configurações
        </h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 mb-4">
        <h2 className="text-xl font-bold text-card-foreground mb-4">
          Geral
        </h2>

        <h3 className="text-sm font-semibold text-card-foreground mb-2">Cursor</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Tamanho do cursor (px)
            </label>
            <input
              type="number"
              min={16}
              max={128}
              value={general.cursorSize}
              onChange={(e) =>
                setGeneral((prev) => ({
                  ...prev,
                  cursorSize: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-card-foreground mt-4 mb-2">Presença</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Tempo para ausente (segundos)
            </label>
            <input
              type="number"
              min={30}
              max={3600}
              value={general.awayTimeout}
              onChange={(e) =>
                setGeneral((prev) => ({
                  ...prev,
                  awayTimeout: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 mb-4">
        <h2 className="text-xl font-bold text-card-foreground">
          Roleta
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure os tempos e limites da roleta. As alterações serão aplicadas na próxima rodada.
        </p>

        <h3 className="text-sm font-semibold text-card-foreground mb-2">Tempos</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Tempo de apostas (segundos)
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={roulette.bettingDuration}
              onChange={(e) =>
                setRoulette((prev) => ({
                  ...prev,
                  bettingDuration: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Tempo de giro (segundos)
            </label>
            <input
              type="number"
              min={2}
              max={30}
              value={roulette.spinningDuration}
              onChange={(e) =>
                setRoulette((prev) => ({
                  ...prev,
                  spinningDuration: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Tempo de resultado (segundos)
            </label>
            <input
              type="number"
              min={2}
              max={30}
              value={roulette.resultDuration}
              onChange={(e) =>
                setRoulette((prev) => ({
                  ...prev,
                  resultDuration: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-card-foreground mt-6 mb-2">Limites de apostas</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Aposta mínima (coins)
            </label>
            <input
              type="number"
              min={1}
              value={roulette.minBet}
              onChange={(e) =>
                setRoulette((prev) => ({
                  ...prev,
                  minBet: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Aposta máxima (coins)
            </label>
            <input
              type="number"
              min={1}
              value={roulette.maxBet}
              onChange={(e) =>
                setRoulette((prev) => ({
                  ...prev,
                  maxBet: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Max apostas por rodada
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={roulette.maxBetsPerRound}
              onChange={(e) =>
                setRoulette((prev) => ({
                  ...prev,
                  maxBetsPerRound: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 mb-4">
        <h2 className="text-xl font-bold text-card-foreground mb-4">
          Eventos
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure os limites e taxa da casa para apostas em eventos.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Taxa da casa (%)
            </label>
            <input
              type="number"
              min={0}
              max={50}
              step={1}
              value={Math.round(eventBetting.houseEdge * 100)}
              onChange={(e) =>
                setEventBetting((prev) => ({
                  ...prev,
                  houseEdge: (parseInt(e.target.value, 10) || 0) / 100,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Aposta mínima (coins)
            </label>
            <input
              type="number"
              min={1}
              value={eventBetting.minBet}
              onChange={(e) =>
                setEventBetting((prev) => ({
                  ...prev,
                  minBet: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Aposta máxima (coins)
            </label>
            <input
              type="number"
              min={1}
              value={eventBetting.maxBet}
              onChange={(e) =>
                setEventBetting((prev) => ({
                  ...prev,
                  maxBet: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Max apostas por evento
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={eventBetting.maxBetsPerEvent}
              onChange={(e) =>
                setEventBetting((prev) => ({
                  ...prev,
                  maxBetsPerEvent: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 mb-4">
        <h2 className="text-xl font-bold text-card-foreground mb-4">
          Duelo de Cartas
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure os limites e tempos do duelo de cartas.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Aposta minima (coins)
            </label>
            <input
              type="number"
              min={1}
              value={cardDuel.minBet}
              onChange={(e) =>
                setCardDuel((prev) => ({
                  ...prev,
                  minBet: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Aposta maxima (coins)
            </label>
            <input
              type="number"
              min={1}
              value={cardDuel.maxBet}
              onChange={(e) =>
                setCardDuel((prev) => ({
                  ...prev,
                  maxBet: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Tempo de revanche (segundos)
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={cardDuel.revengeTimeout}
              onChange={(e) =>
                setCardDuel((prev) => ({
                  ...prev,
                  revengeTimeout: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Tempo de reconexão (segundos)
            </label>
            <input
              type="number"
              min={10}
              max={300}
              value={cardDuel.disconnectGrace}
              onChange={(e) =>
                setCardDuel((prev) => ({
                  ...prev,
                  disconnectGrace: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Contagem regressiva das cartas (segundos)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={cardDuel.cardRevealDelay}
              onChange={(e) =>
                setCardDuel((prev) => ({
                  ...prev,
                  cardRevealDelay: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Aposta do bot (coins)
            </label>
            <input
              type="number"
              min={1}
              value={cardDuel.botBetAmount}
              onChange={(e) =>
                setCardDuel((prev) => ({
                  ...prev,
                  botBetAmount: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 mb-4">
        <h2 className="text-xl font-bold text-card-foreground mb-4">
          Bússola Política
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure o tempo de espera para refazer o teste da bússola política.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Cooldown para reteste (dias)
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={politicalCompass.retestCooldownDays}
              onChange={(e) =>
                setPoliticalCompass((prev) => ({
                  ...prev,
                  retestCooldownDays: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {updateMutation.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
