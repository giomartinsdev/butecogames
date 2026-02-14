import { useWallet, useClaimDailyReward } from "@/hooks/useWallet.js";
import { formatCoins } from "@/lib/utils.js";

export function WalletDisplay() {
  const { data: wallet, isLoading } = useWallet();
  const dailyReward = useClaimDailyReward();

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando carteira...</div>;
  }

  if (!wallet) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-medium text-muted-foreground">Saldo</h2>
      <p className="mt-1 text-3xl font-bold text-accent">
        {formatCoins(wallet.balance)} coins
      </p>
      <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
        <div>
          <span className="block text-card-foreground font-medium">
            {formatCoins(wallet.totalWagered)}
          </span>
          Total apostado
        </div>
        <div>
          <span className="block text-card-foreground font-medium">
            {formatCoins(wallet.totalWon)}
          </span>
          Total ganho
        </div>
      </div>
      <button
        onClick={() => dailyReward.mutate()}
        disabled={dailyReward.isPending}
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        {dailyReward.isPending ? "Coletando..." : "Coletar recompensa diaria"}
      </button>
      {dailyReward.isSuccess && !dailyReward.data.claimed && (
        <p className="mt-2 text-sm text-muted-foreground">
          Recompensa ja coletada hoje. Volte amanha!
        </p>
      )}
    </div>
  );
}
