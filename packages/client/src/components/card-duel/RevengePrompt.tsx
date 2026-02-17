import type { CardDuelRoomState } from "@butecogames/shared";

interface RevengePromptProps {
  roomState: CardDuelRoomState;
  userId: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function RevengePrompt({
  roomState,
  userId,
  onAccept,
  onDecline,
}: RevengePromptProps) {
  const { revengeCountdown, revengeAccepted, matchResult, player1, player2 } =
    roomState;

  const isPlayer1 = player1?.userId === userId;
  const winnerId =
    matchResult === "player1"
      ? player1?.userId
      : matchResult === "player2"
        ? player2?.userId
        : null;
  const isDraw = matchResult === "draw";
  const isWinner = winnerId === userId;
  const hasAccepted = revengeAccepted[userId] === true;

  // For draws: both must accept. For win/loss: winner auto-accepted, loser decides
  if (isDraw) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-800/80 p-6">
        <h3 className="text-lg font-bold text-yellow-400">Empate!</h3>
        <p className="text-sm text-muted-foreground">
          Deseja jogar novamente?
        </p>
        <div className="text-2xl font-bold text-white">{revengeCountdown}s</div>
        {hasAccepted ? (
          <p className="text-sm text-green-400">
            Aguardando o outro jogador...
          </p>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onAccept}
              className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition hover:bg-green-700"
            >
              Aceitar
            </button>
            <button
              onClick={onDecline}
              className="rounded-lg bg-zinc-600 px-6 py-2 font-medium text-white transition hover:bg-zinc-700"
            >
              Recusar
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isWinner) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-800/80 p-6">
        <h3 className="text-lg font-bold text-green-400">Você venceu!</h3>
        <p className="text-sm text-muted-foreground">
          Aguardando decisão do oponente...
        </p>
        <div className="text-2xl font-bold text-white">{revengeCountdown}s</div>
      </div>
    );
  }

  // Loser
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-700 bg-zinc-800/80 p-6">
      <h3 className="text-lg font-bold text-red-400">Você perdeu!</h3>
      <p className="text-sm text-muted-foreground">Deseja revanche?</p>
      <div className="text-2xl font-bold text-white">{revengeCountdown}s</div>
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition hover:bg-green-700"
        >
          Revanche
        </button>
        <button
          onClick={onDecline}
          className="rounded-lg bg-zinc-600 px-6 py-2 font-medium text-white transition hover:bg-zinc-700"
        >
          Recusar
        </button>
      </div>
    </div>
  );
}
