import { useState, useEffect } from "react";
import { useWallet, useClaimDailyReward } from "@/hooks/useWallet.js";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { formatCoins } from "@/lib/utils.js";
import { DAILY_REWARD_COOLDOWN_MS } from "@butecogames/shared";

function getTimeRemaining(lastClaimed: string): number {
  const nextAvailable = new Date(lastClaimed).getTime() + DAILY_REWARD_COOLDOWN_MS;
  return Math.max(0, nextAvailable - Date.now());
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function WalletDisplay() {
  const { data: wallet, isLoading } = useWallet();
  const { profile } = useUserProfile();
  const dailyReward = useClaimDailyReward();
  const [remaining, setRemaining] = useState(0);

  const lastClaimed = profile?.lastDailyReward ?? null;

  useEffect(() => {
    if (!lastClaimed) {
      setRemaining(0);
      return;
    }

    setRemaining(getTimeRemaining(lastClaimed));

    const interval = setInterval(() => {
      const r = getTimeRemaining(lastClaimed);
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastClaimed]);

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando carteira...</div>;
  }

  if (!wallet) return null;

  const canClaim = remaining <= 0;

  return (
    <div className="w-100 rounded-xl border border-border bg-card p-6">
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
      {canClaim ? (
        <button
          onClick={() => dailyReward.mutate()}
          disabled={dailyReward.isPending}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {dailyReward.isPending ? "Coletando..." : "Coletar recompensa diaria"}
        </button>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Proxima recompensa em{" "}
          <span className="font-medium text-card-foreground">{formatCountdown(remaining)}</span>
        </p>
      )}
    </div>
  );
}
