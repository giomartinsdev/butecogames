import type {
  CardDuelRoomState,
  CardDuelRoundData,
} from "@butecogames/shared";
import { CardDisplay } from "./CardDisplay.js";
import { cn } from "@/lib/utils.js";

interface DuelArenaProps {
  roomState: CardDuelRoomState;
  userId: string;
}

function getCardHighlight(
  round: CardDuelRoundData,
  playerSide: "player1" | "player2",
): "win" | "lose" | "draw" | null {
  if (round.result === "draw") return "draw";
  if (round.result === playerSide) return "win";
  return "lose";
}

export function DuelArena({ roomState, userId }: DuelArenaProps) {
  const {
    player1,
    player2,
    rounds,
    player1Score,
    player2Score,
    gameType,
    status,
    currentRound,
  } = roomState;

  const isPlayer1 = player1?.userId === userId;
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const maxRounds = gameType === "classic" ? 1 : 3;
  const showCards = status === "in_progress" || status === "finished" || status === "revenge_pending";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Score header for best of 3 */}
      {gameType === "best_of_3" && showCards && (
        <div className="flex items-center gap-6 text-lg font-bold">
          <span className={cn(isPlayer1 ? "text-blue-400" : "text-zinc-400")}>
            {player1?.displayName}: {player1Score}
          </span>
          <span className="text-zinc-500">x</span>
          <span className={cn(!isPlayer1 ? "text-blue-400" : "text-zinc-400")}>
            {player2?.displayName}: {player2Score}
          </span>
        </div>
      )}

      {/* Round indicator */}
      {gameType === "best_of_3" && showCards && (
        <div className="text-sm text-muted-foreground">
          Rodada {Math.min(currentRound, maxRounds)} de {maxRounds}
        </div>
      )}

      {/* Duel area */}
      <div className="flex items-center gap-8">
        {/* Player 1 card */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {player1?.displayName ?? "Jogador 1"}
            {isPlayer1 && " (Você)"}
          </span>
          <CardDisplay
            card={lastRound?.player1Card ?? null}
            faceDown={!lastRound}
            highlight={lastRound ? getCardHighlight(lastRound, "player1") : null}
            size="lg"
          />
        </div>

        {/* VS */}
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-zinc-500">VS</span>
        </div>

        {/* Player 2 card */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {player2?.displayName ?? "Jogador 2"}
            {!isPlayer1 && player2 && " (Você)"}
          </span>
          <CardDisplay
            card={lastRound?.player2Card ?? null}
            faceDown={!lastRound}
            highlight={lastRound ? getCardHighlight(lastRound, "player2") : null}
            size="lg"
          />
        </div>
      </div>

      {/* Previous rounds (best of 3) */}
      {gameType === "best_of_3" && rounds.length > 1 && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">Rodadas anteriores</span>
          <div className="flex gap-4">
            {rounds.slice(0, -1).map((round) => (
              <div key={round.roundNumber} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  R{round.roundNumber}:
                </span>
                <CardDisplay
                  card={round.player1Card}
                  highlight={getCardHighlight(round, "player1")}
                  size="sm"
                />
                <span className="text-xs text-zinc-500">vs</span>
                <CardDisplay
                  card={round.player2Card}
                  highlight={getCardHighlight(round, "player2")}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
