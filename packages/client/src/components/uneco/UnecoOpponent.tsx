import type { UnecoPlayer } from "@butecogames/shared";

interface UnecoOpponentProps {
  player: UnecoPlayer;
  isCurrentTurn: boolean;
}

export function UnecoOpponent({
  player,
  isCurrentTurn,
}: UnecoOpponentProps) {
  return (
    <div
      className={`
        flex flex-col items-center gap-1 rounded-lg border p-2 transition-all
        ${isCurrentTurn
          ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
          : "border-border bg-card"
        }
        ${!player.connected ? "opacity-50" : ""}
      `}
    >
      <div className="relative">
        {player.avatar ? (
          <img
            src={player.avatar}
            alt={player.displayName}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            {player.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        {!player.connected && (
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-destructive" />
        )}
      </div>

      <span className="max-w-[80px] truncate text-xs font-medium text-card-foreground">
        {player.displayName}
      </span>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: Math.min(player.cardCount, 5) }).map((_, i) => (
            <div
              key={i}
              className="h-5 w-3.5 rounded-sm bg-gray-600 border border-gray-500"
              style={{ marginLeft: i > 0 ? "-4px" : "0" }}
            />
          ))}
          {player.cardCount > 5 && (
            <span className="ml-1 text-[10px] text-muted-foreground">
              +{player.cardCount - 5}
            </span>
          )}
        </div>
        <span className="text-xs font-bold text-card-foreground">
          {player.cardCount}
        </span>
      </div>

      {player.saidUneco && (
        <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
          UNECO!
        </span>
      )}
    </div>
  );
}
