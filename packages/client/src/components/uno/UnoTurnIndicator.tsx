import type { UnoGameState } from "@butecogames/shared";

interface UnoTurnIndicatorProps {
  gameState: UnoGameState;
  isMyTurn: boolean;
}

export function UnoTurnIndicator({ gameState, isMyTurn }: UnoTurnIndicatorProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer) return null;

  return (
    <div className="flex items-center justify-center gap-3">
      {isMyTurn ? (
        <div className="animate-pulse rounded-lg bg-primary/20 px-4 py-2 text-center">
          <span className="text-sm font-bold text-primary">
            Sua vez! ({gameState.turnTimeRemaining}s)
          </span>
        </div>
      ) : (
        <div className="rounded-lg bg-muted px-4 py-2 text-center">
          <span className="text-sm text-muted-foreground">
            Vez de {currentPlayer.displayName} ({gameState.turnTimeRemaining}s)
          </span>
        </div>
      )}
    </div>
  );
}
