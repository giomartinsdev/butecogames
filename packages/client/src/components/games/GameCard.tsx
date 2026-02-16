import { Link } from "react-router-dom";
import type { GameInfo } from "@butecogames/shared";

export function GameCard({ game }: { game: GameInfo }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="aspect-video bg-secondary">
        <img
          src={game.thumbnail}
          alt={game.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-card-foreground">{game.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {game.description}
        </p>
        <div className="mt-4">
          {game.available ? (
            <Link
              to={`/games/${game.id}`}
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Jogar
            </Link>
          ) : (
            <span className="inline-block rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground cursor-not-allowed">
              Em breve
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
