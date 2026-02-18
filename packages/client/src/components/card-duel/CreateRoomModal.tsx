import { useState } from "react";
import type { CardDuelGameType } from "@butecogames/shared";
import { cn, formatCoins } from "@/lib/utils.js";

interface CreateRoomModalProps {
  balance: number;
  minBet: number;
  maxBet: number;
  onClose: () => void;
  onCreate: (betAmount: number, gameType: CardDuelGameType) => void;
}

export function CreateRoomModal({
  balance,
  minBet,
  maxBet,
  onClose,
  onCreate,
}: CreateRoomModalProps) {
  const [betAmount, setBetAmount] = useState(minBet);
  const [gameType, setGameType] = useState<CardDuelGameType>("classic");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    if (betAmount < minBet) {
      setError(`Aposta minima: ${formatCoins(minBet)} coins`);
      return;
    }
    if (betAmount > maxBet) {
      setError(`Aposta maxima: ${formatCoins(maxBet)} coins`);
      return;
    }
    if (betAmount > balance) {
      setError("Saldo insuficiente");
      return;
    }
    if (!Number.isInteger(betAmount) || betAmount <= 0) {
      setError("Valor invalido");
      return;
    }
    onCreate(betAmount, gameType);
  };

  const quickAmounts = [10, 50, 100, 500, 1000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-card-foreground">Criar Sala</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground transition hover:text-white"
          >
            &#10005;
          </button>
        </div>

        {/* Balance */}
        <p className="mb-4 text-sm text-muted-foreground">
          Seu saldo: <span className="font-bold text-yellow-400">{formatCoins(balance)} coins</span>
        </p>

        {/* Game type */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Tipo de Jogo
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setGameType("classic")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition",
                gameType === "classic"
                  ? "bg-slate-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700",
              )}
            >
              Classico
            </button>
            <button
              onClick={() => setGameType("best_of_3")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition",
                gameType === "best_of_3"
                  ? "bg-slate-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700",
              )}
            >
              Melhor de 3
            </button>
          </div>
        </div>

        {/* Bet amount */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Aposta
          </label>
          <input
            type="number"
            min={minBet}
            max={Math.min(maxBet, balance)}
            step={1}
            value={betAmount}
            onChange={(e) => {
              setBetAmount(Math.floor(Number(e.target.value)));
              setError(null);
            }}
            className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {quickAmounts
              .filter((a) => a >= minBet && a <= maxBet && a <= balance)
              .map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setBetAmount(amount);
                    setError(null);
                  }}
                  className="rounded bg-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-600"
                >
                  {formatCoins(amount)}
                </button>
              ))}
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-slate-700 px-4 py-2.5 font-medium text-muted-foreground transition hover:bg-slate-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            Criar Sala
          </button>
        </div>
      </div>
    </div>
  );
}
