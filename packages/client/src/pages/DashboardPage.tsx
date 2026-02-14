import { useAuth } from "@/hooks/useAuth.js";
import { WalletDisplay } from "@/components/wallet/WalletDisplay.js";
import { GameList } from "@/components/games/GameList.js";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">
          Bem-vindo, {user?.name}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Escolha um jogo para comecar a jogar
        </p>
      </div>

      <WalletDisplay />

      <div>
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Jogos</h2>
        <GameList />
      </div>
    </div>
  );
}
