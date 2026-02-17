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
      <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
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
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Tipo de Jogo
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setGameType("classic")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition",
                gameType === "classic"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
              )}
            >
              Classico
            </button>
            <button
              onClick={() => setGameType("best_of_3")}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition",
                gameType === "best_of_3"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
              )}
            >
              Melhor de 3
            </button>
          </div>
        </div>

        {/* Bet amount */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-zinc-300">
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
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
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
                  className="rounded bg-zinc-700 px-3 py-1 text-xs text-zinc-300 transition hover:bg-zinc-600"
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
            className="flex-1 rounded-lg bg-zinc-700 px-4 py-2.5 font-medium text-white transition hover:bg-zinc-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
          >
            Criar Sala
          </button>
        </div>
      </div>
    </div>
  );
}
