import { useQuery } from "@tanstack/react-query";
import { fetchGames } from "@/api/games.js";
import { GameCard } from "./GameCard.js";

export function GameList() {
  const { data, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: fetchGames,
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando jogos...</div>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data?.games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
