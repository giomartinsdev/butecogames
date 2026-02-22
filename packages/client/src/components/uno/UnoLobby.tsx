import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UnoRoomInfo } from "@butecogames/shared";
import { useWallet } from "@/hooks/useWallet.js";
import { useSettings } from "@/hooks/useSettings.js";
import { fetchUnoRecent, fetchUnoStats } from "@/api/uno.js";
import { formatCoins } from "@/lib/utils.js";

interface UnoLobbyProps {
  rooms: UnoRoomInfo[];
  onCreateRoom: (betAmount: number, maxPlayers: number) => void;
  onJoinRoom: (roomId: string) => void;
}

export function UnoLobby({ rooms, onCreateRoom, onJoinRoom }: UnoLobbyProps) {
  const { data: wallet } = useWallet();
  const { data: settings } = useSettings();
  const [betAmount, setBetAmount] = useState(100);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [showCreate, setShowCreate] = useState(false);

  const { data: recentData } = useQuery({
    queryKey: ["uno-recent"],
    queryFn: fetchUnoRecent,
    staleTime: 30_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ["uno-stats"],
    queryFn: fetchUnoStats,
    staleTime: 30_000,
  });

  const unoSettings = settings?.uno;
  const minBet = unoSettings?.minBet ?? 10;
  const maxBet = unoSettings?.maxBet ?? 10_000;
  const minP = unoSettings?.minPlayers ?? 2;
  const maxP = unoSettings?.maxPlayers ?? 10;

  const handleCreate = () => {
    onCreateRoom(betAmount, maxPlayers);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main area */}
      <div className="space-y-6 lg:col-span-2">
        {/* Create room */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-card-foreground">Criar Sala</h3>
            <button
              type="button"
              onClick={() => setShowCreate(!showCreate)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {showCreate ? "Cancelar" : "Nova Sala"}
            </button>
          </div>

          {showCreate && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Aposta ({formatCoins(minBet)} - {formatCoins(maxBet)})
                </label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) =>
                    setBetAmount(
                      Math.max(minBet, Math.min(maxBet, Number(e.target.value) || 0)),
                    )
                  }
                  min={minBet}
                  max={maxBet}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-card-foreground"
                />
                <div className="mt-1 flex gap-1">
                  {[50, 100, 500, 1000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBetAmount(v)}
                      className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Jogadores ({minP} - {maxP})
                </label>
                <input
                  type="range"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  min={minP}
                  max={maxP}
                  className="w-full"
                />
                <span className="text-sm text-card-foreground">{maxPlayers} jogadores</span>
              </div>

              <button
                type="button"
                onClick={handleCreate}
                disabled={!wallet || wallet.balance < betAmount}
                className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                Criar Sala ({formatCoins(betAmount)} coins)
              </button>
            </div>
          )}
        </div>

        {/* Room list */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold text-card-foreground">
            Salas Disponíveis ({rooms.length})
          </h3>

          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma sala disponível. Crie uma!
            </p>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    {room.owner.avatar ? (
                      <img
                        src={room.owner.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {room.owner.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        {room.owner.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCoins(room.betAmount)} coins · {room.playerCount}/{room.maxPlayers} jogadores
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onJoinRoom(room.roomId)}
                    disabled={!wallet || wallet.balance < room.betAmount}
                    className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                  >
                    Entrar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Stats */}
        {statsData && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 font-semibold text-card-foreground">Suas Estatísticas</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-primary">{statsData.stats.wins}</p>
                <p className="text-xs text-muted-foreground">Vitórias</p>
              </div>
              <div>
                <p className="text-lg font-bold text-destructive">{statsData.stats.losses}</p>
                <p className="text-xs text-muted-foreground">Derrotas</p>
              </div>
              <div>
                <p className="text-lg font-bold text-card-foreground">{statsData.stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent matches */}
        {recentData && recentData.matches.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 font-semibold text-card-foreground">Partidas Recentes</h3>
            <div className="space-y-2">
              {recentData.matches.slice(0, 5).map((match) => (
                <div
                  key={match._id}
                  className="flex items-center justify-between rounded border border-border bg-background px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-card-foreground">
                      {match.winnerName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {match.playerCount} jogadores · {formatCoins(match.betAmount)} coins
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    +{formatCoins(match.payout)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
