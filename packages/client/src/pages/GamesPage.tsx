import { GameList } from "@/components/games/GameList.js";

export function GamesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">Jogos</h1>
        <p className="mt-1 text-muted-foreground">
          Explore os jogos disponiveis na plataforma
        </p>
      </div>
      <GameList />
    </div>
  );
}
