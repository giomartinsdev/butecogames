import { useState } from "react";
import type { CardDuelRoomInfo, CardDuelGameType } from "@butecogames/shared";
import { formatCoins } from "@/lib/utils.js";
import { CreateRoomModal } from "./CreateRoomModal.js";

interface CardDuelLobbyProps {
  rooms: CardDuelRoomInfo[];
  balance: number;
  minBet: number;
  maxBet: number;
  onCreateRoom: (betAmount: number, gameType: CardDuelGameType) => void;
  onJoinRoom: (roomId: string) => void;
  onQuickMatch: () => void;
}

function gameTypeLabel(type: string): string {
  return type === "best_of_3" ? "Melhor de 3" : "Classico";
}

export function CardDuelLobby({
  rooms,
  balance,
  minBet,
  maxBet,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
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
    </div>
  );
}
