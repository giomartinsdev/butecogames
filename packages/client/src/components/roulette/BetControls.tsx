import { useState } from "react";
import type { RouletteBetType } from "@butecogames/shared";
import { MIN_BET, MAX_BET } from "@butecogames/shared";
import { formatCoins } from "@/lib/utils.js";

interface BetControlsProps {
  onPlaceBet: (betType: RouletteBetType, amount: number) => void;
  selectedBet: RouletteBetType | null;
  disabled: boolean;
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

export function BetControls({ onPlaceBet, selectedBet, disabled }: BetControlsProps) {
  const [amount, setAmount] = useState(MIN_BET);

  const handlePlaceBet = () => {
    if (!selectedBet || amount < MIN_BET || amount > MAX_BET) return;
    onPlaceBet(selectedBet, amount);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm text-muted-foreground">Valor da aposta</label>
        <input
          type="number"
          min={MIN_BET}
          max={MAX_BET}
          value={amount}
          onChange={(e) => setAmount(Math.max(MIN_BET, Math.min(MAX_BET, Number(e.target.value))))}
          className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-card-foreground outline-none focus:ring-1 focus:ring-primary"
        />
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
          : `Apostar ${formatCoins(amount)} coins`}
      </button>

      {selectedBet && (
        <p className="text-center text-xs text-muted-foreground">
          Aposta selecionada: <span className="font-medium text-card-foreground">{selectedBet}</span>
        </p>
      )}
    </div>
  );
}
