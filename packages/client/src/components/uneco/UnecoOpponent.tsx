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
        flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2 transition-all
        ${isCurrentTurn
          ? "border-primary bg-primary/15 shadow-lg shadow-primary/30 scale-110"
          : "border-border/60 bg-card/80 backdrop-blur-sm"
        }
        ${!player.connected ? "opacity-40" : ""}
      `}
    >
      <div className="relative">
        {player.avatar ? (
          <img
            src={player.avatar}
            alt={player.displayName}
            className="h-8 w-8 rounded-full ring-1 ring-white/20"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground ring-1 ring-white/20">
            {player.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        {!player.connected && (
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-card bg-destructive" />
        )}
      </div>

      <span className="max-w-[72px] truncate text-[11px] font-medium text-card-foreground">
        {player.displayName}
      </span>

      {/* Card fan (compact) */}
      <div className="flex items-center gap-0.5">
        <div className="flex items-center">
          {Array.from({ length: Math.min(player.cardCount, 5) }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-3 rounded-sm bg-gray-600 border border-gray-500"
              style={{
                marginLeft: i > 0 ? "-3px" : "0",
                transform: `rotate(${(i - Math.min(player.cardCount, 5) / 2) * 6}deg)`,
              }}
            />
          ))}
        </div>
        <span className="ml-1 text-[10px] font-bold text-card-foreground">
          {player.cardCount}
        </span>
      </div>

      {player.saidUneco && (
        <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">
          UNECO!
        </span>
      )}
    </div>
  );
}
