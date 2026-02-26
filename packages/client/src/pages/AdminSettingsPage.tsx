import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings.js";
import { MASTER_MODELS, type MasterModelInfo } from "@butecogames/shared";
import { Plus, Trash2, Power, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils.js";

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

  const [uneco, setUneco] = useState({
    minPlayers: 2,
    maxPlayers: 10,
    turnTimeout: 30,
    minBet: 10,
    maxBet: 10000,
    unecoCatchWindow: 5,
    disconnectGrace: 60,
  });

  const [politicalCompass, setPoliticalCompass] = useState({
    retestCooldownDays: 180,
  });

  const [master, setMaster] = useState<{ models: MasterModelInfo[] }>({
    models: MASTER_MODELS,
  });

  const [newModel, setNewModel] = useState<Partial<MasterModelInfo>>({
    id: "",
    name: "",
    provider: "",
    type: "TEXT",
    cost: 0,
    enabled: true,
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
      if (settings.uneco) {
        setUneco(settings.uneco);
      }
      if (settings.politicalCompass) {
        setPoliticalCompass(settings.politicalCompass);
      }
      if (settings.master) {
        setMaster(settings.master);
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
      { roulette, eventBetting, cardDuel, uneco, general, politicalCompass, master },
      {
        onSuccess: () => toast.success("Configurações salvas!"),
        onError: (err: Error) => toast.error(err.message),
      },
    );
  }

  function handleAddModel() {
    if (!newModel.id || !newModel.name || !newModel.provider) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (master.models.some((m) => m.id === newModel.id)) {
      toast.error("ID de modelo já existe");
      return;
    }

    setMaster((prev) => ({
      models: [...prev.models, { ...(newModel as MasterModelInfo), enabled: true }],
    }));

    setNewModel({
      id: "",
      name: "",
      provider: "",
      type: "TEXT",
      cost: 0,
    });

    toast.success("Modelo adicionado! Lembre-se de salvar.");
  }

  function handleRemoveModel(id: string) {
    if (window.confirm("Deseja remover este modelo?")) {
      setMaster((prev) => ({
        models: prev.models.filter((m) => m.id !== id),
      }));
    }
  }

  function handleToggleModel(index: number) {
    const newModels = [...master.models];
    newModels[index] = { ...newModels[index], enabled: !newModels[index].enabled };
    setMaster({ models: newModels });
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
          UNECO
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure os limites e tempos do jogo de UNECO.
        </p>

        <h3 className="text-sm font-semibold text-card-foreground mb-2">Jogadores</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Mínimo de jogadores
            </label>
            <input
              type="number"
              min={2}
              max={10}
              value={uneco.minPlayers}
              onChange={(e) =>
                setUneco((prev) => ({
                  ...prev,
                  minPlayers: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Máximo de jogadores
            </label>
            <input
              type="number"
              min={2}
              max={10}
              value={uneco.maxPlayers}
              onChange={(e) =>
                setUneco((prev) => ({
                  ...prev,
                  maxPlayers: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-card-foreground mb-2">Limites de apostas</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Aposta mínima (coins)
            </label>
            <input
              type="number"
              min={1}
              value={uneco.minBet}
              onChange={(e) =>
                setUneco((prev) => ({
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
              value={uneco.maxBet}
              onChange={(e) =>
                setUneco((prev) => ({
                  ...prev,
                  maxBet: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-card-foreground mb-2">Tempos</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Tempo por turno (segundos)
            </label>
            <input
              type="number"
              min={10}
              max={120}
              value={uneco.turnTimeout}
              onChange={(e) =>
                setUneco((prev) => ({
                  ...prev,
                  turnTimeout: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Janela para pegar UNECO (segundos)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={uneco.unecoCatchWindow}
              onChange={(e) =>
                setUneco((prev) => ({
                  ...prev,
                  unecoCatchWindow: parseInt(e.target.value, 10) || 0,
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
              value={uneco.disconnectGrace}
              onChange={(e) =>
                setUneco((prev) => ({
                  ...prev,
                  disconnectGrace: parseInt(e.target.value, 10) || 0,
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
      <div className="rounded-lg border border-border bg-card p-6 mb-4">
        <h2 className="text-xl font-bold text-card-foreground mb-4">
          Mestre
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Gerencie os custos e modelos da IA.
        </p>

        <div className="space-y-6">
          {master.models.map((model: MasterModelInfo, index: number) => (
            <div key={model.id} className={cn("grid gap-4 sm:grid-cols-5 items-end border-b border-border pb-4 last:border-0 last:pb-0 transition-opacity", !model.enabled && "opacity-50")}>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Modelo ({model.provider})
                </label>
                <div className="text-sm text-muted-foreground font-mono bg-background px-3 py-2 rounded-md border border-border flex items-center justify-between">
                  <span>{model.name}</span>
                  <span className="text-[10px] opacity-40">{model.id}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Custo (coins)
                </label>
                <input
                  type="number"
                  min={0}
                  value={model.cost}
                  onChange={(e) => {
                    const newModels = [...master.models];
                    newModels[index] = { ...newModels[index], cost: parseInt(e.target.value, 10) || 0 };
                    setMaster({ models: newModels });
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
                />
              </div>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-muted text-xs text-muted-foreground justify-center">
                {model.type}
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => handleToggleModel(index)}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    model.enabled ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  )}
                  title={model.enabled ? "Desativar" : "Ativar"}
                >
                  <Power size={18} />
                </button>
                <button
                  onClick={() => handleRemoveModel(model.id)}
                  className="p-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  title="Remover"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Model Form */}
        <div className="mt-10 rounded-xl border border-dashed border-border p-6 bg-muted/20">
          <div className="flex items-center gap-2 mb-6">
            <BrainCircuit className="text-primary" size={20} />
            <h3 className="font-bold text-card-foreground">Adicionar Novo Modelo</h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">ID do Modelo (ex: nvidia/llama-3.1)</label>
              <input
                type="text"
                value={newModel.id}
                onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
                placeholder="ID único"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Nome de Exibição</label>
              <input
                type="text"
                value={newModel.name}
                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                placeholder="Llama 3.1 70B"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Provedor</label>
              <input
                type="text"
                value={newModel.provider}
                onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                placeholder="Meta / NVIDIA / Stability AI"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Tipo de Resposta</label>
              <select
                value={newModel.type}
                onChange={(e) => setNewModel({ ...newModel, type: e.target.value as any })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
              >
                <option value="TEXT">Texto</option>
                <option value="IMAGE">Imagem</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Custo Inicial (coins)</label>
              <input
                type="number"
                value={newModel.cost}
                onChange={(e) => setNewModel({ ...newModel, cost: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-card-foreground"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddModel}
                className="w-full flex items-center justify-center gap-2 bg-primary px-4 py-2 rounded-md font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus size={18} />
                Adicionar Modelo
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-start">
          <button
            onClick={() => {
              if (window.confirm("Deseja voltar para as configurações padrão do Mestre AI?")) {
                setMaster({ models: MASTER_MODELS });
              }
            }}
            className="text-xs text-primary hover:underline"
          >
            Restaurar padrões
          </button>
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
