import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CardDuelRoomInfo, CardDuelGameType, Card } from "@butecogames/shared";
import { RANK_NAMES, SUIT_SYMBOLS } from "@butecogames/shared";
import { cn, formatCoins } from "@/lib/utils.js";
import { fetchRecentMatches, type RecentMatch } from "@/api/card-duel.js";
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

function formatCard(card: Card): string {
  const rank = RANK_NAMES[card.rank] ?? String(card.rank);
  const suit = SUIT_SYMBOLS[card.suit] ?? "";
  return `${rank}${suit}`;
}

function suitColor(suit: string): string {
  return suit === "hearts" || suit === "diamonds" ? "text-red-400" : "text-zinc-200";
}

function PlayerAvatar({
  name,
  avatar,
  isBot,
  className,
}: {
  name: string;
  avatar?: string | null;
  isBot?: boolean;
  className?: string;
}) {
  if (isBot) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-zinc-600 font-bold text-zinc-300",
          className,
        )}
      >
        B
      </div>
    );
  }

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-zinc-700 font-bold text-zinc-300",
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-600 border-t-blue-500" />
        <h2 className="text-lg font-bold text-card-foreground">
          Buscando partida...
        </h2>
        <p className="text-center text-sm text-muted-foreground">
          Nenhuma sala encontrada. Você pode jogar contra um bot ou cancelar a
          busca.
        </p>
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

function RoomCard({
  room,
  canAfford,
  onJoin,
}: {
  room: CardDuelRoomInfo;
  canAfford: boolean;
  onJoin: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-5 transition hover:border-zinc-700">
      {room.owner.avatar ? (
        <img
          src={room.owner.avatar}
          alt=""
          className="h-16 w-16 rounded-full"
        />
      ) : (
        <PlayerAvatar name={room.owner.displayName} className="h-16 w-16 text-xl" />
      )}
      <p className="text-sm font-medium text-zinc-200">
        {room.owner.displayName}
      </p>
      <p className="text-sm text-muted-foreground">{gameTypeLabel(room.gameType)}</p>
      <span className="text-md font-bold text-yellow-400">
        {formatCoins(room.betAmount)} coins
      </span>
      <button
        onClick={onJoin}
        disabled={!canAfford}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Entrar
      </button>
    </div>
  );
}

function AvatarWithCrown({
  name,
  avatar,
  isBot,
  isWinner,
  className,
}: {
  name: string;
  avatar?: string | null;
  isBot?: boolean;
  isWinner: boolean;
  className?: string;
}) {
  return (
    <div className="relative flex flex-col items-center">
      {isWinner && (
        <img
          src="/imgs/crown_icon.png"
          alt="Winner"
          className="absolute -top-4.5 -left-1 z-10 h-7 w-7 -rotate-25"
        />
      )}
      <PlayerAvatar name={name} avatar={avatar} isBot={isBot} className={className} />
    </div>
  );
}

function RecentResultRow({ match }: { match: RecentMatch }) {
  const winnerIsP1 = match.result === "player1";
  const winnerIsP2 = match.result === "player2";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2.5">
      {/* Player 1 */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <AvatarWithCrown
          name={match.player1.displayName}
          avatar={match.player1.avatar}
          isWinner={winnerIsP1}
          className="h-12 w-12 shrink-0 text-sm"
        />
        <span
          className={cn(
            "truncate text-sm",
            winnerIsP1 ? "font-bold text-green-400" : "text-zinc-400",
          )}
        >
          {match.player1.displayName}
        </span>
      </div>

      {/* Cards + coins */}
      <div className="flex shrink-0 flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          {match.rounds.map((round) => (
            <span key={round.roundNumber} className="flex items-center gap-0.5 text-sm px-3 py-2 rounded bg-zinc-700 text-zinc-300">
              <span className={suitColor(round.player1Card.suit)}>
                {formatCard(round.player1Card)}
              </span>
              <span className="text-zinc-600">x</span>
              <span className={suitColor(round.player2Card.suit)}>
                {formatCard(round.player2Card)}
              </span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <img src="/imgs/coin.png" alt="" className="h-3.5 w-3.5" />
          <span className="text-xs font-bold text-yellow-400">
            {formatCoins(match.betAmount)}
          </span>
        </div>
      </div>

      {/* Player 2 */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span
          className={cn(
            "truncate text-sm",
            winnerIsP2 ? "font-bold text-green-400" : "text-zinc-400",
          )}
        >
          {match.player2.displayName}
        </span>
        <AvatarWithCrown
          name={match.player2.displayName}
          avatar={match.player2.avatar}
          isBot={match.isBot}
          isWinner={winnerIsP2}
          className="h-12 w-12 shrink-0 text-sm"
        />
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

  const { data: recentData } = useQuery({
    queryKey: ["card-duel-recent"],
    queryFn: fetchRecentMatches,
    refetchInterval: 15_000,
  });

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

      {/* Room cards */}
      <div>
        <h3 className="mb-3 font-medium text-card-foreground">
          Salas Disponíveis ({rooms.length})
        </h3>

        {rooms.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma sala disponível. Crie uma sala ou busque por partida!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {rooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                canAfford={balance >= room.betAmount}
                onJoin={() => onJoinRoom(room.roomId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent results */}
      {recentData && recentData.matches.length > 0 && (
        <div>
          <h3 className="mb-3 font-medium text-card-foreground">
            Últimos Resultados
          </h3>
          <div className="flex flex-col gap-1.5">
            {recentData.matches.map((match) => (
              <RecentResultRow key={match._id} match={match} />
            ))}
          </div>
        </div>
      )}

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
