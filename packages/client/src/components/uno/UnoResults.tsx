import type { UnoGameState } from "@butecogames/shared";
import { formatCoins } from "@/lib/utils.js";

interface UnoResultsProps {
  gameState: UnoGameState;
  userId: string;
  onReturnToLobby: () => void;
}

export function UnoResults({ gameState, userId, onReturnToLobby }: UnoResultsProps) {
  const isWinner = gameState.winner === userId;
  const winner = gameState.players.find((p) => p.userId === gameState.winner);
  const pot = gameState.betAmount * gameState.players.length;

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <div
        className={`rounded-xl border p-6 ${
          isWinner
            ? "border-primary bg-primary/10"
            : "border-border bg-card"
        }`}
      >
        <h2 className="text-2xl font-extrabold text-card-foreground">
          {isWinner ? "Você venceu!" : `${winner?.displayName ?? "?"} venceu!`}
        </h2>
        <p className="mt-2 text-lg font-bold text-primary">
          +{formatCoins(pot)} coins
        </p>
      </div>

      {/* Player results */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold text-card-foreground">Resultado</h3>
        <div className="space-y-2">
          {gameState.players
            .sort((a, b) => a.cardCount - b.cardCount)
            .map((player, i) => (
              <div
                key={player.userId}
                className={`flex items-center justify-between rounded px-3 py-2 ${
                  player.userId === gameState.winner
                    ? "bg-primary/10"
                    : "bg-background"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-muted-foreground">
                    #{i + 1}
                  </span>
                  <span className="text-sm font-medium text-card-foreground">
                    {player.displayName}
                    {player.userId === userId && " (você)"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {player.cardCount === 0
                    ? "🏆"
                    : `${player.cardCount} carta${player.cardCount > 1 ? "s" : ""}`
                  }
                </span>
              </div>
            ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onReturnToLobby}
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Voltar ao Lobby
      </button>
    </div>
  );
}
