import { useState, useEffect } from "react";
import type { RouletteBetType } from "@butecogames/shared";
import { formatCoins, translateBetType } from "@/lib/utils.js";

interface BetControlsProps {
  onPlaceBet: (betType: RouletteBetType, amount: number) => void;
  selectedBet: RouletteBetType | null;
  disabled: boolean;
  minBet: number;
  maxBet: number;
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

export function BetControls({ onPlaceBet, selectedBet, disabled, minBet, maxBet }: BetControlsProps) {
  const [amount, setAmount] = useState<number | "">(minBet);
  const [error, setError] = useState("");

  useEffect(() => {
    setAmount(minBet);
    setError("");
  }, [minBet]);

  const handlePlaceBet = () => {
    if (!selectedBet) return;
    if (amount === "" || amount <= 0) {
      setError("Digite um valor para apostar");
      return;
    }
    if (amount < minBet) {
      setError(`Aposta mínima: ${formatCoins(minBet)} coins`);
      return;
    }
    if (amount > maxBet) {
      setError(`Aposta máxima: ${formatCoins(maxBet)} coins`);
      return;
    }
    setError("");
    onPlaceBet(selectedBet, amount);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm text-muted-foreground">Valor da aposta</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => {
            setError("");
            const val = e.target.value;
            setAmount(val === "" ? "" : Math.floor(Number(val)));
          }}
          className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className="rounded bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {formatCoins(v)}
          </button>
        ))}
      </div>

      <button
        onClick={handlePlaceBet}
        disabled={disabled || !selectedBet}
        className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {!selectedBet
          ? "Selecione uma aposta"
          : `Apostar ${formatCoins(amount || 0)} coins`}
      </button>

      {selectedBet && (
        <p className="text-center text-xs text-muted-foreground">
          Aposta selecionada: <span className="font-medium text-card-foreground">{translateBetType(selectedBet)}</span>
        </p>
      )}
    </div>
  );
}
