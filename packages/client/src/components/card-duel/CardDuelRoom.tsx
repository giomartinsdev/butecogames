import type { CardDuelRoomState } from "@butecogames/shared";
import { formatCoins } from "@/lib/utils.js";
import { DuelArena } from "./DuelArena.js";
import { RevengePrompt } from "./RevengePrompt.js";
import { DisconnectOverlay } from "./DisconnectOverlay.js";

interface CardDuelRoomProps {
  roomState: CardDuelRoomState;
  userId: string;
  cardRevealCountdown: number;
  onLeave: () => void;
  onCancel: () => void;
  onReady: () => void;
  onStart: () => void;
  onAcceptRevenge: () => void;
  onDeclineRevenge: () => void;
}

function gameTypeLabel(type: string): string {
  return type === "best_of_3" ? "Melhor de 3" : "Clássico";
}

export function CardDuelRoom({
  roomState,
  userId,
  cardRevealCountdown,
  onLeave,
  onCancel,
  onReady,
  onStart,
  onAcceptRevenge,
  onDeclineRevenge,
}: CardDuelRoomProps) {
  const { status, player1, player2, betAmount, gameType } = roomState;
  const isOwner = player1?.userId === userId;
  const isPlayer2 = player2?.userId === userId;

  return (
    <div className="flex flex-col gap-6">
      {/* Room header */}
      {/* <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-300">
            {gameTypeLabel(gameType)}
          </span>
          <span className="text-sm font-bold text-yellow-400">
            {formatCoins(betAmount)} coins
          </span>
        </div>
      </div> */}

      {/* Waiting for player 2 */}
      {status === "waiting" && !player2 && (
        <div className="flex flex-col items-center gap-4 py-12">
          <HeaderGameInfo gameType={gameType} betAmount={betAmount} />
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-blue-500" />
          <p className="text-lg text-muted-foreground">
            Aguardando oponente...
          </p>
          {(status === "waiting" || status === "ready") && (
          <button
            onClick={isOwner ? onCancel : onLeave}
            className="rounded-lg bg-zinc-700 px-4 py-1.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-600"
          >
            {isOwner ? "Cancelar Sala" : "Sair"}
          </button>
        )}
        </div>
      )}

      {/* Player 2 joined but not ready */}
      {status === "waiting" && player2 && !player2.isReady && (
        <div className="flex flex-col items-center gap-4 py-8">
          <HeaderGameInfo gameType={gameType} betAmount={betAmount} />
          <PlayersDisplay player1={player1} player2={player2} userId={userId} />
          {isPlayer2 && (
            <button
              onClick={onReady}
              className="rounded-lg bg-green-600 px-8 py-3 text-lg font-bold text-white transition hover:bg-green-700"
            >
              Estou Pronto!
            </button>
          )}
          {isOwner && (
            <p className="text-sm text-muted-foreground">
              Aguardando {player2.displayName} confirmar...
            </p>
          )}
        </div>
      )}

      {/* Ready — owner can start */}
      {status === "ready" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <HeaderGameInfo gameType={gameType} betAmount={betAmount} />
          <PlayersDisplay player1={player1} player2={player2} userId={userId} />
          {isOwner ? (
            <button
              onClick={onStart}
              className="rounded-lg bg-green-600 px-8 py-3 text-lg font-bold text-white transition hover:bg-green-700"
            >
              Iniciar Partida
            </button>
          ) : (
            <p className="text-sm text-green-400">
              Aguardando o dono da sala iniciar...
            </p>
          )}
        </div>
      )}

      {/* In progress / finished */}
      {(status === "in_progress" || status === "finished") && (
        <div className="flex flex-col items-center gap-6">
          {/* Disconnect overlay */}
          {roomState.disconnectedPlayer && (
            <DisconnectOverlay
              disconnectedPlayer={roomState.disconnectedPlayer}
              countdown={roomState.disconnectCountdown}
              isCurrentUser={roomState.disconnectedPlayer === userId}
            />
          )}
          <DuelArena roomState={roomState} userId={userId} cardRevealCountdown={cardRevealCountdown} />
        </div>
      )}

      {/* Revenge */}
      {status === "revenge_pending" && (
        <div className="flex flex-col items-center gap-6">
          <DuelArena roomState={roomState} userId={userId} cardRevealCountdown={cardRevealCountdown} />
          <RevengePrompt
            roomState={roomState}
            userId={userId}
            onAccept={onAcceptRevenge}
            onDecline={onDeclineRevenge}
          />
        </div>
      )}
    </div>
  );
}

function HeaderGameInfo({gameType, betAmount }: { gameType: string; betAmount: number }) {
  return (
    <div className="flex items-center mb-4">
      <span className="text-sm font-bold text-white me-6">{gameTypeLabel(gameType)}</span>
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2">
        <span className="text-sm font-bold text-yellow-400 absolute">{formatCoins(betAmount)} coins</span>
        <span className="text-sm font-bold text-yellow-400 animate-ping">{formatCoins(betAmount)} coins</span>
      </div>
    </div>
  );
}

// Sub-component for displaying both players
function PlayersDisplay({
  player1,
  player2,
  userId,
}: {
  player1: CardDuelRoomState["player1"];
  player2: CardDuelRoomState["player2"];
  userId: string;
}) {
  return (
    <div className="flex gap-8 mb-6">
      <PlayerCard
        name={player1?.displayName ?? "?"}
        avatar={player1?.avatar}
        isYou={player1?.userId === userId}
        ready={true}
      />
      <div className="grow flex items-center justify-center">
        <span className="text-2xl font-black text-zinc-500">VS</span>
      </div>
      <PlayerCard
        name={player2?.displayName ?? "?"}
        avatar={player2?.avatar}
        isYou={player2?.userId === userId}
        ready={player2?.isReady ?? false}
      />
    </div>
  );
}

function PlayerCard({
  name,
  avatar,
  isYou,
  ready,
}: {
  name: string;
  avatar?: string;
  isYou: boolean;
  ready: boolean;
}) {
  return (
    <div className="flex flex-col grow items-center gap-2">
      {avatar ? (
        <img src={avatar} alt="" className="h-16 w-16 rounded-full" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700 text-xl font-bold text-zinc-300">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <p className="text-sm font-medium text-zinc-200">
        {name} {isYou && "(Você)"}
      </p>
      {ready && (
        <span className="text-xs font-bold text-green-400">Pronto!</span>
      )}
    </div>
  );
}
