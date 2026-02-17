import { useState } from "react";
import type { CardDuelRoomInfo, CardDuelGameType } from "@butecogames/shared";
import { cn, formatCoins } from "@/lib/utils.js";
import { CreateRoomModal } from "./CreateRoomModal.js";

interface CardDuelLobbyProps {
  rooms: CardDuelRoomInfo[];
  balance: number;
  minBet: number;
  maxBet: number;
  isSearching: boolean;
  onCreateRoom: (betAmount: number, gameType: CardDuelGameType) => void;
  onJoinRoom: (roomId: string) => void;
  onQuickMatch: () => void;
  onCancelSearch: () => void;
  onPlayBot: (gameType: CardDuelGameType) => void;
}

function gameTypeLabel(type: string): string {
  return type === "best_of_3" ? "Melhor de 3" : "Classico";
}

function SearchOverlay({
  onCancel,
  onPlayBot,
}: {
  onCancel: () => void;
  onPlayBot: (gameType: CardDuelGameType) => void;
}) {
  const [botGameType, setBotGameType] = useState<CardDuelGameType>("classic");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="mx-4 flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-zinc-700 bg-zinc-900 p-8 shadow-xl">
        {/* Spinner */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-600 border-t-blue-500" />

        <h2 className="text-lg font-bold text-card-foreground">
          Buscando partida...
        </h2>
        <p className="text-center text-sm text-muted-foreground">
          Nenhuma sala encontrada. Você pode jogar contra um bot ou cancelar a
          busca.
        </p>

        {/* Bot game type selector */}
        <div className="w-full">
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Tipo de Jogo (Bot)
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setBotGameType("classic")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition",
                botGameType === "classic"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
              )}
            >
              Classico
            </button>
            <button
              onClick={() => setBotGameType("best_of_3")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition",
                botGameType === "best_of_3"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
              )}
            >
              Melhor de 3
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-zinc-700 px-4 py-2.5 font-medium text-white transition hover:bg-zinc-600"
          >
            Cancelar
          </button>
          <button
            onClick={() => onPlayBot(botGameType)}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 font-medium text-white transition hover:bg-green-700"
          >
            Jogar com Bot
          </button>
        </div>
      </div>
    </div>
  );
}

export function CardDuelLobby({
  rooms,
  balance,
  minBet,
  maxBet,
  isSearching,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onCancelSearch,
  onPlayBot,
}: CardDuelLobbyProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          Criar Sala
        </button>
        <button
          onClick={onQuickMatch}
          className="rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white transition hover:bg-green-700"
        >
          Buscar por Partida
        </button>
      </div>

      {/* Room list */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h3 className="font-medium text-card-foreground">
            Salas Disponíveis ({rooms.length})
          </h3>
        </div>

        {rooms.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma sala disponível. Crie uma sala ou busque por partida!
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {rooms.map((room) => {
              const canAfford = balance >= room.betAmount;
              return (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {room.owner.avatar ? (
                      <img
                        src={room.owner.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-sm font-medium text-zinc-300">
                        {room.owner.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {room.owner.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {gameTypeLabel(room.gameType)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-yellow-400">
                      {formatCoins(room.betAmount)} coins
                    </span>
                    <button
                      onClick={() => onJoinRoom(room.roomId)}
                      disabled={!canAfford}
                      className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create room modal */}
      {showCreateModal && (
        <CreateRoomModal
          balance={balance}
          minBet={minBet}
          maxBet={maxBet}
          onClose={() => setShowCreateModal(false)}
          onCreate={(betAmount, gameType) => {
            setShowCreateModal(false);
            onCreateRoom(betAmount, gameType);
          }}
        />
      )}

      {/* Search overlay */}
      {isSearching && (
        <SearchOverlay onCancel={onCancelSearch} onPlayBot={onPlayBot} />
      )}
    </div>
  );
}
